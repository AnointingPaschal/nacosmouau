import { useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { CalendarClock, CheckCircle2, Clock, Receipt, Wallet, XCircle } from 'lucide-react';
import { toast } from 'sonner';
import { api } from '../../lib/api';
import { naira, when } from '../../lib/money';
import { EmptyState, ErrorState, LoadingState } from '../../components/States';
import { PageTitle, Panel, Pill } from '../../components/Workspace';
import { PayPanel, usePayInfo, type DueRow, type PayInfo } from './PayPanel';

const statusTone = { paid: 'is-paid', pending: 'is-pending', confirming: 'is-pending', rejected: 'is-rejected', unpaid: 'is-unpaid' } as const;
const statusText = { paid: 'Paid', pending: 'Awaiting approval', confirming: 'Confirming payment', rejected: 'Not accepted', unpaid: 'Unpaid' } as const;
const StatusIcon = ({ s }: { s: DueRow['status'] }) => s === 'paid' ? <CheckCircle2 size={15}/> : s === 'pending' || s === 'confirming' ? <Clock size={15}/> : s === 'rejected' ? <XCircle size={15}/> : <Wallet size={15}/>;

function DueCard({ due, info }: { due: DueRow; info: PayInfo }) {
  const client = useQueryClient(); const [open, setOpen] = useState(false); const [checking, setChecking] = useState(false);
  const check = async () => {
    if (!due.payment?.reference) return; setChecking(true);
    try {
      const r = await api.post<{ status: string; gateway?: string; message?: string; charged?: number | null; expected?: number }>('portal/payments/verify', { reference: due.payment.reference });
      if (r.status === 'successful') toast.success('Payment confirmed. Thank you!');
      else if (r.status === 'mismatch') toast.error(`Paystack charged ${naira(r.charged ?? 0)} but ${naira(r.expected ?? 0)} was expected. Please contact the executives.`);
      else toast.message(`Paystack says: ${r.gateway === 'unknown' ? 'no record yet' : r.gateway}${r.message ? `. ${r.message}` : ''}`);
      await client.invalidateQueries({ queryKey: ['portal'] });
    } catch (e) { toast.error(e instanceof Error ? e.message : 'Could not check the payment'); } finally { setChecking(false); }
  };
  const payable = due.amount_minor > 0 && (due.status === 'unpaid' || due.status === 'rejected');
  const late = due.due_date && due.status !== 'paid' && due.due_date < new Date().toISOString().slice(0, 10);
  return <article className={`due-card ${statusTone[due.status]}`}>
    <header><span className="due-kind">{due.kind === 'nacos' ? 'NACOS dues' : 'Other dues'}</span><span className={`due-state ${statusTone[due.status]}`}><StatusIcon s={due.status}/> {statusText[due.status]}</span></header>
    <h3>{due.title}</h3>
    {due.description && <p>{due.description}</p>}
    <div className="due-amount">{due.amount_minor > 0 ? naira(due.amount_minor) : 'Not set yet'}</div>
    {due.due_date && <small className={`due-date${late ? ' is-late' : ''}`}><CalendarClock size={13}/> Due {when(due.due_date)}{late ? ' (overdue)' : ''}</small>}
    {due.status === 'rejected' && <p className="notice-bar"><XCircle size={14}/><span>{due.payment?.review_note ?? 'Your last payment was not accepted. Please pay again.'}</span></p>}
    {due.status === 'pending' && due.payment?.method === 'transfer' && <p className="form-note">Your bank teller was received. An executive will confirm it soon.</p>}
    {due.status === 'confirming' && <><p className="form-note">Paystack is confirming your payment. This is automatic and usually takes under a minute. You do not need to wait for anyone.</p><button className="button button-outline btn-sm" disabled={checking} onClick={() => void check()}>{checking ? 'Checking…' : 'Check again'}</button></>}
    {due.status === 'paid' && due.kind === 'nacos' && <p className="form-note">You are cleared for {info.session} and can vote in elections.</p>}
    {due.amount_minor <= 0 && <p className="form-note">The executives have not set this amount yet.</p>}
    {payable && (open ? <PayPanel purpose={due.kind === 'nacos' ? 'dues' : 'custom_due'} refId={due.kind === 'nacos' ? undefined : due.id} amountMinor={due.amount_minor} info={info} onDone={() => setOpen(false)}/> : <button className="button button-green" onClick={() => setOpen(true)}>Pay {naira(due.amount_minor)}</button>)}
  </article>;
}

export function PortalPayments() {
  const q = usePayInfo(); const client = useQueryClient(); const [params, setParams] = useSearchParams(); const handled = useRef(false); const [cat, setCat] = useState('');
  const reference = params.get('reference') ?? params.get('trxref');
  useEffect(() => {
    if (!reference || handled.current) return; handled.current = true;
    api.post<{ status: string; gateway?: string; message?: string }>('portal/payments/verify', { reference }).then(r => {
      if (r.status === 'successful') toast.success('Payment confirmed. Thank you!'); else toast.message(`Paystack says: ${r.gateway === 'unknown' ? 'no record yet' : r.gateway ?? 'pending'}${r.message ? `. ${r.message}` : ''}`);
    }).catch(e => toast.error(e instanceof Error ? e.message : 'Could not confirm the payment')).finally(() => { setParams({}, { replace: true }); void client.invalidateQueries({ queryKey: ['portal'] }); });
  }, [reference, client, setParams]);
  if (q.isLoading) return <LoadingState/>;
  if (q.error || !q.data) return <ErrorState error={q.error}/>;
  const info = q.data; const dues = info.dues_items ?? [];
  const owing = dues.filter(d => d.status !== 'paid' && d.amount_minor > 0).length;
  const categories = [['', 'All'], ['dues', 'NACOS dues'], ['custom_due', 'Other dues'], ['candidate_form', 'Candidate forms']];
  const history = (info.payments as Array<Record<string, unknown>>).filter(p => !cat || p.purpose === cat);
  const label = (p: Record<string, unknown>) => p.purpose === 'custom_due' ? String(p.due_title ?? 'Other dues') : p.purpose === 'candidate_form' ? 'Candidate form' : 'NACOS dues';
  return <>
    <PageTitle eyebrow="MEMBER SPACE" title="Dues and payments" description={`Everything you can pay for ${info.session}${info.level ? ` as a ${info.level} level member` : ''}, and every payment you have made.`}/>
    <section aria-label="Available dues">
      <div className="section-line"><h2>Available dues</h2><span>{owing === 0 ? 'You are all caught up' : `${owing} to pay`}</span></div>
      <div className="due-grid">{dues.map(d => <DueCard key={d.id} due={d} info={info}/>)}</div>
    </section>
    <section aria-label="Payments made" className="payments-made">
      <div className="section-line"><h2>Payments made</h2><span>{info.payments.length} {info.payments.length === 1 ? 'payment' : 'payments'}</span></div>
      <Panel>
        <div className="filter-tabs">{categories.map(([v, l]) => <button key={v} className={cat === v ? 'selected' : ''} onClick={() => setCat(v)}>{l}</button>)}</div>
        {history.length === 0 ? <EmptyState title="No payments here" text="Your payments and receipts will be listed here." icon={<Receipt size={22}/>}/> : <div className="record-list">{history.map(p => <article className="record-row" key={String(p.id)}>
          <div><strong>{label(p)}{p.session ? ` · ${String(p.session)}` : ''}</strong><span className="mono">{String(p.reference)} · {String(p.method ?? 'online')} · {when(String(p.created_at))}</span>{p.review_note && p.status === 'failed' ? <span className="note-bad">{String(p.review_note)}</span> : null}</div>
          <div className="row-right"><b>{naira(Number(p.amount_minor))}</b><Pill value={p.status === 'pending' && p.method === 'paystack' ? 'confirming' : String(p.status)}/></div>
        </article>)}</div>}
      </Panel>
    </section>
  </>;
}
