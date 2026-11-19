import { Env } from '../../auth/_shared';
import { handleResource } from '../../_resources';
const get:PagesFunction<Env>=({request,env,params})=>handleResource(request,env,String(params.resource),String(params.id),true);
const update:PagesFunction<Env>=({request,env,params})=>handleResource(request,env,String(params.resource),String(params.id),true);
const remove:PagesFunction<Env>=({request,env,params})=>handleResource(request,env,String(params.resource),String(params.id),true);
export const onRequestGet=get;export const onRequestPut=update;export const onRequestPatch=update;export const onRequestDelete=remove;
