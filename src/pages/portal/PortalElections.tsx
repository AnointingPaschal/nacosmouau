import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, ArrowRight, Check, Lock, Trophy, Vote } from 'lucide-react';
import { toast } from 'sonner';
import { api } from '../../lib/api';
import { naira, when } from '../../lib/money';
import { EmptyState, ErrorState, LoadingState } from '../../components/States';
import { PageTitle, Panel, Pill } from '../../components/Workspace';
import { PayPanel, usePayInfo } from './PayPanel';

interface Candidacy { id: string; status: string; screening_note: string | null; position: string }
interface ElectionRow { id: string; title: string; description: string | null; status: string; opens_at: string | null; closes_at: string | null; form_fee_minor: number; my_candidacies: Candidacy[]; has_voted: boolean }
interface ElectionList { session: string; dues_paid: boolean; elections: ElectionRow[] }

function CandidacyForm({ candidacy, fee }: { candidacy: Candidacy; fee: number }) {
  const info = usePayInfo(); const [open, setOpen] = useState(false);
  return <div className="candidacy">
    <div className="candidacy-head"><div><strong>{candidacy.position}</strong><small>Your candidacy</small></div><Pill value={candidacy.status}/></div>
    {candidacy.screening_note && <p className="form-note">Screening note: {candidacy.screening_note}</p>}
    {candidacy.status === 'pending_payment' && <>
      <p className="form-note">Pay the candidate form fee of <b>{naira(fee)}</b> so the electoral committee can screen you.</p>
      {open && info.data ? <PayPanel purpose="candidate_form" refId={candidacy.id} amountMinor={fee} info={info.data} onDone={() => setOpen(false)}/> : <button className="button button-green" onClick={() => setOpen(true)}>Pay candidate form</button>}
    </>}
    {candidacy.status === 'pending_screening' && <p className="form-note">Payment received. The committee is screening your form.</p>}
    {candidacy.status === 'eligible' && <p className="form-note">You have been cleared as a candidate.</p>}
  </div>;
}

export function PortalElections() {
  const q = useQuery({ queryKey: ['portal', 'elections'], queryFn: ({ signal }) => api.get<ElectionList>('portal/elections', signal), retry: false });
  if (q.isLoading) return <LoadingState/>;
  if (q.error || !q.data) return <ErrorState error={q.error}/>;
  const { elections, dues_paid, session } = q.data;
  return <>
    <PageTitle eyebrow="MEMBER SPACE" title="Elections" description="Pay for your candidate form, and vote when voting is open."/>
    {!dues_paid && <div className="notice-bar"><Lock size={16}/><span>Only members who have paid {session} NACOS dues can vote. <Link to="/portal/payments">Pay your dues</Link></span></div>}
    {elections.length === 0 ? <Panel><EmptyState title="No elections right now" text="When the electoral committee opens an election, it will appear here." icon={<Vote size={22}/>}/></Panel> :
      <div className="election-grid">{elections.map(e => <Panel key={e.id} className="election-card">
        <div className="election-top"><div><h2>{e.title}</h2>{e.description && <p>{e.description}</p>}</div><Pill value={e.status}/></div>
        <small className="election-dates">{when(e.opens_at)} to {when(e.closes_at)}</small>
        {e.my_candidacies.map(c => <CandidacyForm key={c.id} candidacy={c} fee={e.form_fee_minor}/>)}
        <div className="election-actions">
          {e.status === 'voting' && (e.has_voted ? <span className="voted-chip"><Check size={14}/> You have voted</span> : <Link className="button button-green" to={`/portal/elections/${e.id}`}>Vote now <ArrowRight size={15}/></Link>)}
          {e.status !== 'voting' && <Link className="text-action" to={`/portal/elections/${e.id}`}>{e.status === 'closed' ? 'View results' : 'View details'} <ArrowRight size={14}/></Link>}
        </div>
      </Panel>)}</div>}
  </>;
}

interface Detail { election: { id: string; title: string; description: string | null; status: string; closes_at: string | null }; positions: Array<{ id: string; title: string; candidates: Array<{ id: string; display_name: string; manifesto: string; photo_url: string | null }> }>; can_vote: boolean; reason: string; has_voted: boolean; results?: { turnout: number; positions: Array<{ id: string; title: string; candidates: Array<{ id: string; display_name: string; votes: number }> }> } }

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
    <PageTitle eyebrow="ELECTION" title={d.election.title} description={d.election.description ?? undefined} action={<Link className="text-action" to="/portal/elections"><ArrowLeft size={14}/> All elections</Link>}/>
    {d.results ? <div className="results-grid">{d.results.positions.map(p => { const max = Math.max(1, ...p.candidates.map(c => c.votes)); return <Panel key={p.id} title={p.title}>{p.candidates.length === 0 ? <p className="form-note">No candidates.</p> : p.candidates.map((c, i) => <div className="result-row" key={c.id}><div className="result-name">{i === 0 && c.votes > 0 && <Trophy size={14}/>}<span>{c.display_name}</span><b>{c.votes}</b></div><div className="result-bar"><i style={{ width: `${(c.votes / max) * 100}%` }}/></div></div>)}</Panel>; })}<p className="form-note">Turnout: {d.results.turnout} voters.</p></div> : <>
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
