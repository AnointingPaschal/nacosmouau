import { githubEnabled, isPublicImage, putGithub, deleteObject } from './_storage';
import { Env, currentUser, fail, hasPermission, json, randomId } from './auth/_shared';
const allowed = new Set(['image/jpeg','image/png','image/webp','application/pdf','application/vnd.openxmlformats-officedocument.wordprocessingml.document']);
const imageLimit = 8 * 1024 * 1024, documentLimit = 20 * 1024 * 1024;
function extension(name: string, mime: string) { const found = name.toLowerCase().match(/\.([a-z0-9]{1,8})$/)?.[1]; const expected: Record<string,string> = {'image/jpeg':'jpg','image/png':'png','image/webp':'webp','application/pdf':'pdf','application/vnd.openxmlformats-officedocument.wordprocessingml.document':'docx'}; return expected[mime] && (!found || found === expected[mime] || (mime === 'image/jpeg' && found === 'jpeg')) ? expected[mime] : null; }
function matchesSignature(bytes: Uint8Array, mime: string) { if(mime==='image/jpeg') return bytes[0]===0xff&&bytes[1]===0xd8&&bytes[2]===0xff; if(mime==='image/png') return bytes[0]===0x89&&bytes[1]===0x50&&bytes[2]===0x4e&&bytes[3]===0x47; if(mime==='image/webp') return String.fromCharCode(...bytes.slice(0,4))==='RIFF'&&String.fromCharCode(...bytes.slice(8,12))==='WEBP'; if(mime==='application/pdf') return String.fromCharCode(...bytes.slice(0,5))==='%PDF-'; return bytes[0]===0x50&&bytes[1]===0x4b; }
export const onRequestPost: PagesFunction<Env> = async ({request,env}) => {
  const user=await currentUser(request,env); if(!user||user.status!=='active') return fail('Sign in with an active account to upload files.',401);
  let form: FormData; try { form=await request.formData(); } catch { return fail('Upload must use multipart form data.'); }
  const purpose=String(form.get('purpose')??'media');const file=form.get('file'); if(!(file instanceof File)) return fail('Choose a file to upload.');
  if(purpose==='proof'){if(!(file.type.toLowerCase().startsWith('image/')||file.type==='application/pdf'))return fail('Upload a photo or PDF of your teller or transfer receipt.');}else if(purpose==='profile'||purpose==='candidate'){if(!file.type.toLowerCase().startsWith('image/'))return fail('Passports must be an image.');}else{const permissions=await Promise.all(['cms','executives','gallery','documents','events','achievements','members','settings'].map(resource=>hasPermission(env,user,resource,'create').catch(()=>false)));if(!permissions.some(Boolean))return fail('You do not have permission to upload association media.',403);}
  const mime=file.type.toLowerCase(), max= mime.startsWith('image/')?imageLimit:documentLimit, ext=extension(file.name,mime);
  if(!allowed.has(mime)||!ext) return fail('File type is not allowed. Use JPEG, PNG, WebP, PDF, or DOCX.');
  if(file.size<=0||file.size>max) return fail(`File exceeds the ${max/(1024*1024)} MB limit.`);
  const bytes=new Uint8Array(await file.arrayBuffer()); if(!matchesSignature(bytes,mime)) return fail('The file contents do not match its declared file type.');
  const privatePurpose=purpose==='profile'||purpose==='proof'||purpose==='candidate';const toGithub=!privatePurpose&&isPublicImage(mime,purpose)&&githubEnabled(env);
  if(!toGithub&&!env.BUCKET) return fail(!privatePurpose&&isPublicImage(mime,purpose)?'Image storage is not configured. Add the GITHUB_TOKEN secret to Cloudflare Pages.':'Private files (documents and profile photos) need the R2 bucket, which is not configured.',503);
  const key=`uploads/${new Date().toISOString().slice(0,7)}/${randomId()}.${ext}`;
  const filename=file.name.replace(/[\r\n\0]/g,'').slice(0,180)||`upload.${ext}`;
  try {
    if(toGithub)await putGithub(env,key,bytes);else await env.BUCKET!.put(key,bytes,{httpMetadata:{contentType:mime,cacheControl:'public, max-age=86400'},customMetadata:{filename,uploadedBy:user.id}});
    await env.DB.prepare('INSERT INTO media_objects(object_key,uploaded_by,filename,mime_type,size_bytes) VALUES(?,?,?,?,?)').bind(key,user.id,filename,mime,file.size).run();
    return json({url:`/api/files/${key}`,key,filename,size:file.size,mimeType:mime},201);
  } catch(error) { console.error('Upload failed:',error); try{await deleteObject(env,key)}catch{} return fail(toGithub?'Image could not be saved to GitHub. Check that GITHUB_TOKEN has Contents read and write access to the repository.':'File could not be saved. Check the R2 binding and D1 media table.',500); }
};
