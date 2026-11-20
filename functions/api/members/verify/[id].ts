import { Env, json } from '../../auth/_shared';
import { currentSession, duesPaid } from '../../_portal';

/** Public check used by the QR code on the digital ID. It never exposes contact details. */
export const onRequestGet: PagesFunction<Env> = async ({ env, params }) => {
  const id = decodeURIComponent(String(params.id)).trim().toUpperCase();
  const row = await env.DB.prepare(`SELECT u.id,u.full_name,u.academic_level,u.status,m.membership_id FROM memberships m JOIN users u ON u.id=m.user_id WHERE m.membership_id=?`).bind(id).first<{ id: string; full_name: string; academic_level: string | null; status: string; membership_id: string }>();
  if (!row || row.status !== 'active') return json({ valid: false });
  const session = await currentSession(env);
  return json({ valid: true, full_name: row.full_name, membership_id: row.membership_id, level: row.academic_level, session, dues_paid: await duesPaid(env, row.id, session), status: 'Active member' });
};
