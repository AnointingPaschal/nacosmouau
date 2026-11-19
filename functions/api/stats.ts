import { Env, json } from './auth/_shared';
export const onRequestGet:PagesFunction<Env>=async({env})=>{
 try{const [members,executives,events,projects]=await Promise.all([
 env.DB.prepare("SELECT COUNT(*) AS n FROM users WHERE role='member' AND status IN ('active','pending')").first<{n:number}>(),
 env.DB.prepare('SELECT COUNT(*) AS n FROM executive_assignments ea JOIN executive_administrations a ON a.id=ea.administration_id WHERE a.is_current=1').first<{n:number}>(),
 env.DB.prepare("SELECT COUNT(*) AS n FROM events WHERE starts_at < datetime('now')").first<{n:number}>(),
 env.DB.prepare('SELECT COUNT(*) AS n FROM achievements').first<{n:number}>()]);return json({registered_members:members?.n??0,active_executives:executives?.n??0,events_hosted:events?.n??0,completed_projects:projects?.n??0});}
 catch(error){console.error('Stats query failed:',error);return json({error:'Association metrics are not available until migrations are applied.'},503)}
};
