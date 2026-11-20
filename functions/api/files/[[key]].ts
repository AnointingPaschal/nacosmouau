import { Env, currentUser, fail, hasPermission } from '../auth/_shared';
import { getGithub, githubEnabled, isPublicImage } from '../_storage';

export const onRequestGet: PagesFunction<Env> = async ({ params, request, env, waitUntil }) => {
  // Catch-all route params arrive as an array of path segments.
  const raw = Array.isArray(params.key) ? params.key.join('/') : String(params.key ?? '');
  const key = raw.replace(/^\/+/, '');
  if (!key || key.includes('..')) return fail('File not found.', 404);

  const record = await env.DB.prepare('SELECT mime_type,filename FROM media_objects WHERE object_key=?').bind(key).first<{ mime_type: string; filename: string }>();
  if (!record) return fail('File not found.', 404);

  const profile = await env.DB.prepare('SELECT user_id FROM member_profiles WHERE profile_photo_key=?').bind(key).first<{ user_id: string }>();
  if (profile) {
    const user = await currentUser(request, env);
    if (!user || user.status !== 'active' || (user.id !== profile.user_id && !(await hasPermission(env, user, 'members', 'read')))) return fail('This profile image is private.', 403);
  }
  if (record.mime_type === 'application/pdf' || record.mime_type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
    const access = await env.DB.prepare('SELECT visibility FROM documents WHERE object_key=?').bind(key).first<{ visibility: string }>();
    if (!access || access.visibility !== 'public') {
      const user = await currentUser(request, env);
      if (!user || user.status !== 'active') return fail('This document is restricted to members.', 403);
    }
  }

  const publicImage = !profile && isPublicImage(record.mime_type);
  const cache = (globalThis as unknown as { caches?: { default: Cache } }).caches?.default;
  if (publicImage && cache) {
    const hit = await cache.match(request);
    if (hit) return hit;
  }

  const headers = new Headers();
  headers.set('Content-Type', record.mime_type);
  headers.set('Cache-Control', publicImage ? 'public, max-age=86400, stale-while-revalidate=604800' : 'private, max-age=3600');
  headers.set('X-Content-Type-Options', 'nosniff');
  headers.set('Content-Disposition', `inline; filename*=UTF-8''${encodeURIComponent(record.filename)}`);

  let body: ReadableStream | null = null;
  if (publicImage && githubEnabled(env)) {
    try { body = (await getGithub(env, key))?.body ?? null; } catch (error) { console.error('GitHub read failed:', error); }
  }
  if (!body && env.BUCKET) {
    const object = await env.BUCKET.get(key);
    if (object) { object.writeHttpMetadata(headers); headers.set('Content-Type', record.mime_type); body = object.body; }
  }
  if (!body) return fail('File not found.', 404);

  const response = new Response(body, { headers });
  if (publicImage && cache) waitUntil(cache.put(request, response.clone()));
  return response;
};
