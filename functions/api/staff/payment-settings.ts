import { Env, currentUser, hasPermission, verifyPassword } from '../auth/_shared';
import { LEVELS, audit, bankDetails, currentSession, duesSchedule, fail, json, readBody, setting } from '../_portal';

async function allowed(env: Env, user: { id: string; role: string }, action: 'read' | 'update') {
  return (await hasPermission(env, user, 'settings', action)) || (await hasPermission(env, user, 'payments', action));
}

export const onRequestGet: PagesFunction<Env> = async ({ request, env }) => {
  const user = await currentUser(request, env).catch(() => null);
  if (!user || user.status !== 'active' || !(await allowed(env, user, 'read'))) return fail('Payment settings permission is required.', 403);
  const [session, schedule, bank, publicKey] = await Promise.all([currentSession(env), duesSchedule(env), bankDetails(env), setting<string>(env, 'paystack_public_key', '')]);
  const explicit = await setting<Record<string, number>>(env, 'dues_by_level', {});
  return json({
    session, dues_by_level: schedule, dues_explicit: LEVELS.filter(l => Number(explicit?.[l]) > 0),
    bank_name: bank.bank_name, bank_account_name: bank.account_name, bank_account_number: bank.account_number,
    paystack_public_key: publicKey, paystack_secret_configured: Boolean(env.PAYSTACK_SECRET_KEY),
    caller_is_super_admin: user.role === 'super_admin',
  });
};

/** Changing money settings needs a super administrator's password, even for a signed-in administrator. */
export const onRequestPut: PagesFunction<Env> = async ({ request, env }) => {
  const user = await currentUser(request, env).catch(() => null);
  if (!user || user.status !== 'active' || !(await allowed(env, user, 'update'))) return fail('Payment settings permission is required.', 403);
  const body = await readBody(request); if (!body) return fail('Invalid JSON body.');

  const recent = await env.DB.prepare("SELECT COUNT(*) AS n FROM audit_logs WHERE actor_user_id=? AND action='payment_settings.denied' AND created_at>datetime('now','-15 minutes')").bind(user.id).first<{ n: number }>().catch(() => null);
  if ((recent?.n ?? 0) >= 5) return fail('Too many failed attempts. Try again in 15 minutes.', 429);

  const password = typeof body.super_admin_password === 'string' ? body.super_admin_password : '';
  const email = typeof body.super_admin_email === 'string' ? body.super_admin_email.trim().toLowerCase() : '';
  let approver: { id: string; password_hash: string; role: string } | null = null;
  if (password) {
    approver = user.role === 'super_admin'
      ? await env.DB.prepare('SELECT id,password_hash,role FROM users WHERE id=?').bind(user.id).first()
      : email ? await env.DB.prepare("SELECT id,password_hash,role FROM users WHERE email=? AND role='super_admin' AND status='active'").bind(email).first() : null;
  }
  if (!approver || !(await verifyPassword(password, approver.password_hash))) {
    await audit(env, user.id, 'payment_settings.denied', 'payment_settings', null);
    return fail(user.role === 'super_admin' ? 'Your password is incorrect.' : 'Super administrator email or password is incorrect.', 403);
  }

  const entries: Array<[string, unknown]> = [];
  if (body.dues_by_level !== undefined) {
    const input = body.dues_by_level as Record<string, unknown>, out: Record<string, number> = {};
    for (const level of LEVELS) {
      const n = Math.round(Number(input?.[level] ?? 0));
      if (!Number.isSafeInteger(n) || n < 0 || n > 1_000_000_000) return fail(`Enter a valid dues amount for ${level} level.`);
      out[level] = n;
    }
    entries.push(['dues_by_level', out]);
  }
  for (const [key, label, max] of [['bank_name', 'Bank name', 80], ['bank_account_name', 'Account name', 120]] as const) {
    if (body[key] === undefined) continue; const v = String(body[key]).trim(); if (v.length > max) return fail(`${label} is too long.`); entries.push([key, v]);
  }
  if (body.bank_account_number !== undefined) {
    const v = String(body.bank_account_number).replace(/\s/g, ''); if (v && !/^\d{10}$/.test(v)) return fail('Account number must be 10 digits.'); entries.push(['bank_account_number', v]);
  }
  if (body.paystack_public_key !== undefined) {
    const v = String(body.paystack_public_key).trim(); if (v && !/^pk_(test|live)_[A-Za-z0-9]{10,}$/.test(v)) return fail('Enter a Paystack public key that starts with pk_test_ or pk_live_.');
    entries.push(['paystack_public_key', v]);
  }
  if (!entries.length) return fail('Nothing to update.');
  for (const [key, value] of entries) {
    await env.DB.prepare("INSERT INTO system_settings(key,value_json,updated_by,updated_at) VALUES(?,?,?,datetime('now')) ON CONFLICT(key) DO UPDATE SET value_json=excluded.value_json,updated_by=excluded.updated_by,updated_at=excluded.updated_at").bind(key, JSON.stringify(value), user.id).run();
  }
  await audit(env, user.id, 'payment_settings.updated', 'payment_settings', null, { keys: entries.map(e => e[0]), approved_by: approver.id });
  return json({ updated: entries.map(e => e[0]) });
};
