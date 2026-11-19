import { Env, currentUser, json } from './_shared';
export const onRequestGet: PagesFunction<Env> = async ({ request, env }) => {
  try { const user = await currentUser(request, env); return user ? json({user}) : json({user:null},401); }
  catch (error) { console.error('Session lookup failed:', error); return json({error:'Session verification is unavailable.'},500); }
};
