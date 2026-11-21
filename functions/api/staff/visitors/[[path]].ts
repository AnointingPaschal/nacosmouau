import { Env, currentUser, fail, hasPermission, json } from '../../auth/_shared';
import { pathOf } from '../../_portal';

const ONLINE = "datetime('now','-45 seconds')";

async function overview(env: Env) {
  const n = async (sql: string) => (await env.DB.prepare(sql).first<{ n: number }>())?.n ?? 0;
  const [online, members, today, todayViews, weekly, live, pages, hourly, countries, devices, referrers] = await Promise.all([
    n(`SELECT COUNT(*) n FROM visitor_sessions WHERE last_seen_at >= ${ONLINE}`),
    n(`SELECT COUNT(*) n FROM visitor_sessions WHERE last_seen_at >= ${ONLINE} AND user_id IS NOT NULL`),
    n("SELECT COUNT(DISTINCT vid) n FROM visitor_sessions WHERE started_at >= date('now')"),
    n("SELECT COUNT(*) n FROM page_views WHERE viewed_at >= date('now')"),
    n("SELECT COUNT(DISTINCT vid) n FROM visitor_sessions WHERE started_at >= datetime('now','-7 days')"),
    env.DB.prepare(`SELECT s.id,s.vid,s.user_id,s.started_at,s.last_seen_at,s.current_path,s.current_title,s.views,s.device,s.browser,s.os,s.country,s.region,s.city,s.referrer,
        u.full_name,u.matric_number,u.academic_level,
        CAST((julianday('now')-julianday(s.started_at))*86400 AS INTEGER) AS seconds_on_site
      FROM visitor_sessions s LEFT JOIN users u ON u.id=s.user_id WHERE s.last_seen_at >= ${ONLINE} ORDER BY s.started_at DESC LIMIT 200`).all(),
    env.DB.prepare(`SELECT current_path path,COUNT(*) n FROM visitor_sessions WHERE last_seen_at >= ${ONLINE} GROUP BY current_path ORDER BY n DESC LIMIT 8`).all(),
    env.DB.prepare("SELECT strftime('%Y-%m-%d %H:00',viewed_at) hour,COUNT(*) views,COUNT(DISTINCT vid) visitors FROM page_views WHERE viewed_at >= datetime('now','-24 hours') GROUP BY hour ORDER BY hour").all(),
    env.DB.prepare("SELECT COALESCE(country,'Unknown') name,COUNT(DISTINCT vid) n FROM visitor_sessions WHERE started_at >= datetime('now','-7 days') GROUP BY name ORDER BY n DESC LIMIT 6").all(),
    env.DB.prepare("SELECT COALESCE(device,'Unknown') name,COUNT(DISTINCT vid) n FROM visitor_sessions WHERE started_at >= datetime('now','-7 days') GROUP BY name ORDER BY n DESC").all(),
    env.DB.prepare("SELECT referrer name,COUNT(*) n FROM visitor_sessions WHERE referrer IS NOT NULL AND started_at >= datetime('now','-7 days') GROUP BY referrer ORDER BY n DESC LIMIT 5").all(),
  ]);
  const topToday = await env.DB.prepare("SELECT path,COUNT(*) n FROM page_views WHERE viewed_at >= date('now') GROUP BY path ORDER BY n DESC LIMIT 8").all();
  return json({ online, members_online: members, guests_online: online - members, visitors_today: today, views_today: todayViews, visitors_7d: weekly, live: live.results ?? [], pages_now: pages.results ?? [], top_pages_today: topToday.results ?? [], hourly: hourly.results ?? [], countries: countries.results ?? [], devices: devices.results ?? [], referrers: referrers.results ?? [], server_time: new Date().toISOString() });
}

async function detail(env: Env, id: string, canSeeContact: boolean) {
  const s = await env.DB.prepare(`SELECT s.*,u.full_name,u.email,u.phone,u.matric_number,u.academic_level,u.status AS user_status,u.role AS user_role,u.created_at AS joined_at,
      CAST((julianday(s.last_seen_at)-julianday(s.started_at))*86400 AS INTEGER) AS seconds_on_site,
      (s.last_seen_at >= ${ONLINE}) AS online
    FROM visitor_sessions s LEFT JOIN users u ON u.id=s.user_id WHERE s.id=?`).bind(id).first<Record<string, unknown>>();
  if (!s) return fail('Visit not found.', 404);
  const [views, previous] = await Promise.all([
    env.DB.prepare('SELECT path,title,viewed_at FROM page_views WHERE session_id=? ORDER BY viewed_at DESC,id DESC LIMIT 200').bind(id).all(),
    env.DB.prepare('SELECT id,started_at,last_seen_at,views,current_path FROM visitor_sessions WHERE vid=? AND id<>? ORDER BY started_at DESC LIMIT 10').bind(s.vid, id).all(),
  ]);
  const { email, phone, ...rest } = s; // contact details are only returned to staff who can read members
  return json({ session: rest, contact: canSeeContact ? { email, phone } : null, views: views.results ?? [], previous_visits: previous.results ?? [] });
}

export const onRequestGet: PagesFunction<Env> = async ({ request, env, params }) => {
  const user = await currentUser(request, env).catch(() => null);
  if (!user || user.status !== 'active') return fail('Sign in to continue.', 401);
  if (!(await hasPermission(env, user, 'analytics', 'read'))) return fail('Analytics permission is required.', 403);
  const [id] = pathOf(params as Record<string, string | string[]>);
  try { return id ? await detail(env, id, await hasPermission(env, user, 'members', 'read')) : await overview(env); }
  catch (error) { console.error('Visitor analytics failed:', error); return fail('Visitor analytics are unavailable. Apply the latest database migration.', 500); }
};
