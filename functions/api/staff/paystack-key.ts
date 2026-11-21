import { Env, currentUser, fail, hasPermission, json, verifyPassword } from '../auth/_shared';
import { audit, readBody } from '../_portal';
import { encryptionReady, saveSecure, verifySecondFactor } from '../_secure';

const KEY = 'paystack_secret_key';

export const onRequestGet: PagesFunction<Env> = async ({ request, env }) => {
  const user = await currentUser(request, env).catch(() => null);
  if (!user || user.status !== 'active' || !((await hasPermission(env, user, 'settings', 'read')) || (await hasPermission(env, user, 'payments', 'read')))) return fail('Payment settings permission is required.', 403);
  const [row, totp] = await Promise.all([
    env.DB.prepare('SELECT last4,updated_at FROM secure_settings WHERE key=?').bind(KEY).first<{ last4: string | null; updated_at: string }>().catch(() => null),
    user.role === 'super_admin' ? env.DB.prepare('SELECT enabled FROM admin_totp WHERE user_id=?').bind(user.id).first<{ enabled: number }>().catch(() => null) : Promise.resolve(null),
  ]);
  return json({
    source: row ? 'database' : env.PAYSTACK_SECRET_KEY ? 'environment' : 'none', last4: row?.last4 ?? null, updated_at: row ? `${row.updated_at.replace(' ', 'T')}Z` : null,
    encryption_ready: encryptionReady(env), caller_is_super_admin: user.role === 'super_admin', two_factor_enabled: Boolean(totp?.enabled),
  });
};

async function authorize(request: Request, env: Env, action: string) {
  const user = await currentUser(request, env).catch(() => null);
  if (!user || user.status !== 'active') return { error: fail('Sign in to continue.', 401) };
  if (user.role !== 'super_admin') return { error: fail('Only a super administrator can change the Paystack secret key.', 403) };
  if (!encryptionReady(env)) return { error: fail('The server is missing its encryption key (SETTINGS_ENCRYPTION_KEY), so the key cannot be stored yet.', 503) };
  const recent = await env.DB.prepare("SELECT COUNT(*) AS n FROM audit_logs WHERE actor_user_id=? AND action='paystack_key.denied' AND created_at>datetime('now','-15 minutes')").bind(user.id).first<{ n: number }>().catch(() => null);
  if ((recent?.n ?? 0) >= 5) return { error: fail('Too many failed attempts. Try again in 15 minutes.', 429) };
  const body = await readBody(request); if (!body) return { error: fail('Invalid request.') };
  const two = await env.DB.prepare('SELECT enabled FROM admin_totp WHERE user_id=?').bind(user.id).first<{ enabled: number }>();
  if (!two?.enabled) return { error: fail('Turn on Google two-factor sign-in first. It is required to change this key.', 409) };
  const row = await env.DB.prepare('SELECT password_hash FROM users WHERE id=?').bind(user.id).first<{ password_hash: string }>();
  const passwordOk = typeof body.password === 'string' && body.password !== '' && Boolean(row) && await verifyPassword(body.password, row!.password_hash);
  const codeOk = passwordOk && await verifySecondFactor(env, user.id, String(body.code ?? ''));
  if (!passwordOk || !codeOk) { await audit(env, user.id, 'paystack_key.denied', 'paystack_key', null, { action }); return { error: fail(passwordOk ? 'The authenticator code is wrong or was already used.' : 'Your password is incorrect.', 403) }; }
  return { user, body };
}

export const onRequestPut: PagesFunction<Env> = async ({ request, env }) => {
  const auth = await authorize(request, env, 'save'); if ('error' in auth) return auth.error;
  const key = typeof auth.body.secret_key === 'string' ? auth.body.secret_key.trim() : '';
  if (!/^sk_(test|live)_[A-Za-z0-9]{16,}$/.test(key)) return fail('That does not look like a Paystack secret key. It starts with sk_test_ or sk_live_.');
  try {
    const check = await fetch('https://api.paystack.co/bank?country=nigeria&perPage=1', { headers: { Authorization: `Bearer ${key}` } });
    if (check.status === 401 || check.status === 403) return fail('Paystack did not accept this key. Copy it again from your Paystack dashboard.');
  } catch { /* Paystack unreachable: the key format is valid, so save it and let the next payment confirm it. */ }
  await saveSecure(env, KEY, key, key.slice(-4), auth.user.id);
  await audit(env, auth.user.id, 'paystack_key.saved', 'paystack_key', null, { mode: key.startsWith('sk_live_') ? 'live' : 'test' });
  return json({ ok: true, last4: key.slice(-4) });
};

export const onRequestDelete: PagesFunction<Env> = async ({ request, env }) => {
  const auth = await authorize(request, env, 'remove'); if ('error' in auth) return auth.error;
  await env.DB.prepare('DELETE FROM secure_settings WHERE key=?').bind(KEY).run();
  await audit(env, auth.user.id, 'paystack_key.removed', 'paystack_key', null);
  return json({ ok: true });
};
