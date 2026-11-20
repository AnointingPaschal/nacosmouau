import { useEffect, useState, type FormEvent } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { api } from '../../lib/api';
import { fromKobo, toKobo } from '../../lib/money';
import { ErrorState, LoadingState } from '../../components/States';
import { FileUpload } from '../../components/FileUpload';
import { PageTitle, Panel } from '../../components/Workspace';

type S = Record<string, unknown>;
export function AdminSettings() {
  const client = useQueryClient();
  const q = useQuery({ queryKey: ['settings', 'admin'], queryFn: ({ signal }) => api.get<S>('settings', signal), retry: false });
  const [f, setF] = useState<S>({}); const [dues, setDues] = useState('0'); const [busy, setBusy] = useState(false);
  useEffect(() => { if (q.data) { setF({ ...q.data }); setDues(fromKobo(Number(q.data.dues_amount_minor ?? 0))); } }, [q.data]);
  if (q.isLoading) return <LoadingState/>;
  if (q.error) return <ErrorState error={q.error}/>;
  const set = (k: string) => (e: { target: { value: string } }) => setF(v => ({ ...v, [k]: e.target.value }));
  const save = async (e: FormEvent) => {
    e.preventDefault(); setBusy(true);
    try {
      const keys = ['chapter_name', 'institution_name', 'academic_session', 'contact_email', 'contact_phone', 'address', 'bank_name', 'bank_account_name', 'bank_account_number'];
      const body: S = Object.fromEntries(keys.map(k => [k, String(f[k] ?? '')])); body.dues_amount_minor = toKobo(dues || 0); body.logo_url = f.logo_url ?? null; body.registration_open = Boolean(f.registration_open);
      await api.put('settings', body); toast.success('Settings saved. The new session now applies across the whole site.');
      await client.invalidateQueries({ queryKey: ['settings'] }); await client.invalidateQueries({ queryKey: ['portal'] });
    } catch (err) { toast.error(err instanceof Error ? err.message : 'Settings could not be saved'); } finally { setBusy(false); }
  };
  const input = (label: string, k: string, extra: Record<string, unknown> = {}) => <label className="field"><span>{label}</span><input value={String(f[k] ?? '')} onChange={set(k)} {...extra}/></label>;
  return <>
    <PageTitle eyebrow="CONFIGURATION" title="Settings" description="The current session, dues and bank details drive the whole site."/>
    <form className="form-stack" onSubmit={save}>
      <Panel title="Current session"><div className="crud-form-grid">{input('Academic session', 'academic_session', { placeholder: '2025/2026', pattern: '\\d{4}/\\d{4}', required: true })}<label className="field"><span>NACOS dues for this session (₦)</span><input type="number" min="0" step="100" value={dues} onChange={e => setDues(e.target.value)}/></label></div><p className="form-note">Changing the session updates the site, registration, dues, elections and Digital IDs. Members pay dues again for each new session.</p></Panel>
      <Panel title="Bank account for teller payments"><div className="crud-form-grid">{input('Bank name', 'bank_name')}{input('Account name', 'bank_account_name')}{input('Account number', 'bank_account_number', { inputMode: 'numeric', maxLength: 20 })}</div></Panel>
      <Panel title="Association"><div className="crud-form-grid">{input('Association name', 'chapter_name')}{input('Institution', 'institution_name')}{input('Contact email', 'contact_email', { type: 'email' })}{input('Contact phone', 'contact_phone')}<label className="field"><span>Campus address</span><textarea rows={2} value={String(f.address ?? '')} onChange={set('address')}/></label><div className="field"><span>Association logo</span><FileUpload value={String(f.logo_url ?? '')} accept="image/jpeg,image/png,image/webp" label="Upload association logo" onChange={file => setF(v => ({ ...v, logo_url: file?.url ?? null }))}/></div></div>
        <label className="check-field"><input type="checkbox" checked={Boolean(f.registration_open)} onChange={e => setF(v => ({ ...v, registration_open: e.target.checked }))}/> Accept member registrations</label></Panel>
      <div><button className="button button-green" disabled={busy}>{busy ? 'Saving…' : 'Save settings'}</button></div>
    </form>
  </>;
}
