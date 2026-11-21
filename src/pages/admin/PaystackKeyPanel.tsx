import { useEffect, useState, type FormEvent } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import QRCode from 'qrcode';
import { toast } from 'sonner';
import { Copy, Download, KeyRound, ShieldCheck, Smartphone, Trash2 } from 'lucide-react';
import { api } from '../../lib/api';
import { LoadingState } from '../../components/States';
import { Panel, Pill } from '../../components/Workspace';

export interface KeyStatus { source: 'database' | 'environment' | 'none'; last4: string | null; updated_at: string | null; encryption_ready: boolean; caller_is_super_admin: boolean; two_factor_enabled: boolean }
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

/** Secret key fields shown inside the main payment settings form, so one Save button covers everything. */
export function PaystackSecretFields({ status, secret, setSecret, code, setCode, password }: { status: KeyStatus; secret: string; setSecret: (v: string) => void; code: string; setCode: (v: string) => void; password: string }) {
  const client = useQueryClient();
  const remove = useMutation({
    mutationFn: () => api.delete('staff/paystack-key', { password, code }),
    onSuccess: async () => { toast.success('Saved key removed'); setCode(''); await client.invalidateQueries({ queryKey: ['staff'] }); },
    onError: e => toast.error(message(e, 'Could not remove the key')),
  });
  const locked = !status.caller_is_super_admin || !status.two_factor_enabled || !status.encryption_ready;
  return <div className="pk-fields">
    <div className="pk-state">{status.source === 'database' ? <Pill value="active"/> : status.source === 'environment' ? <Pill value="pending"/> : <Pill value="unpaid"/>}<span>{status.source === 'database' ? `Secret key saved, ending in ${status.last4}. Stored encrypted.` : status.source === 'environment' ? 'Secret key comes from the Cloudflare secret. Save one here to replace it.' : 'Secret key not set. Members cannot pay online until it is.'}</span></div>
    {!status.encryption_ready && <p className="pk-warn">The server is missing its encryption key (SETTINGS_ENCRYPTION_KEY), so a key cannot be stored here yet.</p>}
    {!status.caller_is_super_admin ? <p className="field-hint">Only a super administrator can change the secret key.</p>
      : !status.two_factor_enabled ? <p className="field-hint">Turn on Google 2FA in the Security panel below first. It is needed to change the secret key.</p> : null}
    <label className="field"><span>Secret key (leave empty to keep the current one)</span><input type="password" value={secret} onChange={e => setSecret(e.target.value)} placeholder="sk_test_… or sk_live_…" autoComplete="off" spellCheck={false} disabled={locked}/></label>
    {(secret || status.source === 'database') && !locked && <label className="field"><span>Authenticator code {secret ? '(required to save the key)' : '(needed to remove it)'}</span><input value={code} onChange={e => setCode(e.target.value)} autoComplete="one-time-code" placeholder="6-digit or backup code" inputMode="numeric"/></label>}
    {status.source === 'database' && !locked && <button type="button" className="button button-outline btn-sm" disabled={!password || !code || remove.isPending} onClick={() => { if (window.confirm('Remove the saved Paystack secret key? Payments fall back to the Cloudflare secret, if one is set.')) remove.mutate(); }}><Trash2 size={14}/> Remove saved key</button>}
    <p className="field-hint">The key is encrypted before it is stored and never shown again, only its last four characters. Enter your password in the box below to confirm.</p>
  </div>;
}

/** One-time security setup for the super administrator. */
export function SecurityPanel({ status }: { status: KeyStatus }) {
  const twoFactor = useQuery({ queryKey: ['staff', 'two-factor'], queryFn: ({ signal }) => api.get<TwoFactor>('staff/two-factor', signal), retry: false, enabled: status.caller_is_super_admin });
  if (!status.caller_is_super_admin) return null;
  return <Panel title="Security: Google 2FA" action={<KeyRound size={18}/>}>
    {twoFactor.isLoading || !twoFactor.data ? <LoadingState/> : <TwoFactorSetup status={twoFactor.data}/>}
  </Panel>;
}
