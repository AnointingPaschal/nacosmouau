import { Env, currentUser, hasPermission, randomId, readableCookie } from './api/auth/_shared';

const safeMethods = new Set(['GET', 'HEAD', 'OPTIONS']);

export const onRequest: PagesFunction<Env> = async ({ request, env, next }) => {
  const url = new URL(request.url);
  const isApi = url.pathname.startsWith('/api/');
  const isCsrfBootstrap = url.pathname === '/api/auth/csrf';
  if (isApi && !safeMethods.has(request.method) && !isCsrfBootstrap) {
    const origin = request.headers.get('Origin');
    if (!origin || origin !== url.origin) return Response.json({ error: 'Request origin could not be verified.' }, { status: 403 });
    const cookies = request.headers.get('Cookie') ?? '';
    const cookieToken = cookies.split(';').map(part => part.trim()).find(part => part.startsWith('csrf_token='))?.slice('csrf_token='.length);
    const headerToken = request.headers.get('X-CSRF-Token');
    if (!cookieToken || !headerToken || cookieToken !== headerToken) return Response.json({ error: 'Your security token expired. Refresh the page and try again.' }, { status: 403 });
  }
  if (url.pathname.startsWith('/api/admin/')) {
    const user = await currentUser(request, env).catch(() => null);
    if (!user || user.status !== 'active') return Response.json({ error: 'Administrator sign-in is required.' }, { status: 401 });
    const [, , , resource] = url.pathname.split('/');
    const action = request.method === 'GET' ? 'read' : request.method === 'POST' ? 'create' : ['PUT','PATCH'].includes(request.method) ? 'update' : request.method === 'DELETE' ? 'delete' : null;
    const permissionResource = ['page-sections','hero-slides'].includes(resource) ? 'cms' : ['academic-sessions','academic-levels'].includes(resource) ? 'academics' : ['executive-administrations','executive-positions'].includes(resource) ? 'executives' : resource === 'gallery-media' ? 'gallery' : resource;
    if (!action || !(await hasPermission(env, user, permissionResource, action))) return Response.json({ error: 'Your account does not have permission for this administration action.' }, { status: 403 });
  }
  const response = await next();
  if (!isCsrfBootstrap || response.status >= 400) return response;
  const token = randomId().replaceAll('-', '');
  const headers = new Headers(response.headers);
  headers.append('Set-Cookie', readableCookie('csrf_token', token, 86400, url.protocol === 'https:'));
  return new Response(response.body, { status: response.status, statusText: response.statusText, headers });
};
