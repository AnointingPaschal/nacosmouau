import { useEffect, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import QRCode from 'qrcode';
import { BadgeCheck, Camera, Printer, RotateCw, ShieldAlert, ShieldCheck } from 'lucide-react';
import { toast } from 'sonner';
import { api } from '../../lib/api';
import { ErrorState, LoadingState } from '../../components/States';
import { FileUpload } from '../../components/FileUpload';
import { PageTitle, Panel } from '../../components/Workspace';
import { useSettings } from '../../hooks/useApi';
import { when } from '../../lib/money';

interface IdData {
  passport_required?: boolean; full_name: string; matric_number?: string | null; academic_level?: string | null; status?: string;
  session?: string; membership_id?: string | null; issued_at?: string | null; dues_paid?: boolean; photo_url?: string | null;
}

function PassportGate({ name }: { name: string }) {
  const client = useQueryClient();
  const [photo, setPhoto] = useState(''); const [busy, setBusy] = useState(false);
  const save = async () => {
    setBusy(true);
    try { await api.put('members/me', { profile_photo_url: photo }); toast.success('Passport saved'); await client.invalidateQueries({ queryKey: ['portal'] }); }
    catch (e) { toast.error(e instanceof Error ? e.message : 'Passport could not be saved'); } finally { setBusy(false); }
  };
  return <>
    <PageTitle eyebrow="MEMBER SPACE" title="Digital ID" description="Add your passport photo to unlock your membership card."/>
    <Panel title="Set your passport first">
      <div className="passport-gate">
        <span className="passport-icon"><Camera size={26}/></span>
        <p><b>{name.split(' ')[0]}</b>, your Digital ID shows your passport photo, so it stays locked until you add one.</p>
        <ul className="passport-tips"><li>Face the camera with your full face visible.</li><li>Plain, light background.</li><li>No cap, sunglasses or filters.</li></ul>
        <FileUpload purpose="profile" value={photo} accept="image/jpeg,image/png,image/webp" label="Upload your passport photo" onChange={f => setPhoto(f?.url ?? '')}/>
        <button className="button button-green" disabled={!photo || busy} onClick={save}><ShieldCheck size={16}/> {busy ? 'Saving…' : 'Save passport and view my ID'}</button>
      </div>
    </Panel>
  </>;
}

export function DigitalId() {
  const q = useQuery({ queryKey: ['portal', 'id'], queryFn: ({ signal }) => api.get<IdData>('portal/id', signal), retry: false });
  const settings = useSettings();
  const [qr, setQr] = useState(''); const [flipped, setFlipped] = useState(false);
  const id = q.data?.membership_id;
  useEffect(() => {
    if (!id) return;
    void QRCode.toDataURL(`${window.location.origin}/verify?id=${encodeURIComponent(id)}`, { margin: 1, width: 420, color: { dark: '#06361f', light: '#ffffff' }, errorCorrectionLevel: 'M' }).then(setQr);
  }, [id]);
  if (q.isLoading) return <LoadingState/>;
  if (q.error || !q.data) return <ErrorState error={q.error}/>;
  const d = q.data;
  if (d.passport_required) return <PassportGate name={d.full_name}/>;
  const logo = settings.data?.logo_url; const paid = Boolean(d.dues_paid);
  const head = <header className="idc-head">
    <span className="idc-logo">{logo ? <img src={logo} alt=""/> : 'N'}</span>
    <div className="idc-title"><b>NACOS</b><small>MOUAU CHAPTER</small></div>
    <span className="idc-session">{d.session}</span>
  </header>;
  return <>
    <PageTitle eyebrow="MEMBER SPACE" title="Digital ID" description="Your official NACOS MOUAU membership card. Scan the QR code to verify it instantly."
      action={<div className="id-actions"><button className="button button-outline btn-sm" onClick={() => setFlipped(f => !f)}><RotateCw size={15}/> {flipped ? 'Front' : 'Back'}</button><button className="button button-green btn-sm" onClick={() => window.print()}><Printer size={15}/> Print</button></div>}/>
    <div className="id-stage">
      <div className={`id-flip${flipped ? ' is-flipped' : ''}`}>
        <article className="idc idc-front" aria-label="Digital membership card, front">
          {head}
          <div className="idc-body">
            <div className="idc-photo"><img src={d.photo_url ?? ''} alt={d.full_name}/></div>
            <h2 className="idc-name">{d.full_name}</h2>
            <span className="idc-role">NACOS MEMBER</span>
            <dl className="idc-fields">
              <div><dt>Matric / Reg. no.</dt><dd className="mono">{d.matric_number ?? '—'}</dd></div>
              <div className="idc-pair">
                <div><dt>Level</dt><dd>{d.academic_level ? `${d.academic_level} Level` : '—'}</dd></div>
                <div><dt>Status</dt><dd>{d.status === 'active' ? 'Active' : d.status}</dd></div>
              </div>
              <div><dt>Membership ID</dt><dd className="mono">{d.membership_id ?? 'Pending'}</dd></div>
            </dl>
          </div>
          <div className="idc-verify">
            <span className="idc-qr">{qr ? <img src={qr} alt={`QR code to verify ${d.membership_id}`}/> : null}</span>
            <div><small>SCAN TO VERIFY</small><span className={`idc-dues ${paid ? 'is-paid' : 'is-unpaid'}`}>{paid ? <><BadgeCheck/> Dues paid</> : <><ShieldAlert/> Dues unpaid</>}</span></div>
          </div>
          <footer className="idc-foot">Michael Okpara University of Agriculture, Umudike</footer>
        </article>
        <article className="idc idc-rear" aria-label="Digital membership card, back">
          {head}
          <div className="idc-body idc-rear-body">
            <span className="idc-qr idc-qr-lg">{qr ? <img src={qr} alt="Verification QR code"/> : null}</span>
            <h3>Verify this member</h3>
            <p>Scan the code, or open <b>/verify</b> and enter the membership ID to confirm this card is genuine.</p>
            <dl className="idc-fields">
              <div><dt>Membership ID</dt><dd className="mono">{d.membership_id ?? '—'}</dd></div>
              <div className="idc-pair">
                <div><dt>Member since</dt><dd>{when(d.issued_at ?? null).split(',')[0]}</dd></div>
                <div><dt>Session</dt><dd>{d.session}</dd></div>
              </div>
            </dl>
          </div>
          <footer className="idc-foot">Valid only while membership is active</footer>
        </article>
      </div>
    </div>
    <p className="id-note">Dues for {d.session} are shown on the card and checked when it is scanned. <Link to="/portal/profile">Change your passport</Link></p>
  </>;
}
