import { Env, cookie, fail, json, randomId, sha256, signSessionToken, verifyPassword } from './_shared';

type LoginUser = { id: string; email: string; password_hash: string; full_name: string; role: string; status: string };

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  let body: { email?: string; password?: string };
  try { body = await request.json(); } catch { return fail('Invalid request body.'); }

  const email = body.email?.trim().toLowerCase() ?? '';
  const password = body.password ?? '';
  const now = Math.floor(Date.now() / 1000);
  const ip = request.headers.get('CF-Connecting-IP') ?? 'unknown';
  const attemptKey = await sha256(`${email}|${ip}`);
  try {
    const attempt = await env.DB.prepare('SELECT failures,window_started_at,blocked_until FROM login_attempts WHERE attempt_key=?').bind(attemptKey).first<{failures:number;window_started_at:number;blocked_until:number|null}>();
    if (attempt?.blocked_until && attempt.blocked_until > now) return fail('Too many sign-in attempts. Try again in a few minutes.',429);
  } catch(error) { console.error('Login rate-limit lookup failed:',error); return fail('Sign in protection is not configured. Apply the latest database migration.',503); }
  const recordFailure = async () => {
    await env.DB.prepare(`INSERT INTO login_attempts(attempt_key,failures,window_started_at,blocked_until,updated_at) VALUES(?,1,?,NULL,datetime('now')) ON CONFLICT(attempt_key) DO UPDATE SET failures=CASE WHEN window_started_at < ? THEN 1 ELSE failures+1 END,window_started_at=CASE WHEN window_started_at < ? THEN excluded.window_started_at ELSE window_started_at END,blocked_until=CASE WHEN (CASE WHEN window_started_at < ? THEN 1 ELSE failures+1 END)>=8 THEN ? ELSE blocked_until END,updated_at=datetime('now')`).bind(attemptKey,now,now-900,now-900,now-900,now+900).run();
  };
  let user: LoginUser | null;
  try {
    user = await env.DB.prepare('SELECT id,email,password_hash,full_name,role,status FROM users WHERE email=?')
      .bind(email).first<LoginUser>();
  } catch (error) {
    console.error('Login account lookup failed:', error);
    return fail('Sign in could not read the account database. Check the users table schema and the auth/login Function log.', 500);
  }

  if (!user) { await recordFailure(); return fail('Email or password is incorrect.', 401); }
  try {
    if (!(await verifyPassword(password, user.password_hash))) { await recordFailure(); return fail('Email or password is incorrect.', 401); }
  } catch (error) {
    console.error('Login password verification failed:', error);
    return fail('Sign in could not verify the password hash. Check the password_hash value and the auth/login Function log.', 500);
  }
  if (user.status !== 'active') return fail('Your account is awaiting approval or is unavailable.', 403);
  if (!env.SESSION_SECRET || env.SESSION_SECRET.length < 32) {
    console.error('Login session creation failed: SESSION_SECRET is missing or shorter than 32 characters.');
    return fail('Sign-in session security is not configured. Add SESSION_SECRET as a Cloudflare Pages secret with at least 32 characters, then redeploy.', 503);
  }

  try {
    await env.DB.prepare('DELETE FROM login_attempts WHERE attempt_key=?').bind(attemptKey).run();
    const token = await signSessionToken(randomId(), env.SESSION_SECRET);
    const expiry = new Date(Date.now() + 7 * 86400000).toISOString();
    await env.DB.prepare('INSERT INTO sessions (id_hash,user_id,expires_at) VALUES (?,?,?)')
      .bind(await sha256(token), user.id, expiry).run();
    return json({ user: { id: user.id, email: user.email, fullName: user.full_name, role: user.role } }, 200, {
      'Set-Cookie': cookie(token, 7 * 86400),
    });
  } catch (error) {
    console.error('Login session creation failed:', error);
    return fail('The password was accepted, but sign in could not create a session. Check the sessions table schema and the auth/login Function log.', 500);
  }
};
