import { Env, currentUser } from '../../auth/_shared';
import { currentSession, fail, json, pathOf, randomId, readBody, text } from '../../_portal';

type Me = NonNullable<Awaited<ReturnType<typeof currentUser>>>;
const LEVELS = ['100', '200', '300', '400'];
const SESSION = /^(\d{4})\/(\d{4})$/;
const GRADES = ['A', 'B', 'C', 'D', 'E', 'F'];

/** Nigerian 5-point scale used at MOUAU: A 70-100, B 60-69, C 50-59, D 45-49, E 40-44, F 0-39. */
const gradeFor = (score: number) => (score >= 70 ? 'A' : score >= 60 ? 'B' : score >= 50 ? 'C' : score >= 45 ? 'D' : score >= 40 ? 'E' : 'F');
const validSession = (value: string) => { const m = value.match(SESSION); return Boolean(m) && Number(m![2]) === Number(m![1]) + 1; };

async function state(env: Env, user: Me) {
  const [session, me, catalogue, records] = await Promise.all([
    currentSession(env),
    env.DB.prepare('SELECT academic_level FROM users WHERE id=?').bind(user.id).first<{ academic_level: string | null }>(),
    env.DB.prepare('SELECT id,code,title,units,level,semester,category,owner_user_id FROM course_catalogue WHERE is_active=1 AND (owner_user_id IS NULL OR owner_user_id=?) ORDER BY level,semester,code,title').bind(user.id).all(),
    env.DB.prepare('SELECT m.id,m.course_id,m.session,m.level,m.semester,m.score,m.grade,c.code,c.title,c.units FROM member_courses m JOIN course_catalogue c ON c.id=m.course_id WHERE m.user_id=? ORDER BY m.session,m.semester,c.code').bind(user.id).all(),
  ]);
  return json({ session, level: me?.academic_level ?? null, catalogue: catalogue.results ?? [], records: records.results ?? [] });
}

async function register(request: Request, env: Env, user: Me) {
  const body = await readBody(request); if (!body) return fail('Invalid request.');
  const ids = Array.isArray(body.course_ids) ? body.course_ids.map(String).slice(0, 60) : body.course_id ? [String(body.course_id)] : [];
  if (!ids.length) return fail('Choose at least one course.');
  const session = text(body.session, 9) || await currentSession(env);
  if (!validSession(session)) return fail('Enter the session like 2025/2026.');
  const added: string[] = []; const skipped: string[] = [];
  for (const courseId of ids) {
    const course = await env.DB.prepare('SELECT id,level,semester FROM course_catalogue WHERE id=? AND is_active=1 AND (owner_user_id IS NULL OR owner_user_id=?)').bind(courseId, user.id).first<{ id: string; level: string; semester: number }>();
    if (!course) { skipped.push(courseId); continue; }
    const id = randomId();
    const result = await env.DB.prepare('INSERT OR IGNORE INTO member_courses(id,user_id,course_id,session,level,semester) VALUES(?,?,?,?,?,?)').bind(id, user.id, course.id, session, course.level, course.semester).run();
    if (result.meta?.changes) added.push(id); else skipped.push(courseId);
  }
  return json({ added: added.length, skipped: skipped.length }, 201);
}

async function createCourse(request: Request, env: Env, user: Me) {
  const body = await readBody(request); if (!body) return fail('Invalid request.');
  const code = text(body.code, 12).toUpperCase().replace(/\s+/g, ' '); const title = text(body.title, 120);
  const units = Number(body.units); const level = String(body.level ?? ''); const semester = Number(body.semester);
  if (!/^[A-Z]{2,4} ?\d{3}$/.test(code)) return fail('Enter a course code like CSC 211.');
  if (title.length < 3) return fail('Enter the course title.');
  if (!Number.isInteger(units) || units < 0 || units > 20) return fail('Credit units must be a whole number from 0 to 20.');
  if (!LEVELS.includes(level)) return fail('Choose a level.');
  if (semester !== 1 && semester !== 2) return fail('Choose a semester.');
  const mine = await env.DB.prepare('SELECT COUNT(*) n FROM course_catalogue WHERE owner_user_id=?').bind(user.id).first<{ n: number }>();
  if ((mine?.n ?? 0) >= 60) return fail('You have reached the limit of personal courses.', 409);
  const id = randomId();
  await env.DB.prepare('INSERT INTO course_catalogue(id,code,title,units,level,semester,category,owner_user_id) VALUES(?,?,?,?,?,?,?,?)').bind(id, code, title, units, level, semester, 'personal', user.id).run();
  return json({ id }, 201);
}

async function updateRecord(request: Request, env: Env, user: Me, id: string) {
  const body = await readBody(request); if (!body) return fail('Invalid request.');
  const row = await env.DB.prepare('SELECT id FROM member_courses WHERE id=? AND user_id=?').bind(id, user.id).first();
  if (!row) return fail('Course record not found.', 404);
  let score: number | null = null; let grade: string | null = null;
  const rawScore = body.score; const rawGrade = typeof body.grade === 'string' ? body.grade.toUpperCase() : null;
  if (rawScore !== null && rawScore !== undefined && rawScore !== '') {
    score = Number(rawScore);
    if (!Number.isFinite(score) || score < 0 || score > 100) return fail('Score must be between 0 and 100.');
    score = Math.round(score * 10) / 10; grade = gradeFor(score);
  } else if (rawGrade) {
    if (!GRADES.includes(rawGrade)) return fail('Grade must be A, B, C, D, E or F.');
    grade = rawGrade;
  }
  await env.DB.prepare("UPDATE member_courses SET score=?,grade=?,updated_at=datetime('now') WHERE id=? AND user_id=?").bind(score, grade, id, user.id).run();
  return json({ ok: true, grade, score });
}

export const onRequest: PagesFunction<Env> = async ({ request, env, params }) => {
  const user = await currentUser(request, env).catch(() => null);
  if (!user || user.status !== 'active') return fail('Sign in with an active member account to continue.', 401);
  const [a, b] = pathOf(params as Record<string, string | string[]>); const method = request.method;
  try {
    if (!a && method === 'GET') return await state(env, user);
    if (a === 'register' && method === 'POST') return await register(request, env, user);
    if (a === 'courses' && method === 'POST') return await createCourse(request, env, user);
    if (a === 'records' && b && method === 'PUT') return await updateRecord(request, env, user, b);
    if (a === 'records' && b && method === 'DELETE') {
      await env.DB.prepare('DELETE FROM member_courses WHERE id=? AND user_id=?').bind(b, user.id).run();
      return json({ ok: true });
    }
    return fail('Not found.', 404);
  } catch (error) { console.error('Study API failed:', error); return fail('Academic records are unavailable right now. Please try again.', 500); }
};
