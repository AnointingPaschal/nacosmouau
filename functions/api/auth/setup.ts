import { Env, fail, json, passwordHash, randomId } from './_shared';

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

  try {
    const schema = await env.DB.prepare("SELECT sql FROM sqlite_master WHERE type='table' AND name='users'").first<{ sql: string }>();
    if (!schema?.sql.includes('super_admin')) {
      return fail('The database is missing the administrator role migration. Apply migrations/0003_super_admin_role.sql to the remote D1 database, then retry setup.', 503);
    }

    const id = randomId();
    const passwordHashValue = await passwordHash(password);
    // This conditional insert is atomic in SQLite, preventing simultaneous
    // setup requests from creating more than one initial administrator.
    const created = await env.DB.prepare(`INSERT INTO users (id,email,password_hash,full_name,role,status)
      SELECT ?,?,?,?,'super_admin','active'
      WHERE NOT EXISTS (SELECT 1 FROM users)`)
      .bind(id, email, passwordHashValue, fullName).run();
    if (!created.meta.changes) return fail('Initial setup has already been completed. Sign in with the administrator account.', 409);

    // Keep account creation successful if audit storage is temporarily damaged;
    // the failure is still visible in the Cloudflare Function logs.
    try {
      await env.DB.prepare('INSERT INTO audit_log (id,actor_user_id,action,target_type,target_id,metadata_json) VALUES (?,?,?,?,?,?)')
        .bind(randomId(), id, 'initial_super_admin_created', 'user', id, JSON.stringify({ email })).run();
    } catch (auditError) {
      console.error('Initial administrator audit record failed:', auditError);
    }
    return json({ ok: true, message: 'Initial administrator account created. You can now sign in.' }, 201);
  } catch (error) {
    console.error('Initial administrator setup failed:', error);
    const message = error instanceof Error ? error.message : '';
    if (message.includes('CHECK constraint failed')) return fail('The D1 user role schema is not ready. Confirm the users table role constraint includes super_admin.', 503);
    if (message.includes('no such table')) return fail('The D1 schema is incomplete. Recheck the required foundation tables in this database.', 503);
    if (message.includes('UNIQUE constraint failed: users.email')) return fail('An account already exists with this email address.', 409);
    return fail('Administrator creation failed in D1. Check the auth/setup Function log for the database error and retry.', 500);
  }
};
