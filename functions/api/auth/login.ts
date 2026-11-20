import { Env, cookie, isStaff, fail, json, randomId, sha256, verifyPassword } from './_shared';

type LoginUser = { id: string; email: string; password_hash: string; full_name: string; role: string; status: string };

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  let body: { identifier?: string; email?: string; password?: string };
  try { body = await request.json(); } catch { return fail('Invalid request body.'); }

  // Members sign in with their matric or JAMB registration number. Executives may still use their email.
  const typed = (body.identifier ?? body.email ?? '').trim();
  const email = typed.toLowerCase();
  let regNumber = typed.replace(/\s+/g, '').toUpperCase();
  if (/^\d{2}\/\d{3,7}$/.test(regNumber)) regNumber = `MOUAU/CMP/${regNumber}`;
  const password = body.password ?? '';
  let user: LoginUser | null;
  try {
    user = await env.DB.prepare('SELECT id,email,password_hash,full_name,role,status FROM users WHERE email=? OR matric_number=?')
      .bind(email, regNumber).first<LoginUser>();
  } catch (error) {
    console.error('Login account lookup failed:', error);
    return fail('Sign in could not read the account database. Check the users table schema and the auth/login Function log.', 500);
  }

  if (!user) return fail('Matric/registration number or password is incorrect.', 401);
  try {
    if (!(await verifyPassword(password, user.password_hash))) return fail('Matric/registration number or password is incorrect.', 401);
  } catch (error) {
    console.error('Login password verification failed:', error);
    return fail('Sign in could not verify the password hash. Check the password_hash value and the auth/login Function log.', 500);
  }
  if (user.status !== 'active') return fail('Your account is awaiting approval or is unavailable.', 403);

  const space = body && (body as { space?: unknown }).space === 'admin' ? 'admin' : 'member';
  if (space === 'admin' && !(await isStaff(env, user))) return fail('This account does not have administration access.', 403);
  try {
    const token = `${randomId()}${randomId().replaceAll('-', '')}`;
    const expiry = new Date(Date.now() + 7 * 86400000).toISOString();
    await env.DB.prepare('INSERT INTO sessions (id_hash,user_id,expires_at) VALUES (?,?,?)')
      .bind(await sha256(token), user.id, expiry).run();
    return json({ user: { id: user.id, email: user.email, fullName: user.full_name, role: user.role } }, 200, {
      'Set-Cookie': cookie(token, 7 * 86400, space),
    });
  } catch (error) {
    console.error('Login session creation failed:', error);
    return fail('The password was accepted, but sign in could not create a session. Check the sessions table schema and the auth/login Function log.', 500);
  }
};
