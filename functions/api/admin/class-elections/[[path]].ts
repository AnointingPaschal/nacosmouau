import { Env, currentUser, fail, hasPermission, json } from '../../auth/_shared';
import { audit, currentSession, pathOf, readBody, text } from '../../_portal';
import { LEVELS, closeElection, ensureElection, finalizeDue, iso } from '../../_class';

/** Admins only approve contestants and start voting. Course reps are never assigned by hand: they are the election winners. */
export const onRequest: PagesFunction<Env> = async ({ request, env, params }) => {
  const user = await currentUser(request, env).catch(() => null);
  const method = request.method;
  const verb = method === 'GET' ? 'read' : 'update';
  if (!user || user.status !== 'active' || !(await hasPermission(env, user, 'elections', verb))) return fail('Election administrator permission is required.', 403);
  const [a, b] = pathOf(params as Record<string, string | string[]>);
  try {
    if (!a && method === 'GET') {
      const session = await currentSession(env); await finalizeDue(env);
      const levels = [];
      for (const level of LEVELS) {
        const election = await ensureElection(env, level, session);
        const [candidates, members, reps] = await Promise.all([
          env.DB.prepare('SELECT c.id,c.position,c.manifesto,c.status,c.review_note,c.created_at,u.full_name,u.matric_number,(SELECT COUNT(*) FROM class_ballots b WHERE b.candidate_id=c.id) AS votes FROM class_candidates c JOIN users u ON u.id=c.user_id WHERE c.election_id=? ORDER BY c.position,c.created_at').bind(election.id).all(),
          env.DB.prepare("SELECT COUNT(*) n FROM users WHERE academic_level=? AND status='active'").bind(level).first<{ n: number }>(),
          env.DB.prepare('SELECT r.role,r.votes,u.full_name,u.matric_number FROM class_reps r JOIN users u ON u.id=r.user_id WHERE r.level=? AND r.session=?').bind(level, session).all(),
        ]);
        const voters = await env.DB.prepare('SELECT COUNT(DISTINCT voter_id) n FROM class_vote_roll WHERE election_id=?').bind(election.id).first<{ n: number }>();
        levels.push({ level, election: { ...election, voting_started_at: iso(election.voting_started_at), voting_ends_at: iso(election.voting_ends_at), closed_at: iso(election.closed_at) }, candidates: candidates.results ?? [], members: members?.n ?? 0, voters: voters?.n ?? 0, reps: reps.results ?? [] });
      }
      return json({ session, levels });
    }
    if (a === 'candidate' && b && method === 'PUT') {
      const body = await readBody(request); const status = String(body?.status ?? '');
      if (!['approved', 'rejected', 'pending'].includes(status)) return fail('Choose approve, reject or pending.');
      const row = await env.DB.prepare("SELECT c.id FROM class_candidates c JOIN class_elections e ON e.id=c.election_id WHERE c.id=? AND e.status='nominations'").bind(b).first();
      if (!row) return fail('Contestants can only be reviewed while nominations are open.', 409);
      await env.DB.prepare('UPDATE class_candidates SET status=?, review_note=? WHERE id=?').bind(status, text(body?.note, 300) || null, b).run();
      await audit(env, user.id, status, 'class_candidates', b);
      return json({ ok: true });
    }
    if (a && LEVELS.includes(a) && b === 'start' && method === 'POST') {
      const body = await readBody(request); const hours = Number(body?.hours);
      if (!Number.isFinite(hours) || hours < 1 || hours > 168) return fail('Voting can last from 1 to 168 hours.');
      const session = await currentSession(env); const election = await ensureElection(env, a, session);
      if (election.status !== 'nominations') return fail('Voting has already started or ended for this level.', 409);
      const approved = await env.DB.prepare("SELECT COUNT(*) n FROM class_candidates WHERE election_id=? AND status='approved'").bind(election.id).first<{ n: number }>();
      if (!approved?.n) return fail('Approve at least one contestant before starting the vote.', 409);
      await env.DB.prepare("UPDATE class_elections SET status='voting', voting_started_at=datetime('now'), voting_ends_at=datetime('now', ?) WHERE id=? AND status='nominations'").bind(`+${Math.round(hours * 60)} minutes`, election.id).run();
      await audit(env, user.id, 'start_vote', 'class_elections', election.id, { level: a, hours });
      return json({ ok: true });
    }
    if (a && LEVELS.includes(a) && b === 'end' && method === 'POST') {
      const session = await currentSession(env); const election = await ensureElection(env, a, session);
      if (election.status !== 'voting') return fail('Voting is not running for this level.', 409);
      await closeElection(env, election.id);
      await audit(env, user.id, 'end_vote', 'class_elections', election.id, { level: a });
      return json({ ok: true });
    }
    return fail('Not found.', 404);
  } catch (error) { console.error('Class election admin API failed:', error); return fail('Class elections are unavailable right now.', 500); }
};
