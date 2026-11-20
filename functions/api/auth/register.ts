import { Env, fail, json, passwordHash, randomId } from './_shared';
import { currentSession } from '../_portal';

type RegistrationBody = {
  email?: string; password?: string; confirmPassword?: string; fullName?: string; phone?: string;
  matricNumber?: string; academicLevel?: string; idType?: string;
};

const LEVELS = new Set(['100', '200', '300', '400']);
const MATRIC = /^MOUAU\/CMP\/\d{2}\/\d{3,7}$/;
const JAMB = /^\d{8,10}[A-Z]{1,2}$/;

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  let body: RegistrationBody;
  try { body = await request.json(); } catch { return fail('Invalid request body.'); }
  const email = body.email?.trim().toLowerCase() ?? '';
  const fullName = body.fullName?.trim() ?? '';
  const phone = body.phone?.trim() ?? '';
  const identifier = (body.matricNumber ?? '').replace(/\s+/g, '').toUpperCase();
  const academicLevel = body.academicLevel?.trim() ?? '';
  const idType = body.idType === 'jamb' ? 'jamb' : 'matric';
  const password = body.password ?? '';

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254) return fail('Enter a valid email address.');
  if (fullName.length < 2 || fullName.length > 120) return fail('Enter your full name.');
  if (!/^\+?[0-9 ()-]{7,24}$/.test(phone)) return fail('Enter a valid phone number.');
  if (!LEVELS.has(academicLevel)) return fail('Select your level (100 to 400).');
  if (idType === 'jamb') {
    if (academicLevel !== '100') return fail('Only 100 level students can register with a JAMB registration number. Use your matric number.');
    if (!JAMB.test(identifier)) return fail('Enter a valid JAMB registration number, for example 12345678AB.');
  } else if (!MATRIC.test(identifier)) {
    return fail('Enter your matric number in the format MOUAU/CMP/26/103328.');
  }
  if (password.length < 12 || password.length > 200) return fail('Password must be between 12 and 200 characters.');
  if (body.confirmPassword !== undefined && body.confirmPassword !== password) return fail('The two passwords do not match.');

  const duplicate = await env.DB.prepare('SELECT email, matric_number FROM users WHERE email=? OR matric_number=?').bind(email, identifier).first<{ email: string; matric_number: string | null }>();
  if (duplicate?.email?.toLowerCase() === email) return fail('An account with this email already exists.', 409);
  if (duplicate?.matric_number === identifier) return fail(idType === 'jamb' ? 'This JAMB registration number is already registered.' : 'This matric number is already registered.', 409);

  const id = randomId();
  await env.DB.prepare('INSERT INTO users (id,email,password_hash,full_name,phone,matric_number,academic_level,academic_session) VALUES (?,?,?,?,?,?,?,?)')
    .bind(id, email, await passwordHash(password), fullName, phone, identifier, academicLevel, await currentSession(env)).run();
  return json({ id, email, fullName, status: 'pending', message: 'Registration received. An administrator must approve your membership.' }, 201);
};
