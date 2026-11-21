import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Check, ExternalLink, Search, Wallet, X } from 'lucide-react';
import { toast } from 'sonner';
import { api } from '../../lib/api';
import { naira, when } from '../../lib/money';
import { EmptyState, ErrorState, LoadingState } from '../../components/States';
import { PageTitle, Panel, Pill } from '../../components/Workspace';

interface P { id: string; reference: string; amount_minor: number; status: string; purpose: string | null; session: string | null; method: string | null; proof_url: string | null; depositor_name: string | null; due_title?: string | null; review_note: string | null; created_at: string; full_name: string | null; matric_number: string | null; academic_level: string | null }
const purposeLabel: Record<string, string> = { dues: 'NACOS dues', candidate_form: 'Candidate form', custom_due: 'Other dues' };

export function AdminPayments() {
  const client = useQueryClient();
  const [status, setStatus] = useState('pending'); const [purpose, setPurpose] = useState(''); const [search, setSearch] = useState(''); const [rejecting, setRejecting] = useState<P | null>(null); const [note, setNote] = useState('');
  const q = useQuery({ queryKey: ['staff', 'payments', status, purpose, search], queryFn: ({ signal }) => api.get<P[]>(`staff/payments?${new URLSearchParams({ status, purpose, search })}`, signal), retry: false });
  const checkOnline = async (p: P) => {
    try {
      const r = await api.post<{ status: string; gateway?: string; message?: string; http?: number; charged?: number | null; expected?: number }>(`staff/payments/${p.id}/verify`, {});
      if (r.status === 'successful') { toast.success(r.message ?? 'Paystack confirmed this payment.'); await client.invalidateQueries({ queryKey: ['staff'] }); }
      else toast.message(`Paystack says: ${r.gateway === 'unknown' ? 'no record' : r.gateway} (HTTP ${r.http ?? '?'}). ${r.message ?? ''}${r.charged != null ? ` Charged ${naira(r.charged)}, expected ${naira(r.expected ?? 0)}.` : ''}`);
    } catch (e) { toast.error(e instanceof Error ? e.message : 'Could not check with Paystack'); }
  };
  const review = async (p: P, decision: 'approve' | 'reject', why = '') => {
    try { await api.patch(`staff/payments/${p.id}`, { decision, note: why }); toast.success(decision === 'approve' ? 'Payment approved' : 'Payment rejected'); setRejecting(null); setNote(''); await client.invalidateQueries({ queryKey: ['staff'] }); }
    catch (e) { toast.error(e instanceof Error ? e.message : 'Could not review the payment'); }
  };
  return <>
    <PageTitle eyebrow="FINANCE" title="Payments" description="Approve bank tellers and see every Paystack payment for dues and candidate forms."/>
    <Panel>
      <div className="filter-bar">
        <div className="filter-tabs">{[['pending', 'Awaiting approval'], ['successful', 'Approved'], ['failed', 'Rejected'], ['', 'All']].map(([v, l]) => <button key={v} className={status === v ? 'selected' : ''} onClick={() => setStatus(v)}>{l}</button>)}</div>
        <select value={purpose} onChange={e => setPurpose(e.target.value)} aria-label="Payment type"><option value="">All types</option><option value="dues">NACOS dues</option><option value="custom_due">Other dues</option><option value="candidate_form">Candidate forms</option></select>
        <label className="crud-search"><Search size={16}/><input value={search} onChange={e => setSearch(e.target.value)} placeholder="Name, matric or reference"/></label>
      </div>
      {q.isLoading ? <LoadingState/> : q.error ? <ErrorState error={q.error}/> : !q.data?.length ? <EmptyState title="No payments here" text="Payments matching these filters will appear here." icon={<Wallet size={22}/>}/> :
        <div className="record-list">{q.data.map(p => <article className="member-row" key={p.id}>
          <div className="member-info"><strong>{p.full_name ?? 'Member'} · {naira(p.amount_minor)}</strong><span className="mono">{p.matric_number ?? '—'} · {p.academic_level ? `${p.academic_level}L` : ''}</span><span>{p.due_title ?? purposeLabel[p.purpose ?? ''] ?? 'Payment'}{p.session ? ` · ${p.session}` : ''} · {p.method === 'transfer' ? 'Bank teller' : 'Paystack'} · {when(p.created_at)}</span><span className="mono">{p.reference}{p.depositor_name ? ` · ${p.depositor_name}` : ''}</span>{p.review_note && <span className="note-bad">{p.review_note}</span>}</div>
          <div className="member-actions"><Pill value={p.status === 'pending' && p.method === 'paystack' ? 'confirming' : p.status}/>
            {p.proof_url && <a className="button button-outline btn-sm" href={p.proof_url} target="_blank" rel="noreferrer"><ExternalLink size={14}/> View teller</a>}
            {p.status === 'pending' && p.method === 'paystack' && <button className="button button-outline btn-sm" onClick={() => void checkOnline(p)}>Check with Paystack</button>}
            {p.status === 'pending' && p.method !== 'paystack' && <><button className="button button-green btn-sm" onClick={() => void review(p, 'approve')}><Check size={14}/> Approve</button><button className="button button-outline btn-sm" onClick={() => setRejecting(p)}><X size={14}/> Reject</button></>}
          </div></article>)}</div>}
    </Panel>
    {rejecting && <div className="modal-scrim" role="presentation"><section className="workspace-panel confirm-modal" role="dialog" aria-modal="true"><h2>Reject this payment?</h2><p>Tell {rejecting.full_name ?? 'the member'} why, so they know what to fix.</p><label className="field"><span>Reason</span><textarea rows={3} value={note} onChange={e => setNote(e.target.value)} placeholder="For example: the teller is not clear, or the amount is wrong."/></label><footer><button className="button button-outline" onClick={() => { setRejecting(null); setNote(''); }}>Cancel</button><button className="button button-danger" disabled={note.trim().length < 3} onClick={() => void review(rejecting, 'reject', note)}>Reject payment</button></footer></section></div>}
  </>;
}
