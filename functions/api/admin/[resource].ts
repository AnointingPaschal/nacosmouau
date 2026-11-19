import { Env } from '../auth/_shared';
import { handleResource } from '../_resources';
const run:PagesFunction<Env>=({request,env,params})=>handleResource(request,env,String(params.resource),undefined,true);
export const onRequestGet=run;export const onRequestPost=run;
