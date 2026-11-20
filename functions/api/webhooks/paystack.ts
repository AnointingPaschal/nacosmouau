import { Env } from '../auth/_shared';
import { applyPaymentSuccess } from '../_portal';

const hex = (buffer: ArrayBuffer) => Array.from(new Uint8Array(buffer), b => b.toString(16).padStart(2, '0')).join('');

/** Paystack calls this after a successful charge, so dues are recorded even if the member closes the page. */
export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  if (!env.PAYSTACK_SECRET_KEY) return new Response('Not configured', { status: 503 });
  const raw = await request.text();
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(env.PAYSTACK_SECRET_KEY), { name: 'HMAC', hash: 'SHA-512' }, false, ['sign']);
  const expected = hex(await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(raw)));
  if (expected !== request.headers.get('x-paystack-signature')) return new Response('Invalid signature', { status: 401 });
  let event: { event?: string; data?: { reference?: string; amount?: number; currency?: string; status?: string } };
  try { event = JSON.parse(raw); } catch { return new Response('Bad request', { status: 400 }); }
  if (event.event === 'charge.success' && event.data?.reference) {
    const payment = await env.DB.prepare('SELECT id,amount_minor,status FROM payments WHERE reference=?').bind(event.data.reference).first<{ id: string; amount_minor: number; status: string }>();
    if (payment && payment.status === 'pending' && event.data.status === 'success' && event.data.amount === payment.amount_minor && event.data.currency === 'NGN') await applyPaymentSuccess(env, payment.id);
  }
  return new Response('ok');
};
