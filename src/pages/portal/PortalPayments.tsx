import { useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { CheckCircle2, Clock, Wallet, XCircle } from 'lucide-react';
import { toast } from 'sonner';
import { api } from '../../lib/api';
import { naira, when } from '../../lib/money';
import { EmptyState, ErrorState, LoadingState } from '../../components/States';
import { PageTitle, Panel, Pill } from '../../components/Workspace';
import { PayPanel, usePayInfo } from './PayPanel';

const purposeLabel: Record<string, string> = { dues: 'NACOS dues', candidate_form: 'Candidate form' };

export function PortalPayments() {
  const q = usePayInfo(); const client = useQueryClient(); const [params, setParams] = useSearchParams(); const handled = useRef(false);
  const reference = params.get('reference') ?? params.get('trxref');
  useEffect(() => {
    if (!reference || handled.current) return; handled.current = true;
    api.post<{ status: string }>('portal/payments/verify', { reference }).then(r => {
      if (r.status === 'successful') toast.success('Payment confirmed. Thank you!'); else toast.message('We are still confirming your payment. Refresh in a moment.');
    }).catch(e => toast.error(e instanceof Error ? e.message : 'Could not confirm the payment')).finally(() => { setParams({}, { replace: true }); void client.invalidateQueries({ queryKey: ['portal'] }); });
  }, [reference, client, setParams]);
  if (q.isLoading) return <LoadingState/>;
  if (q.error || !q.data) return <ErrorState error={q.error}/>;
  const info = q.data; const d = info.dues; const unset = info.dues_amount_minor <= 0;
  return <>
    <PageTitle eyebrow="MEMBER SPACE" title="Payments" description={`Pay your ${info.session} NACOS dues and see every payment you have made.`}/>
    <div className="pay-layout">
      <Panel title={`${info.session} NACOS dues`} className="dues-card">
        <div className={`dues-status dues-${d.status}`}>
          {d.status === 'paid' && <><CheckCircle2 size={28}/><div><strong>Dues paid</strong><span>You are cleared for the {info.session} session and can vote in elections.</span></div></>}
          {d.status === 'pending' && <><Clock size={28}/><div><strong>Awaiting approval</strong><span>Your bank teller was received. An executive will confirm it soon.</span></div></>}
          {d.status === 'rejected' && <><XCircle size={28}/><div><strong>Last payment was not accepted</strong><span>{String(d.payment?.review_note ?? 'Please pay again or upload a clearer teller.')}</span></div></>}
          {d.status === 'unpaid' && <><Wallet size={28}/><div><strong>{unset ? 'Dues not set yet' : naira(info.dues_amount_minor)}</strong><span>{unset ? 'The executives have not set the dues amount for this session.' : `NACOS dues for ${info.session} are not paid yet.`}</span></div></>}
        </div>
        {!unset && (d.status === 'unpaid' || d.status === 'rejected' || (d.status === 'pending' && d.payment?.method === 'paystack')) && <PayPanel purpose="dues" amountMinor={info.dues_amount_minor} info={info}/>}
      </Panel>
      <Panel title="Payment history">
        {info.payments.length === 0 ? <EmptyState title="No payments yet" text="Your payments and receipts will be listed here." icon={<Wallet size={22}/>}/> : <div className="record-list">{info.payments.map(p => <article className="record-row" key={String(p.id)}><div><strong>{purposeLabel[String(p.purpose)] ?? 'Payment'}{p.session ? ` · ${String(p.session)}` : ''}</strong><span>{String(p.reference)} · {String(p.method ?? '')} · {when(String(p.created_at))}</span>{p.status === 'failed' && p.review_note ? <span className="note-bad">{String(p.review_note)}</span> : null}</div><div className="row-right"><b>{naira(Number(p.amount_minor))}</b><Pill value={String(p.status)}/></div></article>)}</div>}
      </Panel>
    </div>
  </>;
}
