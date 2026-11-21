import { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Check, Crown, Play, Square, X } from 'lucide-react';
import { api } from '../../lib/api';
import { ErrorState, LoadingState } from '../../components/States';
import { PageTitle, Panel, Pill } from '../../components/Workspace';
import { REP_LABEL, when, type RepRole } from '../portal/classApi';

interface AdminCandidate { id: string; position: RepRole; manifesto: string; status: 'pending' | 'approved' | 'rejected'; full_name: string; matric_number: string | null; votes: number }
interface LevelState { level: string; election: { id: string; status: 'nominations' | 'voting' | 'closed'; voting_ends_at: string | null; closed_at: string | null }; candidates: AdminCandidate[]; members: number; voters: number; reps: { role: RepRole; votes: number; full_name: string; matric_number: string | null }[] }
interface AdminState { session: string; levels: LevelState[] }

function useTick(active: boolean) { const [, set] = useState(0); useEffect(() => { if (!active) return; const t = window.setInterval(() => set(n => n + 1), 30_000); return () => window.clearInterval(t); }, [active]); }

export function AdminClassReps() {
  const client = useQueryClient();
  const q = useQuery({ queryKey: ['admin', 'class-elections'], queryFn: ({ signal }) => api.get<AdminState>('admin/class-elections', signal), retry: false, refetchInterval: 30_000 });
  const [level, setLevel] = useState('100'); const [hours, setHours] = useState('24');
  useTick(true);
  const refresh = async () => { await client.invalidateQueries({ queryKey: ['admin', 'class-elections'] }); await client.invalidateQueries({ queryKey: ['portal', 'class'] }); };
  const review = useMutation({ mutationFn: (v: { id: string; status: string }) => api.put(`admin/class-elections/candidate/${v.id}`, { status: v.status }), onSuccess: refresh, onError: e => toast.error(e instanceof Error ? e.message : 'Could not update the contestant') });
  const start = useMutation({ mutationFn: () => api.post(`admin/class-elections/${level}/start`, { hours: Number(hours) }), onSuccess: async () => { toast.success(`Voting is open for ${level} level`); await refresh(); }, onError: e => toast.error(e instanceof Error ? e.message : 'Could not start voting') });
  const end = useMutation({ mutationFn: () => api.post(`admin/class-elections/${level}/end`, {}), onSuccess: async () => { toast.success('Voting ended and winners confirmed'); await refresh(); }, onError: e => toast.error(e instanceof Error ? e.message : 'Could not end voting') });

  if (q.isLoading) return <LoadingState/>;
  if (q.error || !q.data) return <ErrorState error={q.error ?? new Error('Class elections unavailable')}/>;
  const cur = q.data.levels.find(l => l.level === level) ?? q.data.levels[0];
  const e = cur.election; const approved = cur.candidates.filter(c => c.status === 'approved').length;

  return <>
    <PageTitle eyebrow="ELECTIONS" title="Course rep elections" description={`${q.data.session}. Reps are elected by their level, never assigned. You approve contestants and start the vote, and it ends by itself at the set time. Winners get the badge automatically.`}/>
    <div className="study-tabs" role="tablist" aria-label="Level">{q.data.levels.map(l => <button key={l.level} className={level === l.level ? 'active' : ''} onClick={() => setLevel(l.level)}>{l.level}L{l.election.status === 'voting' && <i>Live</i>}</button>)}</div>
    <div className="cr-status">
      <div><Pill value={e.status === 'nominations' ? 'nominations' : e.status === 'voting' ? 'voting' : 'closed'}/><span>{cur.members} active students · {cur.voters} voted</span></div>
      {e.status === 'voting' && e.voting_ends_at && <b>Ends {when(e.voting_ends_at)}</b>}
      {e.status === 'closed' && e.closed_at && <b>Closed {when(e.closed_at)}</b>}
    </div>
    {e.status === 'nominations' && <Panel title="Start voting"><div className="cr-start"><label className="field"><span>Voting time (hours)</span><input type="number" min={1} max={168} value={hours} onChange={ev => setHours(ev.target.value)}/></label><button className="button button-green" disabled={approved === 0 || start.isPending} onClick={() => { if (window.confirm(`Open voting for ${level} level for ${hours} hour(s)? New applications will close.`)) start.mutate(); }}><Play size={15}/> {start.isPending ? 'Starting…' : 'Start voting'}</button></div>{approved === 0 && <p className="field-hint">Approve at least one contestant first.</p>}</Panel>}
    {e.status === 'voting' && <Panel title="Voting in progress"><p className="field-hint">Voting closes automatically at the end time. You can end it early if needed.</p><button className="button button-outline" disabled={end.isPending} onClick={() => { if (window.confirm('End voting now and confirm the winners?')) end.mutate(); }}><Square size={14}/> End voting now</button></Panel>}
    {cur.reps.length > 0 && <Panel title="Elected"><ul className="cr-reps">{cur.reps.map(r => <li key={r.role}><Crown size={16}/><div><small>{REP_LABEL[r.role]}</small><b>{r.full_name}</b><span>{r.matric_number} · {r.votes} vote{r.votes === 1 ? '' : 's'}</span></div></li>)}</ul></Panel>}
    <div className="ce-grid">{(['rep', 'assistant'] as const).map(p => <Panel key={p} title={`${REP_LABEL[p]} contestants`}>
      {cur.candidates.filter(c => c.position === p).length === 0 ? <p className="field-hint">No applications yet.</p> : <ul className="ce-cands">{cur.candidates.filter(c => c.position === p).map(c => <li key={c.id}>
        <div><b>{c.full_name}</b><small>{c.matric_number}</small><p>{c.manifesto}</p>{e.status !== 'nominations' && <small>{c.votes} vote{c.votes === 1 ? '' : 's'}</small>}</div>
        <div className="cr-actions"><Pill value={c.status}/>{e.status === 'nominations' && <><button className="button button-green btn-sm" disabled={c.status === 'approved' || review.isPending} onClick={() => review.mutate({ id: c.id, status: 'approved' })}><Check size={14}/> Approve</button><button className="button button-outline btn-sm" disabled={c.status === 'rejected' || review.isPending} onClick={() => review.mutate({ id: c.id, status: 'rejected' })}><X size={14}/> Reject</button></>}</div>
      </li>)}</ul>}
    </Panel>)}</div>
  </>;
}
