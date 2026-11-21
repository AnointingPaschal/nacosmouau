import { Env, currentUser, fail, hasPermission, json } from '../../auth/_shared';
import { audit, readBody } from '../../_portal';
import { WINDOW_MAX_MIN, rules } from '../../_attendance';
import { iso } from '../../_class';

const save = (env: Env, key: string, value: number, userId: string) => env.DB.prepare("INSERT INTO system_settings(key,value_json,updated_by,updated_at) VALUES(?,?,?,datetime('now')) ON CONFLICT(key) DO UPDATE SET value_json=excluded.value_json,updated_by=excluded.updated_by,updated_at=excluded.updated_at").bind(key, JSON.stringify(value), userId).run();

export const onRequest: PagesFunction<Env> = async ({ request, env }) => {
  const user = await currentUser(request, env).catch(() => null);
  const method = request.method;
  if (!user || user.status !== 'active' || !(await hasPermission(env, user, 'academics', method === 'GET' ? 'read' : 'update'))) return fail('Academic administrator permission is required.', 403);
  try {
    if (method === 'GET') {
      const sessions = await env.DB.prepare("SELECT s.id,s.level,s.lecture_date,s.status,s.started_at,c.code,c.title,u.full_name AS started_by,(SELECT COUNT(*) FROM attendance_marks m WHERE m.session_id=s.id AND m.status='verified') AS verified,(SELECT COUNT(*) FROM attendance_marks m WHERE m.session_id=s.id AND m.status='pending') AS pending,(SELECT COUNT(*) FROM attendance_marks m WHERE m.session_id=s.id AND m.method='rep') AS by_rep FROM attendance_sessions s JOIN course_catalogue c ON c.id=s.course_id JOIN users u ON u.id=s.started_by ORDER BY s.started_at DESC LIMIT 40").all<{ started_at: string }>();
      return json({ rules: await rules(env), window_max: WINDOW_MAX_MIN, sessions: (sessions.results ?? []).map(s => ({ ...s, started_at: iso(s.started_at) })) });
    }
    if (method === 'PUT') {
      const body = await readBody(request); if (!body) return fail('Invalid request.');
      const w = Number(body.window_minutes); const r = Number(body.radius_m); const p = Number(body.min_peers);
      if (!Number.isInteger(w) || w < 1 || w > WINDOW_MAX_MIN) return fail(`The attendance window must be between 1 and ${WINDOW_MAX_MIN} minutes.`);
      if (!Number.isInteger(r) || r < 30 || r > 300) return fail('The distance limit must be between 30 and 300 metres.');
      if (!Number.isInteger(p) || p < 0 || p > 40) return fail('Nearby classmates must be between 0 and 40.');
      await Promise.all([save(env, 'attendance_window_minutes', w, user.id), save(env, 'attendance_radius_m', r, user.id), save(env, 'attendance_min_peers', p, user.id)]);
      await audit(env, user.id, 'update', 'attendance_rules', null, { w, r, p });
      return json({ ok: true });
    }
    return fail('Not found.', 404);
  } catch (error) { console.error('Attendance admin API failed:', error); return fail('Attendance settings are unavailable right now.', 500); }
};
