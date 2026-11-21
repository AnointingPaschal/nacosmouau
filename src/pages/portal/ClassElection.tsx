import { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { BadgeCheck, Clock, Crown, Vote } from 'lucide-react';
import { api } from '../../lib/api';
import { EmptyState, ErrorState, LoadingState } from '../../components/States';
import { PageTitle, Panel, Pill } from '../../components/Workspace';
import { REP_LABEL, initials, when, type Candidate, type ClassElectionState, type RepRole } from './classApi';

function Countdown({ endsAt, onDone }: { endsAt: string; onDone: () => void }) {
  const [left, setLeft] = useState(() => new Date(endsAt).getTime() - Date.now());
  useEffect(() => {
    const t = window.setInterval(() => { const ms = new Date(endsAt).getTime() - Date.now(); setLeft(ms); if (ms <= 0) { window.clearInterval(t); onDone(); } }, 1000);
    return () => window.clearInterval(t);
  }, [endsAt, onDone]);
  if (left <= 0) return <span>Closing…</span>;
  const s = Math.floor(left / 1000); const d = Math.floor(s / 86400); const h = Math.floor((s % 86400) / 3600); const m = Math.floor((s % 3600) / 60);
  return <span>{d > 0 ? `${d}d ` : ''}{h}h {m}m {s % 60}s left</span>;
}

const POSITIONS: RepRole[] = ['rep', 'assistant'];

export function PortalClassElection() {
  const client = useQueryClient();
  const q = useQuery({ queryKey: ['portal', 'class', 'election'], queryFn: ({ signal }) => api.get<ClassElectionState>('portal/class/election', signal), retry: false, refetchInterval: 30_000 });
  const refresh = async () => { await client.invalidateQueries({ queryKey: ['portal', 'class'] }); };
  const [position, setPosition] = useState<RepRole>('rep'); const [manifesto, setManifesto] = useState('');
  const apply = useMutation({ mutationFn: () => api.post('portal/class/election/apply', { position, manifesto }), onSuccess: async () => { toast.success('Application sent. An admin will review it.'); setManifesto(''); await refresh(); }, onError: e => toast.error(e instanceof Error ? e.message : 'Could not send your application') });
  const withdraw = useMutation({ mutationFn: () => api.delete('portal/class/election/apply'), onSuccess: async () => { toast.success('Application withdrawn'); await refresh(); }, onError: e => toast.error(e instanceof Error ? e.message : 'Could not withdraw') });
  const vote = useMutation({ mutationFn: (v: { position: RepRole; candidate_id: string }) => api.post('portal/class/election/vote', v), onSuccess: async () => { toast.success('Your vote is in'); await refresh(); }, onError: e => toast.error(e instanceof Error ? e.message : 'Could not record your vote') });

  if (q.isLoading) return <LoadingState/>;
  if (q.error || !q.data) return <ErrorState error={q.error ?? new Error('Election unavailable')}/>;
  const { level, session, election, candidates = [], voted = [], winners = [], me } = q.data;
  if (!level || !election) return <><PageTitle eyebrow="CLASS" title="Class elections"/><EmptyState title="Your level is not set" text="Add your level in My membership to join your class election." icon={<Vote size={22}/>}/></>;
  const mine = candidates.find(c => c.user_id === me);
  const by = (p: RepRole) => candidates.filter(c => c.position === p && c.status === 'approved');
  const status = election.status;

  return <>
    <PageTitle eyebrow="CLASS" title={`${level} level class election`} description={`Course Rep and Assistant Course Rep for ${session}. Contestants are approved by an admin, voting runs for a set time, and the winners carry the badge automatically.`} action={<Pill value={status === 'nominations' ? 'nominations' : status === 'voting' ? 'voting' : 'closed'}/>}/>
    {status === 'voting' && election.voting_ends_at && <div className="ce-banner"><Clock size={18}/><div><b>Voting is open</b><small>Ends {when(election.voting_ends_at)}</small></div><strong><Countdown endsAt={election.voting_ends_at} onDone={() => { void refresh(); }}/></strong></div>}
    {status === 'nominations' && <div className="ce-banner calm"><Vote size={18}/><div><b>Applications are open</b><small>Apply below. Voting starts once an admin approves contestants and opens the vote.</small></div></div>}

    {status === 'nominations' && <Panel title="Apply to contest">
      {mine ? <div className="ce-mine"><div><b>You applied for {REP_LABEL[mine.position]}</b><p>{mine.manifesto}</p>{mine.review_note && <small>Admin note: {mine.review_note}</small>}</div><div className="ce-mine-side"><Pill value={mine.status === 'approved' ? 'approved' : mine.status === 'rejected' ? 'rejected' : 'pending'}/>{mine.status !== 'approved' && <button className="button button-outline btn-sm" disabled={withdraw.isPending} onClick={() => withdraw.mutate()}>Withdraw</button>}</div></div>
        : <form className="form-stack" onSubmit={e => { e.preventDefault(); apply.mutate(); }}>
          <div className="ce-pos" role="radiogroup" aria-label="Position">{POSITIONS.map(p => <button type="button" key={p} role="radio" aria-checked={position === p} className={position === p ? 'on' : ''} onClick={() => setPosition(p)}>{REP_LABEL[p]}</button>)}</div>
          <label className="field"><span>Why should your class elect you?</span><textarea rows={4} maxLength={800} value={manifesto} onChange={e => setManifesto(e.target.value)} placeholder="Your plans for the class, in a few sentences." required/></label>
          <div><button className="button button-green" disabled={apply.isPending || manifesto.trim().length < 20}>{apply.isPending ? 'Sending…' : 'Send application'}</button></div>
        </form>}
    </Panel>}

    <div className="ce-grid">{POSITIONS.map(p => {
      const list = by(p); const winner = winners.find(w => w.role === p); const hasVoted = voted.includes(p);
      const total = list.reduce((s, c) => s + (c.votes ?? 0), 0);
      return <Panel key={p} title={REP_LABEL[p]} action={status === 'voting' && hasVoted ? <span className="ce-voted"><BadgeCheck size={14}/> Voted</span> : undefined}>
        {status === 'closed' && winner && <div className="ce-winner"><Crown size={18}/><div><small>Elected</small><b>{winner.full_name}</b></div><span>{winner.votes} vote{winner.votes === 1 ? '' : 's'}</span></div>}
        {list.length === 0 ? <p className="field-hint">{status === 'nominations' ? 'No approved contestants yet.' : 'No contestants for this position.'}</p> : <ul className="ce-cands">{[...list].sort((a, b) => (b.votes ?? 0) - (a.votes ?? 0)).map((c: Candidate) => <li key={c.id} className={winner?.user_id === c.user_id ? 'won' : ''}>
          <span className="lm-avatar">{initials(c.full_name)}</span>
          <div><b>{c.full_name}</b><small>{c.matric_number}</small><p>{c.manifesto}</p>
            {status === 'closed' && <div className="ce-bar"><i style={{ width: `${total ? ((c.votes ?? 0) / total) * 100 : 0}%` }}/><em>{c.votes ?? 0} vote{c.votes === 1 ? '' : 's'}</em></div>}</div>
          {status === 'voting' && <button className="button button-green btn-sm" disabled={hasVoted || vote.isPending} onClick={() => { if (window.confirm(`Vote for ${c.full_name} as ${REP_LABEL[p]}? You cannot change it.`)) vote.mutate({ position: p, candidate_id: c.id }); }}>{hasVoted ? 'Voted' : 'Vote'}</button>}
        </li>)}</ul>}
      </Panel>;
    })}</div>
  </>;
}
