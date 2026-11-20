import { Env, currentUser, isStaff, json } from './_shared';
export const onRequestGet: PagesFunction<Env> = async ({ request, env }) => {
  try {
    const user = await currentUser(request, env);
    if (!user) return json({ user: null }, 401);
    const rows = await env.DB.prepare('SELECT role_id FROM user_roles WHERE user_id=?').bind(user.id).all<{ role_id: string }>();
    const roles = (rows.results ?? []).map(r => r.role_id);
    const staff = await isStaff(env, user);
    return json({ user, roles, staff });
  }
  catch (error) { console.error('Session lookup failed:', error); return json({error:'Session verification is unavailable.'},500); }
};
