// Browsers do not expose a MAC address or hardware ID. What we can capture is a stable per-browser device ID,
// a fingerprint of the phone's traits, and (on the server) the network address and a device cookie.
const KEY = 'nacos_device_id';

function deviceId(): string {
  try {
    let id = window.localStorage.getItem(KEY);
    if (!id || id.length < 16) { id = (crypto.randomUUID?.() ?? `${Date.now()}${Math.random()}`.replace(/\D/g, '')).replace(/-/g, '').padEnd(32, '0'); window.localStorage.setItem(KEY, id); }
    return id;
  } catch { return `session${Math.random().toString(16).slice(2)}0000000000000000`; }
}

async function sha256(value: string) {
  const bytes = new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(value)));
  return Array.from(bytes, b => b.toString(16).padStart(2, '0')).join('');
}

function canvasTrait(): string {
  try {
    const canvas = document.createElement('canvas'); canvas.width = 220; canvas.height = 40;
    const ctx = canvas.getContext('2d'); if (!ctx) return 'none';
    ctx.textBaseline = 'top'; ctx.font = '16px Arial'; ctx.fillStyle = '#008751'; ctx.fillRect(4, 4, 90, 24); ctx.fillStyle = '#111'; ctx.fillText('NACOS MOUAU attendance', 6, 8);
    return canvas.toDataURL().slice(-120);
  } catch { return 'blocked'; }
}

function glTrait(): string {
  try {
    const gl = document.createElement('canvas').getContext('webgl'); if (!gl) return 'none';
    const ext = gl.getExtension('WEBGL_debug_renderer_info');
    return ext ? `${gl.getParameter(ext.UNMASKED_VENDOR_WEBGL)}|${gl.getParameter(ext.UNMASKED_RENDERER_WEBGL)}` : 'hidden';
  } catch { return 'blocked'; }
}

export interface DeviceCheck { device_id: string; fingerprint: string; summary: Record<string, string | number> }

export async function deviceCheck(): Promise<DeviceCheck> {
  const nav = navigator as Navigator & { deviceMemory?: number };
  const summary: Record<string, string | number> = {
    platform: nav.platform || 'unknown', language: nav.language, timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    screen: `${screen.width}x${screen.height}@${window.devicePixelRatio}`, depth: screen.colorDepth, cores: nav.hardwareConcurrency ?? 0,
    memory: nav.deviceMemory ?? 0, touch: nav.maxTouchPoints ?? 0, gpu: glTrait(),
  };
  const fingerprint = await sha256(JSON.stringify({ ...summary, ua: nav.userAgent, canvas: canvasTrait() }));
  return { device_id: deviceId(), fingerprint, summary };
}

export interface Position { lat: number; lng: number; accuracy: number }

export function currentPosition(timeout = 20_000): Promise<Position> {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) { reject(new Error('This browser cannot share your location.')); return; }
    navigator.geolocation.getCurrentPosition(
      p => resolve({ lat: p.coords.latitude, lng: p.coords.longitude, accuracy: p.coords.accuracy }),
      e => reject(new Error(e.code === e.PERMISSION_DENIED ? 'Location is blocked. Allow location for this site in your browser settings, then try again.' : e.code === e.TIMEOUT ? 'Your phone took too long to find your location. Go near a window or outdoors and try again.' : 'Could not read your location. Turn on GPS and try again.')),
      { enableHighAccuracy: true, timeout, maximumAge: 30_000 },
    );
  });
}

/** Location is an extra signal only. If it is blocked, slow or rough, attendance carries on without it. */
export async function softPosition(timeout = 8000): Promise<Position | null> {
  try { const p = await currentPosition(timeout); return p.accuracy <= 150 ? p : null; } catch { return null; }
}
