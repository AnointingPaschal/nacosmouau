import { useEffect, useState, type FormEvent } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { api } from '../../lib/api';
import { ErrorState, LoadingState } from '../../components/States';
import { FileUpload } from '../../components/FileUpload';
import { PageTitle, Panel } from '../../components/Workspace';

type S = Record<string, unknown>;
export function AdminSettings() {
  const client = useQueryClient();
  const q = useQuery({ queryKey: ['settings', 'admin'], queryFn: ({ signal }) => api.get<S>('settings', signal), retry: false });
  const [f, setF] = useState<S>({}); const [busy, setBusy] = useState(false);
  useEffect(() => { if (q.data) { setF({ ...q.data }); } }, [q.data]);
  if (q.isLoading) return <LoadingState/>;
  if (q.error) return <ErrorState error={q.error}/>;
  const set = (k: string) => (e: { target: { value: string } }) => setF(v => ({ ...v, [k]: e.target.value }));
  const save = async (e: FormEvent) => {
    e.preventDefault(); setBusy(true);
    try {
      const keys = ['chapter_name', 'institution_name', 'academic_session', 'contact_email', 'contact_phone', 'address'];
      const body: S = Object.fromEntries(keys.map(k => [k, String(f[k] ?? '')])); body.logo_url = f.logo_url ?? null; body.secondary_logo_url = f.secondary_logo_url ?? null; body.registration_open = Boolean(f.registration_open);
      await api.put('settings', body); toast.success('Settings saved. The new session now applies across the whole site.');
      await client.invalidateQueries({ queryKey: ['settings'] }); await client.invalidateQueries({ queryKey: ['portal'] });
    } catch (err) { toast.error(err instanceof Error ? err.message : 'Settings could not be saved'); } finally { setBusy(false); }
  };
  const input = (label: string, k: string, extra: Record<string, unknown> = {}) => <label className="field"><span>{label}</span><input value={String(f[k] ?? '')} onChange={set(k)} {...extra}/></label>;
  return <>
    <PageTitle eyebrow="CONFIGURATION" title="Settings" description="The current session and association details drive the whole site. Dues, bank and Paystack are under Dues & payment details."/>
    <form className="form-stack" onSubmit={save}>
      <Panel title="Current session"><div className="crud-form-grid">{input('Academic session', 'academic_session', { placeholder: '2025/2026', pattern: '[0-9]{4}/[0-9]{4}', required: true })}</div><p className="field-hint">Changing the session updates the site, registration, dues, elections and Digital IDs. Members pay dues again for each new session.</p></Panel>
      <Panel title="Association"><div className="crud-form-grid">{input('Association name', 'chapter_name')}{input('Institution', 'institution_name')}{input('Contact email', 'contact_email', { type: 'email' })}{input('Contact phone', 'contact_phone')}<label className="field"><span>Campus address</span><textarea rows={2} value={String(f.address ?? '')} onChange={set('address')}/></label><div className="field"><span>MOUAU logo (shown beside the NACOS logo)</span><FileUpload value={String(f.secondary_logo_url ?? '')} accept="image/jpeg,image/png,image/webp" label="Upload MOUAU logo" onChange={file => setF(v => ({ ...v, secondary_logo_url: file?.url ?? null }))}/></div><div className="field"><span>NACOS logo</span><FileUpload value={String(f.logo_url ?? '')} accept="image/jpeg,image/png,image/webp" label="Upload association logo" onChange={file => setF(v => ({ ...v, logo_url: file?.url ?? null }))}/></div></div>
        <label className="check-field"><input type="checkbox" checked={Boolean(f.registration_open)} onChange={e => setF(v => ({ ...v, registration_open: e.target.checked }))}/> Accept member registrations</label></Panel>
      <div><button className="button button-green" disabled={busy}>{busy ? 'Saving…' : 'Save settings'}</button></div>
    </form>
  </>;
}
