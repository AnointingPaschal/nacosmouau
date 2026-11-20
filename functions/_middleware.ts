import { Env, currentUser, hasPermission } from './api/auth/_shared';

export const onRequest: PagesFunction<Env> = async ({ request, env, next }) => {
  const url = new URL(request.url);
  if (url.pathname.startsWith('/api/admin/')) {
    const user = await currentUser(request, env).catch(() => null);
    if (!user || user.status !== 'active') return Response.json({ error: 'Administrator sign-in is required.' }, { status: 401 });
    const [, , , resource] = url.pathname.split('/');
    const action = request.method === 'GET' ? 'read' : request.method === 'POST' ? 'create' : ['PUT','PATCH'].includes(request.method) ? 'update' : request.method === 'DELETE' ? 'delete' : null;
    const permissionResource = ['page-sections','hero-slides'].includes(resource) ? 'cms' : ['academic-sessions','academic-levels'].includes(resource) ? 'academics' : ['executive-administrations','executive-positions'].includes(resource) ? 'executives' : ['event-speakers','event-media'].includes(resource) ? 'events' : resource === 'gallery-media' ? 'gallery' : resource;
    if (!action || !(await hasPermission(env, user, permissionResource, action))) return Response.json({ error: 'Your account does not have permission for this administration action.' }, { status: 403 });
  }
  return next();
};
