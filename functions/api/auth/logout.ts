import { Env, currentUser, json, sha256 } from './_shared';
export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  const token = request.headers.get('Cookie')?.split(';').map(v=>v.trim()).find(v=>v.startsWith('nacos_session='))?.slice(14);
  if (token) await env.DB.prepare('DELETE FROM sessions WHERE id_hash=?').bind(await sha256(decodeURIComponent(token))).run();
  return json({ok:true},200,{'Set-Cookie':'nacos_session=; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=0'});
};
