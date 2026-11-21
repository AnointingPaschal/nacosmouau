import { Env, verifyPassword } from './auth/_shared';
import { audit, currentSession, duesSchedule, duesAmount, fail, LEVELS } from './_portal';

export interface DuesItem { id: string; title: string; description: string | null; amount_minor: number; levels: string | null; session: string; due_date: string | null; is_active: number }
export const levelApplies = (levels: string | null, level: string | null) => !levels || (level !== null && levels.split(',').includes(level));
export type DueStatus = 'paid' | 'pending' | 'rejected' | 'unpaid';

/** Status of one due for one member, from their payments for it. */
export async function dueStatus(env: Env, userId: string, purpose: 'dues' | 'custom_due', refId: string | null, session: string) {
  const rows = await env.DB.prepare(`SELECT id,reference,status,method,review_note,created_at FROM payments WHERE user_id=? AND purpose=? AND session=? ${refId ? 'AND ref_id=?' : ''} ORDER BY created_at DESC LIMIT 5`)
    .bind(...(refId ? [userId, purpose, session, refId] : [userId, purpose, session])).all<{ id: string; reference: string; status: string; method: string; review_note: string | null; created_at: string }>();
  const list = rows.results ?? [];
  const ok = list.find(p => p.status === 'successful'); if (ok) return { status: 'paid' as DueStatus, payment: ok };
  const wait = list.find(p => p.status === 'pending'); if (wait) return { status: 'pending' as DueStatus, payment: wait };
  const bad = list.find(p => p.status === 'failed'); if (bad) return { status: 'rejected' as DueStatus, payment: bad };
  return { status: 'unpaid' as DueStatus, payment: null };
}

/** Every due this member should see: the NACOS dues for their level, then the extra dues that apply to them. */
export async function duesForMember(env: Env, userId: string, level: string | null) {
  const session = await currentSession(env);
  const [nacosAmount, nacos, items] = await Promise.all([
    duesAmount(env, level), dueStatus(env, userId, 'dues', null, session),
    env.DB.prepare('SELECT id,title,description,amount_minor,levels,session,due_date,is_active FROM dues_items WHERE session=? AND is_active=1 ORDER BY created_at DESC').bind(session).all<DuesItem>(),
  ]);
  const out: Array<Record<string, unknown>> = [{ id: 'nacos', kind: 'nacos', title: `NACOS dues ${session}`, description: 'Annual membership dues. Paying them also lets you vote in NACOS elections.', amount_minor: nacosAmount, due_date: null, ...nacos }];
  for (const item of items.results ?? []) {
    if (!levelApplies(item.levels, level)) continue;
    out.push({ id: item.id, kind: 'custom', title: item.title, description: item.description, amount_minor: item.amount_minor, due_date: item.due_date, ...(await dueStatus(env, userId, 'custom_due', item.id, session)) });
  }
  return out;
}

/** The super administrator's password confirms changes to money settings (same rule as payment details). */
export async function confirmApprover(env: Env, user: { id: string; role: string }, body: Record<string, unknown>) {
  const recent = await env.DB.prepare("SELECT COUNT(*) AS n FROM audit_logs WHERE actor_user_id=? AND action='payment_settings.denied' AND created_at>datetime('now','-15 minutes')").bind(user.id).first<{ n: number }>().catch(() => null);
  if ((recent?.n ?? 0) >= 5) return { error: fail('Too many failed attempts. Try again in 15 minutes.', 429) };
  const password = typeof body.super_admin_password === 'string' ? body.super_admin_password : '';
  const email = typeof body.super_admin_email === 'string' ? body.super_admin_email.trim().toLowerCase() : '';
  let approver: { id: string; password_hash: string } | null = null;
  if (password) approver = user.role === 'super_admin'
    ? await env.DB.prepare('SELECT id,password_hash FROM users WHERE id=?').bind(user.id).first()
    : email ? await env.DB.prepare("SELECT id,password_hash FROM users WHERE email=? AND role='super_admin' AND status='active'").bind(email).first() : null;
  if (!approver || !(await verifyPassword(password, approver.password_hash))) {
    await audit(env, user.id, 'payment_settings.denied', 'dues', null);
    return { error: fail(user.role === 'super_admin' ? 'Your password is incorrect.' : 'Super administrator email or password is incorrect.', 403) };
  }
  return { approverId: approver.id };
}
export { LEVELS, duesSchedule };
