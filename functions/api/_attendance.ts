import type { Env } from './auth/_shared';
import { setting } from './_portal';

export const WINDOW_MAX_MIN = 30;
export interface AttendanceRules { window_minutes: number; radius_m: number; min_peers: number }

export async function rules(env: Env): Promise<AttendanceRules> {
  const [w, r, p] = await Promise.all([setting<number>(env, 'attendance_window_minutes', 15), setting<number>(env, 'attendance_radius_m', 100), setting<number>(env, 'attendance_min_peers', 10)]);
  const num = (v: unknown, d: number) => (Number.isFinite(Number(v)) ? Number(v) : d);
  return { window_minutes: Math.min(WINDOW_MAX_MIN, Math.max(1, Math.round(num(w, 15)))), radius_m: Math.min(300, Math.max(30, Math.round(num(r, 100)))), min_peers: Math.min(40, Math.max(0, Math.round(num(p, 10)))) };
}

/** Nigeria is on UTC+1 all year, so "today" and "now" for lectures are computed in that zone. */
export function lagosNow(date = new Date()) {
  const local = new Date(date.getTime() + 3_600_000);
  return { day: local.getUTCDay(), minutes: local.getUTCHours() * 60 + local.getUTCMinutes(), date: local.toISOString().slice(0, 10) };
}

export function distanceMeters(aLat: number, aLng: number, bLat: number, bLng: number) {
  const rad = (d: number) => (d * Math.PI) / 180; const R = 6_371_000;
  const dLat = rad(bLat - aLat); const dLng = rad(bLng - aLng);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(rad(aLat)) * Math.cos(rad(bLat)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.min(1, Math.sqrt(h)));
}

const STEP_MS = 30_000;
export const stepNow = () => Math.floor(Date.now() / STEP_MS);
export const stepSecondsLeft = () => Math.ceil((STEP_MS - (Date.now() % STEP_MS)) / 1000);

/** A 6-digit code that changes every 30 seconds, derived from the session secret. */
export async function codeFor(secret: string, step: number) {
  const digest = new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(`${secret}:${step}`)));
  const n = ((digest[0] << 24) | (digest[1] << 16) | (digest[2] << 8) | digest[3]) >>> 0;
  return String(n % 1_000_000).padStart(6, '0');
}
export async function codeIsValid(secret: string, code: string) {
  const step = stepNow();
  for (const s of [step, step - 1]) if (await codeFor(secret, s) === code) return true;
  return false;
}

export function newSecret() { return Array.from(crypto.getRandomValues(new Uint8Array(16)), b => b.toString(16).padStart(2, '0')).join(''); }

export async function closeDueSessions(env: Env) {
  await env.DB.prepare("UPDATE attendance_sessions SET status='closed', closed_at=COALESCE(closed_at,closes_at) WHERE status='open' AND closes_at<=datetime('now')").run();
}

interface PeerMark { id: string; lat: number; lng: number; device_key: string; status: string; reviewed: number; flags: string | null }

/** A mark is verified once at least `min_peers` other students on different phones marked within the radius of it. */
export async function recomputePeers(env: Env, sessionId: string, radius: number, minPeers: number) {
  const rows = await env.DB.prepare("SELECT id,lat,lng,COALESCE(device_id,cookie_id,id) AS device_key,status,reviewed,flags FROM attendance_marks WHERE session_id=? AND method='device' AND status!='rejected' AND lat IS NOT NULL AND lng IS NOT NULL").bind(sessionId).all<PeerMark>();
  const marks = rows.results ?? [];
  const statements = [];
  for (const m of marks) {
    const peers = new Set<string>();
    for (const o of marks) if (o.id !== m.id && o.device_key !== m.device_key && distanceMeters(m.lat, m.lng, o.lat, o.lng) <= radius) peers.add(o.device_key);
    const status = m.reviewed ? m.status : (peers.size >= minPeers && !m.flags ? 'verified' : 'pending');
    statements.push(env.DB.prepare('UPDATE attendance_marks SET neighbours=?, status=? WHERE id=?').bind(peers.size, status, m.id));
  }
  if (statements.length) await env.DB.batch(statements);
}
