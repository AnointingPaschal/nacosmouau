import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Banknote, Check, Copy, CreditCard, Landmark } from 'lucide-react';
import { toast } from 'sonner';
import { api } from '../../lib/api';
import { naira } from '../../lib/money';
import { FileUpload } from '../../components/FileUpload';

export interface DueRow { id: string; kind: 'nacos' | 'custom'; title: string; description: string | null; amount_minor: number; due_date: string | null; status: 'paid' | 'pending' | 'unpaid' | 'rejected'; payment: { id: string; method: string; review_note: string | null } | null }
export interface PayInfo { session: string; level: string | null; dues_items: DueRow[]; dues_amount_minor: number; paystack: boolean; bank: { bank_name: string; account_name: string; account_number: string; configured: boolean }; dues: { status: 'paid' | 'pending' | 'unpaid' | 'rejected'; payment: Record<string, unknown> | null }; payments: Array<Record<string, unknown>> }
export const usePayInfo = () => useQuery({ queryKey: ['portal', 'payments'], queryFn: ({ signal }) => api.get<PayInfo>('portal/payments', signal), retry: false });

function CopyButton({ value }: { value: string }) {
  return <button type="button" className="copy-btn" aria-label="Copy" onClick={() => { void navigator.clipboard?.writeText(value).then(() => toast.success('Copied')); }}><Copy size={14}/></button>;
}

/** Pay with Paystack or upload a bank teller. The amount is always decided by the server. */
export function PayPanel({ purpose, refId, amountMinor, info, onDone }: { purpose: 'dues' | 'candidate_form' | 'custom_due'; refId?: string; amountMinor: number; info: PayInfo; onDone?: () => void }) {
  const client = useQueryClient();
  const [tab, setTab] = useState<'online' | 'transfer'>(info.paystack ? 'online' : 'transfer');
  const [proof, setProof] = useState(''); const [name, setName] = useState(''); const [busy, setBusy] = useState(false);
  const finish = async () => { await client.invalidateQueries({ queryKey: ['portal'] }); onDone?.(); };
  const payOnline = async () => {
    setBusy(true);
    try { const r = await api.post<{ authorization_url: string }>('portal/payments', { purpose, refId, method: 'paystack' }); window.location.href = r.authorization_url; }
    catch (e) { toast.error(e instanceof Error ? e.message : 'Could not start the payment'); setBusy(false); }
  };
  const submitTeller = async () => {
    if (!proof) { toast.error('Upload your teller or transfer receipt first.'); return; }
    setBusy(true);
    try { const r = await api.post<{ message?: string }>('portal/payments', { purpose, refId, method: 'transfer', proof_url: proof, depositor_name: name }); toast.success(r.message ?? 'Teller submitted'); setProof(''); setName(''); await finish(); }
    catch (e) { toast.error(e instanceof Error ? e.message : 'Could not submit your teller'); }
    finally { setBusy(false); }
  };
  return <div className="pay-panel">
    <div className="pay-amount"><span>Amount to pay</span><strong>{naira(amountMinor)}</strong></div>
    <div className="id-type" role="tablist">
      <button type="button" role="tab" aria-selected={tab === 'online'} className={tab === 'online' ? 'selected' : ''} onClick={() => setTab('online')}><CreditCard size={15}/> Pay online</button>
      <button type="button" role="tab" aria-selected={tab === 'transfer'} className={tab === 'transfer' ? 'selected' : ''} onClick={() => setTab('transfer')}><Landmark size={15}/> Bank teller</button>
    </div>
    {tab === 'online' ? (
      info.paystack
        ? <div className="pay-body"><p>Pay securely with your card, bank transfer or USSD through Paystack. Your payment is confirmed automatically.</p><button className="button button-green" disabled={busy} onClick={() => void payOnline()}><CreditCard size={16}/> {busy ? 'Opening Paystack…' : `Pay ${naira(amountMinor)} with Paystack`}</button></div>
        : <div className="pay-body"><p className="form-note">Online payment is not available right now. Please pay by bank teller.</p></div>
    ) : (
      info.bank.configured
        ? <div className="pay-body">
            <div className="bank-card"><Banknote size={20}/><dl>
              <div><dt>Bank</dt><dd>{info.bank.bank_name}</dd></div>
              <div><dt>Account name</dt><dd>{info.bank.account_name}</dd></div>
              <div><dt>Account number</dt><dd className="mono">{info.bank.account_number} <CopyButton value={info.bank.account_number}/></dd></div>
            </dl></div>
            <p className="form-note">Pay exactly {naira(amountMinor)}, then upload a clear photo or PDF of your teller or transfer receipt. An executive will confirm it.</p>
            <label className="field"><span>Name on the teller (optional)</span><input value={name} onChange={e => setName(e.target.value)} placeholder="Depositor name"/></label>
            <FileUpload purpose="proof" accept="image/jpeg,image/png,image/webp,application/pdf" label="Upload teller or receipt" maxSizeMb={8} value={proof} onChange={f => setProof(f?.url ?? '')}/>
            <button className="button button-green" disabled={busy || !proof} onClick={() => void submitTeller()}><Check size={16}/> {busy ? 'Submitting…' : 'Submit teller for approval'}</button>
          </div>
        : <div className="pay-body"><p className="form-note">Bank details have not been set up yet. Please check back soon.</p></div>
    )}
  </div>;
}
