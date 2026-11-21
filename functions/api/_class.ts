import type { Env } from './auth/_shared';
import { randomId } from './_portal';

export const LEVELS = ['100', '200', '300', '400'];
export type Position = 'rep' | 'assistant';
export const POSITIONS: Position[] = ['rep', 'assistant'];
export const POSITION_LABEL: Record<Position, string> = { rep: 'Course Rep', assistant: 'Assistant Course Rep' };

/** D1 stores UTC as "YYYY-MM-DD HH:MM:SS"; the app gets proper ISO strings. */
export const iso = (value: unknown) => (typeof value === 'string' && value ? `${value.replace(' ', 'T')}Z` : null);

export interface ClassElection { id: string; level: string; session: string; status: 'nominations' | 'voting' | 'closed'; voting_started_at: string | null; voting_ends_at: string | null; closed_at: string | null }

export async function ensureElection(env: Env, level: string, session: string): Promise<ClassElection> {
  await env.DB.prepare('INSERT OR IGNORE INTO class_elections(id,level,session) VALUES(?,?,?)').bind(randomId(), level, session).run();
  return (await env.DB.prepare('SELECT id,level,session,status,voting_started_at,voting_ends_at,closed_at FROM class_elections WHERE level=? AND session=?').bind(level, session).first<ClassElection>())!;
}

/** Ends an election: the approved candidate with the most votes in each position becomes rep or assistant. Ties go to the earlier applicant. */
export async function closeElection(env: Env, electionId: string) {
  const election = await env.DB.prepare("SELECT id,level,session FROM class_elections WHERE id=? AND status='voting'").bind(electionId).first<{ id: string; level: string; session: string }>();
  if (!election) return;
  for (const position of POSITIONS) {
    const winner = await env.DB.prepare("SELECT c.user_id, COUNT(b.id) AS votes FROM class_candidates c LEFT JOIN class_ballots b ON b.candidate_id=c.id WHERE c.election_id=? AND c.position=? AND c.status='approved' GROUP BY c.id ORDER BY votes DESC, c.created_at ASC LIMIT 1").bind(election.id, position).first<{ user_id: string; votes: number }>();
    if (winner) await env.DB.prepare('INSERT OR REPLACE INTO class_reps(id,user_id,level,session,role,election_id,votes) VALUES(?,?,?,?,?,?,?)').bind(randomId(), winner.user_id, election.level, election.session, position, election.id, winner.votes).run();
  }
  await env.DB.prepare("UPDATE class_elections SET status='closed', closed_at=datetime('now') WHERE id=? AND status='voting'").bind(election.id).run();
}

/** Voting ends by itself once its set time has passed. Called on every read so no scheduler is needed. */
export async function finalizeDue(env: Env) {
  const due = await env.DB.prepare("SELECT id FROM class_elections WHERE status='voting' AND voting_ends_at<=datetime('now')").all<{ id: string }>();
  for (const row of due.results ?? []) await closeElection(env, row.id);
}

export async function repRoles(env: Env, userId: string, session: string) {
  const rows = await env.DB.prepare('SELECT role,level,session FROM class_reps WHERE user_id=? AND session=?').bind(userId, session).all<{ role: Position; level: string; session: string }>();
  return rows.results ?? [];
}
