import { Env } from '../../auth/_shared';
import { handleHeroSlides } from '../../hero-slides';
export const onRequestGet:PagesFunction<Env>=({request,env,params})=>handleHeroSlides(request,env,String(params.id));
export const onRequestPut:PagesFunction<Env>=({request,env,params})=>handleHeroSlides(request,env,String(params.id));
export const onRequestPatch:PagesFunction<Env>=({request,env,params})=>handleHeroSlides(request,env,String(params.id));
export const onRequestDelete:PagesFunction<Env>=({request,env,params})=>handleHeroSlides(request,env,String(params.id));
