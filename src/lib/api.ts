import type { AuthResponse, LoginPayload, RegistrationPayload, SessionUser } from '../types/auth';
import type { SiteSettings, CmsPage, HeroSlide, Executive, NewsItem, Announcement, EventItem, GalleryAlbum, AssociationDocument, Achievement, AssociationStats } from '../types/content';
import type { ContactPayload, EventRegistrationPayload, Payment, Election, WelfareRequest } from '../types/operations';
export class ApiError extends Error {
  constructor(message: string, readonly status: number, readonly details?: unknown) { super(message); this.name = 'ApiError'; }
}
export class ApiUnavailableError extends ApiError {
  constructor(status: number, message = 'This service is not available yet. Please try again later.') { super(message, status); this.name = 'ApiUnavailableError'; }
}
export const isApiUnavailable = (error: unknown): error is ApiUnavailableError => error instanceof ApiUnavailableError;

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const headers = new Headers(init.headers);
  if (init.body && !(init.body instanceof FormData) && !headers.has('Content-Type')) headers.set('Content-Type', 'application/json');
  const method = (init.method ?? 'GET').toUpperCase();
  let response: Response;
  try {
    response = await fetch(path.startsWith('/api/') ? path : `/api/${path.replace(/^\//, '')}`, {
      ...init, method, headers, credentials: 'include', redirect: 'follow',
    });
  } catch {
    throw new ApiUnavailableError(0, 'Could not reach the association service. Check your connection and try again.');
  }
  const contentType = response.headers.get('content-type') ?? '';
  const payload: unknown = response.status === 204 ? undefined : contentType.includes('application/json')
    ? await response.json().catch(() => undefined)
    : await response.text().catch(() => undefined);
  if (!response.ok) {
    const body = payload && typeof payload === 'object' ? payload as { error?: string; message?: string } : undefined;
    const message = body?.error ?? body?.message ?? (typeof payload === 'string' && contentType.includes('application/json') ? payload : `Request failed (${response.status}).`);
    if (response.status === 404 || response.status === 503 || response.status === 502) throw new ApiUnavailableError(response.status, message);
    throw new ApiError(message, response.status, payload);
  }
  // Pages can serve index.html with a 200 response for an API URL when a
  // Function has not been deployed yet. Never treat that HTML as API data:
  // doing so makes typed hooks receive strings and crash during rendering.
  if (response.status !== 204 && !contentType.includes('application/json')) {
    throw new ApiUnavailableError(503, 'The association service is not available yet. Please try again later.');
  }
  return payload as T;
}
export const api = {
  get: <T>(path: string, signal?: AbortSignal) => request<T>(path, { signal }),
  getOptional: async <T>(path: string, fallback: T, signal?: AbortSignal): Promise<T> => { try { return await request<T>(path, { signal }); } catch (error) { if (error instanceof ApiUnavailableError && error.status !== 0) return fallback; throw error; } },
  post: <T, B = unknown>(path: string, body: B) => request<T>(path, { method: 'POST', body: JSON.stringify(body) }),
  put: <T, B = unknown>(path: string, body: B) => request<T>(path, { method: 'PUT', body: JSON.stringify(body) }),
  patch: <T, B = unknown>(path: string, body: B) => request<T>(path, { method: 'PATCH', body: JSON.stringify(body) }),
  delete: <T>(path: string) => request<T>(path, { method: 'DELETE' }),
  upload: <T>(file: File, onProgress?: (percent: number) => void, purpose: 'media'|'profile'|'document'|'proof' = 'media') => new Promise<T>(async (resolve, reject) => {
    const xhr = new XMLHttpRequest(); const form = new FormData(); form.append('file', file); form.append('purpose', purpose); xhr.open('POST', '/api/upload'); xhr.withCredentials = true;
    xhr.upload.onprogress = event => { if (event.lengthComputable) onProgress?.(Math.round(event.loaded / event.total * 100)); };
    xhr.onerror = () => reject(new ApiUnavailableError(0, 'Could not reach the file service. Check your connection and try again.'));
    xhr.onload = () => { let payload: unknown; try { payload = JSON.parse(xhr.responseText); } catch { payload = undefined; } if (xhr.status >= 200 && xhr.status < 300) { onProgress?.(100); resolve(payload as T); } else { const message = payload && typeof payload === 'object' && 'error' in payload ? String((payload as {error:unknown}).error) : `Upload failed (${xhr.status}).`; reject(xhr.status===404||xhr.status===503?new ApiUnavailableError(xhr.status,message):new ApiError(message,xhr.status,payload)); } };
    xhr.send(form);
  }),
  auth: {
    me: () => request<{ user: SessionUser }>('auth/me'),
    login: (payload: LoginPayload) => request<AuthResponse>('auth/login', { method: 'POST', body: JSON.stringify(payload) }),
    register: (payload: RegistrationPayload) => request<{ id: string; email: string; fullName: string; status: 'pending'; message: string }>('auth/register', { method: 'POST', body: JSON.stringify(payload) }),
    logout: () => request<{ ok: boolean }>('auth/logout', { method: 'POST', body: '{}' }),
  },
  content: {
    settings: () => request<SiteSettings>('settings'), pages: (query = '') => request<CmsPage[]>(`pages${query}`),
    slides: () => request<HeroSlide[]>('pages/hero-slides'), executives: (query = '') => request<Executive[]>(`executives${query}`),
    news: (query = '') => request<NewsItem[]>(`news${query}`), announcements: () => request<Announcement[]>('announcements'),
    events: (query = '') => request<EventItem[]>(`events${query}`), gallery: () => request<GalleryAlbum[]>('gallery'),
    documents: () => request<AssociationDocument[]>('documents'), achievements: () => request<Achievement[]>('achievements'), stats: () => request<AssociationStats>('stats'),
  },
  member: { records: (query = '') => request<unknown[]>(`members${query}`), payments: () => request<Payment[]>('payments'), elections: () => request<Election[]>('elections'), welfare: () => request<WelfareRequest[]>('welfare') },
  forms: { contact: (payload: ContactPayload) => request<{ ok: boolean }>('contact', { method: 'POST', body: JSON.stringify(payload) }), eventRegistration: (eventId: string, payload: EventRegistrationPayload) => request<{ ok: boolean }>(`events/${encodeURIComponent(eventId)}/register`, { method: 'POST', body: JSON.stringify(payload) }) },
};
export function queryString(values: Record<string, string | number | undefined>) {
  const query = new URLSearchParams();
  Object.entries(values).forEach(([key, value]) => { if (value !== undefined && value !== '') query.set(key, String(value)); });
  const value = query.toString(); return value ? `?${value}` : '';
}
