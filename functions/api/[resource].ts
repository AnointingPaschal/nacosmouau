import { Env } from './auth/_shared';
import { handleResource } from './_resources';
export const onRequestGet:PagesFunction<Env>=({request,env,params})=>handleResource(request,env,String(params.resource));
export const onRequestPost:PagesFunction<Env>=({request,env,params})=>handleResource(request,env,String(params.resource));
