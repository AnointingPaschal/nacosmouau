import { Env, currentUser } from '../../auth/_shared';
import { currentSession, fail, json, pathOf, randomId, readBody, text } from '../../_portal';
import { LEVELS, iso, repRoles } from '../../_class';
import { closeDueSessions, distanceMeters, lagosNow, newSecret, rules } from '../../_attendance';

type Me = NonNullable<Awaited<ReturnType<typeof currentUser>>>;
interface SessionRow { id: string; level: string; session: string; course_id: string; lecture_date: string; started_by: string; started_at: string; closes_at: string; closed_at: string | null; status: string; secret: string; rep_lat: number | null; rep_lng: number | null; rep_accuracy: number | null; radius_m: number; min_peers: number }

const num = (v: unknown) => (typeof v === 'number' && Number.isFinite(v) ? v : typeof v === 'string' && v.trim() !== '' && Number.isFinite(Number(v)) ? Number(v) : null);
const publicSession = (s: SessionRow & { code?: string; title?: string }) => ({ id: s.id, level: s.level, session: s.session, course_id: s.course_id, code: s.code, title: s.title, lecture_date: s.lecture_date, started_at: iso(s.started_at), closes_at: iso(s.closes_at), closed_at: iso(s.closed_at), status: s.status, radius_m: s.radius_m, min_peers: s.min_peers });

async function myLevel(env: Env, user: Me) {
  const row = await env.DB.prepare('SELECT academic_level FROM users WHERE id=?').bind(user.id).first<{ academic_level: string | null }>();
  return row?.academic_level && LEVELS.includes(row.academic_level) ? row.academic_level : null;
}
const openSession = (env: Env, level: string, session: string) => env.DB.prepare("SELECT s.*,c.code,c.title FROM attendance_sessions s JOIN course_catalogue c ON c.id=s.course_id WHERE s.level=? AND s.session=? AND s.status='open' ORDER BY s.started_at DESC LIMIT 1").bind(level, session).first<SessionRow & { code: string; title: string }>();

async function studentOpen(env: Env, user: Me) {
  const [session, level] = await Promise.all([currentSession(env), myLevel(env, user)]);
  await closeDueSessions(env);
  if (!level) return json({ level: null, session, open: null, history: [] });
  const open = await openSession(env, level, session);
  const mine = open ? await env.DB.prepare('SELECT status,neighbours,distance_m,flags,marked_at,method FROM attendance_marks WHERE session_id=? AND user_id=?').bind(open.id, user.id).first<Record<string, unknown>>() : null;
  const history = await env.DB.prepare("SELECT c.id AS course_id,c.code,c.title,COUNT(DISTINCT s.id) AS total, COUNT(DISTINCT CASE WHEN m.status='verified' THEN s.id END) AS attended FROM attendance_sessions s JOIN course_catalogue c ON c.id=s.course_id LEFT JOIN attendance_marks m ON m.session_id=s.id AND m.user_id=? WHERE s.level=? AND s.session=? GROUP BY c.id ORDER BY c.code").bind(user.id, level, session).all();
  return json({ level, session, open: open ? publicSession(open) : null, mine, history: history.results ?? [], rules: await rules(env) });
}

async function mark(request: Request, env: Env, user: Me) {
  const [session, level] = await Promise.all([currentSession(env), myLevel(env, user)]);
  if (!level) return fail('Set your level in your profile first.', 409);
  await closeDueSessions(env);
  const open = await openSession(env, level, session);
  if (!open) return fail('No attendance is open for your level right now.', 409);
  const body = await readBody(request); if (!body) return fail('Invalid request.');
  if (await env.DB.prepare('SELECT 1 FROM attendance_marks WHERE session_id=? AND user_id=?').bind(open.id, user.id).first()) return fail('You have already marked attendance for this lecture.', 409);
  // Location is a soft signal: it never blocks a mark, but a precise location far from the rep is flagged for review.
  const lat = num(body.lat); const lng = num(body.lng); const accuracy = num(body.accuracy);
  const located = lat !== null && lng !== null && Math.abs(lat) <= 90 && Math.abs(lng) <= 180 && accuracy !== null && accuracy <= 150;
  const distance = located && open.rep_lat !== null && open.rep_lng !== null ? distanceMeters(lat!, lng!, open.rep_lat, open.rep_lng) : null;
  const deviceId = text(body.device_id, 64); const fingerprint = text(body.fingerprint, 128);
  if (deviceId.length < 16 || fingerprint.length < 32) return fail('Your device could not be checked. Reload the page and try again.', 400);
  const cookies = request.headers.get('Cookie') ?? ''; const cookieId = cookies.split(';').map(v => v.trim()).find(v => v.startsWith('nacos_did='))?.slice(10) || randomId();
  const clash = await env.DB.prepare("SELECT user_id FROM attendance_marks WHERE session_id=? AND user_id!=? AND method='device' AND status!='rejected' AND (device_id=? OR cookie_id=?) LIMIT 1").bind(open.id, user.id, deviceId, cookieId).first();
  if (clash) return json({ error: 'This phone has already been used to mark attendance for another student. One phone can mark for one student only.' }, 409, { 'Set-Cookie': `nacos_did=${cookieId}; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=31536000` });
  const flags: string[] = [];
  if (await env.DB.prepare("SELECT 1 FROM attendance_marks WHERE session_id=? AND user_id!=? AND method='device' AND status!='rejected' AND fingerprint=? LIMIT 1").bind(open.id, user.id, fingerprint).first()) flags.push('same_fingerprint');
  if (distance !== null && distance > open.radius_m) flags.push('far_from_rep');
  const status = flags.length ? 'pending' : 'verified';
  const ip = request.headers.get('CF-Connecting-IP') ?? request.headers.get('X-Forwarded-For') ?? null;
  const summary = JSON.stringify(body.summary && typeof body.summary === 'object' ? body.summary : {}).slice(0, 1200);
  await env.DB.prepare("INSERT INTO attendance_marks(id,session_id,user_id,method,status,lat,lng,accuracy,distance_m,device_id,cookie_id,fingerprint,ip,user_agent,device_summary,flags) VALUES(?,?,?,'device',?,?,?,?,?,?,?,?,?,?,?,?)")
    .bind(randomId(), open.id, user.id, status, located ? lat : null, located ? lng : null, located ? accuracy : null, distance === null ? null : Math.round(distance), deviceId, cookieId, fingerprint, ip, (request.headers.get('User-Agent') ?? '').slice(0, 300), summary, flags.join(',') || null).run();
  return json({ ok: true, status, flags: flags.join(',') || null }, 201, { 'Set-Cookie': `nacos_did=${cookieId}; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=31536000` });
}

async function repContext(env: Env, user: Me) {
  const session = await currentSession(env); const roles = await repRoles(env, user.id, session);
  return { session, role: roles[0] ?? null };
}

async function desk(env: Env, user: Me) {
  const { session, role } = await repContext(env, user);
  if (!role) return fail('Only your class rep and assistant can open the attendance desk.', 403);
  await closeDueSessions(env);
  const { day, minutes } = lagosNow();
  const [r, timetable, courses, open, recent, roster] = await Promise.all([
    rules(env),
    env.DB.prepare('SELECT t.id,t.course_id,t.day_of_week,t.start_min,t.end_min,t.venue,c.code,c.title FROM class_timetable t JOIN course_catalogue c ON c.id=t.course_id WHERE t.level=? AND t.session=? ORDER BY t.day_of_week,t.start_min').bind(role.level, session).all<{ id: string; course_id: string; day_of_week: number; start_min: number; end_min: number; code: string; title: string }>(),
    env.DB.prepare('SELECT id,code,title,semester FROM course_catalogue WHERE level=? AND is_active=1 AND owner_user_id IS NULL ORDER BY semester,code').bind(role.level).all(),
    openSession(env, role.level, session),
    env.DB.prepare("SELECT s.id,s.lecture_date,s.status,s.started_at,c.code,c.title,(SELECT COUNT(*) FROM attendance_marks m WHERE m.session_id=s.id AND m.status='verified') AS verified,(SELECT COUNT(*) FROM attendance_marks m WHERE m.session_id=s.id AND m.status='pending') AS pending FROM attendance_sessions s JOIN course_catalogue c ON c.id=s.course_id WHERE s.level=? AND s.session=? ORDER BY s.started_at DESC LIMIT 12").bind(role.level, session).all<{ started_at: string }>(),
    env.DB.prepare("SELECT id,full_name,matric_number FROM users WHERE academic_level=? AND status='active' ORDER BY full_name COLLATE NOCASE").bind(role.level).all(),
  ]);
  const entries = timetable.results ?? [];
  const suggested = entries.find(t => t.day_of_week === day && minutes >= t.start_min - 20 && minutes <= t.end_min) ?? null;
  return json({ session, role: role.role, level: role.level, rules: r, timetable: entries, courses: courses.results ?? [], suggested, open: open ? publicSession(open) : null, recent: (recent.results ?? []).map(s => ({ ...s, started_at: iso(s.started_at) })), roster: roster.results ?? [] });
}

async function startSession(request: Request, env: Env, user: Me) {
  const { session, role } = await repContext(env, user);
  if (!role) return fail('Only your class rep and assistant can start attendance.', 403);
  await closeDueSessions(env);
  if (await openSession(env, role.level, session)) return fail('Attendance is already open for your level.', 409);
  const body = await readBody(request); if (!body) return fail('Invalid request.');
  const rawLat = num(body.lat); const rawLng = num(body.lng); const rawAcc = num(body.accuracy);
  const ok = rawLat !== null && rawLng !== null && (rawAcc ?? 0) <= 150;
  const lat = ok ? rawLat : null; const lng = ok ? rawLng : null; const accuracy = ok ? rawAcc : null;
  const { day, minutes, date } = lagosNow();
  let courseId = text(body.course_id, 64);
  if (!courseId) {
    const hit = await env.DB.prepare('SELECT course_id FROM class_timetable WHERE level=? AND session=? AND day_of_week=? AND ?>=start_min-20 AND ?<=end_min ORDER BY start_min LIMIT 1').bind(role.level, session, day, minutes, minutes).first<{ course_id: string }>();
    courseId = hit?.course_id ?? '';
  }
  const course = await env.DB.prepare('SELECT id FROM course_catalogue WHERE id=? AND level=? AND is_active=1').bind(courseId, role.level).first();
  if (!course) return fail('No lecture is scheduled right now. Choose the course for this attendance.', 400);
  const r = await rules(env); const id = randomId();
  await env.DB.prepare("INSERT INTO attendance_sessions(id,level,session,course_id,lecture_date,started_by,closes_at,secret,rep_lat,rep_lng,rep_accuracy,radius_m,min_peers) VALUES(?,?,?,?,?,?,datetime('now',?),?,?,?,?,?,?)")
    .bind(id, role.level, session, courseId, date, user.id, `+${r.window_minutes} minutes`, newSecret(), lat, lng, accuracy, r.radius_m, r.min_peers).run();
  return json({ id }, 201);
}

type Owned = { error: Response } | { row: SessionRow; role: { role: string; level: string; session: string } };
async function ownedSession(env: Env, user: Me, id: string): Promise<Owned> {
  const { role } = await repContext(env, user);
  if (!role) return { error: fail('Only your class rep and assistant can do that.', 403) };
  const row = await env.DB.prepare('SELECT * FROM attendance_sessions WHERE id=? AND level=?').bind(id, role.level).first<SessionRow>();
  return row ? { row, role } : { error: fail('Attendance session not found.', 404) };
}

async function live(env: Env, user: Me, id: string) {
  await closeDueSessions(env);
  const found = await ownedSession(env, user, id); if ('error' in found) return found.error;
  const s = found.row;
  const [course, marks] = await Promise.all([
    env.DB.prepare('SELECT code,title FROM course_catalogue WHERE id=?').bind(s.course_id).first<{ code: string; title: string }>(),
    env.DB.prepare('SELECT m.id,m.user_id,m.method,m.status,m.distance_m,m.neighbours,m.flags,m.marked_at,m.ip,m.review_note,u.full_name,u.matric_number FROM attendance_marks m JOIN users u ON u.id=m.user_id WHERE m.session_id=? ORDER BY m.marked_at DESC').bind(id).all<{ marked_at: string }>(),
  ]);
  return json({ session: publicSession({ ...s, ...course } as SessionRow & { code?: string; title?: string }), code: null, seconds_left: 0, marks: (marks.results ?? []).map(m => ({ ...m, marked_at: iso(m.marked_at) })) });
}

export const onRequest: PagesFunction<Env> = async ({ request, env, params }) => {
  const user = await currentUser(request, env).catch(() => null);
  if (!user || user.status !== 'active') return fail('Sign in with an active member account to continue.', 401);
  const [a, b, c, d] = pathOf(params as Record<string, string | string[]>); const method = request.method;
  try {
    if (a === 'open' && method === 'GET') return await studentOpen(env, user);
    if (a === 'mark' && method === 'POST') return await mark(request, env, user);
    if (a === 'desk' && method === 'GET') return await desk(env, user);
    if (a === 'start' && method === 'POST') return await startSession(request, env, user);
    if (a === 'sessions' && b && !c && method === 'GET') return await live(env, user, b);
    if (a === 'sessions' && b && c === 'location' && method === 'POST') {
      const f = await ownedSession(env, user, b); if ('error' in f) return f.error;
      const body = await readBody(request); const lat = num(body?.lat); const lng = num(body?.lng); const acc = num(body?.accuracy);
      if (lat === null || lng === null || (acc ?? 0) > 150) return json({ ok: false });
      await env.DB.prepare("UPDATE attendance_sessions SET rep_lat=?,rep_lng=?,rep_accuracy=? WHERE id=? AND status='open'").bind(lat, lng, acc, b).run();
      return json({ ok: true });
    }
    if (a === 'sessions' && b && c === 'close' && method === 'POST') {
      const f = await ownedSession(env, user, b); if ('error' in f) return f.error;
      await env.DB.prepare("UPDATE attendance_sessions SET status='closed', closed_at=datetime('now') WHERE id=? AND status='open'").bind(b).run();
      return json({ ok: true });
    }
    if (a === 'sessions' && b && c === 'approve-pending' && method === 'POST') {
      const f = await ownedSession(env, user, b); if ('error' in f) return f.error;
      await env.DB.prepare("UPDATE attendance_marks SET status='verified', reviewed=1, review_note='Approved by class rep' WHERE session_id=? AND status='pending'").bind(b).run();
      return json({ ok: true });
    }
    if (a === 'sessions' && b && c === 'manual' && method === 'POST') {
      const f = await ownedSession(env, user, b); if ('error' in f) return f.error;
      const body = await readBody(request); const ids = Array.isArray(body?.user_ids) ? body!.user_ids.map(String).slice(0, 200) : [];
      if (body?.confirm !== true) return fail('Confirm that you are signing for these students.', 400);
      if (!ids.length) return fail('Choose at least one student.');
      const valid = await env.DB.prepare(`SELECT id FROM users WHERE academic_level=? AND status='active' AND id IN (${ids.map(() => '?').join(',')})`).bind(f.role.level, ...ids).all<{ id: string }>();
      const statements = (valid.results ?? []).map(u => env.DB.prepare("INSERT INTO attendance_marks(id,session_id,user_id,method,status,reviewed,signed_by,review_note) VALUES(?,?,?,'rep','verified',1,?,'Signed and marked by class rep') ON CONFLICT(session_id,user_id) DO UPDATE SET method='rep',status='verified',reviewed=1,signed_by=excluded.signed_by,review_note=excluded.review_note").bind(randomId(), b, u.id, user.id));
      if (statements.length) await env.DB.batch(statements);
      return json({ ok: true, marked: statements.length });
    }
    if (a === 'marks' && b && method === 'PUT') {
      const row = await env.DB.prepare('SELECT session_id FROM attendance_marks WHERE id=?').bind(b).first<{ session_id: string }>();
      if (!row) return fail('Mark not found.', 404);
      const f = await ownedSession(env, user, row.session_id); if ('error' in f) return f.error;
      const body = await readBody(request); const status = String(body?.status ?? '');
      if (!['verified', 'rejected'].includes(status)) return fail('Choose approve or reject.');
      await env.DB.prepare('UPDATE attendance_marks SET status=?, reviewed=1, review_note=? WHERE id=?').bind(status, text(body?.note, 200) || (status === 'verified' ? 'Approved by class rep' : 'Rejected by class rep'), b).run();
      return json({ ok: true });
    }
    if (a === 'marks' && b && method === 'DELETE') {
      const row = await env.DB.prepare('SELECT session_id FROM attendance_marks WHERE id=?').bind(b).first<{ session_id: string }>();
      if (!row) return json({ ok: true });
      const f = await ownedSession(env, user, row.session_id); if ('error' in f) return f.error;
      await env.DB.prepare('DELETE FROM attendance_marks WHERE id=?').bind(b).run();
      return json({ ok: true });
    }
    if (a === 'timetable' && !b && method === 'POST') {
      const { session, role } = await repContext(env, user); if (!role) return fail('Only your class rep and assistant can edit the timetable.', 403);
      const body = await readBody(request); const day = Number(body?.day_of_week); const start = Number(body?.start_min); const end = Number(body?.end_min); const courseId = text(body?.course_id, 64);
      if (!Number.isInteger(day) || day < 0 || day > 6) return fail('Choose a day.');
      if (!Number.isInteger(start) || !Number.isInteger(end) || start < 0 || end > 1440 || end <= start) return fail('Enter a valid start and end time.');
      if (!(await env.DB.prepare('SELECT 1 FROM course_catalogue WHERE id=? AND level=?').bind(courseId, role.level).first())) return fail('Choose a course for your level.');
      await env.DB.prepare('INSERT INTO class_timetable(id,level,session,course_id,day_of_week,start_min,end_min,venue,created_by) VALUES(?,?,?,?,?,?,?,?,?)').bind(randomId(), role.level, session, courseId, day, start, end, text(body?.venue, 80) || null, user.id).run();
      return json({ ok: true }, 201);
    }
    if (a === 'timetable' && b && method === 'DELETE') {
      const { role } = await repContext(env, user); if (!role) return fail('Only your class rep and assistant can edit the timetable.', 403);
      await env.DB.prepare('DELETE FROM class_timetable WHERE id=? AND level=?').bind(b, role.level).run();
      return json({ ok: true });
    }
    if (a === 'report' && method === 'GET') {
      const { session, role } = await repContext(env, user); if (!role) return fail('Only your class rep and assistant can see the report.', 403);
      const [totals, counts, members] = await Promise.all([
        env.DB.prepare('SELECT c.id AS course_id,c.code,c.title,COUNT(s.id) AS total FROM attendance_sessions s JOIN course_catalogue c ON c.id=s.course_id WHERE s.level=? AND s.session=? GROUP BY c.id ORDER BY c.code').bind(role.level, session).all(),
        env.DB.prepare("SELECT s.course_id,m.user_id,COUNT(*) AS n FROM attendance_marks m JOIN attendance_sessions s ON s.id=m.session_id WHERE s.level=? AND s.session=? AND m.status='verified' GROUP BY s.course_id,m.user_id").bind(role.level, session).all<{ course_id: string; user_id: string; n: number }>(),
        env.DB.prepare("SELECT id,full_name,matric_number FROM users WHERE academic_level=? AND status='active' ORDER BY full_name COLLATE NOCASE").bind(role.level).all<{ id: string; full_name: string; matric_number: string | null }>(),
      ]);
      const byUser = new Map<string, Record<string, number>>();
      for (const row of counts.results ?? []) byUser.set(row.user_id, { ...(byUser.get(row.user_id) ?? {}), [row.course_id]: row.n });
      return json({ session, level: role.level, courses: totals.results ?? [], members: (members.results ?? []).map(m => ({ ...m, by_course: byUser.get(m.id) ?? {} })) });
    }
    void d;
    return fail('Not found.', 404);
  } catch (error) { console.error('Attendance API failed:', error); return fail('Attendance is unavailable right now. Please try again.', 500); }
};
