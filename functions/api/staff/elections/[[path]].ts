import { Env, currentUser, hasPermission } from '../../auth/_shared';
import { audit, currentSession, fail, fileKey, json, pathOf, randomId, readBody, tally, text } from '../../_portal';

type Staff = NonNullable<Awaited<ReturnType<typeof currentUser>>>;
const STATUSES = ['draft', 'nominations', 'voting', 'closed'];
const denied = () => fail('Your role does not allow election management.', 403);
const toMinor = (value: unknown) => { const n = Math.round(Number(value)); return Number.isSafeInteger(n) && n >= 0 ? n : null; };

async function list(env: Env) {
  const rows = await env.DB.prepare(`SELECT e.id,e.title,e.description,e.status,e.opens_at,e.closes_at,e.session,e.form_fee_minor,
    (SELECT COUNT(*) FROM election_positions p WHERE p.election_id=e.id) positions,
    (SELECT COUNT(*) FROM election_candidates c WHERE c.election_id=e.id) candidates,
    (SELECT COUNT(*) FROM election_candidates c WHERE c.election_id=e.id AND c.status='eligible') eligible,
    (SELECT COUNT(*) FROM election_ballots v WHERE v.election_id=e.id) votes
    FROM elections e ORDER BY e.created_at DESC`).all();
  return json(rows.results ?? []);
}

async function detail(env: Env, id: string) {
  const election = await env.DB.prepare('SELECT id,title,description,status,opens_at,closes_at,session,form_fee_minor FROM elections WHERE id=?').bind(id).first();
  if (!election) return fail('Election not found.', 404);
  const [positions, candidates] = await Promise.all([
    env.DB.prepare('SELECT id,title,display_order FROM election_positions WHERE election_id=? ORDER BY display_order,title').bind(id).all(),
    env.DB.prepare(`SELECT c.id,c.position_id,c.user_id,c.display_name,c.manifesto,c.photo_key,c.status,c.screening_note,u.matric_number,u.academic_level,
      (SELECT status FROM payments p WHERE p.ref_id=c.id AND p.purpose='candidate_form' ORDER BY (p.status='successful') DESC,p.created_at DESC LIMIT 1) payment_status
      FROM election_candidates c LEFT JOIN users u ON u.id=c.user_id WHERE c.election_id=? ORDER BY c.display_name`).bind(id).all<Record<string, unknown>>(),
  ]);
  return json({ election, positions: positions.results ?? [], candidates: (candidates.results ?? []).map(c => ({ ...c, photo_url: c.photo_key ? `/api/files/${c.photo_key}` : null, photo_key: undefined })) });
}

async function create(request: Request, env: Env, user: Staff) {
  const body = await readBody(request); const title = text(body?.title, 160);
  if (title.length < 3) return fail('Give the election a title.');
  const fee = toMinor(body?.form_fee_minor ?? 0); if (fee === null) return fail('Enter a valid form fee.');
  const id = randomId(); const session = await currentSession(env);
  await env.DB.prepare("INSERT INTO elections(id,title,description,opens_at,closes_at,status,created_by,session,form_fee_minor) VALUES(?,?,?,?,?,'draft',?,?,?)")
    .bind(id, title, text(body?.description, 2000) || null, text(body?.opens_at, 40) || new Date().toISOString(), text(body?.closes_at, 40) || new Date(Date.now() + 7 * 864e5).toISOString(), user.id, session, fee).run();
  await audit(env, user.id, 'create', 'elections', id, { title });
  return json({ id }, 201);
}

async function update(request: Request, env: Env, user: Staff, id: string) {
  const current = await env.DB.prepare('SELECT status FROM elections WHERE id=?').bind(id).first<{ status: string }>();
  if (!current) return fail('Election not found.', 404);
  const body = await readBody(request) ?? {};
  const sets: string[] = []; const values: unknown[] = [];
  const put = (column: string, value: unknown) => { sets.push(`${column}=?`); values.push(value); };
  if ('title' in body) { const v = text(body.title, 160); if (v.length < 3) return fail('Give the election a title.'); put('title', v); }
  if ('description' in body) put('description', text(body.description, 2000) || null);
  if ('opens_at' in body) put('opens_at', text(body.opens_at, 40));
  if ('closes_at' in body) put('closes_at', text(body.closes_at, 40));
  if ('form_fee_minor' in body) { const fee = toMinor(body.form_fee_minor); if (fee === null) return fail('Enter a valid form fee.'); put('form_fee_minor', fee); }
  if ('status' in body) {
    const status = text(body.status, 20); if (!STATUSES.includes(status)) return fail('Choose a valid election status.');
    if (status === 'voting') {
      const eligible = await env.DB.prepare("SELECT COUNT(*) n FROM election_candidates WHERE election_id=? AND status='eligible'").bind(id).first<{ n: number }>();
      if (!eligible?.n) return fail('Mark at least one screened candidate as eligible before opening voting.', 409);
    }
    put('status', status);
  }
  if (!sets.length) return fail('Nothing to update.');
  await env.DB.prepare(`UPDATE elections SET ${sets.join(',')} WHERE id=?`).bind(...values, id).run();
  await audit(env, user.id, 'update', 'elections', id, body);
  return json({ ok: true });
}

async function addCandidate(request: Request, env: Env, user: Staff, id: string) {
  const election = await env.DB.prepare('SELECT status,form_fee_minor FROM elections WHERE id=?').bind(id).first<{ status: string; form_fee_minor: number }>();
  if (!election) return fail('Election not found.', 404);
  if (election.status === 'voting' || election.status === 'closed') return fail('Candidates cannot be added once voting has started.', 409);
  const body = await readBody(request);
  const positionId = text(body?.position_id, 80);
  if (!(await env.DB.prepare('SELECT 1 FROM election_positions WHERE id=? AND election_id=?').bind(positionId, id).first())) return fail('Choose a position for this contestant.');
  let reg = text(body?.matric_number, 60).replace(/\s+/g, '').toUpperCase(); if (/^\d{2}\/\d{3,7}$/.test(reg)) reg = `MOUAU/CMP/${reg}`;
  const member = await env.DB.prepare("SELECT id,full_name FROM users WHERE matric_number=? AND status='active'").bind(reg).first<{ id: string; full_name: string }>();
  if (!member) return fail('No active member has that matric or registration number.', 404);
  const photo = body?.photo_url ? fileKey(body.photo_url) : null;
  if (body?.photo_url && !photo) return fail('Upload the contestant photo with the file picker.');
  const candidateId = randomId(); const status = election.form_fee_minor > 0 ? 'pending_payment' : 'pending_screening';
  try {
    await env.DB.prepare('INSERT INTO election_candidates(id,election_id,position_id,user_id,display_name,manifesto,photo_key,status) VALUES(?,?,?,?,?,?,?,?)')
      .bind(candidateId, id, positionId, member.id, member.full_name, text(body?.manifesto, 3000) || 'Manifesto to be provided.', photo, status).run();
  } catch { return fail('This member is already a contestant for that position.', 409); }
  await audit(env, user.id, 'create', 'election_candidates', candidateId, { election: id, member: member.id });
  return json({ id: candidateId, status }, 201);
}

async function screen(request: Request, env: Env, user: Staff, id: string, candidateId: string) {
  const candidate = await env.DB.prepare('SELECT c.status,e.form_fee_minor,e.status AS election_status FROM election_candidates c JOIN elections e ON e.id=c.election_id WHERE c.id=? AND c.election_id=?').bind(candidateId, id).first<{ status: string; form_fee_minor: number; election_status: string }>();
  if (!candidate) return fail('Contestant not found.', 404);
  if (candidate.election_status === 'voting' || candidate.election_status === 'closed') return fail('Screening is closed once voting has started.', 409);
  const body = await readBody(request); const status = text(body?.status, 30);
  if (!['eligible', 'rejected', 'pending_screening'].includes(status)) return fail('Choose eligible, rejected or pending screening.');
  if (status === 'eligible') {
    const paid = candidate.form_fee_minor <= 0 || await env.DB.prepare("SELECT 1 FROM payments WHERE ref_id=? AND purpose='candidate_form' AND status='successful'").bind(candidateId).first();
    if (!paid) return fail('This contestant has not paid for the candidate form yet.', 409);
  }
  await env.DB.prepare('UPDATE election_candidates SET status=?,screening_note=? WHERE id=?').bind(status, text(body?.note, 400) || null, candidateId).run();
  await audit(env, user.id, 'screen', 'election_candidates', candidateId, { status });
  return json({ ok: true });
}

export const onRequest: PagesFunction<Env> = async ({ request, env, params }) => {
  const user = await currentUser(request, env).catch(() => null);
  if (!user || user.status !== 'active') return fail('Sign in to continue.', 401);
  const [id, sub, subId] = pathOf(params as Record<string, string | string[]>); const m = request.method;
  const action = m === 'GET' ? 'read' : m === 'POST' ? 'create' : m === 'DELETE' ? 'delete' : 'update';
  if (!(await hasPermission(env, user, 'elections', action))) return denied();
  try {
    if (!id && m === 'GET') return await list(env);
    if (!id && m === 'POST') return await create(request, env, user);
    if (id && !sub && m === 'GET') return await detail(env, id);
    if (id && !sub && m === 'PATCH') return await update(request, env, user, id);
    if (id && !sub && m === 'DELETE') {
      const row = await env.DB.prepare('SELECT status FROM elections WHERE id=?').bind(id).first<{ status: string }>();
      if (!row) return fail('Election not found.', 404);
      if (row.status !== 'draft') return fail('Only draft elections can be deleted.', 409);
      await env.DB.prepare('DELETE FROM elections WHERE id=?').bind(id).run(); await audit(env, user.id, 'delete', 'elections', id); return json({ ok: true });
    }
    if (id && sub === 'positions' && m === 'POST') {
      const body = await readBody(request); const title = text(body?.title, 120); if (title.length < 2) return fail('Enter a position title.');
      const order = await env.DB.prepare('SELECT COUNT(*) n FROM election_positions WHERE election_id=?').bind(id).first<{ n: number }>();
      try { await env.DB.prepare('INSERT INTO election_positions(id,election_id,title,display_order) VALUES(?,?,?,?)').bind(randomId(), id, title, order?.n ?? 0).run(); } catch { return fail('That position already exists.', 409); }
      return json({ ok: true }, 201);
    }
    if (id && sub === 'positions' && subId && m === 'DELETE') { await env.DB.prepare('DELETE FROM election_positions WHERE id=? AND election_id=?').bind(subId, id).run(); return json({ ok: true }); }
    if (id && sub === 'candidates' && !subId && m === 'POST') return await addCandidate(request, env, user, id);
    if (id && sub === 'candidates' && subId && m === 'PATCH') return await screen(request, env, user, id, subId);
    if (id && sub === 'candidates' && subId && m === 'DELETE') { await env.DB.prepare('DELETE FROM election_candidates WHERE id=? AND election_id=?').bind(subId, id).run(); await audit(env, user.id, 'delete', 'election_candidates', subId); return json({ ok: true }); }
    if (id && sub === 'results' && m === 'GET') return json(await tally(env, id));
    return fail('Not found.', 404);
  } catch (error) {
    console.error('Election admin request failed:', error);
    return fail('Something went wrong. Please try again.', 500);
  }
};
