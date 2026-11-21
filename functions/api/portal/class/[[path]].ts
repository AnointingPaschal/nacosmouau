import { Env, currentUser } from '../../auth/_shared';
import { currentSession, fail, json, pathOf, randomId, readBody, text } from '../../_portal';
import { LEVELS, POSITIONS, ensureElection, finalizeDue, iso, repRoles, type Position } from '../../_class';

type Me = NonNullable<Awaited<ReturnType<typeof currentUser>>>;
const isPosition = (value: unknown): value is Position => POSITIONS.includes(value as Position);

async function myLevel(env: Env, user: Me) {
  const row = await env.DB.prepare('SELECT academic_level FROM users WHERE id=?').bind(user.id).first<{ academic_level: string | null }>();
  return row?.academic_level && LEVELS.includes(row.academic_level) ? row.academic_level : null;
}

async function me(env: Env, user: Me) {
  const [session, level] = await Promise.all([currentSession(env), myLevel(env, user)]);
  await finalizeDue(env);
  const roles = await repRoles(env, user.id, session);
  const election = level ? await ensureElection(env, level, session) : null;
  return json({ session, level, roles, election: election && { status: election.status, voting_ends_at: iso(election.voting_ends_at) } });
}

async function mates(env: Env, user: Me) {
  const [session, level] = await Promise.all([currentSession(env), myLevel(env, user)]);
  if (!level) return json({ level: null, session, members: [], notices: [] });
  const [members, notices] = await Promise.all([
    env.DB.prepare("SELECT u.id,u.full_name,u.matric_number, r.role AS rep_role, CASE WHEN r.role IS NOT NULL THEN u.phone END AS phone FROM users u LEFT JOIN class_reps r ON r.user_id=u.id AND r.session=? AND r.level=? WHERE u.academic_level=? AND u.status='active' ORDER BY (r.role='rep') DESC, (r.role='assistant') DESC, u.full_name COLLATE NOCASE").bind(session, level, level).all(),
    env.DB.prepare('SELECT n.id,n.title,n.body,n.created_at,n.author_id,u.full_name AS author FROM class_notices n JOIN users u ON u.id=n.author_id WHERE n.level=? AND n.session=? ORDER BY n.created_at DESC LIMIT 20').bind(level, session).all<{ created_at: string }>(),
  ]);
  return json({ level, session, members: members.results ?? [], notices: (notices.results ?? []).map(n => ({ ...n, created_at: iso(n.created_at) })), me: user.id });
}

async function electionState(env: Env, user: Me) {
  const [session, level] = await Promise.all([currentSession(env), myLevel(env, user)]);
  if (!level) return json({ level: null, session });
  await finalizeDue(env);
  const election = await ensureElection(env, level, session);
  const closed = election.status === 'closed';
  const candidates = await env.DB.prepare(`SELECT c.id,c.position,c.manifesto,c.status,c.review_note,c.user_id,u.full_name,u.matric_number${closed ? ',(SELECT COUNT(*) FROM class_ballots b WHERE b.candidate_id=c.id) AS votes' : ''} FROM class_candidates c JOIN users u ON u.id=c.user_id WHERE c.election_id=? AND (c.status='approved' OR c.user_id=?) ORDER BY c.created_at`).bind(election.id, user.id).all<Record<string, unknown>>();
  const voted = await env.DB.prepare('SELECT position FROM class_vote_roll WHERE election_id=? AND voter_id=?').bind(election.id, user.id).all<{ position: string }>();
  const winners = await env.DB.prepare('SELECT r.role,r.user_id,r.votes,u.full_name FROM class_reps r JOIN users u ON u.id=r.user_id WHERE r.election_id=?').bind(election.id).all();
  return json({
    session, level,
    election: { id: election.id, status: election.status, voting_started_at: iso(election.voting_started_at), voting_ends_at: iso(election.voting_ends_at), closed_at: iso(election.closed_at) },
    candidates: candidates.results ?? [], voted: (voted.results ?? []).map(v => v.position), winners: winners.results ?? [], me: user.id,
  });
}

async function apply(request: Request, env: Env, user: Me) {
  const [session, level] = await Promise.all([currentSession(env), myLevel(env, user)]);
  if (!level) return fail('Set your level in your profile before applying.', 409);
  const election = await ensureElection(env, level, session);
  if (election.status !== 'nominations') return fail('Applications are closed for this election.', 409);
  const body = await readBody(request); const position = body?.position; const manifesto = text(body?.manifesto, 800);
  if (!isPosition(position)) return fail('Choose a position.');
  if (manifesto.length < 20) return fail('Write at least a couple of sentences on why you should be elected.');
  if (await env.DB.prepare('SELECT 1 FROM class_candidates WHERE election_id=? AND user_id=?').bind(election.id, user.id).first()) return fail('You have already applied in this election.', 409);
  const id = randomId();
  await env.DB.prepare('INSERT INTO class_candidates(id,election_id,user_id,position,manifesto) VALUES(?,?,?,?,?)').bind(id, election.id, user.id, position, manifesto).run();
  return json({ id }, 201);
}

async function withdraw(env: Env, user: Me) {
  const [session, level] = await Promise.all([currentSession(env), myLevel(env, user)]);
  if (!level) return fail('Your level is not set.', 409);
  const election = await ensureElection(env, level, session);
  if (election.status !== 'nominations') return fail('You can only withdraw while nominations are open.', 409);
  await env.DB.prepare("DELETE FROM class_candidates WHERE election_id=? AND user_id=? AND status IN ('pending','rejected')").bind(election.id, user.id).run();
  return json({ ok: true });
}

async function vote(request: Request, env: Env, user: Me) {
  const [session, level] = await Promise.all([currentSession(env), myLevel(env, user)]);
  if (!level) return fail('Set your level in your profile before voting.', 409);
  await finalizeDue(env);
  const election = await ensureElection(env, level, session);
  if (election.status !== 'voting') return fail('Voting is not open right now.', 409);
  const body = await readBody(request); const position = body?.position; const candidateId = String(body?.candidate_id ?? '');
  if (!isPosition(position)) return fail('Choose a position.');
  const candidate = await env.DB.prepare("SELECT id FROM class_candidates WHERE id=? AND election_id=? AND position=? AND status='approved'").bind(candidateId, election.id, position).first();
  if (!candidate) return fail('That contestant is not on the ballot.', 404);
  if (await env.DB.prepare('SELECT 1 FROM class_vote_roll WHERE election_id=? AND position=? AND voter_id=?').bind(election.id, position, user.id).first()) return fail('You have already voted for this position.', 409);
  await env.DB.batch([
    env.DB.prepare('INSERT INTO class_vote_roll(election_id,position,voter_id) VALUES(?,?,?)').bind(election.id, position, user.id),
    env.DB.prepare('INSERT INTO class_ballots(id,election_id,position,candidate_id) VALUES(?,?,?,?)').bind(randomId(), election.id, position, candidateId),
  ]);
  return json({ ok: true }, 201);
}

async function requireRep(env: Env, user: Me) {
  const session = await currentSession(env);
  const roles = await repRoles(env, user.id, session);
  return { session, role: roles[0] ?? null };
}

async function repDesk(env: Env, user: Me) {
  const { session, role } = await requireRep(env, user);
  if (!role) return fail('Only your class rep and assistant can open the rep desk.', 403);
  const members = await env.DB.prepare("SELECT u.id,u.full_name,u.matric_number,u.phone,u.email, COALESCE((SELECT SUM(c.units) FROM member_courses m JOIN course_catalogue c ON c.id=m.course_id WHERE m.user_id=u.id AND m.session=?),0) AS units, EXISTS(SELECT 1 FROM payments p WHERE p.user_id=u.id AND p.purpose='dues' AND p.session=? AND p.status='successful') AS dues_paid FROM users u WHERE u.academic_level=? AND u.status='active' ORDER BY u.full_name COLLATE NOCASE").bind(session, session, role.level).all();
  return json({ session, role: role.role, level: role.level, members: members.results ?? [] });
}

async function postNotice(request: Request, env: Env, user: Me) {
  const { session, role } = await requireRep(env, user);
  if (!role) return fail('Only your class rep and assistant can post class notices.', 403);
  const body = await readBody(request); const title = text(body?.title, 120); const message = text(body?.body, 1500);
  if (title.length < 3 || message.length < 3) return fail('Add a title and a message.');
  const id = randomId();
  await env.DB.prepare('INSERT INTO class_notices(id,level,session,author_id,title,body) VALUES(?,?,?,?,?,?)').bind(id, role.level, session, user.id, title, message).run();
  return json({ id }, 201);
}

export const onRequest: PagesFunction<Env> = async ({ request, env, params }) => {
  const user = await currentUser(request, env).catch(() => null);
  if (!user || user.status !== 'active') return fail('Sign in with an active member account to continue.', 401);
  const [a, b, c] = pathOf(params as Record<string, string | string[]>); const method = request.method;
  try {
    if (a === 'me' && method === 'GET') return await me(env, user);
    if (a === 'mates' && method === 'GET') return await mates(env, user);
    if (a === 'election' && !b && method === 'GET') return await electionState(env, user);
    if (a === 'election' && b === 'apply' && method === 'POST') return await apply(request, env, user);
    if (a === 'election' && b === 'apply' && method === 'DELETE') return await withdraw(env, user);
    if (a === 'election' && b === 'vote' && method === 'POST') return await vote(request, env, user);
    if (a === 'rep' && method === 'GET') return await repDesk(env, user);
    if (a === 'notices' && !b && method === 'POST') return await postNotice(request, env, user);
    if (a === 'notices' && b && method === 'DELETE') {
      const { role } = await requireRep(env, user);
      if (!role) return fail('Only your class rep and assistant can remove class notices.', 403);
      await env.DB.prepare('DELETE FROM class_notices WHERE id=? AND level=?').bind(b, role.level).run();
      return json({ ok: true });
    }
    void c;
    return fail('Not found.', 404);
  } catch (error) { console.error('Class API failed:', error); return fail('Class features are unavailable right now. Please try again.', 500); }
};
