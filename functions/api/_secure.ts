import type { Env } from './auth/_shared';
import { randomId } from './_portal';

const enc = new TextEncoder(); const dec = new TextDecoder();
const toB64 = (bytes: Uint8Array) => btoa(String.fromCharCode(...bytes));
const fromB64 = (value: string) => Uint8Array.from(atob(value), c => c.charCodeAt(0));

export const encryptionReady = (env: Env) => Boolean(env.SETTINGS_ENCRYPTION_KEY && env.SETTINGS_ENCRYPTION_KEY.length >= 24);

async function aesKey(env: Env) {
  if (!encryptionReady(env)) return null;
  const raw = await crypto.subtle.digest('SHA-256', enc.encode(`nacos-secure-settings:${env.SETTINGS_ENCRYPTION_KEY}`));
  return crypto.subtle.importKey('raw', raw, 'AES-GCM', false, ['encrypt', 'decrypt']);
}

/** AES-256-GCM. The label is bound to the ciphertext, so a value cannot be swapped between rows. */
export async function encrypt(env: Env, plain: string, label: string) {
  const key = await aesKey(env); if (!key) throw new Error('Encryption key is not configured.');
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const cipher = new Uint8Array(await crypto.subtle.encrypt({ name: 'AES-GCM', iv, additionalData: enc.encode(label) }, key, enc.encode(plain)));
  return { cipher: toB64(cipher), iv: toB64(iv) };
}
export async function decrypt(env: Env, cipher: string, iv: string, label: string): Promise<string | null> {
  const key = await aesKey(env); if (!key) return null;
  try { return dec.decode(await crypto.subtle.decrypt({ name: 'AES-GCM', iv: fromB64(iv), additionalData: enc.encode(label) }, key, fromB64(cipher))); } catch { return null; }
}

const KEY_LABEL = 'paystack_secret_key';
export async function storedPaystackKey(env: Env): Promise<string | null> {
  if (!encryptionReady(env)) return null;
  const row = await env.DB.prepare('SELECT cipher,iv FROM secure_settings WHERE key=?').bind(KEY_LABEL).first<{ cipher: string; iv: string }>().catch(() => null);
  return row ? decrypt(env, row.cipher, row.iv, KEY_LABEL) : null;
}
/** Payment code reads env.PAYSTACK_SECRET_KEY. A key saved from the admin page takes priority over the Cloudflare secret. */
export async function withStoredPaystackKey(env: Env): Promise<Env> {
  const stored = await storedPaystackKey(env);
  return stored ? { ...env, PAYSTACK_SECRET_KEY: stored } : env;
}
export async function saveSecure(env: Env, key: string, value: string, last4: string, userId: string) {
  const { cipher, iv } = await encrypt(env, value, key);
  await env.DB.prepare("INSERT INTO secure_settings(key,cipher,iv,last4,updated_by,updated_at) VALUES(?,?,?,?,?,datetime('now')) ON CONFLICT(key) DO UPDATE SET cipher=excluded.cipher,iv=excluded.iv,last4=excluded.last4,updated_by=excluded.updated_by,updated_at=excluded.updated_at").bind(key, cipher, iv, last4, userId).run();
}

// ---- Google Authenticator compatible TOTP (RFC 6238: HMAC-SHA1, 30 second steps, 6 digits)
const B32 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
export function base32(bytes: Uint8Array) {
  let bits = ''; for (const b of bytes) bits += b.toString(2).padStart(8, '0');
  let out = ''; for (let i = 0; i < bits.length; i += 5) out += B32[parseInt(bits.slice(i, i + 5).padEnd(5, '0'), 2)];
  return out;
}
export function unbase32(text: string) {
  let bits = ''; for (const ch of text.replace(/=+$/, '')) bits += B32.indexOf(ch).toString(2).padStart(5, '0');
  const bytes: number[] = []; for (let i = 0; i + 8 <= bits.length; i += 8) bytes.push(parseInt(bits.slice(i, i + 8), 2));
  return new Uint8Array(bytes);
}
export async function totpAt(secret: Uint8Array, step: number) {
  const counter = new Uint8Array(8); new DataView(counter.buffer).setUint32(4, step >>> 0); new DataView(counter.buffer).setUint32(0, Math.floor(step / 2 ** 32));
  const key = await crypto.subtle.importKey('raw', new Uint8Array(secret), { name: 'HMAC', hash: 'SHA-1' }, false, ['sign']);
  const mac = new Uint8Array(await crypto.subtle.sign('HMAC', key, counter));
  const o = mac[19] & 15; const n = ((mac[o] & 127) << 24) | (mac[o + 1] << 16) | (mac[o + 2] << 8) | mac[o + 3];
  return String(n % 1_000_000).padStart(6, '0');
}
export const newTotpSecret = () => crypto.getRandomValues(new Uint8Array(20));
/** Returns the matching step, or null. Steps at or below `after` are rejected so a code cannot be used twice. */
export async function matchTotp(secret: Uint8Array, code: string, after = 0) {
  const now = Math.floor(Date.now() / 30_000);
  for (const step of [now, now - 1, now + 1]) if (step > after && (await totpAt(secret, step)) === code) return step;
  return null;
}

async function sha256Hex(value: string) {
  return Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256', enc.encode(value))), b => b.toString(16).padStart(2, '0')).join('');
}
const normalizeBackup = (code: string) => code.toLowerCase().replace(/[^a-z0-9]/g, '');
export async function makeBackupCodes(env: Env, userId: string) {
  const codes = Array.from({ length: 8 }, () => { const hex = Array.from(crypto.getRandomValues(new Uint8Array(5)), b => b.toString(16).padStart(2, '0')).join(''); return `${hex.slice(0, 5)}-${hex.slice(5)}`; });
  await env.DB.batch([
    env.DB.prepare('DELETE FROM admin_backup_codes WHERE user_id=?').bind(userId),
    ...(await Promise.all(codes.map(async c => env.DB.prepare('INSERT INTO admin_backup_codes(id,user_id,code_hash) VALUES(?,?,?)').bind(randomId(), userId, await sha256Hex(`${userId}:${normalizeBackup(c)}`))))),
  ]);
  return codes;
}

/** Accepts a 6-digit authenticator code, or one of the one-time backup codes. */
export async function verifySecondFactor(env: Env, userId: string, input: string): Promise<boolean> {
  const row = await env.DB.prepare('SELECT secret_cipher,iv,enabled,last_step FROM admin_totp WHERE user_id=?').bind(userId).first<{ secret_cipher: string; iv: string; enabled: number; last_step: number }>();
  if (!row || !row.enabled) return false;
  const code = input.trim();
  if (/^\d{6}$/.test(code)) {
    const secret = await decrypt(env, row.secret_cipher, row.iv, `totp:${userId}`); if (!secret) return false;
    const step = await matchTotp(unbase32(secret), code, row.last_step); if (step === null) return false;
    await env.DB.prepare('UPDATE admin_totp SET last_step=? WHERE user_id=?').bind(step, userId).run();
    return true;
  }
  const hash = await sha256Hex(`${userId}:${normalizeBackup(code)}`);
  const hit = await env.DB.prepare('SELECT id FROM admin_backup_codes WHERE user_id=? AND code_hash=? AND used_at IS NULL').bind(userId, hash).first<{ id: string }>();
  if (!hit) return false;
  await env.DB.prepare("UPDATE admin_backup_codes SET used_at=datetime('now') WHERE id=?").bind(hit.id).run();
  return true;
}
