import { deleteObject } from './_storage';
import { Env, currentUser, fail, hasPermission, json, randomId } from './auth/_shared';

type Config={table:string; permission:string; fields:Record<string,string>; required:string[]; publicWhere?:string; keyField?:string};
const configs:Record<string,Config>={
 pages:{table:'pages',permission:'cms',fields:{slug:'slug',title:'title',summary:'summary',body:'body',hero_image_url:'hero_image_key',status:'status',published_at:'published_at'},required:['slug','title'],publicWhere:"status='published'"},
 news:{table:'news',permission:'news',fields:{title:'title',slug:'slug',excerpt:'excerpt',body:'body',image_url:'image_key',category:'category',status:'status',published_at:'published_at'},required:['title','slug'],publicWhere:"status='published'"},
 announcements:{table:'announcements',permission:'announcements',fields:{title:'title',body:'body',priority:'priority',published_at:'published_at',expires_at:'expires_at'},required:['title','body'],publicWhere:"published_at IS NOT NULL AND (expires_at IS NULL OR expires_at > datetime('now'))"},
 achievements:{table:'achievements',permission:'achievements',fields:{title:'title',description:'description',achieved_at:'achieved_at',image_url:'image_key'},required:['title']},
 events:{table:'events',permission:'events',fields:{title:'title',slug:'slug',description:'description',image_url:'image_key',starts_at:'starts_at',ends_at:'ends_at',venue:'venue',price_minor:'price_minor',currency:'currency',capacity:'capacity',registration_open:'registration_open',summary:'summary',stats_text:'stats_text'},required:['title','slug','starts_at'],publicWhere:'1=1'},
 'event-speakers':{table:'event_speakers',permission:'events',fields:{event_id:'event_id',name:'name',role:'role',image_url:'image_key',display_order:'display_order'},required:['event_id','name']},
 'event-media':{table:'event_media',permission:'events',fields:{event_id:'event_id',kind:'kind',image_url:'object_key',video_link:'video_link',thumbnail_url:'thumbnail_key',caption:'caption',duration:'duration',is_featured:'is_featured',display_order:'display_order'},required:['event_id','kind']},
 documents:{table:'documents',permission:'documents',fields:{title:'title',description:'description',category:'category',file_url:'object_key',visibility:'visibility',published_at:'published_at'},required:['title','category','file_url'],publicWhere:"visibility='public' AND published_at IS NOT NULL"},
 gallery:{table:'gallery_albums',permission:'gallery',fields:{title:'title',description:'description',cover_image_url:'cover_key',is_public:'is_public'},required:['title'],publicWhere:'is_public=1'},
 'page-sections':{table:'page_sections',permission:'cms',fields:{page_id:'page_id',key:'section_key',title:'title',body:'body',image_url:'image_key',display_order:'display_order',is_published:'is_published'},required:['page_id','key','title']},
 'gallery-media':{table:'gallery_media',permission:'gallery',fields:{album_id:'album_id',image_url:'object_key',caption:'caption',display_order:'display_order'},required:['album_id','image_url']},
 navigation:{table:'navigation_menus',permission:'cms',fields:{label:'label',href:'href',location:'location',display_order:'display_order',is_visible:'is_visible',parent_id:'parent_id'},required:['label','href']},
 'academic-sessions':{table:'academic_sessions',permission:'academics',fields:{name:'name',starts_at:'starts_at',ends_at:'ends_at',is_active:'is_active'},required:['name']},
 'academic-levels':{table:'academic_levels',permission:'academics',fields:{name:'name',display_order:'display_order'},required:['name']},
 'executive-administrations':{table:'executive_administrations',permission:'executives',fields:{name:'name',starts_at:'starts_at',ends_at:'ends_at',is_current:'is_current',handover_notes:'handover_notes'},required:['name']},
 'executive-positions':{table:'executive_positions',permission:'executives',fields:{name:'name',description:'description',display_order:'display_order'},required:['name']}
};
function clean(body:Record<string,unknown>,cfg:Config){
 const out:Record<string,unknown>={};
 for(const [input,column] of Object.entries(cfg.fields)){
  if(!(input in body))continue;
  let value:unknown=body[input];
  if(typeof value==='string'){const text=value.trim();if(text.length>12000)return null;value=text;}
  if(input.endsWith('_url')||input==='file_url'){
   if(value===null||value===''){out[column]=null;continue;}
   if(typeof value!=='string')return null;
   const match=value.match(/^\/api\/files\/(uploads\/[A-Za-z0-9/_-]+\.[A-Za-z0-9]+)$/);if(!match)return null;value=match[1];
  }
  if(['price_minor','capacity','display_order'].includes(input)&&value!==null){const numeric=Number(value);if(!Number.isSafeInteger(numeric)||numeric<0)return null;value=numeric;}
  if(['is_active','is_visible','is_public','is_current','registration_open','is_published','is_featured'].includes(input))value=value===true||value===1?1:0;
  if(input==='video_link'&&value!==null&&value!==''){if(typeof value!=='string'||value.length>500||!/^https:\/\/[^\s]+$/.test(value))return null;}
  if(input==='kind'&&!['photo','video'].includes(String(value)))return null;
  out[column]=value;
 }
 if(cfg.table==='event_media'){if(out.kind==='photo'&&!out.object_key)return null;if(out.kind==='video'&&!out.video_link)return null;}
 for(const required of cfg.required){const value=out[cfg.fields[required]];if(value===undefined||value===null||value==='')return null;}
 return out;
}
function show(row:Record<string,unknown>,cfg:Config){const reverse=Object.fromEntries(Object.entries(cfg.fields).map(([a,b])=>[b,a]));const out:Record<string,unknown>={...row};for(const [col,key] of Object.entries(reverse)){if(key.endsWith('_url')||key==='file_url'){const value=out[col];out[key]=typeof value==='string'?`/api/files/${value}`:null;delete out[col];}else if(['is_active','is_visible','is_public','is_current','registration_open','is_published','is_featured'].includes(key))out[key]=Boolean(out[col]);}return out;}
function action(method:string){return method==='GET'?'read':method==='POST'?'create':['PUT','PATCH'].includes(method)?'update':method==='DELETE'?'delete':null;}
async function galleryPhotos(env:Env,albumId:string){const {results=[]}=await env.DB.prepare('SELECT id,object_key,caption,display_order FROM gallery_media WHERE album_id=? ORDER BY display_order').bind(albumId).all<Record<string,unknown>>();return results.map(photo=>({id:photo.id,image_url:`/api/files/${photo.object_key}`,caption:photo.caption,display_order:photo.display_order}));}
const parseStats=(text:unknown)=>typeof text==='string'?text.split(/\r?\n/).map(line=>line.split('|').map(part=>part.trim())).filter(parts=>parts[0]&&parts[1]).slice(0,8).map(([value,label])=>({value,label})):[];
const fileUrl=(key:unknown)=>typeof key==='string'&&key?`/api/files/${key}`:null;
async function eventExtras(env:Env,eventId:string,statsText:unknown){
 const safe=async<T,>(query:Promise<{results?:T[]}>)=>{try{return (await query).results??[]}catch{return [] as T[]}};
 const speakers=await safe(env.DB.prepare('SELECT id,name,role,image_key FROM event_speakers WHERE event_id=? ORDER BY display_order,created_at').bind(eventId).all<Record<string,unknown>>());
 const media=await safe(env.DB.prepare('SELECT id,kind,object_key,video_link,thumbnail_key,caption,duration,is_featured FROM event_media WHERE event_id=? ORDER BY display_order,created_at').bind(eventId).all<Record<string,unknown>>());
 return {
  stats:parseStats(statsText),
  speakers:speakers.map(x=>({id:x.id,name:x.name,role:x.role,image_url:fileUrl(x.image_key)})),
  photos:media.filter(x=>x.kind==='photo'&&x.object_key).map(x=>({id:x.id,image_url:fileUrl(x.object_key),caption:x.caption})),
  videos:media.filter(x=>x.kind==='video'&&x.video_link).map(x=>({id:x.id,video_url:x.video_link,thumbnail_url:fileUrl(x.thumbnail_key),caption:x.caption,duration:x.duration,is_featured:Boolean(x.is_featured)})),
 };
}
async function pageSections(env:Env,pageId:string,admin:boolean){const {results=[]}=await env.DB.prepare(`SELECT id,section_key,title,body,image_key,display_order FROM page_sections WHERE page_id=?${admin?'':' AND is_published=1'} ORDER BY display_order`).bind(pageId).all<Record<string,unknown>>();return results.map(section=>({...section,key:section.section_key,image_url:typeof section.image_key==='string'?`/api/files/${section.image_key}`:null,image_key:undefined,section_key:undefined}));}
export async function handleResource(request:Request,env:Env,resource:string,id?:string,adminPath=false){
 const cfg=configs[resource];if(!cfg)return fail('This API resource is not implemented.',404);
 const verb=action(request.method);if(!verb)return fail('Method not allowed.',405);
 const user=await currentUser(request,env).catch(()=>null);const authorized=!!user&&user.status==='active'&&await hasPermission(env,user,cfg.permission,verb);
 if(verb!=='read'&&(!authorized||!user))return fail('You do not have permission to change this resource.',403);
 if(adminPath&&(!authorized||!user))return fail('Administrator permission is required to view this resource.',403);
 if(verb==='read'){
  const where=(authorized||!cfg.publicWhere)?'':` WHERE ${cfg.publicWhere}`;
  if(id){const field=!adminPath&&['pages','news','events'].includes(resource)?'slug':'id';const row=await env.DB.prepare(`SELECT * FROM ${cfg.table} WHERE ${field}=?${where?` AND ${cfg.publicWhere}`:''}`).bind(id).first<Record<string,unknown>>();if(!row)return fail('Record not found.',404);const item=show(row,cfg);if(resource==='gallery')item.photos=await galleryPhotos(env,String(row.id));if(resource==='events'&&!adminPath)Object.assign(item,await eventExtras(env,String(row.id),row.stats_text));if(resource==='pages')item.sections=await pageSections(env,String(row.id),authorized);return json(item);}
  const params=new URL(request.url).searchParams;const query=params.get('search')?.trim().slice(0,100);const offset=Math.max(0,Math.min(10000,(Number(params.get('page')??1)-1)*100));const {results=[]}=await env.DB.prepare(`SELECT * FROM ${cfg.table}${where} ORDER BY created_at DESC LIMIT 100 OFFSET ?`).bind(offset).all<Record<string,unknown>>();let items=results.map(row=>show(row,cfg)).filter(row=>!query||JSON.stringify(row).toLowerCase().includes(query.toLowerCase()));if(params.has('category'))items=items.filter(row=>row.category===params.get('category'));if(params.get('slug'))items=items.filter(row=>row.slug===params.get('slug'));if(resource==='events'&&params.get('status')==='upcoming')items=items.filter(row=>String(row.starts_at)>=new Date().toISOString());if(resource==='gallery')items=await Promise.all(items.map(async item=>({...item,photos:await galleryPhotos(env,String(item.id))})));if(resource==='pages')items=await Promise.all(items.map(async item=>({...item,sections:await pageSections(env,String(item.id),authorized)})));return json(items);
 }
 if(request.method==='DELETE'){
  if(!id)return fail('Record id is required.');const old=await env.DB.prepare(`SELECT * FROM ${cfg.table} WHERE id=?`).bind(id).first<Record<string,unknown>>();if(!old)return fail('Record not found.',404);
  await env.DB.prepare(`DELETE FROM ${cfg.table} WHERE id=?`).bind(id).run();const mediaKey=old.image_key??old.hero_image_key??old.cover_key??old.object_key;if(typeof mediaKey==='string'){const refs=await env.DB.prepare(`SELECT (SELECT count(*) FROM hero_slides WHERE image_key=?)+(SELECT count(*) FROM pages WHERE hero_image_key=?)+(SELECT count(*) FROM news WHERE image_key=?)+(SELECT count(*) FROM events WHERE image_key=?)+(SELECT count(*) FROM gallery_albums WHERE cover_key=?)+(SELECT count(*) FROM gallery_media WHERE object_key=?)+(SELECT count(*) FROM documents WHERE object_key=?)+(SELECT count(*) FROM page_sections WHERE image_key=?)+(SELECT count(*) FROM executive_assignments WHERE image_key=?)+(SELECT count(*) FROM member_profiles WHERE profile_photo_key=?) AS n`).bind(mediaKey,mediaKey,mediaKey,mediaKey,mediaKey,mediaKey,mediaKey,mediaKey,mediaKey,mediaKey).first<{n:number}>();if(!refs?.n){await deleteObject(env,mediaKey);await env.DB.prepare('DELETE FROM media_objects WHERE object_key=?').bind(mediaKey).run();}}
  await env.DB.prepare('INSERT INTO audit_logs(id,actor_user_id,action,resource,record_id,details_json) VALUES(?,?,?,?,?,?)').bind(randomId(),user!.id,'delete',resource,id,JSON.stringify({title:old.title??old.name??null})).run();return json({ok:true});
 }
 let body:Record<string,unknown>;try{body=await request.json()}catch{return fail('Invalid JSON body.')};const fields=clean(body,cfg);if(!fields)return fail('Record data is invalid or contains a file URL that was not uploaded through the file service.');
 if(request.method==='POST'){
  const newId=randomId();const columns=Object.keys(fields);const values=columns.map(key=>fields[key]);if(cfg.table==='news'||cfg.table==='pages'||cfg.table==='events') {columns.push('created_by');values.push(user!.id);}
  await env.DB.prepare(`INSERT INTO ${cfg.table}(id,${columns.join(',')}) VALUES(${['?','?'] .concat(columns.slice(1).map(()=>'?')).join(',')})`).bind(newId,...values).run();await env.DB.prepare('INSERT INTO audit_logs(id,actor_user_id,action,resource,record_id,details_json) VALUES(?,?,?,?,?,?)').bind(randomId(),user!.id,'create',resource,newId,JSON.stringify({title:fields.title??fields.name??null})).run();return json({id:newId,...body},201);
 }
 if(!id)return fail('Record id is required.');const old=await env.DB.prepare(`SELECT * FROM ${cfg.table} WHERE id=?`).bind(id).first<Record<string,unknown>>();if(!old)return fail('Record not found.',404);
 const merged={...show(old,cfg),...body};const safe=clean(merged,cfg);if(!safe)return fail('Record data is invalid.');const columns=Object.keys(safe);if(!columns.length)return fail('No editable fields were supplied.');await env.DB.prepare(`UPDATE ${cfg.table} SET ${columns.map(col=>`${col}=?`).join(',')}${'updated_at' in old?",updated_at=datetime('now')":''} WHERE id=?`).bind(...columns.map(col=>safe[col]),id).run();await env.DB.prepare('INSERT INTO audit_logs(id,actor_user_id,action,resource,record_id,details_json) VALUES(?,?,?,?,?,?)').bind(randomId(),user!.id,'update',resource,id,JSON.stringify({title:safe.title??safe.name??null})).run();return json({id,...body});
}
export const resourceNames=Object.keys(configs);
