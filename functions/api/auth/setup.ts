import { Env, fail, json, passwordHash, randomId, sha256 } from './_shared';

type SetupBody = { setupToken?: string; email?: string; fullName?: string; password?: string };

function constantTimeEqual(a: string, b: string): boolean {
  const left = new TextEncoder().encode(a);
  const right = new TextEncoder().encode(b);
  let difference = left.length ^ right.length;
  const length = Math.max(left.length, right.length);
  for (let i = 0; i < length; i++) difference |= (left[i] ?? 0) ^ (right[i] ?? 0);
  return difference === 0;
}

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  if (!env.SETUP_TOKEN) return fail('Initial administrator setup is not configured. Add the SETUP_TOKEN secret in Cloudflare Pages settings and redeploy.', 503);
  let body: SetupBody;
  try { body = await request.json(); } catch { return fail('Invalid request body.'); }

  const setupToken = body.setupToken ?? '';
  const email = body.email?.trim().toLowerCase() ?? '';
  const fullName = body.fullName?.trim() ?? '';
  const password = body.password ?? '';
  if (!constantTimeEqual(setupToken, env.SETUP_TOKEN)) return fail('The one-time setup token is incorrect.', 401);
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254) return fail('Enter a valid email address.');
  if (fullName.length < 2 || fullName.length > 120) return fail('Enter your full name.');
  if (password.length < 12 || password.length > 200) return fail('Password must be between 12 and 200 characters.');

  const id = randomId();
  const passwordHashValue = await passwordHash(password);
  // The conditional insert is atomic in D1, so simultaneous setup requests
  // cannot create more than one initial administrator or race registration.
  const result = await env.DB.prepare(`INSERT INTO users (id,email,password_hash,full_name,role,status)
    SELECT ?,?,?,?,'super_admin','active'
    WHERE NOT EXISTS (SELECT 1 FROM users)`)
    .bind(id, email, passwordHashValue, fullName).run();
  if (!result.meta.changes) return fail('Initial setup has already been completed. Sign in with the administrator account.', 409);

  await env.DB.prepare('INSERT INTO audit_log (id,actor_user_id,action,target_type,target_id,metadata_json) VALUES (?,?,?,?,?,?)')
    .bind(randomId(), id, 'initial_super_admin_created', 'user', id, JSON.stringify({ email })).run();
  return json({ ok: true, message: 'Initial administrator account created. You can now sign in.' }, 201);
};
