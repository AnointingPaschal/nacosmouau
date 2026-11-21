import { Env, currentUser, hasPermission } from '../auth/_shared';
import { applyPaymentSuccess, audit, bankDetails, currentSession, duesSchedule, ensureMembership, fail, json, pathOf, readBody, text } from '../_portal';

type Staff = NonNullable<Awaited<ReturnType<typeof currentUser>>>;
const isSuper = (u: Staff) => u.role === 'super_admin';
const SUPER_ONLY_ROLES = new Set(['super_admin', 'admin']);

async function allow(env: Env, user: Staff, resource: string, action: string) { return hasPermission(env, user, resource, action); }
const denied = () => fail('Your role does not allow this action.', 403);

async function rolesOf(env: Env, ids: string[]) {
  const map = new Map<string, string[]>();
  if (!ids.length) return map;
  const rows = await env.DB.prepare(`SELECT user_id,role_id FROM user_roles WHERE user_id IN (${ids.map(() => '?').join(',')})`).bind(...ids).all<{ user_id: string; role_id: string }>();
  for (const r of rows.results ?? []) map.set(r.user_id, [...(map.get(r.user_id) ?? []), r.role_id]);
  return map;
}

async function members(request: Request, env: Env, user: Staff) {
  if (!(await allow(env, user, 'members', 'read'))) return denied();
  const q = new URL(request.url).searchParams;
  const search = text(q.get('search'), 80); const level = text(q.get('level'), 20); const status = text(q.get('status'), 20);
  const page = Math.max(1, Number(q.get('page') ?? 1) || 1);
  const rows = await env.DB.prepare(`SELECT u.id,u.email,u.full_name,u.phone,u.matric_number,u.academic_level,u.role,u.status,u.created_at,
    (SELECT membership_id FROM memberships m WHERE m.user_id=u.id ORDER BY created_at DESC LIMIT 1) membership_id
    FROM users u WHERE (?='' OR u.full_name LIKE '%'||?||'%' OR u.matric_number LIKE '%'||?||'%' OR u.email LIKE '%'||?||'%')
    AND (?='' OR u.academic_level=?) AND (?='' OR u.status=?) ORDER BY u.created_at DESC LIMIT 50 OFFSET ?`).bind(search, search, search, search, level, level, status, status, (page - 1) * 50).all<Record<string, unknown>>();
  const list = rows.results ?? []; const roleMap = await rolesOf(env, list.map(r => String(r.id)));
  const total = await env.DB.prepare(`SELECT COUNT(*) n FROM users u WHERE (?='' OR u.full_name LIKE '%'||?||'%' OR u.matric_number LIKE '%'||?||'%' OR u.email LIKE '%'||?||'%') AND (?='' OR u.academic_level=?) AND (?='' OR u.status=?)`).bind(search, search, search, search, level, level, status, status).first<{ n: number }>();
  return json({ total: total?.n ?? 0, page, members: list.map(r => ({ ...r, roles: roleMap.get(String(r.id)) ?? [] })) });
}

async function setMemberStatus(request: Request, env: Env, user: Staff, id: string) {
  if (!(await allow(env, user, 'members', 'update'))) return denied();
  const body = await readBody(request); const status = text(body?.status, 20);
  if (!['active', 'suspended', 'pending'].includes(status)) return fail('Choose active, suspended or pending.');
  const target = await env.DB.prepare('SELECT role FROM users WHERE id=?').bind(id).first<{ role: string }>();
  if (!target) return fail('Member not found.', 404);
  if (['admin', 'super_admin'].includes(target.role) && !isSuper(user)) return fail('Only a super administrator can change an administrator account.', 403);
  if (id === user.id && status !== 'active') return fail('You cannot suspend your own account.');
  await env.DB.prepare("UPDATE users SET status=?,updated_at=datetime('now') WHERE id=?").bind(status, id).run();
  if (status === 'active') await ensureMembership(env, id);
  await audit(env, user.id, 'update', 'members', id, { status });
  return json({ ok: true });
}

async function changeRole(request: Request, env: Env, user: Staff, id: string) {
  if (!(await allow(env, user, 'roles', 'update'))) return denied();
  const body = await readBody(request); const roleId = text(body?.role_id, 60); const act = body?.action === 'remove' ? 'remove' : 'add';
  const role = await env.DB.prepare('SELECT id,name FROM roles WHERE id=?').bind(roleId).first<{ id: string; name: string }>();
  if (!role) return fail('Choose a valid role.');
  const target = await env.DB.prepare('SELECT id,role,status FROM users WHERE id=?').bind(id).first<{ id: string; role: string; status: string }>();
  if (!target) return fail('Member not found.', 404);
  if (SUPER_ONLY_ROLES.has(roleId) && !isSuper(user)) return fail('Only a super administrator can grant or remove Administrator roles.', 403);
  if (act === 'add') {
    if (target.status !== 'active') return fail('Approve this member before giving them a role.', 409);
    await env.DB.prepare('INSERT OR IGNORE INTO user_roles(user_id,role_id,assigned_by) VALUES(?,?,?)').bind(id, roleId, user.id).run();
    if (roleId === 'admin' && target.role === 'member') await env.DB.prepare("UPDATE users SET role='admin' WHERE id=?").bind(id).run();
    if (roleId === 'super_admin') await env.DB.prepare("UPDATE users SET role='super_admin' WHERE id=?").bind(id).run();
  } else {
    if (roleId === 'super_admin') {
      const count = await env.DB.prepare("SELECT COUNT(*) n FROM users WHERE role='super_admin'").first<{ n: number }>();
      if ((count?.n ?? 0) <= 1) return fail('You cannot remove the last super administrator.', 409);
    }
    await env.DB.prepare('DELETE FROM user_roles WHERE user_id=? AND role_id=?').bind(id, roleId).run();
    if (roleId === 'admin' && target.role === 'admin') await env.DB.prepare("UPDATE users SET role='member' WHERE id=?").bind(id).run();
    if (roleId === 'super_admin' && target.role === 'super_admin') await env.DB.prepare("UPDATE users SET role='admin' WHERE id=?").bind(id).run();
  }
  await audit(env, user.id, act === 'add' ? 'role_add' : 'role_remove', 'roles', id, { role: roleId });
  return json({ ok: true });
}

async function roles(env: Env, user: Staff) {
  if (!(await allow(env, user, 'roles', 'read'))) return denied();
  const rows = await env.DB.prepare('SELECT r.id,r.name,r.description,(SELECT COUNT(*) FROM role_permissions rp WHERE rp.role_id=r.id) permissions,(SELECT COUNT(*) FROM user_roles ur WHERE ur.role_id=r.id) members FROM roles r ORDER BY r.name').all();
  return json(rows.results ?? []);
}

async function paymentList(request: Request, env: Env, user: Staff) {
  if (!(await allow(env, user, 'payments', 'read'))) return denied();
  const q = new URL(request.url).searchParams; const status = text(q.get('status'), 20); const purpose = text(q.get('purpose'), 30); const search = text(q.get('search'), 80);
  const rows = await env.DB.prepare(`SELECT p.id,p.reference,p.amount_minor,p.status,p.purpose,p.session,p.method,p.proof_key,p.depositor_name,p.review_note,p.created_at,p.paid_at,u.full_name,u.matric_number,u.academic_level,d.title AS due_title
    FROM payments p LEFT JOIN users u ON u.id=p.user_id LEFT JOIN dues_items d ON d.id=p.ref_id AND p.purpose='custom_due' WHERE (?='' OR p.status=?) AND (?='' OR p.purpose=?) AND (?='' OR u.full_name LIKE '%'||?||'%' OR u.matric_number LIKE '%'||?||'%' OR p.reference LIKE '%'||?||'%') ORDER BY (p.status='pending') DESC,p.created_at DESC LIMIT 200`).bind(status, status, purpose, purpose, search, search, search, search).all<Record<string, unknown>>();
  return json((rows.results ?? []).map(r => ({ ...r, proof_url: r.proof_key ? `/api/files/${r.proof_key}` : null, proof_key: undefined })));
}

async function reviewPayment(request: Request, env: Env, user: Staff, id: string) {
  if (!(await allow(env, user, 'payments', 'update'))) return denied();
  const body = await readBody(request); const decision = body?.decision === 'approve' ? 'approve' : body?.decision === 'reject' ? 'reject' : '';
  if (!decision) return fail('Choose approve or reject.');
  const payment = await env.DB.prepare('SELECT id,status,method FROM payments WHERE id=?').bind(id).first<{ id: string; status: string; method: string }>();
  if (!payment) return fail('Payment not found.', 404);
  if (payment.status !== 'pending') return fail('This payment has already been reviewed.', 409);
  const note = text(body?.note, 400) || null;
  if (decision === 'reject') {
    if (!note) return fail('Give a short reason so the member knows what to fix.');
    await env.DB.prepare("UPDATE payments SET status='failed',reviewed_by=?,reviewed_at=datetime('now'),review_note=? WHERE id=?").bind(user.id, note, id).run();
  } else await applyPaymentSuccess(env, id, user.id, note);
  await audit(env, user.id, decision, 'payments', id, { note });
  return json({ ok: true });
}

async function overview(env: Env, user: Staff) {
  const session = await currentSession(env);
  const [m, pend, dues, el, pay, level] = await Promise.all([
    env.DB.prepare("SELECT COUNT(*) total,SUM(status='active') active,SUM(status='pending') pending FROM users WHERE role<>'x'").first<Record<string, number>>(),
    env.DB.prepare("SELECT COUNT(*) n FROM payments WHERE status='pending'").first<{ n: number }>(),
    env.DB.prepare("SELECT COUNT(DISTINCT user_id) payers,COALESCE(SUM(amount_minor),0) total FROM payments WHERE purpose='dues' AND session=? AND status='successful'").bind(session).first<{ payers: number; total: number }>(),
    env.DB.prepare("SELECT COUNT(*) n FROM elections WHERE status IN ('nominations','voting')").first<{ n: number }>(),
    env.DB.prepare('SELECT p.id,p.amount_minor,p.status,p.purpose,p.method,p.created_at,u.full_name FROM payments p LEFT JOIN users u ON u.id=p.user_id ORDER BY p.created_at DESC LIMIT 6').all(),
    env.DB.prepare("SELECT COALESCE(academic_level,'Unknown') level,COUNT(*) n FROM users WHERE status='active' GROUP BY academic_level ORDER BY level").all<{ level: string; n: number }>(),
  ]);
  return json({ session, members: m, pending_payments: pend?.n ?? 0, dues: { ...dues, amount_minor: Math.max(0, ...Object.values(await duesSchedule(env))) }, open_elections: el?.n ?? 0, recent_payments: pay.results ?? [], by_level: level.results ?? [], bank: await bankDetails(env), staff: user.id });
}

async function finance(env: Env, user: Staff) {
  if (!(await allow(env, user, 'finance', 'read')) && !(await allow(env, user, 'payments', 'read'))) return denied();
  const [bySession, byMethod, pending] = await Promise.all([
    env.DB.prepare("SELECT COALESCE(session,'-') session,COALESCE(purpose,'other') purpose,COUNT(*) payments,SUM(amount_minor) total FROM payments WHERE status='successful' GROUP BY session,purpose ORDER BY session DESC,purpose").all(),
    env.DB.prepare("SELECT COALESCE(method,'other') method,COUNT(*) payments,SUM(amount_minor) total FROM payments WHERE status='successful' GROUP BY method").all(),
    env.DB.prepare("SELECT COUNT(*) n,COALESCE(SUM(amount_minor),0) total FROM payments WHERE status='pending'").first<{ n: number; total: number }>(),
  ]);
  return json({ by_session: bySession.results ?? [], by_method: byMethod.results ?? [], pending });
}

async function analytics(env: Env, user: Staff) {
  if (!(await allow(env, user, 'analytics', 'read')) && !(await allow(env, user, 'members', 'read'))) return denied();
  const session = await currentSession(env);
  const [byLevel, byMonth, active, paid, events] = await Promise.all([
    env.DB.prepare("SELECT COALESCE(academic_level,'Unknown') label,COUNT(*) value FROM users WHERE status='active' GROUP BY academic_level ORDER BY label").all(),
    env.DB.prepare("SELECT substr(created_at,1,7) label,COUNT(*) value FROM users GROUP BY substr(created_at,1,7) ORDER BY label DESC LIMIT 12").all<{ label: string; value: number }>(),
    env.DB.prepare("SELECT COUNT(*) n FROM users WHERE status='active'").first<{ n: number }>(),
    env.DB.prepare("SELECT COUNT(DISTINCT user_id) n FROM payments WHERE purpose='dues' AND session=? AND status='successful'").bind(session).first<{ n: number }>(),
    env.DB.prepare('SELECT e.title label,COUNT(r.id) value FROM events e LEFT JOIN event_registrations r ON r.event_id=e.id GROUP BY e.id ORDER BY e.starts_at DESC LIMIT 8').all(),
  ]);
  return json({ session, active_members: active?.n ?? 0, dues_payers: paid?.n ?? 0, by_level: byLevel.results ?? [], signups: (byMonth.results ?? []).reverse(), event_registrations: events.results ?? [] });
}

async function auditLog(request: Request, env: Env, user: Staff) {
  if (!(await allow(env, user, 'audit', 'read'))) return denied();
  const q = new URL(request.url).searchParams; const where: string[] = []; const args: unknown[] = [];
  const term = (q.get('q') ?? '').trim().slice(0, 80);
  if (term) { const like = `%${term}%`; where.push('(a.action LIKE ? OR a.resource LIKE ? OR a.details_json LIKE ? OR a.record_id LIKE ? OR u.full_name LIKE ?)'); args.push(like, like, like, like, like); }
  const resource = (q.get('resource') ?? '').trim().slice(0, 60); if (resource) { where.push('a.resource=?'); args.push(resource); }
  const day = /^\d{4}-\d{2}-\d{2}$/;
  const from = q.get('from') ?? ''; if (day.test(from)) { where.push('a.created_at >= ?'); args.push(from); }
  const to = q.get('to') ?? ''; if (day.test(to)) { where.push("a.created_at < date(?, '+1 day')"); args.push(to); }
  const clause = where.length ? `WHERE ${where.join(' AND ')}` : '';
  const all = q.get('all') === '1'; const size = all ? 5000 : 30; const page = Math.max(1, Number(q.get('page')) || 1);
  const base = `FROM audit_logs a LEFT JOIN users u ON u.id=a.actor_user_id ${clause}`;
  const [rows, total, resources] = await Promise.all([
    env.DB.prepare(`SELECT a.id,a.action,a.resource,a.record_id,a.details_json,a.created_at,u.full_name actor,u.matric_number ${base} ORDER BY a.created_at DESC LIMIT ? OFFSET ?`).bind(...args, size, all ? 0 : (page - 1) * size).all(),
    env.DB.prepare(`SELECT COUNT(*) n ${base}`).bind(...args).first<{ n: number }>(),
    env.DB.prepare('SELECT resource,COUNT(*) n FROM audit_logs GROUP BY resource ORDER BY n DESC LIMIT 40').all(),
  ]);
  return json({ rows: rows.results ?? [], total: total?.n ?? 0, page, page_size: size, resources: (resources.results ?? []).map(r => (r as { resource: string }).resource) });
}

async function welfare(request: Request, env: Env, user: Staff, id?: string) {
  if (request.method === 'GET') {
    if (!(await allow(env, user, 'welfare', 'read'))) return denied();
    const rows = await env.DB.prepare('SELECT w.id,w.category,w.subject,w.details,w.status,w.response,w.created_at,u.full_name,u.matric_number FROM welfare_requests w JOIN users u ON u.id=w.user_id ORDER BY (w.status=\'submitted\') DESC,w.created_at DESC LIMIT 200').all();
    return json(rows.results ?? []);
  }
  if (!(await allow(env, user, 'welfare', 'update')) || !id) return denied();
  const body = await readBody(request); const status = text(body?.status, 30) || 'in_review'; const response = text(body?.response, 2000) || null;
  if (!['submitted', 'in_review', 'resolved', 'declined'].includes(status)) return fail('Choose a valid status.');
  await env.DB.prepare("UPDATE welfare_requests SET status=?,response=?,assigned_to=?,updated_at=datetime('now') WHERE id=?").bind(status, response, user.id, id).run();
  await audit(env, user.id, 'update', 'welfare', id, { status });
  return json({ ok: true });
}

export const onRequest: PagesFunction<Env> = async ({ request, env, params }) => {
  const user = await currentUser(request, env).catch(() => null);
  if (!user || user.status !== 'active') return fail('Sign in to continue.', 401);
  const staff = ['admin', 'super_admin'].includes(user.role) || Boolean(await env.DB.prepare("SELECT 1 FROM user_roles WHERE user_id=? AND role_id<>'member' LIMIT 1").bind(user.id).first());
  if (!staff) return fail('Executive access is required.', 403);
  const [a, b, c] = pathOf(params as Record<string, string | string[]>); const m = request.method;
  try {
    if (a === 'overview' && m === 'GET') return await overview(env, user);
    if (a === 'members' && !b && m === 'GET') return await members(request, env, user);
    if (a === 'members' && b && !c && m === 'PATCH') return await setMemberStatus(request, env, user, b);
    if (a === 'members' && b && c === 'roles' && m === 'POST') return await changeRole(request, env, user, b);
    if (a === 'roles' && m === 'GET') return await roles(env, user);
    if (a === 'payments' && !b && m === 'GET') return await paymentList(request, env, user);
    if (a === 'payments' && b && m === 'PATCH') return await reviewPayment(request, env, user, b);
    if (a === 'finance' && m === 'GET') return await finance(env, user);
    if (a === 'analytics' && m === 'GET') return await analytics(env, user);
    if (a === 'audit' && m === 'GET') return await auditLog(request, env, user);
    if (a === 'welfare') return await welfare(request, env, user, b);
    return fail('Not found.', 404);
  } catch (error) {
    console.error('Staff request failed:', error);
    return fail('Something went wrong. Please try again.', 500);
  }
};
