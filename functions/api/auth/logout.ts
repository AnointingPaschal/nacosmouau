import { Env, clearCookie, json, requestSpace, sessionToken, sha256 } from './_shared';
export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  const space = requestSpace(request); const token = sessionToken(request, space);
  if (token) await env.DB.prepare('DELETE FROM sessions WHERE id_hash=?').bind(await sha256(token)).run();
  return json({ ok: true }, 200, { 'Set-Cookie': clearCookie(space) });
};
