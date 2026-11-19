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

function csrfToken(): string | undefined {
  const match = document.cookie.split('; ').find((entry) => entry.startsWith('csrf_token='));
  if (match) return decodeURIComponent(match.slice('csrf_token='.length));
  return document.querySelector<HTMLMetaElement>('meta[name="csrf-token"]')?.content || undefined;
}

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const headers = new Headers(init.headers);
  if (init.body && !headers.has('Content-Type')) headers.set('Content-Type', 'application/json');
  const method = (init.method ?? 'GET').toUpperCase();
  if (!['GET', 'HEAD', 'OPTIONS'].includes(method)) {
    const csrf = csrfToken();
    if (csrf) headers.set('X-CSRF-Token', csrf);
  }
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
    const message = body?.error ?? body?.message ?? (typeof payload === 'string' ? payload : `Request failed (${response.status}).`);
    if (response.status === 404 || response.status === 503 || response.status === 502) throw new ApiUnavailableError(response.status, message);
    throw new ApiError(message, response.status, payload);
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
