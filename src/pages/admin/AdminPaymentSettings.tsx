import { useEffect, useState, type FormEvent } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { KeyRound, Landmark, ShieldCheck, Wallet } from 'lucide-react';
import { toast } from 'sonner';
import { api } from '../../lib/api';
import { fromKobo, toKobo } from '../../lib/money';
import { ErrorState, LoadingState } from '../../components/States';
import { PageTitle, Panel } from '../../components/Workspace';

const LEVELS = ['100', '200', '300', '400'];
interface Data {
  session: string; dues_by_level: Record<string, number>; dues_explicit: string[];
  bank_name: string; bank_account_name: string; bank_account_number: string;
  paystack_public_key: string; paystack_secret_configured: boolean; caller_is_super_admin: boolean;
}

export function AdminPaymentSettings() {
  const client = useQueryClient();
  const q = useQuery({ queryKey: ['staff', 'payment-settings'], queryFn: ({ signal }) => api.get<Data>('staff/payment-settings', signal), retry: false });
  const [dues, setDues] = useState<Record<string, string>>({});
  const [bank, setBank] = useState({ bank_name: '', bank_account_name: '', bank_account_number: '' });
  const [key, setKey] = useState('');
  const [email, setEmail] = useState(''); const [password, setPassword] = useState(''); const [busy, setBusy] = useState(false);

  useEffect(() => {
    const d = q.data; if (!d) return;
    setDues(Object.fromEntries(LEVELS.map(l => [l, fromKobo(d.dues_by_level[l] ?? 0)])));
    setBank({ bank_name: d.bank_name, bank_account_name: d.bank_account_name, bank_account_number: d.bank_account_number });
    setKey(d.paystack_public_key);
  }, [q.data]);

  if (q.isLoading) return <LoadingState/>;
  if (q.error || !q.data) return <ErrorState error={q.error}/>;
  const d = q.data;

  const save = async (e: FormEvent) => {
    e.preventDefault(); setBusy(true);
    try {
      await api.put('staff/payment-settings', {
        dues_by_level: Object.fromEntries(LEVELS.map(l => [l, toKobo(dues[l] || 0)])), ...bank, paystack_public_key: key,
        super_admin_email: d.caller_is_super_admin ? undefined : email, super_admin_password: password,
      });
      toast.success('Payment settings saved.'); setPassword('');
      await client.invalidateQueries({ queryKey: ['staff'] }); await client.invalidateQueries({ queryKey: ['portal'] });
    } catch (err) { toast.error(err instanceof Error ? err.message : 'Settings could not be saved'); } finally { setBusy(false); }
  };

  return <>
    <PageTitle eyebrow="FINANCE" title="Dues and payment details" description={`NACOS dues for the ${d.session} session, bank account and Paystack. Only a super administrator's password can change them.`}/>
    <form className="form-stack" onSubmit={save}>
      <Panel title={`Dues for ${d.session} (₦)`}>
        <div className="crud-form-grid">
          {LEVELS.map(l => <label className="field" key={l}><span>{l} level</span><input inputMode="decimal" value={dues[l] ?? ''} onChange={e => setDues(v => ({ ...v, [l]: e.target.value }))} placeholder="0"/></label>)}
        </div>
        <p className="field-hint">A level set to 0 shows "Dues not set" to those members, so they cannot pay or vote until you set it. Change the session itself in Settings.</p>
      </Panel>
      <Panel title="Bank account for teller payments">
        <div className="crud-form-grid">
          <label className="field"><span>Bank name</span><input value={bank.bank_name} onChange={e => setBank(b => ({ ...b, bank_name: e.target.value }))}/></label>
          <label className="field"><span>Account name</span><input value={bank.bank_account_name} onChange={e => setBank(b => ({ ...b, bank_account_name: e.target.value }))}/></label>
          <label className="field"><span>Account number</span><input inputMode="numeric" maxLength={10} value={bank.bank_account_number} onChange={e => setBank(b => ({ ...b, bank_account_number: e.target.value.replace(/\D/g, '') }))} placeholder="10 digits"/></label>
        </div>
      </Panel>
      <Panel title="Paystack">
        <label className="field"><span>Public key</span><input value={key} onChange={e => setKey(e.target.value)} placeholder="pk_test_…" autoComplete="off" spellCheck={false}/></label>
        <div className="detail-list"><div><dt>Secret key</dt><dd>{d.paystack_secret_configured ? <span className="pill pill-ok">Configured</span> : <span className="pill pill-wait">Not set</span>}</dd></div></div>
        <p className="field-hint">The secret key is never stored here. Add it as the <b>PAYSTACK_SECRET_KEY</b> secret in your Cloudflare Pages settings. Members can pay with Paystack only when it is set.</p>
      </Panel>
      <Panel title="Confirm with a super administrator">
        <p className="field-hint"><ShieldCheck size={14}/> {d.caller_is_super_admin ? 'Enter your password to save these changes.' : 'Enter the email and password of a super administrator to save these changes.'}</p>
        <div className="crud-form-grid">
          {!d.caller_is_super_admin && <label className="field"><span>Super administrator email</span><input type="email" value={email} onChange={e => setEmail(e.target.value)} required autoComplete="off"/></label>}
          <label className="field"><span>{d.caller_is_super_admin ? 'Your password' : 'Super administrator password'}</span><input type="password" value={password} onChange={e => setPassword(e.target.value)} required autoComplete="current-password"/></label>
        </div>
      </Panel>
      <div className="row-right" style={{ justifyContent: 'flex-start' }}>
        <button className="button button-green" disabled={busy || !password}><KeyRound size={16}/> {busy ? 'Saving…' : 'Save payment settings'}</button>
        <span className="field-hint"><Wallet size={14}/> <Landmark size={14}/> Changes are recorded in the audit log.</span>
      </div>
    </form>
  </>;
}
