import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, ArrowRight, CalendarClock, Check, Lock, Ticket, Trophy, Vote } from 'lucide-react';
import { toast } from 'sonner';
import { api } from '../../lib/api';
import { naira, when } from '../../lib/money';
import { EmptyState, ErrorState, LoadingState } from '../../components/States';
import { PageTitle, Panel, Pill } from '../../components/Workspace';
import { CandidacyFlow, PhaseSteps, levelsText, type Candidacy, type Position } from './Candidacy';

interface ElectionRow { id: string; title: string; description: string | null; status: string; opens_at: string | null; closes_at: string | null; form_fee_minor: number; my_candidacies: Candidacy[]; has_voted: boolean }
interface ElectionList { session: string; dues_paid: boolean; elections: ElectionRow[] }


export function PortalElections() {
  const q = useQuery({ queryKey: ['portal', 'elections'], queryFn: ({ signal }) => api.get<ElectionList>('portal/elections', signal), retry: false });
  if (q.isLoading) return <LoadingState/>;
  if (q.error || !q.data) return <ErrorState error={q.error}/>;
  const { elections, dues_paid, session } = q.data;
  return <>
    <PageTitle eyebrow="MEMBER SPACE" title="Elections" description="Apply to contest, buy your candidate form and vote when voting opens."/>
    {!dues_paid && <div className="notice-bar"><Lock size={16}/><span>Only members who have paid {session} NACOS dues can vote. <Link to="/portal/payments">Pay your dues</Link></span></div>}
    {elections.length === 0 ? <Panel><EmptyState title="No elections right now" text="When the electoral committee opens an election, it will appear here." icon={<Vote size={22}/>}/></Panel> :
      <div className="election-grid">{elections.map(e => <article key={e.id} className="election-card">
        <header className="election-banner"><div><Pill value={e.status}/><h2>{e.title}</h2></div><PhaseSteps status={e.status}/></header>
        <div className="election-body">
          {e.description && <p>{e.description}</p>}
          <dl className="election-facts">
            <div><dt><CalendarClock size={13}/> Voting</dt><dd>{when(e.opens_at)} to {when(e.closes_at)}</dd></div>
            <div><dt><Ticket size={13}/> Candidate form</dt><dd>{e.form_fee_minor > 0 ? naira(e.form_fee_minor) : 'Free'}</dd></div>
          </dl>
          {e.my_candidacies.map(c => <div className="my-candidacy" key={c.id}><span>You applied for <b>{c.position}</b></span><Pill value={c.status}/></div>)}
          <div className="election-actions">
            {e.status === 'nominations' && <Link className="button button-green" to={`/portal/elections/${e.id}`}>{e.my_candidacies.length ? 'Continue application' : 'Apply to contest'} <ArrowRight size={15}/></Link>}
            {e.status === 'voting' && (e.has_voted ? <span className="voted-chip"><Check size={14}/> You have voted</span> : <Link className="button button-green" to={`/portal/elections/${e.id}`}>Vote now <ArrowRight size={15}/></Link>)}
            {e.status === 'closed' && <Link className="button button-outline" to={`/portal/elections/${e.id}`}>View results <ArrowRight size={15}/></Link>}
          </div>
        </div>
      </article>)}</div>}
  </>;
}

interface Detail {
  election: { id: string; title: string; description: string | null; status: string; opens_at: string | null; closes_at: string | null; form_fee_minor: number };
  positions: Array<Position & { candidates: Array<{ id: string; display_name: string; manifesto: string; photo_url: string | null }> }>;
  can_vote: boolean; reason: string; has_voted: boolean; can_apply: boolean; my_level: string | null; my_candidacies: Array<Candidacy & { position_id: string }>;
  results?: { turnout: number; positions: Array<{ id: string; title: string; candidates: Array<{ id: string; display_name: string; votes: number }> }> };
}

/** Positions a member can apply for, and the steps for an application already started. */
function ApplySection({ d, id, onChanged }: { d: Detail; id: string; onChanged: () => void }) {
  const [busy, setBusy] = useState('');
  const mine = d.my_candidacies; const fee = d.election.form_fee_minor;
  const apply = async (positionId: string) => {
    setBusy(positionId);
    try { await api.post(`portal/elections/${id}/apply`, { position_id: positionId }); toast.success(fee > 0 ? 'Applied. Now buy your candidate form.' : 'Application received.'); onChanged(); }
    catch (e) { toast.error(e instanceof Error ? e.message : 'Could not apply'); } finally { setBusy(''); }
  };
  return <>
    {mine.map(c => <Panel key={c.id} title="Your application"><CandidacyFlow candidacy={{ ...c, position: d.positions.find(p => p.id === c.position_id)?.title ?? '' }} fee={fee} editable={d.can_apply} onChanged={onChanged}/></Panel>)}
    {mine.length === 0 && (d.can_apply ? <Panel title="Contest for a post">
      <p className="form-note">Pick the post you want. You buy the candidate form ({fee > 0 ? naira(fee) : 'free'}), add your passport and manifesto, then the committee screens you.</p>
      <div className="position-grid">{d.positions.map(p => {
        const ok = !p.eligible_levels || (d.my_level !== null && p.eligible_levels.split(',').includes(d.my_level));
        return <article key={p.id} className={`position-card${ok ? '' : ' is-locked'}`}>
          <h3>{p.title}</h3>
          <div className="chips"><i>{levelsText(p.eligible_levels)}</i></div>
          {ok ? <button className="button button-green" disabled={busy !== ''} onClick={() => void apply(p.id)}>{busy === p.id ? 'Applying…' : fee > 0 ? `Buy form · ${naira(fee)}` : 'Apply'}</button>
            : <p className="form-note"><Lock size={13}/> Only {p.eligible_levels?.split(',').join(', ')} level members can contest.</p>}
        </article>; })}
        {d.positions.length === 0 && <p className="form-note">Posts have not been added yet.</p>}
      </div>
    </Panel> : <Panel><EmptyState title="Applications are not open" text="The electoral committee will open nominations soon." icon={<Vote size={22}/>}/></Panel>)}
  </>;
}

export function PortalBallot() {
  const { id = '' } = useParams(); const navigate = useNavigate(); const client = useQueryClient();
  const q = useQuery({ queryKey: ['portal', 'elections', id], queryFn: ({ signal }) => api.get<Detail>(`portal/elections/${id}`, signal), retry: false });
  const [choice, setChoice] = useState<Record<string, string>>({}); const [busy, setBusy] = useState(false); const [confirm, setConfirm] = useState(false); const [reading, setReading] = useState<{ name: string; position: string; manifesto: string; photo: string | null } | null>(null);
  if (q.isLoading) return <LoadingState/>;
  if (q.error || !q.data) return <ErrorState error={q.error}/>;
  const d = q.data;
  const submit = async () => {
    setBusy(true);
    try { const r = await api.post<{ message: string }>(`portal/elections/${id}/vote`, { selections: choice }); toast.success(r.message); await client.invalidateQueries({ queryKey: ['portal', 'elections'] }); navigate('/portal/elections'); }
    catch (e) { toast.error(e instanceof Error ? e.message : 'Could not record your vote'); setConfirm(false); }
    finally { setBusy(false); }
  };
  return <>
    <header className="election-hero"><Link className="exec-back" to="/portal/elections"><ArrowLeft size={14}/> All elections</Link><div className="election-hero-main"><div><Pill value={d.election.status}/><h1>{d.election.title}</h1>{d.election.description && <p>{d.election.description}</p>}</div><PhaseSteps status={d.election.status}/></div>
      <dl className="election-facts"><div><dt><CalendarClock size={13}/> Voting</dt><dd>{when(d.election.opens_at)} to {when(d.election.closes_at)}</dd></div><div><dt><Ticket size={13}/> Candidate form</dt><dd>{d.election.form_fee_minor > 0 ? naira(d.election.form_fee_minor) : 'Free'}</dd></div></dl></header>
    {d.election.status === 'nominations' && <ApplySection d={d} id={id} onChanged={() => void client.invalidateQueries({ queryKey: ['portal', 'elections'] })}/>}
    {d.election.status === 'nominations' ? null : d.results ? <div className="results-grid">{d.results.positions.map(p => { const max = Math.max(1, ...p.candidates.map(c => c.votes)); return <Panel key={p.id} title={p.title}>{p.candidates.length === 0 ? <p className="form-note">No candidates.</p> : p.candidates.map((c, i) => <div className="result-row" key={c.id}><div className="result-name">{i === 0 && c.votes > 0 && <Trophy size={14}/>}<span>{c.display_name}</span><b>{c.votes}</b></div><div className="result-bar"><i style={{ width: `${(c.votes / max) * 100}%` }}/></div></div>)}</Panel>; })}<p className="form-note">Turnout: {d.results.turnout} voters.</p></div> : <>
      {!d.can_vote && <div className="notice-bar"><Lock size={16}/><span>{d.reason}</span></div>}
      {d.positions.length === 0 ? <Panel><EmptyState title="No candidates yet" text="Screened candidates will appear here once voting opens." icon={<Vote size={22}/>}/></Panel> :
        d.positions.map(p => <Panel key={p.id} title={p.title}>
          {p.candidates.length === 0 ? <p className="form-note">No eligible candidates for this position.</p> : <div className="candidate-grid" role="radiogroup" aria-label={p.title}>{p.candidates.map(c => { const selected = choice[p.id] === c.id; const pick = () => { if (d.can_vote) setChoice(v => ({ ...v, [p.id]: selected ? '' : c.id })); };
            return <div key={c.id} role="radio" aria-checked={selected} aria-disabled={!d.can_vote} tabIndex={d.can_vote ? 0 : -1} className={`candidate${selected ? ' is-selected' : ''}${d.can_vote ? '' : ' is-locked'}`} onClick={pick} onKeyDown={e => { if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); pick(); } }}>
              <span className="cand-photo">{c.photo_url ? <img src={c.photo_url} alt={c.display_name} loading="lazy"/> : <b>{c.display_name.split(' ').map(w => w[0]).slice(0, 2).join('')}</b>}<span className="candidate-check">{selected && <Check size={16}/>}</span></span>
              <span className="cand-name">{c.display_name}</span>
              <span className="cand-man">{c.manifesto}</span>
              <button type="button" className="cand-more" onClick={e => { e.stopPropagation(); setReading({ name: c.display_name, position: p.title, manifesto: c.manifesto, photo: c.photo_url }); }}>Read manifesto</button>
            </div>; })}</div>}
        </Panel>)}
      {d.can_vote && <div className="ballot-bar"><span>{Object.values(choice).filter(Boolean).length} selected. You can leave a position empty.</span><button className="button button-green" disabled={!Object.values(choice).some(Boolean) || busy} onClick={() => setConfirm(true)}>Review and submit</button></div>}
    </>}
    {reading && <div className="modal-scrim" role="presentation" onClick={() => setReading(null)}><section className="workspace-panel confirm-modal reading-modal" role="dialog" aria-modal="true" aria-label={`${reading.name} manifesto`} onClick={e => e.stopPropagation()}>
      <div className="reading-head"><span className="reading-photo">{reading.photo ? <img src={reading.photo} alt=""/> : <b>{reading.name[0]}</b>}</span><div><h2>{reading.name}</h2><small>Candidate for {reading.position}</small></div></div>
      <p>{reading.manifesto}</p><footer><button className="button button-green btn-sm" onClick={() => setReading(null)}>Close</button></footer></section></div>}
    {confirm && <div className="modal-scrim" role="presentation"><section className="workspace-panel confirm-modal" role="dialog" aria-modal="true"><h2>Submit your vote?</h2><p>Your vote is secret and cannot be changed after you submit.</p><ul className="exec-list">{d.positions.filter(p => choice[p.id]).map(p => <li key={p.id}><b>{p.title}:</b> {p.candidates.find(c => c.id === choice[p.id])?.display_name}</li>)}</ul><footer><button className="button button-outline" onClick={() => setConfirm(false)}>Go back</button><button className="button button-green" disabled={busy} onClick={() => void submit()}>{busy ? 'Submitting…' : 'Confirm vote'}</button></footer></section></div>}
  </>;
}
