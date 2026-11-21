import { useEffect, useState, type FormEvent } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { KeyRound, Landmark, ShieldCheck, Wallet } from 'lucide-react';
import { toast } from 'sonner';
import { api } from '../../lib/api';
import { ErrorState, LoadingState } from '../../components/States';
import { PageTitle, Panel } from '../../components/Workspace';
import { PaystackSecretFields, SecurityPanel, type KeyStatus } from './PaystackKeyPanel';

interface Data {
  session: string; dues_by_level: Record<string, number>; dues_explicit: string[];
  bank_name: string; bank_account_name: string; bank_account_number: string;
  paystack_public_key: string; paystack_secret_configured: boolean; caller_is_super_admin: boolean;
}

export function AdminPaymentSettings() {
  const client = useQueryClient();
  const q = useQuery({ queryKey: ['staff', 'payment-settings'], queryFn: ({ signal }) => api.get<Data>('staff/payment-settings', signal), retry: false });
  const [bank, setBank] = useState({ bank_name: '', bank_account_name: '', bank_account_number: '' });
  const [key, setKey] = useState('');
  const [secret, setSecret] = useState(''); const [code, setCode] = useState('');
  const keyStatus = useQuery({ queryKey: ['staff', 'paystack-key'], queryFn: ({ signal }) => api.get<KeyStatus>('staff/paystack-key', signal), retry: false });
  const [email, setEmail] = useState(''); const [password, setPassword] = useState(''); const [busy, setBusy] = useState(false);

  useEffect(() => {
    const d = q.data; if (!d) return;
    setBank({ bank_name: d.bank_name, bank_account_name: d.bank_account_name, bank_account_number: d.bank_account_number });
    setKey(d.paystack_public_key);
  }, [q.data]);

  if (q.isLoading) return <LoadingState/>;
  if (q.error || !q.data) return <ErrorState error={q.error}/>;
  const d = q.data;

  const save = async (e: FormEvent) => {
    e.preventDefault(); setBusy(true);
    try {
      if (secret) await api.put('staff/paystack-key', { secret_key: secret, password, code });
      await api.put('staff/payment-settings', {
        ...bank, paystack_public_key: key,
        super_admin_email: d.caller_is_super_admin ? undefined : email, super_admin_password: password,
      });
      toast.success(secret ? 'Payment settings and secret key saved.' : 'Payment settings saved.'); setPassword(''); setSecret(''); setCode('');
      await client.invalidateQueries({ queryKey: ['staff'] }); await client.invalidateQueries({ queryKey: ['portal'] });
    } catch (err) { toast.error(err instanceof Error ? err.message : 'Settings could not be saved'); } finally { setBusy(false); }
  };

  return <>
    <PageTitle eyebrow="FINANCE" title="Payment details" description="The bank account members pay tellers into, and your Paystack keys. Dues amounts are set on the Dues page. Only a super administrator's password can change these."/>
    <form className="form-stack" onSubmit={save}>
      <Panel title="Bank account for teller payments">
        <div className="crud-form-grid">
          <label className="field"><span>Bank name</span><input value={bank.bank_name} onChange={e => setBank(b => ({ ...b, bank_name: e.target.value }))}/></label>
          <label className="field"><span>Account name</span><input value={bank.bank_account_name} onChange={e => setBank(b => ({ ...b, bank_account_name: e.target.value }))}/></label>
          <label className="field"><span>Account number</span><input inputMode="numeric" maxLength={10} value={bank.bank_account_number} onChange={e => setBank(b => ({ ...b, bank_account_number: e.target.value.replace(/\D/g, '') }))} placeholder="10 digits"/></label>
        </div>
      </Panel>
      <Panel title="Paystack">
        <label className="field"><span>Public key</span><input value={key} onChange={e => setKey(e.target.value)} placeholder="pk_test_…" autoComplete="off" spellCheck={false}/></label>
        {keyStatus.data && <PaystackSecretFields status={keyStatus.data} secret={secret} setSecret={setSecret} code={code} setCode={setCode} password={password}/>}
      </Panel>
      <Panel title="Confirm with a super administrator">
        <p className="field-hint"><ShieldCheck size={14}/> {d.caller_is_super_admin ? 'Enter your password to save these changes.' : 'Enter the email and password of a super administrator to save these changes.'}</p>
        <div className="crud-form-grid">
          {!d.caller_is_super_admin && <label className="field"><span>Super administrator email</span><input type="email" value={email} onChange={e => setEmail(e.target.value)} required autoComplete="off"/></label>}
          <label className="field"><span>{d.caller_is_super_admin ? 'Your password' : 'Super administrator password'}</span><input type="password" value={password} onChange={e => setPassword(e.target.value)} required autoComplete="current-password"/></label>
        </div>
      </Panel>
      <div className="row-right" style={{ justifyContent: 'flex-start' }}>
        <button className="button button-green" disabled={busy || !password || Boolean(secret && !code)}><KeyRound size={16}/> {busy ? 'Saving…' : 'Save payment settings'}</button>
        <span className="field-hint"><Wallet size={14}/> <Landmark size={14}/> Changes are recorded in the audit log.</span>
      </div>
    </form>
    {keyStatus.data && <SecurityPanel status={keyStatus.data}/>}
  </>;
}
