import { Env, currentUser, fail, json, verifyPassword } from '../auth/_shared';
import { audit, readBody } from '../_portal';
import { base32, encrypt, decrypt, encryptionReady, makeBackupCodes, matchTotp, newTotpSecret, unbase32, verifySecondFactor } from '../_secure';

type Admin = { id: string; email: string; role: string };

async function superAdmin(request: Request, env: Env): Promise<Admin | Response> {
  const user = await currentUser(request, env).catch(() => null);
  if (!user || user.status !== 'active') return fail('Sign in to continue.', 401);
  if (user.role !== 'super_admin') return fail('Only a super administrator can manage two-factor sign-in.', 403);
  return user as Admin;
}

async function tooManyFailures(env: Env, userId: string) {
  const recent = await env.DB.prepare("SELECT COUNT(*) AS n FROM audit_logs WHERE actor_user_id=? AND action='two_factor.denied' AND created_at>datetime('now','-15 minutes')").bind(userId).first<{ n: number }>().catch(() => null);
  return (recent?.n ?? 0) >= 5;
}
async function passwordOk(env: Env, userId: string, password: unknown) {
  const row = await env.DB.prepare('SELECT password_hash FROM users WHERE id=?').bind(userId).first<{ password_hash: string }>();
  return typeof password === 'string' && password !== '' && Boolean(row) && verifyPassword(password, row!.password_hash);
}

export const onRequestGet: PagesFunction<Env> = async ({ request, env }) => {
  const admin = await superAdmin(request, env); if (admin instanceof Response) return admin;
  const row = await env.DB.prepare('SELECT enabled FROM admin_totp WHERE user_id=?').bind(admin.id).first<{ enabled: number }>();
  const left = await env.DB.prepare('SELECT COUNT(*) n FROM admin_backup_codes WHERE user_id=? AND used_at IS NULL').bind(admin.id).first<{ n: number }>();
  return json({ enabled: Boolean(row?.enabled), pending: Boolean(row && !row.enabled), backup_codes_left: left?.n ?? 0, encryption_ready: encryptionReady(env) });
};

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  const admin = await superAdmin(request, env); if (admin instanceof Response) return admin;
  const body = await readBody(request); if (!body) return fail('Invalid request.');
  const action = String(body.action ?? '');
  if (!encryptionReady(env)) return fail('The server is missing its encryption key (SETTINGS_ENCRYPTION_KEY), so two-factor sign-in cannot be set up yet.', 503);
  if (await tooManyFailures(env, admin.id)) return fail('Too many failed attempts. Try again in 15 minutes.', 429);
  const deny = async (message: string) => { await audit(env, admin.id, 'two_factor.denied', 'two_factor', null, { action }); return fail(message, 403); };

  if (action === 'begin') {
    if (!(await passwordOk(env, admin.id, body.password))) return deny('Your password is incorrect.');
    const existing = await env.DB.prepare('SELECT enabled FROM admin_totp WHERE user_id=?').bind(admin.id).first<{ enabled: number }>();
    if (existing?.enabled) return fail('Two-factor sign-in is already on. Turn it off first to set it up again.', 409);
    const secret = base32(newTotpSecret());
    const { cipher, iv } = await encrypt(env, secret, `totp:${admin.id}`);
    await env.DB.prepare("INSERT INTO admin_totp(user_id,secret_cipher,iv,enabled,last_step) VALUES(?,?,?,0,0) ON CONFLICT(user_id) DO UPDATE SET secret_cipher=excluded.secret_cipher,iv=excluded.iv,enabled=0,last_step=0,confirmed_at=NULL").bind(admin.id, cipher, iv).run();
    return json({ secret, otpauth: `otpauth://totp/${encodeURIComponent(`NACOS MOUAU:${admin.email}`)}?secret=${secret}&issuer=${encodeURIComponent('NACOS MOUAU')}&digits=6&period=30` });
  }
  if (action === 'confirm') {
    const row = await env.DB.prepare('SELECT secret_cipher,iv,enabled FROM admin_totp WHERE user_id=?').bind(admin.id).first<{ secret_cipher: string; iv: string; enabled: number }>();
    if (!row || row.enabled) return fail('Start the setup first.', 409);
    const secret = await decrypt(env, row.secret_cipher, row.iv, `totp:${admin.id}`); const code = String(body.code ?? '').trim();
    const step = secret && /^\d{6}$/.test(code) ? await matchTotp(unbase32(secret), code, 0) : null;
    if (step === null) return deny('That code does not match. Check the time on your phone and try again.');
    await env.DB.prepare("UPDATE admin_totp SET enabled=1,last_step=?,confirmed_at=datetime('now') WHERE user_id=?").bind(step, admin.id).run();
    const backup_codes = await makeBackupCodes(env, admin.id);
    await audit(env, admin.id, 'two_factor.enabled', 'two_factor', null);
    return json({ ok: true, backup_codes });
  }
  if (action === 'disable') {
    if (!(await passwordOk(env, admin.id, body.password)) || !(await verifySecondFactor(env, admin.id, String(body.code ?? '')))) return deny('Your password or code is incorrect.');
    await env.DB.batch([env.DB.prepare('DELETE FROM admin_totp WHERE user_id=?').bind(admin.id), env.DB.prepare('DELETE FROM admin_backup_codes WHERE user_id=?').bind(admin.id)]);
    await audit(env, admin.id, 'two_factor.disabled', 'two_factor', null);
    return json({ ok: true });
  }
  return fail('Unknown action.');
};
