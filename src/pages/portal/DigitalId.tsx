import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import QRCode from 'qrcode';
import { BadgeCheck, Printer, RotateCw, ShieldAlert } from 'lucide-react';
import { api } from '../../lib/api';
import { ErrorState, LoadingState } from '../../components/States';
import { PageTitle } from '../../components/Workspace';
import { useSettings } from '../../hooks/useApi';
import { when } from '../../lib/money';

interface IdData { full_name: string; matric_number: string | null; academic_level: string | null; status: string; session: string; membership_id: string | null; issued_at: string | null; dues_paid: boolean; photo_url: string | null }

export function DigitalId() {
  const q = useQuery({ queryKey: ['portal', 'id'], queryFn: ({ signal }) => api.get<IdData>('portal/id', signal), retry: false });
  const settings = useSettings();
  const [qr, setQr] = useState(''); const [flipped, setFlipped] = useState(false);
  const id = q.data?.membership_id;
  useEffect(() => {
    if (!id) return;
    void QRCode.toDataURL(`${window.location.origin}/verify?id=${encodeURIComponent(id)}`, { margin: 1, width: 360, color: { dark: '#06361f', light: '#ffffff' }, errorCorrectionLevel: 'M' }).then(setQr);
  }, [id]);
  if (q.isLoading) return <LoadingState/>;
  if (q.error || !q.data) return <ErrorState error={q.error}/>;
  const d = q.data; const logo = settings.data?.logo_url;
  const initials = d.full_name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase();
  return <>
    <PageTitle eyebrow="MEMBER SPACE" title="Digital ID" description="Your official NACOS MOUAU membership card. Scan the QR code to verify it instantly."
      action={<div className="id-actions"><button className="button button-outline" onClick={() => setFlipped(f => !f)}><RotateCw size={15}/> {flipped ? 'Show front' : 'Show back'}</button><button className="button button-green" onClick={() => window.print()}><Printer size={15}/> Print</button></div>}/>
    <div className="id-stage">
      <div className={`id-flip${flipped ? ' is-flipped' : ''}`}>
        <article className="id-card id-front" aria-label="Digital membership card, front">
          <div className="id-pattern" aria-hidden="true"/>
          <header className="id-top">
            <div className="id-brand">{logo ? <img src={logo} alt=""/> : <span className="id-logo-fallback">N</span>}<div><b>NACOS</b><small>MOUAU CHAPTER</small></div></div>
            <span className="id-session">{d.session}</span>
          </header>
          <div className="id-main">
            <div className="id-photo">{d.photo_url ? <img src={d.photo_url} alt={d.full_name}/> : <span>{initials}</span>}</div>
            <div className="id-details">
              <small>MEMBER</small>
              <h2>{d.full_name}</h2>
              <dl>
                <div><dt>Matric / Reg. no.</dt><dd className="mono">{d.matric_number ?? '—'}</dd></div>
                <div><dt>Level</dt><dd>{d.academic_level ? `${d.academic_level} Level` : '—'}</dd></div>
              </dl>
            </div>
          </div>
          <footer className="id-bottom">
            <div className="id-no"><small>MEMBERSHIP ID</small><b className="mono">{d.membership_id ?? 'Pending'}</b></div>
            <div className="id-qr">{qr ? <img src={qr} alt={`QR code to verify ${d.membership_id}`}/> : null}</div>
          </footer>
          <div className={`id-badge ${d.dues_paid ? 'is-paid' : 'is-unpaid'}`}>{d.dues_paid ? <><BadgeCheck size={14}/> Dues paid {d.session}</> : <><ShieldAlert size={14}/> Dues unpaid</>}</div>
        </article>
        <article className="id-card id-back" aria-label="Digital membership card, back">
          <div className="id-pattern" aria-hidden="true"/>
          <div className="id-back-body">
            <div className="id-qr id-qr-large">{qr ? <img src={qr} alt="Verification QR code"/> : null}</div>
            <h3>Verify this member</h3>
            <p>Scan the code or open <b>/verify</b> and enter the membership ID to confirm this card is genuine and active.</p>
            <dl>
              <div><dt>Membership ID</dt><dd className="mono">{d.membership_id ?? '—'}</dd></div>
              <div><dt>Member since</dt><dd>{when(d.issued_at)}</dd></div>
              <div><dt>Status</dt><dd>{d.status === 'active' ? 'Active member' : d.status}</dd></div>
            </dl>
            <small>Michael Okpara University of Agriculture, Umudike · NACOS MOUAU Chapter</small>
          </div>
        </article>
      </div>
    </div>
    <p className="id-note">This card is valid only while your membership is active. Dues for {d.session} are shown on the card and checked when you scan the code.</p>
  </>;
}
