import { Env, currentUser, hasPermission } from '../../auth/_shared';
import { LEVELS, audit, currentSession, duesSchedule, fail, json, pathOf, randomId, readBody, text } from '../../_portal';
import { confirmApprover } from '../../_dues';

type Staff = { id: string; role: string };
const levelsOf = (input: unknown): string | null | undefined => {
  if (input === undefined) return undefined; if (!Array.isArray(input)) return null;
  const picked = LEVELS.filter(l => input.map(String).includes(l)); return picked.length === 0 || picked.length === LEVELS.length ? null : picked.join(',');
};
const money = (v: unknown) => { const n = Math.round(Number(v)); return Number.isSafeInteger(n) && n > 0 && n <= 1_000_000_000 ? n : null; };

async function overview(env: Env, user: Staff): Promise<Response> {
  const session = await currentSession(env);
  const [schedule, explicit, perLevel, members, items] = await Promise.all([
    duesSchedule(env), env.DB.prepare("SELECT value_json FROM system_settings WHERE key='dues_by_level'").first<{ value_json: string }>(),
    env.DB.prepare("SELECT u.academic_level level,COUNT(DISTINCT p.user_id) payers,COALESCE(SUM(p.amount_minor),0) total FROM payments p JOIN users u ON u.id=p.user_id WHERE p.purpose='dues' AND p.session=? AND p.status='successful' GROUP BY u.academic_level").bind(session).all<{ level: string; payers: number; total: number }>(),
    env.DB.prepare("SELECT academic_level level,COUNT(*) n FROM users WHERE status='active' GROUP BY academic_level").all<{ level: string; n: number }>(),
    env.DB.prepare(`SELECT i.*,
        (SELECT COUNT(DISTINCT p.user_id) FROM payments p WHERE p.purpose='custom_due' AND p.ref_id=i.id AND p.status='successful') paid_count,
        (SELECT COALESCE(SUM(p.amount_minor),0) FROM payments p WHERE p.purpose='custom_due' AND p.ref_id=i.id AND p.status='successful') collected_minor,
        (SELECT COUNT(*) FROM payments p WHERE p.purpose='custom_due' AND p.ref_id=i.id AND p.status='pending') pending_count,
        (SELECT COUNT(*) FROM payments p WHERE p.purpose='custom_due' AND p.ref_id=i.id) payments_count
      FROM dues_items i ORDER BY (i.session=?) DESC,i.created_at DESC LIMIT 200`).bind(session).all(),
  ]);
  let stored: Record<string, number> = {}; try { stored = explicit ? JSON.parse(explicit.value_json) : {}; } catch { stored = {}; }
  const count = (rows: Array<{ level: string; n?: number; payers?: number; total?: number }> | undefined, level: string) => rows?.find(r => r.level === level);
  const nacos = LEVELS.map(level => ({ level, amount_minor: schedule[level] ?? 0, explicit: Number(stored[level]) > 0, members: count(members.results, level)?.n ?? 0, payers: count(perLevel.results, level)?.payers ?? 0, collected_minor: count(perLevel.results, level)?.total ?? 0 }));
  return json({ session, nacos, items: items.results ?? [], caller_is_super_admin: user.role === 'super_admin' });
}

async function saveNacos(request: Request, env: Env, user: Staff): Promise<Response> {
  const body = await readBody(request); if (!body) return fail('Invalid JSON body.');
  const confirmed = await confirmApprover(env, user, body); if (confirmed.error) return confirmed.error;
  const input = (body.dues_by_level ?? {}) as Record<string, unknown>; const out: Record<string, number> = {};
  for (const level of LEVELS) { const n = Math.round(Number(input[level] ?? 0)); if (!Number.isSafeInteger(n) || n < 0 || n > 1_000_000_000) return fail(`Enter a valid amount for ${level} level.`); out[level] = n; }
  await env.DB.prepare("INSERT INTO system_settings(key,value_json,updated_by,updated_at) VALUES('dues_by_level',?,?,datetime('now')) ON CONFLICT(key) DO UPDATE SET value_json=excluded.value_json,updated_by=excluded.updated_by,updated_at=excluded.updated_at").bind(JSON.stringify(out), user.id).run();
  await audit(env, user.id, 'nacos_dues.updated', 'dues', null, { amounts: out, approved_by: confirmed.approverId });
  return json({ ok: true });
}

async function create(request: Request, env: Env, user: Staff): Promise<Response> {
  const body = await readBody(request); const title = text(body?.title, 120); if (title.length < 3) return fail('Give the dues a name of at least 3 letters.');
  const amount = money(body?.amount_minor); if (!amount) return fail('Enter a valid amount.');
  const due = text(body?.due_date, 20); if (due && !/^\d{4}-\d{2}-\d{2}$/.test(due)) return fail('Use a valid due date.');
  const id = randomId(); const session = await currentSession(env);
  await env.DB.prepare('INSERT INTO dues_items(id,title,description,amount_minor,levels,session,due_date,is_active,created_by) VALUES(?,?,?,?,?,?,?,?,?)')
    .bind(id, title, text(body?.description, 600) || null, amount, levelsOf(body?.levels) ?? null, session, due || null, body?.is_active === false ? 0 : 1, user.id).run();
  await audit(env, user.id, 'create', 'dues_items', id, { title, amount_minor: amount, levels: body?.levels ?? 'all' });
  return json({ id }, 201);
}

async function update(request: Request, env: Env, user: Staff, id: string): Promise<Response> {
  const row = await env.DB.prepare('SELECT (SELECT COUNT(*) FROM payments WHERE purpose=\'custom_due\' AND ref_id=?) AS payments FROM dues_items WHERE id=?').bind(id, id).first<{ payments: number }>();
  if (!row) return fail('Dues not found.', 404);
  const body = await readBody(request) ?? {}; const sets: string[] = []; const vals: unknown[] = [];
  if (body.title !== undefined) { const t = text(body.title, 120); if (t.length < 3) return fail('Give the dues a name of at least 3 letters.'); sets.push('title=?'); vals.push(t); }
  if (body.description !== undefined) { sets.push('description=?'); vals.push(text(body.description, 600) || null); }
  if (body.due_date !== undefined) { const d = text(body.due_date, 20); if (d && !/^\d{4}-\d{2}-\d{2}$/.test(d)) return fail('Use a valid due date.'); sets.push('due_date=?'); vals.push(d || null); }
  if (body.is_active !== undefined) { sets.push('is_active=?'); vals.push(body.is_active ? 1 : 0); }
  if (body.amount_minor !== undefined || body.levels !== undefined) {
    if (row.payments > 0) return fail('Payments have started, so the amount and levels are locked. Close these dues and create new ones instead.', 409);
    if (body.amount_minor !== undefined) { const a = money(body.amount_minor); if (!a) return fail('Enter a valid amount.'); sets.push('amount_minor=?'); vals.push(a); }
    if (body.levels !== undefined) { sets.push('levels=?'); vals.push(levelsOf(body.levels) ?? null); }
  }
  if (!sets.length) return fail('Nothing to update.');
  await env.DB.prepare(`UPDATE dues_items SET ${sets.join(',')} WHERE id=?`).bind(...vals, id).run();
  await audit(env, user.id, 'update', 'dues_items', id, body); return json({ ok: true });
}

export const onRequest: PagesFunction<Env> = async ({ request, env, params }) => {
  const user = await currentUser(request, env).catch(() => null);
  if (!user || user.status !== 'active') return fail('Sign in to continue.', 401);
  const [id] = pathOf(params as Record<string, string | string[]>); const m = request.method;
  const action = m === 'GET' ? 'read' : m === 'POST' ? 'create' : m === 'DELETE' ? 'delete' : 'update';
  if (!(await hasPermission(env, user, 'payments', action))) return fail('Payments permission is required.', 403);
  try {
    if (!id && m === 'GET') return await overview(env, user);
    if (id === 'nacos' && m === 'PUT') return await saveNacos(request, env, user);
    if (!id && m === 'POST') return await create(request, env, user);
    if (id && m === 'PATCH') return await update(request, env, user, id);
    if (id && m === 'DELETE') {
      const n = await env.DB.prepare("SELECT COUNT(*) n FROM payments WHERE purpose='custom_due' AND ref_id=?").bind(id).first<{ n: number }>();
      if ((n?.n ?? 0) > 0) return fail('Members have already paid or started paying these dues. Close them instead of deleting.', 409);
      await env.DB.prepare('DELETE FROM dues_items WHERE id=?').bind(id).run(); await audit(env, user.id, 'delete', 'dues_items', id); return json({ ok: true });
    }
    return fail('Not found.', 404);
  } catch (error) { console.error('Dues admin request failed:', error); return fail('Something went wrong. Make sure the latest database migration is applied.', 500); }
};
