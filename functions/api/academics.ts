import { Env, fail } from './auth/_shared';
import { handleResource } from './_resources';
function kind(request:Request){const value=new URL(request.url).searchParams.get('kind');return value==='sessions'?'academic-sessions':'academic-levels'}
export const onRequestGet:PagesFunction<Env>=({request,env})=>handleResource(request,env,kind(request));
export const onRequestPost:PagesFunction<Env>=async({request,env})=>{let body:Record<string,unknown>;try{body=await request.clone().json()}catch{return fail('Invalid JSON body.')};return handleResource(request,env,body.kind==='sessions'?'academic-sessions':'academic-levels')};
