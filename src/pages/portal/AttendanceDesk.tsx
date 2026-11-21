import { useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Check, Clock, Play, Radio, Search, Square, UserCheck, X } from 'lucide-react';
import { api } from '../../lib/api';
import { softPosition } from '../../lib/device';
import { ErrorState, LoadingState } from '../../components/States';
import { PageTitle, Panel, Pill } from '../../components/Workspace';
import { AttendanceExtras } from './AttendanceExtras';
import { DAYS, hhmm, leftText, useNow, type DeskState, type LiveState } from './attendanceApi';

function LiveCard({ id }: { id: string }) {
  const client = useQueryClient();
  const now = useNow();
  const live = useQuery({ queryKey: ['portal', 'attendance', 'live', id], queryFn: ({ signal }) => api.get<LiveState>(`portal/attendance/sessions/${id}`, signal), refetchInterval: 4000, retry: false });
  const refresh = async () => { await client.invalidateQueries({ queryKey: ['portal', 'attendance'] }); };
  useEffect(() => {
    const ping = () => { void softPosition(8000).then(p => (p ? api.post(`portal/attendance/sessions/${id}/location`, p) : undefined)).catch(() => undefined); };
    const t = window.setInterval(ping, 30_000); return () => window.clearInterval(t);
  }, [id]);
  const close = useMutation({ mutationFn: () => api.post(`portal/attendance/sessions/${id}/close`, {}), onSuccess: async () => { toast.success('Attendance closed'); await refresh(); }, onError: e => toast.error(e instanceof Error ? e.message : 'Could not close') });
  const approveAll = useMutation({ mutationFn: () => api.post(`portal/attendance/sessions/${id}/approve-pending`, {}), onSuccess: async () => { toast.success('Pending marks approved'); await refresh(); }, onError: e => toast.error(e instanceof Error ? e.message : 'Could not approve') });
  const review = useMutation({ mutationFn: (v: { id: string; status: 'verified' | 'rejected' }) => api.put(`portal/attendance/marks/${v.id}`, { status: v.status }), onSuccess: refresh, onError: e => toast.error(e instanceof Error ? e.message : 'Could not update') });
  const remove = useMutation({ mutationFn: (markId: string) => api.delete(`portal/attendance/marks/${markId}`), onSuccess: refresh, onError: e => toast.error(e instanceof Error ? e.message : 'Could not remove') });
  if (!live.data) return <LoadingState/>;
  const s = live.data.session; const open = s.status === 'open'; const marks = live.data.marks;
  const verified = marks.filter(m => m.status === 'verified').length; const pending = marks.filter(m => m.status === 'pending').length;
  return <>
    <Panel className="att-open">
      <div className="att-head"><div><span className={`att-live${open ? '' : ' off'}`}>{open ? 'Open now' : 'Closed'}</span><h2>{s.code}</h2><p>{s.title} · {s.lecture_date}</p></div><div className="att-timer"><Clock size={16}/> {open ? leftText(s.closes_at, now) : 'Closed'}</div></div>
      {open && <div className="att-board"><div><small>Attendance is open</small><strong className="att-bigcode">{leftText(s.closes_at, now)}</strong><span>Students open their Attendance page and tap Mark me present. It closes by itself when the time runs out.</span></div></div>}
      <div className="rep-stats"><div><Check size={18}/><b>{verified}</b><span>Verified</span></div><div><Radio size={18}/><b>{pending}</b><span>Waiting</span></div><div><UserCheck size={18}/><b>{marks.length}</b><span>Total marks</span></div></div>
      <div className="att-actions">
        {pending > 0 && <button className="button button-outline btn-sm" disabled={approveAll.isPending} onClick={() => { if (window.confirm(`Approve all ${pending} waiting marks?`)) approveAll.mutate(); }}>Approve all waiting</button>}
        {open && <button className="button btn-sm att-stop" disabled={close.isPending} onClick={() => { if (window.confirm('Close attendance now?')) close.mutate(); }}><Square size={13}/> Close now</button>}
      </div>
    </Panel>
    <Panel title="Marks">
      {marks.length === 0 ? <p className="field-hint">No one has marked yet.</p> : <div className="res-table-wrap"><table className="res-table"><thead><tr><th>Student</th><th>Status</th><th className="num">Distance</th><th/></tr></thead><tbody>{marks.map(m => <tr key={m.id}>
        <td className="name"><b>{m.full_name}</b><span>{m.matric_number}{m.method === 'rep' ? ' · signed by rep' : ''}{m.flags ? ` · ⚠ ${m.flags.replace('same_fingerprint', 'same device type as another student').replace('far_from_rep', 'location far from you')}` : ''}</span></td>
        <td><Pill value={m.status}/></td><td className="num">{m.distance_m === null ? '-' : `${m.distance_m} m`}</td>        <td><div className="record-actions">{m.status !== 'verified' && <button aria-label="Approve" onClick={() => review.mutate({ id: m.id, status: 'verified' })}><Check size={15}/></button>}{m.status !== 'rejected' && m.method === 'device' && <button aria-label="Reject" onClick={() => review.mutate({ id: m.id, status: 'rejected' })}><X size={15}/></button>}{m.method === 'rep' && <button aria-label="Remove" onClick={() => remove.mutate(m.id)}><X size={15}/></button>}</div></td>
      </tr>)}</tbody></table></div>}
    </Panel>
  </>;
}

function StartCard({ desk }: { desk: DeskState }) {
  const client = useQueryClient();
  const [course, setCourse] = useState('');
  const [busy, setBusy] = useState('');
  const start = useMutation({
    mutationFn: async () => { setBusy('Checking your location…'); const pos = await softPosition(8000); setBusy('Opening attendance…'); return api.post('portal/attendance/start', { ...(course ? { course_id: course } : {}), ...(pos ?? {}) }); },
    onSuccess: async () => { setBusy(''); toast.success('Attendance is open'); await client.invalidateQueries({ queryKey: ['portal', 'attendance'] }); },
    onError: e => { setBusy(''); toast.error(e instanceof Error ? e.message : 'Could not start attendance'); },
  });
  const s = desk.suggested;
  return <Panel title="Start attendance">
    {s ? <div className="att-suggest"><Clock size={18}/><div><b>{s.code} · {s.title}</b><span>Scheduled {DAYS[s.day_of_week]} {hhmm(s.start_min)} to {hhmm(s.end_min)}{s.venue ? ` · ${s.venue}` : ''}. The course and today's date are set for you.</span></div></div>
      : <div className="form-stack"><p className="field-hint">No lecture is scheduled for right now. Choose the course. Today's date is set automatically.</p>
        <label className="field"><span>Course</span><select value={course} onChange={e => setCourse(e.target.value)}><option value="">Choose course</option>{desk.courses.map(c => <option key={c.id} value={c.id}>{c.code} · {c.title}</option>)}</select></label></div>}
    <p className="field-hint">Students have {desk.rules.window_minutes} minutes to mark. If your location is on, marks from far away are flagged for your review. Attendance works without it.</p>
    <button className="button button-green" disabled={start.isPending || (!s && !course)} onClick={() => start.mutate()}><Play size={15}/> {start.isPending ? busy || 'Starting…' : 'Start attendance'}</button>
  </Panel>;
}

function ManualMark({ desk, targetId }: { desk: DeskState; targetId: string | null }) {
  const client = useQueryClient();
  const [picked, setPicked] = useState<Set<string>>(new Set()); const [search, setSearch] = useState('');
  const list = useMemo(() => desk.roster.filter(m => `${m.full_name} ${m.matric_number ?? ''}`.toLowerCase().includes(search.toLowerCase())), [desk.roster, search]);
  const sign = useMutation({
    mutationFn: () => api.post<{ marked: number }>(`portal/attendance/sessions/${targetId}/manual`, { user_ids: [...picked], confirm: true }),
    onSuccess: async r => { toast.success(`${r.marked} student${r.marked === 1 ? '' : 's'} signed and marked present`); setPicked(new Set()); await client.invalidateQueries({ queryKey: ['portal', 'attendance'] }); },
    onError: e => toast.error(e instanceof Error ? e.message : 'Could not mark'),
  });
  if (!targetId) return null;
  return <Panel title="Sign for students without a smartphone" action={<label className="study-search"><Search size={15}/><input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search" aria-label="Search students"/></label>}>
    <p className="field-hint">Tick students who are in the lecture but cannot use the app. Your name is recorded as the signer.</p>
    <ul className="att-roster">{list.map(m => <li key={m.id}><label><input type="checkbox" checked={picked.has(m.id)} onChange={() => setPicked(prev => { const n = new Set(prev); if (n.has(m.id)) n.delete(m.id); else n.add(m.id); return n; })}/><span><b>{m.full_name}</b><small>{m.matric_number}</small></span></label></li>)}</ul>
    <button className="button button-green" disabled={picked.size === 0 || sign.isPending} onClick={() => { if (window.confirm(`I confirm that these ${picked.size} student(s) were present at this lecture. Sign and mark them?`)) sign.mutate(); }}><UserCheck size={15}/> Sign and mark {picked.size || ''} present</button>
  </Panel>;
}

export function PortalAttendanceDesk() {
  const desk = useQuery({ queryKey: ['portal', 'attendance', 'desk'], queryFn: ({ signal }) => api.get<DeskState>('portal/attendance/desk', signal), retry: false, refetchInterval: 20_000 });
  const [viewId, setViewId] = useState<string | null>(null);
  if (desk.isLoading) return <LoadingState/>;
  if (desk.error || !desk.data) return <ErrorState error={desk.error ?? new Error('Attendance desk unavailable')}/>;
  const d = desk.data; const activeId = viewId ?? d.open?.id ?? d.recent[0]?.id ?? null;
  return <>
    <PageTitle eyebrow="CLASS REP DESK" title={`${d.level} level attendance`} description="Open attendance for a lecture, watch marks come in, and review anything that needs your call."/>
    {!d.open && <StartCard desk={d}/>}
    {activeId && <LiveCard id={activeId}/>}
    <ManualMark desk={d} targetId={activeId}/>
    {d.recent.length > 0 && <Panel title="Recent lectures"><ul className="att-recent">{d.recent.map(r => <li key={r.id} className={r.id === activeId ? 'on' : ''}><button onClick={() => setViewId(r.id)}><b>{r.code}</b><span>{r.title} · {r.lecture_date}</span><em>{r.verified} verified{r.pending ? ` · ${r.pending} waiting` : ''}</em></button></li>)}</ul></Panel>}
    <AttendanceExtras desk={d}/>
  </>;
}
