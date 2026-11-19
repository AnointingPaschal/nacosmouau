import { Env, fail, json, passwordHash, randomId } from './_shared';
export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  let body: {email?:string;password?:string;fullName?:string};
  try { body = await request.json(); } catch { return fail('Invalid request body.'); }
  const email = body.email?.trim().toLowerCase() ?? ''; const fullName = body.fullName?.trim() ?? ''; const password = body.password ?? '';
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254) return fail('Enter a valid email address.');
  if (fullName.length < 2 || fullName.length > 120) return fail('Enter your full name.');
  if (password.length < 12 || password.length > 200) return fail('Password must be between 12 and 200 characters.');
  const exists = await env.DB.prepare('SELECT 1 FROM users WHERE email=?').bind(email).first();
  if (exists) return fail('An account with this email already exists.', 409);
  const id = randomId();
  await env.DB.prepare('INSERT INTO users (id,email,password_hash,full_name) VALUES (?,?,?,?)').bind(id,email,await passwordHash(password),fullName).run();
  return json({ id, email, fullName, status: 'pending', message: 'Registration received. An administrator must approve your membership.' }, 201);
};
