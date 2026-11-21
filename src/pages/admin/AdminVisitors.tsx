import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Eye, Globe2, Laptop, MapPin, Monitor, Radio, Smartphone, Tablet, UserRound, Users, X } from 'lucide-react';
import { api } from '../../lib/api';
import { EmptyState, ErrorState, LoadingState } from '../../components/States';
import { PageTitle, Panel, Pill, Stat } from '../../components/Workspace';

interface Live { id: string; vid: string; user_id: string | null; started_at: string; last_seen_at: string; current_path: string; current_title: string | null; views: number; device: string | null; browser: string | null; os: string | null; country: string | null; region: string | null; city: string | null; referrer: string | null; full_name: string | null; matric_number: string | null; academic_level: string | null; seconds_on_site: number }
interface Overview {
  online: number; members_online: number; guests_online: number; visitors_today: number; views_today: number; visitors_7d: number;
  live: Live[]; pages_now: Array<{ path: string; n: number }>; top_pages_today: Array<{ path: string; n: number }>;
  hourly: Array<{ hour: string; views: number; visitors: number }>; countries: Array<{ name: string; n: number }>; devices: Array<{ name: string; n: number }>; referrers: Array<{ name: string; n: number }>;
}
interface Detail {
  session: Live & { user_status: string | null; user_role: string | null; joined_at: string | null; online: number };
  contact: { email: string | null; phone: string | null } | null;
  views: Array<{ path: string; title: string | null; viewed_at: string }>;
  previous_visits: Array<{ id: string; started_at: string; views: number; current_path: string }>;
}

const utc = (s: string) => new Date(`${s.replace(' ', 'T')}Z`);
const clock = (s: string) => utc(s).toLocaleTimeString('en-NG', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
const stamp = (s: string) => utc(s).toLocaleString('en-NG', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
const duration = (sec: number) => (sec < 60 ? `${Math.max(sec, 0)}s` : sec < 3600 ? `${Math.floor(sec / 60)}m ${sec % 60}s` : `${Math.floor(sec / 3600)}h ${Math.floor((sec % 3600) / 60)}m`);
const place = (v: { city: string | null; region: string | null; country: string | null }) => [v.city, v.country].filter(Boolean).join(', ') || 'Unknown location';
const DeviceIcon = ({ kind }: { kind: string | null }) => kind === 'Mobile' ? <Smartphone size={14}/> : kind === 'Tablet' ? <Tablet size={14}/> : <Monitor size={14}/>;

function VisitDetail({ id, onClose }: { id: string; onClose: () => void }) {
  const q = useQuery({ queryKey: ['staff', 'visitors', id], queryFn: ({ signal }) => api.get<Detail>(`staff/visitors/${id}`, signal), refetchInterval: 5000, retry: false });
  const d = q.data; const s = d?.session;
  return <div className="modal-scrim" role="presentation" onClick={onClose}><section className="workspace-panel visit-detail" role="dialog" aria-modal="true" aria-label="Visitor details" onClick={e => e.stopPropagation()}>
    <header className="visit-detail-head"><div><h2>{s?.full_name ?? 'Guest visitor'}</h2><small>{s?.user_id ? 'Signed-in member' : `Anonymous · ID ${s?.vid.slice(0, 8) ?? '…'}`}</small></div>{s && <span className={`pill ${s.online ? 'pill-ok' : 'pill-muted'}`}>{s.online ? 'Online now' : 'Left'}</span>}<button className="icon-button" onClick={onClose} aria-label="Close"><X size={16}/></button></header>
    {q.isLoading && <LoadingState/>}{q.error && <ErrorState error={q.error}/>}
    {d && s && <div className="visit-body">
      <dl className="detail-list">
        <div><dt>Current page</dt><dd className="mono">{s.current_path}</dd></div>
        <div><dt>On site</dt><dd>{duration(s.seconds_on_site)} · {s.views} {s.views === 1 ? 'page' : 'pages'}</dd></div>
        <div><dt>Started</dt><dd>{stamp(s.started_at)}</dd></div>
        <div><dt>Last seen</dt><dd>{clock(s.last_seen_at)}</dd></div>
        <div><dt>Device</dt><dd>{s.device} · {s.os} · {s.browser}</dd></div>
        <div><dt>Location</dt><dd>{place(s)}</dd></div>
        <div><dt>Came from</dt><dd>{s.referrer ?? 'Direct visit'}</dd></div>
      </dl>
      {s.user_id && <><h3>Member details</h3><dl className="detail-list">
        <div><dt>Matric / Reg. no.</dt><dd className="mono">{s.matric_number ?? '—'}</dd></div>
        <div><dt>Level</dt><dd>{s.academic_level ? `${s.academic_level} Level` : '—'}</dd></div>
        <div><dt>Account</dt><dd>{s.user_status ? <Pill value={s.user_status}/> : '—'} {s.user_role && s.user_role !== 'member' ? <small>({s.user_role.replace('_', ' ')})</small> : null}</dd></div>
        {d.contact?.email && <div><dt>Email</dt><dd>{d.contact.email}</dd></div>}
        {d.contact?.phone && <div><dt>Phone</dt><dd>{d.contact.phone}</dd></div>}
        {s.joined_at && <div><dt>Joined</dt><dd>{stamp(s.joined_at)}</dd></div>}
      </dl></>}
      <h3>Pages visited this session</h3>
      <ol className="visit-timeline">{d.views.map((v, i) => <li key={`${v.viewed_at}-${i}`}><time>{clock(v.viewed_at)}</time><div><b className="mono">{v.path}</b>{v.title && <small>{v.title}</small>}</div></li>)}</ol>
      {d.previous_visits.length > 0 && <><h3>Earlier visits from this device</h3><ul className="visit-previous">{d.previous_visits.map(p => <li key={p.id}><span>{stamp(p.started_at)}</span><small>{p.views} {p.views === 1 ? 'page' : 'pages'} · ended on {p.current_path}</small></li>)}</ul></>}
    </div>}
  </section></div>;
}

export function AdminVisitors() {
  const q = useQuery({ queryKey: ['staff', 'visitors'], queryFn: ({ signal }) => api.get<Overview>('staff/visitors', signal), refetchInterval: 5000, retry: false });
  const [open, setOpen] = useState<string | null>(null);
  if (q.isLoading) return <LoadingState/>;
  if (q.error || !q.data) return <ErrorState error={q.error}/>;
  const d = q.data; const peak = Math.max(1, ...d.hourly.map(h => h.views)); const topNow = Math.max(1, ...d.pages_now.map(p => p.n));
  return <>
    <PageTitle eyebrow="ANALYTICS" title="Live visitors" description="Who is on the website right now, which pages they are on, and traffic over time. Updates every few seconds." action={<span className="lr-status is-live"><Radio size={13}/> LIVE · {clock(new Date(q.dataUpdatedAt).toISOString().replace('T', ' ').slice(0, 19))}</span>}/>
    <div className="count-grid">
      <Stat label="Online now" value={d.online}/><Stat label="Members online" value={d.members_online}/><Stat label="Guests online" value={d.guests_online}/>
      <Stat label="Visitors today" value={d.visitors_today}/><Stat label="Page views today" value={d.views_today}/><Stat label="Visitors, 7 days" value={d.visitors_7d}/>
    </div>
    <Panel title={`On the site now (${d.live.length})`}>
      {d.live.length === 0 ? <EmptyState title="Nobody is on the site right now" text="Visitors appear here within seconds of opening any page." icon={<Users size={22}/>}/> :
        <div className="visitor-list">{d.live.map(v => <button key={v.id} className="visitor-row" onClick={() => setOpen(v.id)}>
          <span className={`visitor-avatar${v.user_id ? ' is-member' : ''}`}>{v.full_name ? v.full_name[0].toUpperCase() : <UserRound size={17}/>}<i/></span>
          <span className="visitor-main">
            <b>{v.full_name ?? 'Guest'}{v.user_id && <em>Member{v.academic_level ? ` · ${v.academic_level}L` : ''}</em>}</b>
            <small className="mono"><Eye size={12}/> {v.current_path}</small>
            <small><DeviceIcon kind={v.device}/> {v.device} · {v.browser} · <MapPin size={12}/> {place(v)}</small>
          </span>
          <span className="visitor-meta"><b>{duration(v.seconds_on_site)}</b><small>{v.views} {v.views === 1 ? 'page' : 'pages'}</small></span>
        </button>)}</div>}
    </Panel>
    <div className="pay-layout">
      <Panel title="Pages being viewed now">{d.pages_now.length === 0 ? <p className="form-note">No active pages.</p> : d.pages_now.map(p => <div className="bar-row" key={p.path}><span className="mono">{p.path}</span><b>{p.n}</b><i><u style={{ width: `${(p.n / topNow) * 100}%` }}/></i></div>)}</Panel>
      <Panel title="Most viewed today">{d.top_pages_today.length === 0 ? <p className="form-note">No views yet today.</p> : d.top_pages_today.map(p => <div className="bar-row" key={p.path}><span className="mono">{p.path}</span><b>{p.n}</b><i><u style={{ width: `${(p.n / (d.top_pages_today[0]?.n || 1)) * 100}%` }}/></i></div>)}</Panel>
    </div>
    <Panel title="Page views, last 24 hours">
      {d.hourly.length === 0 ? <p className="form-note">No traffic recorded yet.</p> : <div className="hour-chart" role="img" aria-label="Page views per hour">{d.hourly.map(h => <div key={h.hour} title={`${h.hour.slice(11)} · ${h.views} views · ${h.visitors} visitors`}><i style={{ height: `${Math.max(4, (h.views / peak) * 100)}%` }}/><small>{h.hour.slice(11, 13)}</small></div>)}</div>}
    </Panel>
    <div className="pay-layout">
      <Panel title="Top locations (7 days)">{d.countries.length ? d.countries.map(c => <div className="bar-row" key={c.name}><span><Globe2 size={13}/> {c.name}</span><b>{c.n}</b></div>) : <p className="form-note">No location data yet.</p>}</Panel>
      <Panel title="Devices (7 days)">{d.devices.length ? d.devices.map(c => <div className="bar-row" key={c.name}><span><Laptop size={13}/> {c.name}</span><b>{c.n}</b></div>) : <p className="form-note">No data yet.</p>}</Panel>
      <Panel title="Where visitors come from">{d.referrers.length ? d.referrers.map(c => <div className="bar-row" key={c.name}><span>{c.name}</span><b>{c.n}</b></div>) : <p className="form-note">Mostly direct visits.</p>}</Panel>
    </div>
    {open && <VisitDetail id={open} onClose={() => setOpen(null)}/>}
  </>;
}
