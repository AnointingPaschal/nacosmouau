import { useState, type FormEvent } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, ArrowRight, Check, Plus, Trash2, Vote, X } from 'lucide-react';
import { toast } from 'sonner';
import { api } from '../../lib/api';
import { fromKobo, naira, toKobo, when } from '../../lib/money';
import { EmptyState, ErrorState, LoadingState } from '../../components/States';
import { FileUpload } from '../../components/FileUpload';
import { PageTitle, Panel, Pill, Stat } from '../../components/Workspace';

interface Row { id: string; title: string; status: string; opens_at: string | null; closes_at: string | null; form_fee_minor: number; positions: number; candidates: number; eligible: number; votes: number }
const toLocal = (iso?: string | null) => (iso ? iso.slice(0, 16) : '');
const toIso = (local: string) => (local ? new Date(local).toISOString() : '');

export function AdminElections() {
  const { id } = useParams(); const client = useQueryClient(); const navigate = useNavigate();
  const q = useQuery({ queryKey: ['staff', 'elections'], queryFn: ({ signal }) => api.get<Row[]>('staff/elections', signal), retry: false, enabled: !id });
  const [open, setOpen] = useState(false); const [f, setF] = useState({ title: '', description: '', fee: '0', opens: '', closes: '' });
  if (id) return <ElectionDetail id={id}/>;
  const create = async (e: FormEvent) => {
    e.preventDefault();
    try { const r = await api.post<{ id: string }>('staff/elections', { title: f.title, description: f.description, form_fee_minor: toKobo(f.fee || 0), opens_at: toIso(f.opens), closes_at: toIso(f.closes) }); toast.success('Election created'); setOpen(false); await client.invalidateQueries({ queryKey: ['staff', 'elections'] }); navigate(`/admin/elections/${r.id}`); }
    catch (err) { toast.error(err instanceof Error ? err.message : 'Could not create the election'); }
  };
  return <>
    <PageTitle eyebrow="ELECTIONS" title="Elections" description="Create an election, add contestants, screen them, then open voting." action={<button className="button button-green" onClick={() => setOpen(true)}><Plus size={16}/> New election</button>}/>
    {q.isLoading ? <LoadingState/> : q.error ? <ErrorState error={q.error}/> : !q.data?.length ? <Panel><EmptyState title="No elections yet" text="Create the first election to start adding contestants." icon={<Vote size={22}/>}/></Panel> :
      <div className="election-grid">{q.data.map(e => <Panel key={e.id} className="election-card">
        <div className="election-top"><div><h2>{e.title}</h2><small>{when(e.opens_at)} to {when(e.closes_at)}</small></div><Pill value={e.status}/></div>
        <div className="mini-stats"><span><b>{e.positions}</b> positions</span><span><b>{e.candidates}</b> contestants</span><span><b>{e.eligible}</b> eligible</span><span><b>{e.votes}</b> votes</span></div>
        <div className="election-actions"><span className="form-note">Form fee {naira(e.form_fee_minor)}</span><Link className="text-action" to={`/admin/elections/${e.id}`}>Manage <ArrowRight size={14}/></Link></div>
      </Panel>)}</div>}
    {open && <div className="modal-scrim" role="presentation" onMouseDown={ev => { if (ev.target === ev.currentTarget) setOpen(false); }}><section className="workspace-panel crud-modal" role="dialog" aria-modal="true"><header><div><span className="eyebrow-green">NEW ELECTION</span><h2>Create election</h2></div><button className="icon-button" onClick={() => setOpen(false)} aria-label="Close"><X size={18}/></button></header>
      <form className="form-stack" onSubmit={create}>
        <label className="field"><span>Title</span><input value={f.title} onChange={e => setF(v => ({ ...v, title: e.target.value }))} placeholder="2026/2027 NACOS General Election" required minLength={3}/></label>
        <label className="field"><span>Description</span><textarea rows={3} value={f.description} onChange={e => setF(v => ({ ...v, description: e.target.value }))}/></label>
        <div className="crud-form-grid"><label className="field"><span>Voting opens</span><input type="datetime-local" value={f.opens} onChange={e => setF(v => ({ ...v, opens: e.target.value }))}/></label><label className="field"><span>Voting closes</span><input type="datetime-local" value={f.closes} onChange={e => setF(v => ({ ...v, closes: e.target.value }))}/></label></div>
        <label className="field"><span>Candidate form fee (naira, 0 for free)</span><input type="number" min="0" step="100" value={f.fee} onChange={e => setF(v => ({ ...v, fee: e.target.value }))}/></label>
        <footer><button type="button" className="button button-outline" onClick={() => setOpen(false)}>Cancel</button><button className="button button-green">Create election</button></footer>
      </form></section></div>}
  </>;
}

interface Cand { id: string; position_id: string; display_name: string; manifesto: string; photo_url: string | null; status: string; screening_note: string | null; matric_number: string | null; academic_level: string | null; payment_status: string | null }
interface Detail { election: { id: string; title: string; description: string | null; status: string; opens_at: string | null; closes_at: string | null; form_fee_minor: number }; positions: Array<{ id: string; title: string }>; candidates: Cand[] }
const NEXT: Record<string, { to: string; label: string }> = { draft: { to: 'nominations', label: 'Open nominations' }, nominations: { to: 'voting', label: 'Open voting' }, voting: { to: 'closed', label: 'Close election' } };

function ElectionDetail({ id }: { id: string }) {
  const client = useQueryClient();
  const q = useQuery({ queryKey: ['staff', 'elections', id], queryFn: ({ signal }) => api.get<Detail>(`staff/elections/${id}`, signal), retry: false });
  const results = useQuery({ queryKey: ['staff', 'elections', id, 'results'], queryFn: ({ signal }) => api.get<{ turnout: number; positions: Array<{ id: string; title: string; candidates: Array<{ id: string; display_name: string; votes: number }> }> }>(`staff/elections/${id}/results`, signal), retry: false, enabled: q.data?.election.status === 'voting' || q.data?.election.status === 'closed' });
  const [pos, setPos] = useState(''); const [c, setC] = useState({ position_id: '', matric_number: '', manifesto: '', photo: '' }); const [busy, setBusy] = useState(false);
  const refresh = () => client.invalidateQueries({ queryKey: ['staff', 'elections'] });
  if (q.isLoading) return <LoadingState/>;
  if (q.error || !q.data) return <ErrorState error={q.error}/>;
  const { election, positions, candidates } = q.data; const locked = election.status === 'voting' || election.status === 'closed'; const next = NEXT[election.status];
  const run = async (fn: () => Promise<unknown>, ok: string) => { try { await fn(); toast.success(ok); await refresh(); } catch (e) { toast.error(e instanceof Error ? e.message : 'That did not work'); } };
  const addCandidate = async (e: FormEvent) => { e.preventDefault(); setBusy(true); await run(() => api.post(`staff/elections/${id}/candidates`, { position_id: c.position_id || positions[0]?.id, matric_number: c.matric_number, manifesto: c.manifesto, photo_url: c.photo || undefined }), 'Contestant added'); setC(v => ({ ...v, matric_number: '', manifesto: '', photo: '' })); setBusy(false); };
  return <>
    <PageTitle eyebrow="ELECTION" title={election.title} description={election.description ?? undefined} action={<Link className="text-action" to="/admin/elections"><ArrowLeft size={14}/> All elections</Link>}/>
    <div className="count-grid">
      <Stat label="Status" value={<Pill value={election.status}/>}/><Stat label="Form fee" value={naira(election.form_fee_minor)}/><Stat label="Contestants" value={candidates.length}/><Stat label="Eligible" value={candidates.filter(x => x.status === 'eligible').length}/>
    </div>
    <Panel title="Election controls">
      <div className="controls-row">
        {next && <button className="button button-green" onClick={() => { if (next.to === 'closed' && !window.confirm('Close this election? Voting will stop and results will be published to members.')) return; void run(() => api.patch(`staff/elections/${id}`, { status: next.to }), `Election ${next.to === 'closed' ? 'closed' : 'moved to ' + next.to}`); }}>{next.label}</button>}
        {election.status === 'nominations' && <button className="button button-outline" onClick={() => void run(() => api.patch(`staff/elections/${id}`, { status: 'draft' }), 'Moved back to draft')}>Back to draft</button>}
        <label className="inline-field"><span>Opens</span><input type="datetime-local" defaultValue={toLocal(election.opens_at)} disabled={election.status === 'closed'} onBlur={e => { if (e.target.value && toIso(e.target.value) !== election.opens_at) void run(() => api.patch(`staff/elections/${id}`, { opens_at: toIso(e.target.value) }), 'Opening time saved'); }}/></label>
        <label className="inline-field"><span>Closes</span><input type="datetime-local" defaultValue={toLocal(election.closes_at)} disabled={election.status === 'closed'} onBlur={e => { if (e.target.value && toIso(e.target.value) !== election.closes_at) void run(() => api.patch(`staff/elections/${id}`, { closes_at: toIso(e.target.value) }), 'Closing time saved'); }}/></label>
        <label className="inline-field"><span>Form fee (₦)</span><input type="number" min="0" defaultValue={fromKobo(election.form_fee_minor)} disabled={locked} onBlur={e => { if (toKobo(e.target.value || 0) !== election.form_fee_minor) void run(() => api.patch(`staff/elections/${id}`, { form_fee_minor: toKobo(e.target.value || 0) }), 'Form fee saved'); }}/></label>
      </div>
      <p className="form-note">Voting is only open between the opening and closing times, and only members who have paid this session's NACOS dues can vote.</p>
    </Panel>
    <div className="pay-layout">
      <Panel title="Positions">
        <div className="chips big">{positions.map(p => <i key={p.id}>{p.title}{!locked && <button aria-label={`Remove ${p.title}`} onClick={() => { if (window.confirm(`Remove ${p.title} and its contestants?`)) void run(() => api.delete(`staff/elections/${id}/positions/${p.id}`), 'Position removed'); }}><X size={12}/></button>}</i>)}{positions.length === 0 && <span className="form-note">Add the posts members will vote for.</span>}</div>
        {!locked && <form className="inline-form" onSubmit={e => { e.preventDefault(); void run(() => api.post(`staff/elections/${id}/positions`, { title: pos }), 'Position added'); setPos(''); }}><input value={pos} onChange={e => setPos(e.target.value)} placeholder="e.g. President" required minLength={2}/><button className="button button-green btn-sm"><Plus size={14}/> Add</button></form>}
      </Panel>
      {!locked && <Panel title="Add a contestant">
        <form className="form-stack" onSubmit={addCandidate}>
          <label className="field"><span>Position</span><select value={c.position_id || positions[0]?.id || ''} onChange={e => setC(v => ({ ...v, position_id: e.target.value }))} required>{positions.map(p => <option key={p.id} value={p.id}>{p.title}</option>)}</select></label>
          <label className="field"><span>Member's matric or reg. number</span><input value={c.matric_number} onChange={e => setC(v => ({ ...v, matric_number: e.target.value }))} placeholder="26/103328 or MOUAU/CMP/26/103328" required/></label>
          <label className="field"><span>Manifesto (optional)</span><textarea rows={3} value={c.manifesto} onChange={e => setC(v => ({ ...v, manifesto: e.target.value }))}/></label>
          <div className="field"><span>Photo (optional)</span><FileUpload value={c.photo} accept="image/jpeg,image/png,image/webp" label="Upload contestant photo" onChange={f => setC(v => ({ ...v, photo: f?.url ?? '' }))}/></div>
          <button className="button button-green" disabled={busy || positions.length === 0}>{election.form_fee_minor > 0 ? 'Add contestant (they pay the form fee)' : 'Add contestant'}</button>
        </form>
      </Panel>}
    </div>
    <Panel title="Contestants and screening">
      {candidates.length === 0 ? <EmptyState title="No contestants yet" text="Add contestants above. They will see the form to pay in their portal." icon={<Vote size={22}/>}/> :
        positions.map(p => { const list = candidates.filter(x => x.position_id === p.id); return list.length === 0 ? null : <div key={p.id} className="position-block"><h3>{p.title}</h3><div className="record-list">{list.map(x => <article className="member-row" key={x.id}>
          <div className="member-info"><strong>{x.display_name}</strong><span className="mono">{x.matric_number ?? '—'}{x.academic_level ? ` · ${x.academic_level}L` : ''}</span><span>Form: {election.form_fee_minor > 0 ? (x.payment_status === 'successful' ? 'Paid' : x.payment_status === 'pending' ? 'Teller awaiting approval' : 'Not paid') : 'No fee'}</span>{x.screening_note && <span>Note: {x.screening_note}</span>}</div>
          <div className="member-actions"><Pill value={x.status}/>
            {!locked && x.status !== 'eligible' && <button className="button button-green btn-sm" onClick={() => void run(() => api.patch(`staff/elections/${id}/candidates/${x.id}`, { status: 'eligible' }), 'Marked eligible')}><Check size={14}/> Eligible</button>}
            {!locked && x.status !== 'rejected' && <button className="button button-outline btn-sm" onClick={() => { const note = window.prompt('Reason for rejecting this contestant (shown to them):'); if (note) void run(() => api.patch(`staff/elections/${id}/candidates/${x.id}`, { status: 'rejected', note }), 'Contestant rejected'); }}><X size={14}/> Reject</button>}
            {!locked && <button className="icon-button" aria-label={`Remove ${x.display_name}`} onClick={() => { if (window.confirm(`Remove ${x.display_name}?`)) void run(() => api.delete(`staff/elections/${id}/candidates/${x.id}`), 'Contestant removed'); }}><Trash2 size={15}/></button>}
          </div></article>)}</div></div>; })}
    </Panel>
    {results.data && <Panel title={election.status === 'closed' ? 'Final results' : 'Live tally (admins only)'}>
      <p className="form-note">Turnout: {results.data.turnout} voters.</p>
      {results.data.positions.map(p => { const max = Math.max(1, ...p.candidates.map(x => x.votes)); return <div key={p.id} className="position-block"><h3>{p.title}</h3>{p.candidates.map(x => <div className="result-row" key={x.id}><div className="result-name"><span>{x.display_name}</span><b>{x.votes}</b></div><div className="result-bar"><i style={{ width: `${(x.votes / max) * 100}%` }}/></div></div>)}</div>; })}
    </Panel>}
  </>;
}
