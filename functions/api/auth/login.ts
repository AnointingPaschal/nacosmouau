import { Env, cookie, fail, json, passwordHash, randomId, sha256, verifyPassword } from './_shared';
export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  let body: {email?:string;password?:string}; try { body = await request.json(); } catch { return fail('Invalid request body.'); }
  const email = body.email?.trim().toLowerCase() ?? ''; const password = body.password ?? '';
  const user = await env.DB.prepare('SELECT id,email,password_hash,full_name,role,status FROM users WHERE email=?').bind(email).first<{id:string;email:string;password_hash:string;full_name:string;role:string;status:string}>();
  if (!user || !(await verifyPassword(password, user.password_hash))) return fail('Email or password is incorrect.', 401);
  if (user.status !== 'active') return fail('Your account is awaiting approval or is unavailable.', 403);
  const token = `${randomId()}${randomId().replaceAll('-','')}`; const expiry = new Date(Date.now() + 7*86400000).toISOString();
  await env.DB.prepare('INSERT INTO sessions (id_hash,user_id,expires_at) VALUES (?,?,?)').bind(await sha256(token),user.id,expiry).run();
  return json({ user: { id:user.id,email:user.email,fullName:user.full_name,role:user.role } },200,{ 'Set-Cookie':cookie(token,7*86400) });
};
