import { Env, fail, json, randomId } from './auth/_shared';

export type Actor = { id: string; email: string; full_name: string; role: string; status: string };

/** The one current academic session, set by an administrator in Settings. */
export async function currentSession(env: Env): Promise<string> {
  const row = await env.DB.prepare("SELECT value_json FROM system_settings WHERE key='academic_session'").first<{ value_json: string }>().catch(() => null);
  try { const value = row ? JSON.parse(row.value_json) : null; if (typeof value === 'string' && value.trim()) return value.trim(); } catch { /* fall through */ }
  return `${new Date().getFullYear() - 1}/${new Date().getFullYear()}`;
}

export async function setting<T>(env: Env, key: string, fallback: T): Promise<T> {
  const row = await env.DB.prepare('SELECT value_json FROM system_settings WHERE key=?').bind(key).first<{ value_json: string }>().catch(() => null);
  if (!row) return fallback;
  try { return JSON.parse(row.value_json) as T; } catch { return fallback; }
}

export const LEVELS = ['100', '200', '300', '400'] as const;
export type DuesSchedule = Record<string, number>;
const kobo = (v: unknown) => { const n = Number(v); return Number.isSafeInteger(n) && n > 0 ? n : 0; };

/** Dues per level for the current session. Falls back to the old single amount when a level has none. */
export async function duesSchedule(env: Env): Promise<DuesSchedule> {
  const [byLevel, legacy] = await Promise.all([setting<Record<string, unknown>>(env, 'dues_by_level', {}), setting<number>(env, 'dues_amount_minor', 0)]);
  const out: DuesSchedule = {};
  for (const level of LEVELS) out[level] = kobo(byLevel?.[level]) || kobo(legacy);
  return out;
}
export async function duesAmount(env: Env, level?: string | null) { const schedule = await duesSchedule(env); return level && schedule[level] ? schedule[level] : 0; }
export async function duesAmountForUser(env: Env, userId: string) {
  const row = await env.DB.prepare('SELECT academic_level FROM users WHERE id=?').bind(userId).first<{ academic_level: string | null }>();
  return duesAmount(env, row?.academic_level ?? null);
}

export async function bankDetails(env: Env) {
  const [bank, name, number] = await Promise.all([setting<string>(env, 'bank_name', ''), setting<string>(env, 'bank_account_name', ''), setting<string>(env, 'bank_account_number', '')]);
  return { bank_name: bank, account_name: name, account_number: number, configured: Boolean(bank && name && number) };
}

/** Has the member paid NACOS dues for the current session? Votes and some services depend on it. */
export async function duesPaid(env: Env, userId: string, session?: string) {
  const s = session ?? await currentSession(env);
  return Boolean(await env.DB.prepare("SELECT 1 FROM payments WHERE user_id=? AND purpose='dues' AND session=? AND status='successful' LIMIT 1").bind(userId, s).first());
}

export async function audit(env: Env, actor: string | null, action: string, resource: string, recordId: string | null, details?: unknown) {
  await env.DB.prepare('INSERT INTO audit_logs(id,actor_user_id,action,resource,record_id,details_json) VALUES(?,?,?,?,?,?)').bind(randomId(), actor, action, resource, recordId, details ? JSON.stringify(details) : null).run().catch(() => undefined);
}

export function pathOf(params: Record<string, string | string[] | undefined>): string[] {
  const raw = params.path; return (Array.isArray(raw) ? raw : raw ? [raw] : []).map(String);
}

export async function readBody(request: Request): Promise<Record<string, unknown> | null> {
  try { const body = await request.json(); return body && typeof body === 'object' && !Array.isArray(body) ? body as Record<string, unknown> : null; } catch { return null; }
}

export const text = (value: unknown, max = 500) => typeof value === 'string' ? value.trim().slice(0, max) : '';
export const fileKey = (value: unknown) => typeof value === 'string' ? value.match(/^\/api\/files\/(uploads\/[A-Za-z0-9/_-]+\.[A-Za-z0-9]+)$/)?.[1] ?? null : null;

/** Membership IDs look like NMU/2526/0001 and are created the first time a member is approved. */
export async function ensureMembership(env: Env, userId: string): Promise<{ membership_id: string; status: string; started_at: string | null } | null> {
  const existing = await env.DB.prepare('SELECT membership_id,status,started_at FROM memberships WHERE user_id=? ORDER BY created_at DESC LIMIT 1').bind(userId).first<{ membership_id: string; status: string; started_at: string | null }>();
  if (existing) return existing;
  const session = await currentSession(env);
  const [a, b] = session.split('/');
  const count = await env.DB.prepare('SELECT COUNT(*) n FROM memberships').first<{ n: number }>();
  let seq = (count?.n ?? 0) + 1;
  for (let attempt = 0; attempt < 5; attempt++, seq++) {
    const membershipId = `NMU/${(a ?? '').slice(-2)}${(b ?? '').slice(-2)}/${String(seq).padStart(4, '0')}`;
    try {
      await env.DB.prepare("INSERT INTO memberships(id,user_id,membership_id,status,started_at) VALUES(?,?,?,'active',datetime('now'))").bind(randomId(), userId, membershipId).run();
      return { membership_id: membershipId, status: 'active', started_at: new Date().toISOString() };
    } catch { /* membership id collision: try the next number */ }
  }
  return null;
}

// ---------- Paystack ----------
export function paystackReady(env: Env) { return Boolean(env.PAYSTACK_SECRET_KEY); }

export async function paystackInitialize(env: Env, input: { email: string; amount: number; reference: string; callback: string; metadata: Record<string, unknown> }) {
  const response = await fetch('https://api.paystack.co/transaction/initialize', {
    method: 'POST',
    headers: { Authorization: `Bearer ${env.PAYSTACK_SECRET_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: input.email, amount: input.amount, currency: 'NGN', reference: input.reference, callback_url: input.callback, metadata: input.metadata }),
  });
  const body = await response.json<{ status: boolean; message?: string; data?: { authorization_url: string } }>().catch(() => null);
  if (!response.ok || !body?.status || !body.data) throw new Error(body?.message ?? 'Paystack could not start the payment.');
  return body.data.authorization_url;
}

export async function paystackVerify(env: Env, reference: string) {
  const response = await fetch(`https://api.paystack.co/transaction/verify/${encodeURIComponent(reference)}`, { headers: { Authorization: `Bearer ${env.PAYSTACK_SECRET_KEY}` } });
  const body = await response.json<{ status: boolean; data?: { status: string; amount: number; currency: string; reference: string } }>().catch(() => null);
  return response.ok && body?.status ? body.data ?? null : null;
}

type PaymentRow = { id: string; user_id: string; amount_minor: number; purpose: string | null; ref_id: string | null; status: string };

/** Marks a payment successful and applies its effect (for example, a paid candidate form). Safe to call twice. */
export async function applyPaymentSuccess(env: Env, paymentId: string, reviewer: string | null = null, note: string | null = null) {
  const payment = await env.DB.prepare('SELECT id,user_id,amount_minor,purpose,ref_id,status FROM payments WHERE id=?').bind(paymentId).first<PaymentRow>();
  if (!payment || payment.status === 'successful') return payment;
  await env.DB.prepare("UPDATE payments SET status='successful',paid_at=datetime('now'),reviewed_by=?,reviewed_at=CASE WHEN ? IS NULL THEN reviewed_at ELSE datetime('now') END,review_note=? WHERE id=?").bind(reviewer, reviewer, note, paymentId).run();
  if (payment.purpose === 'candidate_form' && payment.ref_id) {
    await env.DB.prepare("UPDATE election_candidates SET status='pending_screening' WHERE id=? AND status='pending_payment'").bind(payment.ref_id).run();
  }
  return payment;
}

export async function tally(env: Env, electionId: string) {
  const [ballots, positions, candidates, turnout] = await Promise.all([
    env.DB.prepare('SELECT encrypted_selections s FROM election_ballots WHERE election_id=?').bind(electionId).all<{ s: string }>(),
    env.DB.prepare('SELECT id,title FROM election_positions WHERE election_id=? ORDER BY display_order,title').bind(electionId).all<{ id: string; title: string }>(),
    env.DB.prepare("SELECT id,position_id,display_name FROM election_candidates WHERE election_id=? AND status='eligible'").bind(electionId).all<{ id: string; position_id: string; display_name: string }>(),
    env.DB.prepare('SELECT COUNT(*) n FROM election_ballots WHERE election_id=?').bind(electionId).first<{ n: number }>(),
  ]);
  const counts = new Map<string, number>();
  for (const ballot of ballots.results ?? []) { try { for (const candidateId of Object.values(JSON.parse(ballot.s) as Record<string, string>)) counts.set(candidateId, (counts.get(candidateId) ?? 0) + 1); } catch { /* ignore malformed ballot */ } }
  return { turnout: turnout?.n ?? 0, positions: (positions.results ?? []).map(p => ({ id: p.id, title: p.title, candidates: (candidates.results ?? []).filter(c => c.position_id === p.id).map(c => ({ id: c.id, display_name: c.display_name, votes: counts.get(c.id) ?? 0 })).sort((a, b) => b.votes - a.votes) })) };
}


export { fail, json, randomId };
