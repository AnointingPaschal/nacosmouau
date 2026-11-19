import { Env } from '../auth/_shared';
import { handleResource } from '../_resources';
function kind(request:Request){return new URL(request.url).searchParams.get('kind')==='sessions'?'academic-sessions':'academic-levels'}
const run:PagesFunction<Env>=({request,env,params})=>handleResource(request,env,kind(request),String(params.id));
export const onRequestGet=run;export const onRequestPut=run;export const onRequestPatch=run;export const onRequestDelete=run;
