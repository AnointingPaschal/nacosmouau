import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { HeartHandshake, ShieldCheck, Wallet } from 'lucide-react';
import { toast } from 'sonner';
import { api } from '../../lib/api';
import { naira, when } from '../../lib/money';
import { EmptyState, ErrorState, LoadingState } from '../../components/States';
import { PageTitle, Panel, Pill, Stat } from '../../components/Workspace';

interface Overview { session: string; members: { total: number; active: number; pending: number }; pending_payments: number; dues: { payers: number; total: number; amount_minor: number }; open_elections: number; recent_payments: Array<{ id: string; amount_minor: number; status: string; purpose: string | null; method: string | null; created_at: string; full_name: string | null }>; by_level: Array<{ level: string; n: number }>; bank: { configured: boolean } }

export function AdminOverview() {
  const q = useQuery({ queryKey: ['staff', 'overview'], queryFn: ({ signal }) => api.get<Overview>('staff/overview', signal), retry: false });
  if (q.isLoading) return <LoadingState/>;
  if (q.error || !q.data) return <ErrorState error={q.error}/>;
  const d = q.data;
  return <>
    <PageTitle eyebrow={`${d.session} SESSION`} title="Dashboard" description="What needs your attention today."/>
    <div className="count-grid">
      <Stat label="Active members" value={d.members.active ?? 0} hint={`${d.members.total ?? 0} registered`}/>
      <Stat label="Awaiting approval" value={d.members.pending ?? 0}/>
      <Stat label="Tellers to review" value={d.pending_payments}/>
      <Stat label="Dues collected" value={naira(d.dues.total)} hint={`${d.dues.payers} members paid`}/>
    </div>
    {(!d.dues.amount_minor || !d.bank.configured) && <div className="notice-bar"><ShieldCheck size={16}/><span>Set the dues amount and bank details in <Link to="/admin/settings">Settings</Link> so members can pay.</span></div>}
    <div className="dashboard-grid">
      <Panel title="Active members by level">{d.by_level.length === 0 ? <EmptyState title="No members yet" text="Approved members will be counted here."/> : <div className="chart-box"><ResponsiveContainer width="100%" height="100%"><BarChart data={d.by_level}><CartesianGrid strokeDasharray="3 3" vertical={false}/><XAxis dataKey="level"/><YAxis allowDecimals={false}/><Tooltip/><Bar dataKey="n" fill="#008751" radius={[6, 6, 0, 0]}/></BarChart></ResponsiveContainer></div>}</Panel>
      <Panel title="Recent payments" action={<Link className="text-action" to="/admin/payments">All payments</Link>}>
        {d.recent_payments.length === 0 ? <EmptyState title="No payments yet" text="Payments will show here." icon={<Wallet size={22}/>}/> : <div className="record-list">{d.recent_payments.map(p => <article className="record-row" key={p.id}><div><strong>{p.full_name ?? 'Member'}</strong><span>{p.purpose === 'dues' ? 'Dues' : 'Candidate form'} · {when(p.created_at)}</span></div><div className="row-right"><b>{naira(p.amount_minor)}</b><Pill value={p.status}/></div></article>)}</div>}
      </Panel>
    </div>
  </>;
}

export function AdminFinance() {
  const q = useQuery({ queryKey: ['staff', 'finance'], queryFn: ({ signal }) => api.get<{ by_session: Array<{ session: string; purpose: string; payments: number; total: number }>; by_method: Array<{ method: string; payments: number; total: number }>; pending: { n: number; total: number } }>('staff/finance', signal), retry: false });
  if (q.isLoading) return <LoadingState/>;
  if (q.error || !q.data) return <ErrorState error={q.error}/>;
  const d = q.data; const total = d.by_session.reduce((a, r) => a + r.total, 0);
  return <>
    <PageTitle eyebrow="FINANCE" title="Finance summary" description="Money collected from approved payments."/>
    <div className="count-grid"><Stat label="Total collected" value={naira(total)}/><Stat label="Awaiting approval" value={naira(d.pending.total)} hint={`${d.pending.n} payments`}/><Stat label="Online (Paystack)" value={naira(d.by_method.find(m => m.method === 'paystack')?.total ?? 0)}/><Stat label="Bank teller" value={naira(d.by_method.find(m => m.method === 'transfer')?.total ?? 0)}/></div>
    <Panel title="By session">{d.by_session.length === 0 ? <EmptyState title="No approved payments yet" text="Totals will appear once payments are approved." icon={<Wallet size={22}/>}/> : <div className="record-list">{d.by_session.map((r, i) => <article className="record-row" key={i}><div><strong>{r.session}</strong><span>{r.purpose === 'dues' ? 'NACOS dues' : r.purpose === 'candidate_form' ? 'Candidate forms' : r.purpose} · {r.payments} payments</span></div><b>{naira(r.total)}</b></article>)}</div>}</Panel>
  </>;
}

export function AdminAnalytics() {
  const q = useQuery({ queryKey: ['staff', 'analytics'], queryFn: ({ signal }) => api.get<{ session: string; active_members: number; dues_payers: number; by_level: Array<{ label: string; value: number }>; signups: Array<{ label: string; value: number }>; event_registrations: Array<{ label: string; value: number }> }>('staff/analytics', signal), retry: false });
  if (q.isLoading) return <LoadingState/>;
  if (q.error || !q.data) return <ErrorState error={q.error}/>;
  const d = q.data; const rate = d.active_members ? Math.round((d.dues_payers / d.active_members) * 100) : 0;
  const chart = (title: string, data: Array<{ label: string; value: number }>) => <Panel title={title}>{data.length === 0 ? <EmptyState title="No data yet" text="This chart fills in as members and events grow."/> : <div className="chart-box"><ResponsiveContainer width="100%" height="100%"><BarChart data={data}><CartesianGrid strokeDasharray="3 3" vertical={false}/><XAxis dataKey="label" tick={{ fontSize: 11 }}/><YAxis allowDecimals={false}/><Tooltip/><Bar dataKey="value" fill="#008751" radius={[6, 6, 0, 0]}/></BarChart></ResponsiveContainer></div>}</Panel>;
  return <>
    <PageTitle eyebrow={`${d.session} SESSION`} title="Analytics" description="Membership growth and dues collection."/>
    <div className="count-grid"><Stat label="Active members" value={d.active_members}/><Stat label="Paid dues" value={d.dues_payers}/><Stat label="Dues rate" value={`${rate}%`}/><Stat label="Unpaid" value={Math.max(0, d.active_members - d.dues_payers)}/></div>
    <div className="dashboard-grid">{chart('Members by level', d.by_level)}{chart('New sign-ups by month', d.signups)}</div>
    {chart('Event registrations', d.event_registrations)}
  </>;
}

export function AdminAudit() {
  const q = useQuery({ queryKey: ['staff', 'audit'], queryFn: ({ signal }) => api.get<Array<{ id: string; action: string; resource: string; details_json: string | null; created_at: string; actor: string | null }>>('staff/audit', signal), retry: false });
  return <>
    <PageTitle eyebrow="SECURITY" title="Audit log" description="Who changed what, newest first."/>
    <Panel>{q.isLoading ? <LoadingState/> : q.error ? <ErrorState error={q.error}/> : !q.data?.length ? <EmptyState title="Nothing logged yet" text="Approvals, role changes and settings updates are recorded here."/> : <div className="record-list">{q.data.map(a => <article className="record-row" key={a.id}><div><strong>{a.actor ?? 'System'} · {a.action} {a.resource}</strong>{a.details_json && <span className="mono">{a.details_json.slice(0, 140)}</span>}</div><time>{when(a.created_at)}</time></article>)}</div>}</Panel>
  </>;
}

interface W { id: string; category: string; subject: string; details: string; status: string; response: string | null; created_at: string; full_name: string; matric_number: string | null }
export function AdminWelfare() {
  const client = useQueryClient();
  const q = useQuery({ queryKey: ['staff', 'welfare'], queryFn: ({ signal }) => api.get<W[]>('staff/welfare', signal), retry: false });
  const [reply, setReply] = useState<Record<string, string>>({});
  const act = async (w: W, status: string) => { try { await api.patch(`staff/welfare/${w.id}`, { status, response: reply[w.id] ?? w.response ?? '' }); toast.success('Request updated'); await client.invalidateQueries({ queryKey: ['staff', 'welfare'] }); } catch (e) { toast.error(e instanceof Error ? e.message : 'Could not update'); } };
  return <>
    <PageTitle eyebrow="MEMBER CARE" title="Welfare requests" description="Private requests from members. Reply and mark them resolved."/>
    {q.isLoading ? <LoadingState/> : q.error ? <ErrorState error={q.error}/> : !q.data?.length ? <Panel><EmptyState title="No requests" text="Welfare requests from members will appear here." icon={<HeartHandshake size={22}/>}/></Panel> :
      <div className="message-list">{q.data.map(w => <article className="message-card" key={w.id}><div className="panel-heading"><div><strong>{w.subject}</strong><span>{w.full_name} · {w.matric_number ?? ''} · {w.category} · {when(w.created_at)}</span></div><Pill value={w.status}/></div><p>{w.details}</p>
        <textarea rows={2} placeholder="Write a reply to the member" value={reply[w.id] ?? w.response ?? ''} onChange={e => setReply(v => ({ ...v, [w.id]: e.target.value }))}/>
        <div className="controls-row"><button className="button button-outline btn-sm" onClick={() => void act(w, 'in_review')}>Mark in review</button><button className="button button-green btn-sm" onClick={() => void act(w, 'resolved')}>Resolve</button><button className="button button-outline btn-sm" onClick={() => void act(w, 'declined')}>Decline</button></div></article>)}</div>}
  </>;
}

export function AdminRoles() {
  const q = useQuery({ queryKey: ['staff', 'roles'], queryFn: ({ signal }) => api.get<Array<{ id: string; name: string; description: string | null; permissions: number; members: number }>>('staff/roles', signal), retry: false });
  return <>
    <PageTitle eyebrow="ACCESS" title="Roles & permissions" description="What each role can do. Give roles to members under Members." action={<Link className="button button-green" to="/admin/members"><ShieldCheck size={15}/> Assign roles</Link>}/>
    <Panel>{q.isLoading ? <LoadingState/> : q.error ? <ErrorState error={q.error}/> : <div className="record-list">{(q.data ?? []).map(r => <article className="record-row" key={r.id}><div><strong>{r.name}</strong><span>{r.description}</span></div><div className="row-right"><span className="mono">{r.permissions} permissions</span><b>{r.members} {r.members === 1 ? 'member' : 'members'}</b></div></article>)}</div>}</Panel>
  </>;
}
