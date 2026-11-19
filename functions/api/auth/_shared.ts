export interface Env { DB: D1Database; SETUP_TOKEN?: string }
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
export async function passwordHash(password: string, salt = crypto.randomUUID()): Promise<string> {
  const material = await crypto.subtle.importKey('raw', new TextEncoder().encode(password), 'PBKDF2', false, ['deriveBits']);
  const bits = await crypto.subtle.deriveBits({ name: 'PBKDF2', salt: new TextEncoder().encode(salt), iterations: PASSWORD_ITERATIONS, hash: 'SHA-256' }, material, 256);
  return `${salt}:${Array.from(new Uint8Array(bits), b => b.toString(16).padStart(2, '0')).join('')}`;
}
export async function verifyPassword(password: string, stored: string): Promise<boolean> {
  const [salt, expected] = stored.split(':'); if (!salt || !expected) return false;
  const actual = await passwordHash(password, salt); return actual === stored;
}
export async function currentUser(request: Request, env: Env) {
  const token = request.headers.get('Cookie')?.split(';').map(v => v.trim()).find(v => v.startsWith('nacos_session='))?.slice('nacos_session='.length);
  if (!token) return null;
  return env.DB.prepare('SELECT u.id, u.email, u.full_name, u.role, u.status FROM sessions s JOIN users u ON u.id=s.user_id WHERE s.id_hash=? AND s.expires_at > datetime(\'now\')')
    .bind(await sha256(decodeURIComponent(token))).first<{id:string; email:string; full_name:string; role:string; status:string}>();
}
export function cookie(token: string, maxAge: number) { return `nacos_session=${encodeURIComponent(token)}; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=${maxAge}`; }
