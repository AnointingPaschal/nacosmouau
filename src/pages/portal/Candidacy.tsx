import { useState, type FormEvent } from 'react';
import { BadgeCheck, Camera, CheckCircle2, FileSignature, Lock, Receipt, ScanSearch, Ticket } from 'lucide-react';
import { toast } from 'sonner';
import { api } from '../../lib/api';
import { naira } from '../../lib/money';
import { FileUpload } from '../../components/FileUpload';
import { Pill } from '../../components/Workspace';
import { PayPanel, usePayInfo } from './PayPanel';

export interface Candidacy { id: string; status: string; screening_note: string | null; position: string; manifesto: string; photo_url: string | null }
export interface Position { id: string; title: string; eligible_levels: string | null }
export const levelsText = (v: string | null) => (v ? `${v.split(',').join(', ')} level` : 'All levels');
const PLACEHOLDER = 'Manifesto to be provided.';

/** Election phases shown as a progress strip. */
export function PhaseSteps({ status }: { status: string }) {
  const steps = ['Nominations', 'Voting', 'Results']; const at = status === 'closed' ? 2 : status === 'voting' ? 1 : 0;
  return <ol className="phase-steps" aria-label="Election progress">{steps.map((label, i) => <li key={label} className={i < at ? 'is-done' : i === at ? 'is-now' : ''}><span>{i < at ? <CheckCircle2 size={14}/> : i + 1}</span>{label}</li>)}</ol>;
}

function CandidacyEditor({ candidacy, onSaved }: { candidacy: Candidacy; onSaved: () => void }) {
  const [photo, setPhoto] = useState(''); const [manifesto, setManifesto] = useState(candidacy.manifesto === PLACEHOLDER ? '' : candidacy.manifesto); const [busy, setBusy] = useState(false);
  const save = async (e: FormEvent) => {
    e.preventDefault(); setBusy(true);
    try { await api.post(`portal/candidacy/${candidacy.id}`, { manifesto, ...(photo ? { photo_url: photo } : {}) }); toast.success('Saved'); setPhoto(''); onSaved(); }
    catch (err) { toast.error(err instanceof Error ? err.message : 'Could not save'); } finally { setBusy(false); }
  };
  return <form className="form-stack" onSubmit={save}>
    <div className="field"><span>Passport photo</span><FileUpload purpose="candidate" value={photo || candidacy.photo_url} accept="image/jpeg,image/png,image/webp" label="Upload a clear passport photo" onChange={f => setPhoto(f?.url ?? '')}/></div>
    <label className="field"><span>Manifesto</span><textarea rows={5} value={manifesto} onChange={e => setManifesto(e.target.value)} minLength={20} required placeholder="Tell members why they should vote for you and what you will do."/></label>
    <button className="button button-green" disabled={busy}>{busy ? 'Saving…' : 'Save passport and manifesto'}</button>
  </form>;
}

/** Everything a contestant has to do, in order: buy the form, add passport and manifesto, wait for screening. */
export function CandidacyFlow({ candidacy, fee, editable, onChanged }: { candidacy: Candidacy; fee: number; editable: boolean; onChanged: () => void }) {
  const info = usePayInfo(); const [paying, setPaying] = useState(false);
  const bought = candidacy.status !== 'pending_payment'; const profileDone = Boolean(candidacy.photo_url) && candidacy.manifesto !== PLACEHOLDER;
  const cleared = candidacy.status === 'eligible'; const rejected = candidacy.status === 'rejected';
  const steps = [
    { icon: Receipt, label: 'Buy form', done: bought },
    { icon: Camera, label: 'Passport and manifesto', done: profileDone },
    { icon: ScanSearch, label: 'Screening', done: cleared },
    { icon: BadgeCheck, label: 'Cleared', done: cleared },
  ];
  const withdraw = async () => {
    if (!window.confirm('Withdraw your application? You have not paid yet, so nothing is lost.')) return;
    try { await api.post(`portal/candidacy/${candidacy.id}/withdraw`, {}); toast.success('Application withdrawn'); onChanged(); } catch (e) { toast.error(e instanceof Error ? e.message : 'Could not withdraw'); }
  };
  return <div className="candidacy-flow">
    <div className="candidacy-head"><div><strong>{candidacy.position}</strong><small>Your application</small></div><Pill value={candidacy.status}/></div>
    <ol className="flow-steps">{steps.map(({ icon: Icon, label, done }, i) => <li key={label} className={done ? 'is-done' : ''}><span><Icon size={15}/></span><b>{i + 1}. {label}</b></li>)}</ol>
    {candidacy.screening_note && <p className="notice-bar"><FileSignature size={15}/><span>Committee note: {candidacy.screening_note}</span></p>}
    {candidacy.status === 'pending_payment' && <div className="flow-card">
      <h3><Ticket size={16}/> Step 1: buy your candidate form</h3>
      <p className="form-note">The form costs <b>{naira(fee)}</b>. Pay by Paystack or upload your bank teller, then the electoral committee can screen you.</p>
      {paying && info.data ? <PayPanel purpose="candidate_form" refId={candidacy.id} amountMinor={fee} info={info.data} onDone={() => { setPaying(false); onChanged(); }}/> : <div className="row-right" style={{ justifyContent: 'flex-start' }}><button className="button button-green" onClick={() => setPaying(true)}>Buy form for {naira(fee)}</button><button className="button button-outline btn-sm" onClick={() => void withdraw()}>Withdraw</button></div>}
    </div>}
    {candidacy.status === 'pending_screening' && <p className="notice-bar notice-ok"><ScanSearch size={15}/><span>Form received. The electoral committee is screening your application.</span></p>}
    {cleared && <p className="notice-bar notice-ok"><BadgeCheck size={15}/><span>You are cleared. Your name will appear on the ballot when voting opens.</span></p>}
    {rejected && <p className="notice-bar"><Lock size={15}/><span>Your application was not approved.</span></p>}
    {editable && !rejected && <div className="flow-card"><h3><Camera size={16}/> {bought ? 'Step 2:' : 'Next:'} passport and manifesto</h3>
      <CandidacyEditor candidacy={candidacy} onSaved={onChanged}/></div>}
  </div>;
}
