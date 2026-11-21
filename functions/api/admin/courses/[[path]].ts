import { Env, currentUser, fail, hasPermission, json, randomId } from '../../auth/_shared';
import { audit, pathOf, readBody, text } from '../../_portal';

const LEVELS = ['100', '200', '300', '400'];
const CATEGORIES = ['mandatory', 'elective', 'general'];

function parse(body: Record<string, unknown>) {
  const code = text(body.code, 12).toUpperCase().replace(/\s+/g, ' ');
  const title = text(body.title, 140);
  const units = Number(body.units); const semester = Number(body.semester);
  const level = String(body.level ?? ''); const category = String(body.category ?? 'mandatory');
  if (!/^[A-Z]{2,4} ?\d{3}$/.test(code)) return { error: 'Enter a course code like CSC 211.' };
  if (title.length < 3) return { error: 'Enter the course title.' };
  if (!Number.isInteger(units) || units < 0 || units > 20) return { error: 'Credit units must be a whole number from 0 to 20.' };
  if (!LEVELS.includes(level)) return { error: 'Choose a level.' };
  if (semester !== 1 && semester !== 2) return { error: 'Choose a semester.' };
  if (!CATEGORIES.includes(category)) return { error: 'Choose a category.' };
  return { value: { code: code.includes(' ') ? code : `${code.slice(0, -3)} ${code.slice(-3)}`, title, units, level, semester, category } };
}

export const onRequest: PagesFunction<Env> = async ({ request, env, params }) => {
  const user = await currentUser(request, env).catch(() => null);
  const method = request.method;
  const verb = method === 'GET' ? 'read' : method === 'POST' ? 'create' : method === 'DELETE' ? 'delete' : 'update';
  if (!user || user.status !== 'active' || !(await hasPermission(env, user, 'academics', verb))) return fail('Academic administrator permission is required.', 403);
  const [id] = pathOf(params as Record<string, string | string[]>);
  try {
    if (!id && method === 'GET') {
      const rows = await env.DB.prepare('SELECT c.id,c.code,c.title,c.units,c.level,c.semester,c.category,c.is_active,(SELECT COUNT(*) FROM member_courses m WHERE m.course_id=c.id) AS registered FROM course_catalogue c WHERE c.owner_user_id IS NULL ORDER BY c.level,c.semester,c.code,c.title').all();
      return json(rows.results ?? []);
    }
    if (!id && method === 'POST') {
      const body = await readBody(request); const parsed = body ? parse(body) : { error: 'Invalid request.' };
      if (!parsed.value) return fail(parsed.error ?? 'Invalid request.');
      const v = parsed.value; const newId = randomId();
      await env.DB.prepare('INSERT INTO course_catalogue(id,code,title,units,level,semester,category) VALUES(?,?,?,?,?,?,?)').bind(newId, v.code, v.title, v.units, v.level, v.semester, v.category).run();
      await audit(env, user.id, 'create', 'course_catalogue', newId, v);
      return json({ id: newId }, 201);
    }
    if (id && method === 'PUT') {
      const body = await readBody(request); if (!body) return fail('Invalid request.');
      const existing = await env.DB.prepare('SELECT id FROM course_catalogue WHERE id=? AND owner_user_id IS NULL').bind(id).first();
      if (!existing) return fail('Course not found.', 404);
      if (Object.keys(body).length === 1 && 'is_active' in body) {
        await env.DB.prepare('UPDATE course_catalogue SET is_active=? WHERE id=?').bind(body.is_active === true ? 1 : 0, id).run();
        await audit(env, user.id, 'update', 'course_catalogue', id, { is_active: body.is_active === true });
        return json({ ok: true });
      }
      const parsed = parse(body); if (!parsed.value) return fail(parsed.error ?? 'Invalid request.');
      const v = parsed.value;
      await env.DB.prepare('UPDATE course_catalogue SET code=?,title=?,units=?,level=?,semester=?,category=? WHERE id=?').bind(v.code, v.title, v.units, v.level, v.semester, v.category, id).run();
      await audit(env, user.id, 'update', 'course_catalogue', id, v);
      return json({ ok: true });
    }
    if (id && method === 'DELETE') {
      const used = await env.DB.prepare('SELECT COUNT(*) n FROM member_courses WHERE course_id=?').bind(id).first<{ n: number }>();
      if ((used?.n ?? 0) > 0) {
        await env.DB.prepare('UPDATE course_catalogue SET is_active=0 WHERE id=? AND owner_user_id IS NULL').bind(id).run();
        await audit(env, user.id, 'deactivate', 'course_catalogue', id);
        return json({ ok: true, deactivated: true });
      }
      await env.DB.prepare('DELETE FROM course_catalogue WHERE id=? AND owner_user_id IS NULL').bind(id).run();
      await audit(env, user.id, 'delete', 'course_catalogue', id);
      return json({ ok: true, deactivated: false });
    }
    return fail('Not found.', 404);
  } catch (error) { console.error('Course catalogue API failed:', error); return fail('The course catalogue is unavailable right now.', 500); }
};
