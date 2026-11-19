import { Env, fail, json, passwordHash, randomId } from './_shared';
type RegistrationBody = {
  email?: string; password?: string; fullName?: string; phone?: string;
  matricNumber?: string; academicLevel?: string; faculty?: string; department?: string; session?: string;
};
export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  let body: RegistrationBody;
  try { body = await request.json(); } catch { return fail('Invalid request body.'); }
  const email = body.email?.trim().toLowerCase() ?? '';
  const fullName = body.fullName?.trim() ?? '';
  const phone = body.phone?.trim() ?? '';
  const matricNumber = body.matricNumber?.trim().toUpperCase() ?? '';
  const academicLevel = body.academicLevel?.trim() ?? '';
  const faculty = body.faculty?.trim() ?? '';
  const department = body.department?.trim() ?? '';
  const academicSession = body.session?.trim() ?? '';
  const password = body.password ?? '';

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254) return fail('Enter a valid email address.');
  if (fullName.length < 2 || fullName.length > 120) return fail('Enter your full name.');
  if (!/^\+?[0-9 ()-]{7,24}$/.test(phone)) return fail('Enter a valid phone number.');
  if (matricNumber.length < 3 || matricNumber.length > 40) return fail('Enter a valid matriculation number.');
  if (academicLevel.length < 1 || academicLevel.length > 40 || faculty.length < 2 || faculty.length > 120 || department.length < 2 || department.length > 120) return fail('Enter your faculty, department, and academic level.');
  if (!/^(20\d{2})\/(20\d{2})$/.test(academicSession)) return fail('Enter a valid academic session.');
  if (password.length < 12 || password.length > 200) return fail('Password must be between 12 and 200 characters.');
  const duplicate = await env.DB.prepare('SELECT email, matric_number FROM users WHERE email=? OR matric_number=?').bind(email, matricNumber).first<{email:string;matric_number:string|null}>();
  if (duplicate?.email?.toLowerCase() === email) return fail('An account with this email already exists.', 409);
  if (duplicate?.matric_number === matricNumber) return fail('This matriculation number is already registered.', 409);

  const id = randomId();
  await env.DB.prepare('INSERT INTO users (id,email,password_hash,full_name,phone,matric_number,academic_level,faculty,department,academic_session) VALUES (?,?,?,?,?,?,?,?,?,?)')
    .bind(id,email,await passwordHash(password),fullName,phone,matricNumber,academicLevel,faculty,department,academicSession).run();
  await env.DB.prepare(`INSERT OR IGNORE INTO user_roles(user_id,role_id) VALUES(?,'member')`).bind(id).run();
  return json({ id, email, fullName, status: 'pending', message: 'Registration received. An administrator must approve your membership.' }, 201);
};
