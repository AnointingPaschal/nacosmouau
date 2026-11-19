import { Env } from '../auth/_shared';
import { handleResource } from '../_resources';
const get:PagesFunction<Env>=({request,env,params})=>handleResource(request,env,String(params.resource),String(params.id));
const update:PagesFunction<Env>=({request,env,params})=>handleResource(request,env,String(params.resource),String(params.id));
const remove:PagesFunction<Env>=({request,env,params})=>handleResource(request,env,String(params.resource),String(params.id));
export const onRequestGet=get;export const onRequestPut=update;export const onRequestPatch=update;export const onRequestDelete=remove;
