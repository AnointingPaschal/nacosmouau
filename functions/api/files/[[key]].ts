import { Env, currentUser, fail } from '../auth/_shared';
export const onRequestGet: PagesFunction<Env> = async ({params,request,env}) => {
  const key=String(params.key??'').replace(/^\/+/, ''); if(!key||key.includes('..')) return fail('File not found.',404);
  if(!env.BUCKET) return fail('File storage is not configured.',503);
  const record=await env.DB.prepare('SELECT mime_type,filename FROM media_objects WHERE object_key=?').bind(key).first<{mime_type:string;filename:string}>();
  if(!record) return fail('File not found.',404);
  const profile=await env.DB.prepare('SELECT user_id FROM member_profiles WHERE profile_photo_key=?').bind(key).first<{user_id:string}>();if(profile){const user=await currentUser(request,env);if(!user||user.status!=='active'||(user.id!==profile.user_id&&!(await (await import('../auth/_shared')).hasPermission(env,user,'members','read'))))return fail('This profile image is private.',403);}
  if(record.mime_type==='application/pdf'||record.mime_type==='application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
    const access=await env.DB.prepare('SELECT visibility FROM documents WHERE object_key=?').bind(key).first<{visibility:string}>();
    if(!access||access.visibility!=='public') { const user=await currentUser(request,env); if(!user||user.status!=='active') return fail('This document is restricted to members.',403); }
  }
  const object=await env.BUCKET.get(key); if(!object) return fail('File not found.',404);
  const headers=new Headers(); object.writeHttpMetadata(headers); headers.set('Content-Type',record.mime_type); headers.set('Cache-Control','public, max-age=86400'); headers.set('X-Content-Type-Options','nosniff'); headers.set('Content-Disposition',`inline; filename*=UTF-8''${encodeURIComponent(record.filename)}`);
  return new Response(object.body,{headers});
};
