import { useEffect, useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { CalendarDays, Download, FileText, HeartHandshake, IdCard, KeyRound, Megaphone, Vote, Wallet } from 'lucide-react';
import { toast } from 'sonner';
import { api } from '../../lib/api';
import { naira, when } from '../../lib/money';
import { EmptyState, ErrorState, LoadingState } from '../../components/States';
import { FileUpload } from '../../components/FileUpload';
import { PageTitle, Panel, Pill, Stat } from '../../components/Workspace';
import { useSession } from '../../hooks/useSession';

interface Overview { session: string; profile: Record<string, string | null>; membership: { membership_id: string } | null; dues: { status: string; amount_minor: number }; counts: { events: number; open_elections: number }; notices: Array<{ id: string; title: string; body: string; priority: string; published_at: string }> }

export function PortalOverview() {
  const q = useQuery({ queryKey: ['portal', 'overview'], queryFn: ({ signal }) => api.get<Overview>('portal/overview', signal), retry: false });
  if (q.isLoading) return <LoadingState/>;
  if (q.error || !q.data) return <ErrorState error={q.error}/>;
  const d = q.data; const first = String(d.profile.full_name ?? '').split(' ')[0];
  return <>
    <PageTitle eyebrow={`${d.session} SESSION`} title={`Welcome, ${first}`} description="Your membership, dues and activity at a glance."/>
    <div className="count-grid">
      <Stat label="Membership ID" value={<span className="mono stat-id">{d.membership?.membership_id ?? '—'}</span>}/>
      <Stat label={`${d.session} dues`} value={<Pill value={d.dues.status}/>} hint={d.dues.status === 'paid' ? 'You can vote' : d.dues.amount_minor ? naira(d.dues.amount_minor) : undefined}/>
      <Stat label="My events" value={d.counts.events}/>
      <Stat label="Open elections" value={d.counts.open_elections}/>
    </div>
    <div className="quick-cards">
      <Link to="/portal/id-card" className="quick-card"><IdCard size={22}/><b>Digital ID</b><small>Show your membership card</small></Link>
      <Link to="/portal/payments" className="quick-card"><Wallet size={22}/><b>Pay dues</b><small>Paystack or bank teller</small></Link>
      <Link to="/portal/elections" className="quick-card"><Vote size={22}/><b>Elections</b><small>Vote and apply</small></Link>
      <Link to="/portal/welfare" className="quick-card"><HeartHandshake size={22}/><b>Welfare</b><small>Ask the executives for help</small></Link>
    </div>
    <Panel title="Notices" action={<Link className="text-action" to="/news?tab=announcements">All notices</Link>}>
      {d.notices.length === 0 ? <EmptyState title="No notices" text="New association notices will show here." icon={<Megaphone size={22}/>}/> : <div className="record-list">{d.notices.map(n => <article className="record-row" key={n.id}><div><strong>{n.title}</strong><span>{n.body.slice(0, 140)}</span></div><time>{when(n.published_at)}</time></article>)}</div>}
    </Panel>
  </>;
}

interface Me { full_name: string; email: string; phone: string | null; matric_number: string | null; academic_level: string | null; status: string; profile_photo_url: string | null }
export function PortalMembership() {
  const client = useQueryClient(); const { session } = useSession();
  const q = useQuery({ queryKey: ['portal', 'me'], queryFn: ({ signal }) => api.get<Me>('members/me', signal), retry: false });
  const [form, setForm] = useState({ full_name: '', phone: '' }); const [photo, setPhoto] = useState('');
  useEffect(() => { if (q.data) setForm({ full_name: q.data.full_name ?? '', phone: q.data.phone ?? '' }); }, [q.data]);
  if (q.isLoading) return <LoadingState/>;
  if (q.error || !q.data) return <ErrorState error={q.error}/>;
  const save = async (e: FormEvent) => { e.preventDefault(); try { await api.put('members/me', { ...form, ...(photo ? { profile_photo_url: photo } : {}) }); toast.success('Profile updated'); setPhoto(''); await client.invalidateQueries({ queryKey: ['portal'] }); } catch (err) { toast.error(err instanceof Error ? err.message : 'Could not save'); } };
  const m = q.data;
  return <>
    <PageTitle eyebrow="MEMBER SPACE" title="My membership" description="Keep your details up to date. Your photo appears on your digital ID."/>
    <div className="pay-layout">
      <Panel title="Membership record">
        <dl className="detail-list">
          <div><dt>Matric / Reg. number</dt><dd className="mono">{m.matric_number ?? '—'}</dd></div>
          <div><dt>Level</dt><dd>{m.academic_level ? `${m.academic_level} Level` : '—'}</dd></div>
          <div><dt>Session</dt><dd>{session}</dd></div>
          <div><dt>Email</dt><dd>{m.email}</dd></div>
          <div><dt>Status</dt><dd><Pill value={m.status}/></dd></div>
        </dl>
        <small className="form-note">To change your matric number, level or email, contact the executives.</small>
      </Panel>
      <Panel title="Edit profile">
        <form className="form-stack" onSubmit={save}>
          <label className="field"><span>Full name</span><input value={form.full_name} onChange={e => setForm(v => ({ ...v, full_name: e.target.value }))}/></label>
          <label className="field"><span>Phone number</span><input type="tel" value={form.phone} onChange={e => setForm(v => ({ ...v, phone: e.target.value }))}/></label>
          <div className="field"><span>Profile photo (for your ID)</span><FileUpload purpose="profile" value={photo || m.profile_photo_url} accept="image/jpeg,image/png,image/webp" label="Upload a clear passport-style photo" onChange={f => setPhoto(f?.url ?? '')}/></div>
          <button className="button button-green">Save changes</button>
        </form>
      </Panel>
    </div>
  </>;
}

export function PortalEvents() {
  const q = useQuery({ queryKey: ['portal', 'events'], queryFn: ({ signal }) => api.get<Array<{ id: string; title: string; slug: string; starts_at: string; venue: string | null; status: string; ticket_code: string | null }>>('portal/events', signal), retry: false });
  return <>
    <PageTitle eyebrow="MEMBER SPACE" title="Events & tickets" description="Events you registered for, with your ticket codes."/>
    <Panel action={<Link className="text-action" to="/events">Browse events</Link>}>
      {q.isLoading ? <LoadingState/> : q.error ? <ErrorState error={q.error}/> : !q.data?.length ? <EmptyState title="No registrations yet" text="Register for an event from the Events page and your ticket will show here." icon={<CalendarDays size={22}/>}/> :
        <div className="record-list">{q.data.map(r => <article className="record-row" key={r.id}><div><strong>{r.title}</strong><span>{when(r.starts_at)}{r.venue ? ` · ${r.venue}` : ''}</span>{r.ticket_code && <span className="mono ticket-code">Ticket {r.ticket_code.slice(0, 12)}</span>}</div><div className="row-right"><Pill value={r.status}/><Link className="text-action" to={`/events/${r.slug}`}>View</Link></div></article>)}</div>}
    </Panel>
  </>;
}

export function PortalWelfare() {
  const client = useQueryClient();
  const q = useQuery({ queryKey: ['portal', 'welfare'], queryFn: ({ signal }) => api.get<Array<{ id: string; category: string; subject: string; details: string; status: string; response: string | null; created_at: string }>>('portal/welfare', signal), retry: false });
  const [f, setF] = useState({ category: 'General', subject: '', details: '' }); const [busy, setBusy] = useState(false);
  const submit = async (e: FormEvent) => { e.preventDefault(); setBusy(true); try { await api.post('portal/welfare', f); toast.success('Request sent to the executives'); setF({ category: 'General', subject: '', details: '' }); await client.invalidateQueries({ queryKey: ['portal', 'welfare'] }); } catch (err) { toast.error(err instanceof Error ? err.message : 'Could not send'); } finally { setBusy(false); } };
  return <>
    <PageTitle eyebrow="MEMBER SPACE" title="Welfare" description="Tell the executives if you need help. Requests are private."/>
    <div className="pay-layout">
      <Panel title="New request"><form className="form-stack" onSubmit={submit}>
        <label className="field"><span>Category</span><select value={f.category} onChange={e => setF(v => ({ ...v, category: e.target.value }))}>{['General', 'Academic', 'Health', 'Financial', 'Accommodation', 'Other'].map(c => <option key={c}>{c}</option>)}</select></label>
        <label className="field"><span>Subject</span><input value={f.subject} onChange={e => setF(v => ({ ...v, subject: e.target.value }))} required minLength={3}/></label>
        <label className="field"><span>What do you need?</span><textarea rows={5} value={f.details} onChange={e => setF(v => ({ ...v, details: e.target.value }))} required minLength={10}/></label>
        <button className="button button-green" disabled={busy}>{busy ? 'Sending…' : 'Send request'}</button>
      </form></Panel>
      <Panel title="My requests">{q.isLoading ? <LoadingState/> : !q.data?.length ? <EmptyState title="No requests" text="Your welfare requests and replies will show here." icon={<HeartHandshake size={22}/>}/> : <div className="record-list">{q.data.map(w => <article className="record-row" key={w.id}><div><strong>{w.subject}</strong><span>{w.category} · {when(w.created_at)}</span>{w.response && <span className="note-ok">Reply: {w.response}</span>}</div><Pill value={w.status}/></article>)}</div>}</Panel>
    </div>
  </>;
}

export function PortalDocuments() {
  const q = useQuery({ queryKey: ['portal', 'documents'], queryFn: ({ signal }) => api.get<Array<{ id: string; title: string; description: string | null; category: string; file_url: string; visibility: string }>>('portal/documents', signal), retry: false });
  return <>
    <PageTitle eyebrow="MEMBER SPACE" title="Documents" description="Constitution, forms and other association documents."/>
    <Panel>{q.isLoading ? <LoadingState/> : q.error ? <ErrorState error={q.error}/> : !q.data?.length ? <EmptyState title="No documents yet" text="Documents shared by the executives will appear here." icon={<FileText size={22}/>}/> : <div className="record-list">{q.data.map(d => <article className="record-row" key={d.id}><div><strong>{d.title}</strong><span>{d.category}{d.visibility === 'members' ? ' · Members only' : ''}{d.description ? ` · ${d.description}` : ''}</span></div><a className="icon-button" href={d.file_url} target="_blank" rel="noreferrer" aria-label={`Download ${d.title}`}><Download size={16}/></a></article>)}</div>}</Panel>
  </>;
}

export function PortalSettings() {
  const [f, setF] = useState({ current: '', next: '', again: '' }); const [busy, setBusy] = useState(false);
  const submit = async (e: FormEvent) => { e.preventDefault(); if (f.next !== f.again) { toast.error('The new passwords do not match.'); return; } setBusy(true); try { await api.put('portal/password', { current: f.current, next: f.next }); toast.success('Password changed'); setF({ current: '', next: '', again: '' }); } catch (err) { toast.error(err instanceof Error ? err.message : 'Could not change password'); } finally { setBusy(false); } };
  return <>
    <PageTitle eyebrow="MEMBER SPACE" title="Settings" description="Change your password."/>
    <Panel title="Change password"><form className="form-stack narrow" onSubmit={submit}>
      <label className="field"><span>Current password</span><input type="password" autoComplete="current-password" value={f.current} onChange={e => setF(v => ({ ...v, current: e.target.value }))} required/></label>
      <label className="field"><span>New password (12+ characters)</span><input type="password" autoComplete="new-password" value={f.next} onChange={e => setF(v => ({ ...v, next: e.target.value }))} required minLength={12}/></label>
      <label className="field"><span>Confirm new password</span><input type="password" autoComplete="new-password" value={f.again} onChange={e => setF(v => ({ ...v, again: e.target.value }))} required/></label>
      <button className="button button-green" disabled={busy}><KeyRound size={15}/> {busy ? 'Saving…' : 'Update password'}</button>
    </form></Panel>
  </>;
}
