export interface Env { DB: D1Database; BUCKET?: R2Bucket; SESSION_SECRET?: string; SETUP_TOKEN?: string; APP_URL?: string; PAYSTACK_SECRET_KEY?: string; PAYSTACK_PUBLIC_KEY?: string; CLOUDFLARE_TURNSTILE_SECRET?: string; EMAIL_PROVIDER_API_KEY?: string }
// Cloudflare Workers rejects PBKDF2 deriveBits iteration counts above 100,000.
// Keep this value in sync with scripts/generate_admin_sql.py.
const PASSWORD_ITERATIONS = 100_000;
export const json = (data: unknown, status = 200, headers: HeadersInit = {}) => Response.json(data, { status, headers: { 'Cache-Control': 'no-store', ...headers } });
export const fail = (message: string, status = 400) => json({ error: message }, status);
export const randomId = () => crypto.randomUUID();
export async function sha256(value: string): Promise<string> {
  const bytes = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(value));
  return Array.from(new Uint8Array(bytes), b => b.toString(16).padStart(2, '0')).join('');
}
export async function passwordHash(password: string, salt: string = crypto.randomUUID()): Promise<string> {
  const material = await crypto.subtle.importKey('raw', new TextEncoder().encode(password), 'PBKDF2', false, ['deriveBits']);
  const bits = await crypto.subtle.deriveBits({ name: 'PBKDF2', salt: new TextEncoder().encode(salt), iterations: PASSWORD_ITERATIONS, hash: 'SHA-256' }, material, 256);
  return `${salt}:${Array.from(new Uint8Array(bits), b => b.toString(16).padStart(2, '0')).join('')}`;
}
export async function verifyPassword(password: string, stored: string): Promise<boolean> {
  const [salt, expected] = stored.split(':'); if (!salt || !expected) return false;
  const actual = await passwordHash(password, salt); let difference = actual.length ^ stored.length; for (let i = 0; i < Math.max(actual.length, stored.length); i++) difference |= (actual.charCodeAt(i) || 0) ^ (stored.charCodeAt(i) || 0); return difference === 0;
}
export async function signSessionToken(random: string, secret: string): Promise<string> {
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const signature = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(random));
  return `${random}.${Array.from(new Uint8Array(signature), b => b.toString(16).padStart(2, '0')).join('')}`;
}
export async function verifySessionToken(token: string, secret: string): Promise<boolean> {
  const [random, signature] = token.split('.');
  if (!random || !/^[a-f0-9]{64}$/.test(signature ?? '')) return false;
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['verify']);
  const bytes = new Uint8Array(signature.match(/.{2}/g)!.map(pair => parseInt(pair, 16)));
  return crypto.subtle.verify('HMAC', key, bytes, new TextEncoder().encode(random));
}
export async function currentUser(request: Request, env: Env) {
  const token = request.headers.get('Cookie')?.split(';').map(v => v.trim()).find(v => v.startsWith('nacos_session='))?.slice('nacos_session='.length);
  if (!token || !env.SESSION_SECRET || !(await verifySessionToken(decodeURIComponent(token), env.SESSION_SECRET))) return null;
  return env.DB.prepare(`SELECT u.id,u.email,u.full_name,COALESCE((SELECT role_id FROM user_roles WHERE user_id=u.id ORDER BY CASE role_id WHEN 'super_admin' THEN 0 WHEN 'president' THEN 1 WHEN 'vice_president' THEN 2 WHEN 'general_secretary' THEN 3 WHEN 'financial_secretary' THEN 4 WHEN 'treasurer' THEN 5 WHEN 'public_relations_officer' THEN 6 WHEN 'event_manager' THEN 7 WHEN 'election_committee' THEN 8 WHEN 'content_manager' THEN 9 ELSE 10 END LIMIT 1),u.role) AS role,u.status FROM sessions s JOIN users u ON u.id=s.user_id WHERE s.id_hash=? AND s.expires_at > datetime('now')`)
    .bind(await sha256(decodeURIComponent(token))).first<{id:string; email:string; full_name:string; role:string; status:string}>();
}
export function cookie(token: string, maxAge: number) { return `nacos_session=${encodeURIComponent(token)}; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=${maxAge}`; }
export function readableCookie(name: string, value: string, maxAge: number, secure = true) { return `${name}=${value};${secure ? ' Secure;' : ''} SameSite=Lax; Path=/; Max-Age=${maxAge}`; }

export async function hasPermission(env: Env, user: { id: string; role: string }, resource: string, action: string): Promise<boolean> {
  if (user.role === 'super_admin' || user.role === 'admin') return true;
  return Boolean(await env.DB.prepare(`SELECT 1 AS allowed FROM user_roles ur JOIN role_permissions rp ON rp.role_id=ur.role_id JOIN permissions p ON p.id=rp.permission_id WHERE ur.user_id=? AND p.resource=? AND p.action=? LIMIT 1`)
    .bind(user.id, resource, action).first());
}
