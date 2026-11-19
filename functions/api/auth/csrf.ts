import { Env, json } from './_shared';
export const onRequestGet: PagesFunction<Env> = async () => json({ ok: true });
