import { useEffect, useState, type FormEvent } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import QRCode from 'qrcode';
import { toast } from 'sonner';
import { Copy, Download, KeyRound, ShieldCheck, Smartphone, Trash2 } from 'lucide-react';
import { api } from '../../lib/api';
import { LoadingState } from '../../components/States';
import { Panel, Pill } from '../../components/Workspace';

interface KeyStatus { source: 'database' | 'environment' | 'none'; last4: string | null; updated_at: string | null; encryption_ready: boolean; caller_is_super_admin: boolean; two_factor_enabled: boolean }
interface TwoFactor { enabled: boolean; pending: boolean; backup_codes_left: number; encryption_ready: boolean }
const message = (e: unknown, fallback: string) => (e instanceof Error ? e.message : fallback);

function TwoFactorSetup({ status }: { status: TwoFactor }) {
  const client = useQueryClient();
  const [password, setPassword] = useState(''); const [code, setCode] = useState('');
  const [setup, setSetup] = useState<{ secret: string; otpauth: string } | null>(null); const [qr, setQr] = useState('');
  const [codes, setCodes] = useState<string[] | null>(null);
  useEffect(() => { if (setup) void QRCode.toDataURL(setup.otpauth, { margin: 1, width: 200 }).then(setQr); }, [setup]);
  const refresh = async () => { await client.invalidateQueries({ queryKey: ['staff'] }); };
  const begin = useMutation({ mutationFn: () => api.post<{ secret: string; otpauth: string }>('staff/two-factor', { action: 'begin', password }), onSuccess: r => { setSetup(r); setPassword(''); }, onError: e => toast.error(message(e, 'Could not start setup')) });
  const confirm = useMutation({ mutationFn: () => api.post<{ backup_codes: string[] }>('staff/two-factor', { action: 'confirm', code }), onSuccess: async r => { setCodes(r.backup_codes); setSetup(null); setCode(''); toast.success('Google 2FA is on'); await refresh(); }, onError: e => toast.error(message(e, 'That code did not work')) });
  const disable = useMutation({ mutationFn: () => api.post('staff/two-factor', { action: 'disable', password, code }), onSuccess: async () => { toast.success('Google 2FA is off'); setPassword(''); setCode(''); await refresh(); }, onError: e => toast.error(message(e, 'Could not turn it off')) });
  const copy = async () => { await navigator.clipboard.writeText((codes ?? []).join('\n')); toast.success('Backup codes copied'); };
  const download = () => { const url = URL.createObjectURL(new Blob([`NACOS MOUAU backup codes\nEach code works once.\n\n${(codes ?? []).join('\n')}\n`], { type: 'text/plain' })); const a = document.createElement('a'); a.href = url; a.download = 'nacos-backup-codes.txt'; a.click(); URL.revokeObjectURL(url); };

  if (codes) return <div className="pk-codes"><b>Save these backup codes now</b><p>Each works once if you lose your phone. They will not be shown again.</p><ul>{codes.map(c => <li key={c}>{c}</li>)}</ul><div className="pk-row"><button type="button" className="button button-outline btn-sm" onClick={() => void copy()}><Copy size={14}/> Copy</button><button type="button" className="button button-outline btn-sm" onClick={download}><Download size={14}/> Download</button><button type="button" className="button button-green btn-sm" onClick={() => setCodes(null)}>I have saved them</button></div></div>;
  if (status.enabled) return <form className="form-stack" onSubmit={(e: FormEvent) => { e.preventDefault(); disable.mutate(); }}>
    <div className="pk-state"><Pill value="active"/><span>Google 2FA is on. {status.backup_codes_left} backup code{status.backup_codes_left === 1 ? '' : 's'} left.</span></div>
    <details className="pk-off"><summary>Turn off 2FA</summary><div className="crud-form-grid"><label className="field"><span>Your password</span><input type="password" value={password} onChange={e => setPassword(e.target.value)} autoComplete="current-password"/></label><label className="field"><span>Authenticator or backup code</span><input value={code} onChange={e => setCode(e.target.value)} autoComplete="one-time-code"/></label></div><button className="button button-outline btn-sm" disabled={disable.isPending || !password || !code}>Turn off</button></details>
  </form>;
  if (setup) return <form className="pk-setup" onSubmit={(e: FormEvent) => { e.preventDefault(); confirm.mutate(); }}>
    <ol><li>Open <b>Google Authenticator</b> on your phone and add an account by scanning this code.</li></ol>
    {qr && <img className="pk-qr" src={qr} alt="Scan with Google Authenticator" width={200} height={200}/>}
    <p className="field-hint">Cannot scan? Enter this key by hand: <code>{setup.secret}</code></p>
    <label className="field"><span>Enter the 6-digit code from the app</span><input inputMode="numeric" maxLength={6} value={code} onChange={e => setCode(e.target.value.replace(/\D/g, ''))} autoComplete="one-time-code" placeholder="000000"/></label>
    <button className="button button-green" disabled={confirm.isPending || code.length !== 6}><ShieldCheck size={15}/> {confirm.isPending ? 'Checking…' : 'Turn on 2FA'}</button>
  </form>;
  return <form className="form-stack" onSubmit={(e: FormEvent) => { e.preventDefault(); begin.mutate(); }}>
    <div className="pk-state"><Pill value="pending"/><span>Google 2FA is not set up. It is required to change the secret key.</span></div>
    <label className="field"><span>Your password</span><input type="password" value={password} onChange={e => setPassword(e.target.value)} autoComplete="current-password"/></label>
    <div><button className="button button-outline" disabled={begin.isPending || !password}><Smartphone size={15}/> {begin.isPending ? 'Starting…' : 'Set up Google Authenticator'}</button></div>
  </form>;
}

export function PaystackKeyPanel() {
  const client = useQueryClient();
  const status = useQuery({ queryKey: ['staff', 'paystack-key'], queryFn: ({ signal }) => api.get<KeyStatus>('staff/paystack-key', signal), retry: false });
  const twoFactor = useQuery({ queryKey: ['staff', 'two-factor'], queryFn: ({ signal }) => api.get<TwoFactor>('staff/two-factor', signal), retry: false, enabled: Boolean(status.data?.caller_is_super_admin) });
  const [secret, setSecret] = useState(''); const [password, setPassword] = useState(''); const [code, setCode] = useState('');
  const done = async () => { setSecret(''); setPassword(''); setCode(''); await client.invalidateQueries({ queryKey: ['staff'] }); };
  const save = useMutation({ mutationFn: () => api.put('staff/paystack-key', { secret_key: secret, password, code }), onSuccess: async () => { toast.success('Paystack secret key saved'); await done(); }, onError: e => toast.error(message(e, 'Could not save the key')) });
  const remove = useMutation({ mutationFn: () => api.delete('staff/paystack-key', { password, code }), onSuccess: async () => { toast.success('Saved key removed'); await done(); }, onError: e => toast.error(message(e, 'Could not remove the key')) });
  if (status.isLoading) return <LoadingState/>;
  const s = status.data; if (!s) return null;
  const removeWith = () => { if (window.confirm('Remove the saved Paystack secret key? Payments fall back to the Cloudflare secret, if one is set.')) remove.mutate(); };
  return <Panel title="Paystack secret key" action={<KeyRound size={18}/>}>
    <div className="pk-state">{s.source === 'database' ? <Pill value="active"/> : s.source === 'environment' ? <Pill value="pending"/> : <Pill value="unpaid"/>}<span>{s.source === 'database' ? `Saved here, ending in ${s.last4}. Stored encrypted.` : s.source === 'environment' ? 'Using the PAYSTACK_SECRET_KEY secret from Cloudflare. Save a key here to replace it.' : 'Not set. Members cannot pay online until it is.'}</span></div>
    {!s.encryption_ready && <p className="pk-warn">The server is missing its encryption key (SETTINGS_ENCRYPTION_KEY), so a key cannot be stored here yet.</p>}
    {!s.caller_is_super_admin ? <p className="field-hint">Only a super administrator can change the secret key.</p> : <>
      <h3 className="pk-h">Step 1: Google 2FA</h3>
      {twoFactor.isLoading || !twoFactor.data ? <LoadingState/> : <TwoFactorSetup status={twoFactor.data}/>}
      <h3 className="pk-h">Step 2: Save the key</h3>
      <form className="form-stack" onSubmit={(e: FormEvent) => { e.preventDefault(); save.mutate(); }}>
        <label className="field"><span>Secret key</span><input type="password" value={secret} onChange={e => setSecret(e.target.value)} placeholder="sk_test_… or sk_live_…" autoComplete="off" spellCheck={false} disabled={!s.two_factor_enabled}/></label>
        <div className="crud-form-grid">
          <label className="field"><span>Your password</span><input type="password" value={password} onChange={e => setPassword(e.target.value)} autoComplete="current-password" disabled={!s.two_factor_enabled}/></label>
          <label className="field"><span>Authenticator code</span><input value={code} onChange={e => setCode(e.target.value)} autoComplete="one-time-code" placeholder="6-digit or backup code" disabled={!s.two_factor_enabled}/></label>
        </div>
        <div className="pk-row"><button className="button button-green" disabled={save.isPending || !s.two_factor_enabled || !secret || !password || !code || !s.encryption_ready}><ShieldCheck size={15}/> {save.isPending ? 'Saving…' : 'Save secret key'}</button>
          {s.source === 'database' && <button type="button" className="button button-outline" disabled={!password || !code} onClick={removeWith}><Trash2 size={14}/> Remove saved key</button>}</div>
        <p className="field-hint">The key is encrypted before it is stored and is never shown again, only its last four characters. Every save is recorded in the audit log.</p>
      </form>
    </>}
  </Panel>;
}
