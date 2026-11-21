import { Env, currentUser, json, randomId } from './auth/_shared';

const BOT = /bot|crawl|spider|slurp|headless|lighthouse|pingdom|uptime|monitor|curl|wget|python-requests|facebookexternalhit/i;

function describe(ua: string) {
  const browser = /edg\//i.test(ua) ? 'Edge' : /opr\/|opera/i.test(ua) ? 'Opera' : /samsungbrowser/i.test(ua) ? 'Samsung Internet' : /firefox|fxios/i.test(ua) ? 'Firefox' : /chrome|crios/i.test(ua) ? 'Chrome' : /safari/i.test(ua) ? 'Safari' : 'Other';
  const os = /android/i.test(ua) ? 'Android' : /iphone|ipad|ipod/i.test(ua) ? 'iOS' : /windows/i.test(ua) ? 'Windows' : /mac os/i.test(ua) ? 'macOS' : /linux/i.test(ua) ? 'Linux' : 'Other';
  const device = /ipad|tablet/i.test(ua) ? 'Tablet' : /mobi|android|iphone/i.test(ua) ? 'Mobile' : 'Desktop';
  return { browser, os, device };
}
const clip = (v: unknown, n: number) => (typeof v === 'string' ? v.trim().slice(0, n) : '');

/** Receives a page view or a heartbeat from the site. Public: guests are tracked by a random browser id. */
export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  const ua = request.headers.get('User-Agent') ?? '';
  if (!ua || BOT.test(ua)) return json({ ok: true });
  let body: Record<string, unknown>; try { body = await request.json(); } catch { return json({ ok: true }); }
  const vid = clip(body.vid, 64); if (!/^[A-Za-z0-9-]{8,64}$/.test(vid)) return json({ ok: true });
  let path = clip(body.path, 300); if (!path.startsWith('/') || path.startsWith('/admin')) return json({ ok: true });
  path = path.split('#')[0];
  const title = clip(body.title, 160) || null; const view = body.type !== 'ping';

  try {
    const user = await currentUser(request, env).catch(() => null);
    const userId = user && user.status === 'active' ? user.id : null;
    const session = await env.DB.prepare("SELECT id,current_path,user_id FROM visitor_sessions WHERE vid=? AND last_seen_at >= datetime('now','-30 minutes') ORDER BY last_seen_at DESC LIMIT 1").bind(vid).first<{ id: string; current_path: string; user_id: string | null }>();
    if (session) {
      const changed = view && session.current_path !== path;
      await env.DB.prepare("UPDATE visitor_sessions SET last_seen_at=datetime('now'),current_path=?,current_title=COALESCE(?,current_title),user_id=COALESCE(?,user_id),views=views+? WHERE id=?").bind(path, title, userId, changed ? 1 : 0, session.id).run();
      if (changed) await env.DB.prepare('INSERT INTO page_views(session_id,vid,user_id,path,title) VALUES(?,?,?,?,?)').bind(session.id, vid, userId, path, title).run();
    } else {
      const cf = (request as Request & { cf?: { country?: string; region?: string; city?: string } }).cf ?? {};
      const { browser, os, device } = describe(ua); const id = randomId();
      const ref = clip(body.referrer, 200); let referrer: string | null = null;
      if (ref) { try { const host = new URL(ref).host; referrer = host === new URL(request.url).host ? null : host; } catch { referrer = null; } }
      await env.DB.prepare('INSERT INTO visitor_sessions(id,vid,user_id,current_path,current_title,device,browser,os,country,region,city,referrer) VALUES(?,?,?,?,?,?,?,?,?,?,?,?)')
        .bind(id, vid, userId, path, title, device, browser, os, cf.country ?? null, cf.region ?? null, cf.city ?? null, referrer).run();
      await env.DB.prepare('INSERT INTO page_views(session_id,vid,user_id,path,title) VALUES(?,?,?,?,?)').bind(id, vid, userId, path, title).run();
    }
    if (Math.random() < 0.01) await env.DB.prepare("DELETE FROM visitor_sessions WHERE last_seen_at < datetime('now','-90 days')").run();
  } catch (error) { console.error('Visitor tracking failed:', error); }
  return json({ ok: true });
};
