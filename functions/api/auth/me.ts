import { Env, currentUser, json } from './_shared';
export const onRequestGet: PagesFunction<Env> = async ({ request, env }) => {
  const user = await currentUser(request, env); return user ? json({user}) : json({user:null},401);
};
