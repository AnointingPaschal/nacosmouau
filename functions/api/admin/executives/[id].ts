import { Env } from '../../auth/_shared';
import { handleAdmin } from '../../executives';
export const onRequestGet:PagesFunction<Env>=({request,env,params})=>handleAdmin(request,env,String(params.id));
export const onRequestPut:PagesFunction<Env>=({request,env,params})=>handleAdmin(request,env,String(params.id));
export const onRequestPatch=onRequestPut;
export const onRequestDelete:PagesFunction<Env>=({request,env,params})=>handleAdmin(request,env,String(params.id));
