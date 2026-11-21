import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';
import { ChevronLeft, FileDown } from 'lucide-react';
import { api } from '../../lib/api';
import { downloadLetterheadPdf } from '../../lib/pdf';
import { useSettings } from '../../hooks/useApi';
import { EmptyState, ErrorState, LoadingState } from '../../components/States';
import { PageTitle, Panel, Pill } from '../../components/Workspace';
import { REQUIRED_PCT, pct, shortDate, timeOf, type CourseMatrix, type RecordDetail, type RecordsState } from './attendanceApi';

const slug = (v: string) => v.replace(/[^A-Za-z0-9]+/g, '-').replace(/^-|-$/g, '');

function LectureDetail({ id, level, onBack }: { id: string; level: string; onBack: () => void }) {
  const { data: settings } = useSettings();
  const q = useQuery({ queryKey: ['portal', 'attendance', 'record', id], queryFn: ({ signal }) => api.get<RecordDetail>(`portal/attendance/records/${id}`, signal), retry: false });
  const [busy, setBusy] = useState(false);
  const rows = useMemo(() => {
    if (!q.data) return [];
    const byUser = new Map(q.data.marks.map(m => [m.user_id, m]));
    return q.data.roster.map(r => { const m = byUser.get(r.id); return { ...r, mark: m && m.status !== 'rejected' ? m : null, pending: m?.status === 'pending' }; });
  }, [q.data]);
  if (q.isLoading) return <LoadingState/>;
  if (q.error || !q.data) return <ErrorState error={q.error ?? new Error('Record unavailable')}/>;
  const s = q.data.session; const present = rows.filter(r => r.mark?.status === 'verified').length;
  const pdf = async () => {
    setBusy(true);
    try {
      await downloadLetterheadPdf({
        title: `Lecture attendance register`, subtitle: `${s.code} · ${s.title}`, fileName: `attendance-${slug(s.code)}-${s.lecture_date}.pdf`,
        details: [['Course', `${s.code} ${s.title}`], ['Level', `${level} level`], ['Session', s.session], ['Lecture date', s.lecture_date], ['Opened by', q.data.started_by ?? '-'], ['Present', `${present} of ${rows.length} students`]],
        head: ['S/N', 'Name', 'Matric number', 'Status', 'Time', 'Marked by'], columnWidths: [12, 62, 40, 24, 18, 26],
        body: rows.map((r, i) => [i + 1, r.full_name, r.matric_number ?? '', r.mark?.status === 'verified' ? 'Present' : r.pending ? 'Waiting' : 'Absent', r.mark?.status === 'verified' && r.mark.method === 'device' ? timeOf(r.mark.marked_at) : '', r.mark?.status === 'verified' ? (r.mark.method === 'rep' ? 'Class rep' : 'App') : '']),
        note: 'Present means the student marked attendance in the lecture window on their own phone, or was signed in by the class rep. Waiting marks were not approved at the time this register was printed.',
        signatures: ['Course Rep', 'Lecturer'],
      }, settings);
      toast.success('Attendance PDF downloaded');
    } catch { toast.error('Could not create the PDF'); } finally { setBusy(false); }
  };
  return <>
    <button className="text-action study-toggle" onClick={onBack}><ChevronLeft size={16}/> All lectures</button>
    <Panel title={`${s.code} · ${s.lecture_date}`} action={<button className="button button-green btn-sm" disabled={busy} onClick={() => void pdf()}><FileDown size={14}/> {busy ? 'Preparing…' : 'Download PDF'}</button>}>
      <p className="field-hint">{s.title}. {present} present, {rows.filter(r => r.pending).length} waiting, {rows.filter(r => !r.mark).length} absent.</p>
      <div className="res-table-wrap"><table className="res-table"><thead><tr><th>Student</th><th>Status</th><th>Time</th><th>By</th></tr></thead><tbody>{rows.map(r => <tr key={r.id}>
        <td className="name"><b>{r.full_name}</b><span>{r.matric_number}</span></td>
        <td>{r.mark ? <Pill value={r.mark.status}/> : <span className="rep-no">Absent</span>}</td><td>{r.mark?.method === 'device' ? timeOf(r.mark.marked_at) : '-'}</td><td>{r.mark ? (r.mark.method === 'rep' ? 'Class rep' : 'App') : '-'}</td>
      </tr>)}</tbody></table></div>
    </Panel>
  </>;
}

function CourseView({ courseId, onBack }: { courseId: string; onBack: () => void }) {
  const { data: settings } = useSettings();
  const q = useQuery({ queryKey: ['portal', 'attendance', 'course', courseId], queryFn: ({ signal }) => api.get<CourseMatrix>(`portal/attendance/records/course/${courseId}`, signal), retry: false });
  const [busy, setBusy] = useState(false);
  if (q.isLoading) return <LoadingState/>;
  if (q.error || !q.data) return <ErrorState error={q.error ?? new Error('Course record unavailable')}/>;
  const d = q.data; const total = d.sessions.length;
  const pdf = async () => {
    setBusy(true);
    try {
      await downloadLetterheadPdf({
        title: 'Course attendance summary', subtitle: `${d.course.code} · ${d.course.title}`, landscape: d.sessions.length > 6, fileName: `attendance-summary-${slug(d.course.code)}.pdf`,
        details: [['Course', `${d.course.code} ${d.course.title}`], ['Level', `${d.level} level`], ['Session', d.session], ['Lectures held', String(total)]],
        head: ['S/N', 'Name', 'Matric number', ...d.sessions.map(s => shortDate(s.lecture_date)), 'Total', '%'],
        body: d.members.map((m, i) => { const n = m.present.length; return [i + 1, m.full_name, m.matric_number ?? '', ...d.sessions.map(s => (m.present.includes(s.id) ? 'P' : '-')), `${n}/${total}`, `${pct(n, total) ?? 0}%`]; }),
        note: `P = present, - = absent. Students under ${REQUIRED_PCT}% are not eligible to sit the course examination.`, signatures: ['Course Rep', 'Lecturer'],
      }, settings);
      toast.success('Summary PDF downloaded');
    } catch { toast.error('Could not create the PDF'); } finally { setBusy(false); }
  };
  return <>
    <button className="text-action study-toggle" onClick={onBack}><ChevronLeft size={16}/> All lectures</button>
    <Panel title={`${d.course.code} summary`} action={<button className="button button-green btn-sm" disabled={busy} onClick={() => void pdf()}><FileDown size={14}/> {busy ? 'Preparing…' : 'Download PDF'}</button>}>
      <p className="field-hint">{d.course.title}. {total} lecture{total === 1 ? '' : 's'} held this session.</p>
      <div className="res-table-wrap"><table className="res-table"><thead><tr><th>Student</th>{d.sessions.map(s => <th key={s.id} className="num">{shortDate(s.lecture_date)}</th>)}<th className="num">%</th></tr></thead><tbody>{d.members.map(m => { const n = m.present.length; const p = pct(n, total) ?? 0; return <tr key={m.id}><td className="name"><b>{m.full_name}</b><span>{m.matric_number}</span></td>{d.sessions.map(s => <td key={s.id} className="num">{m.present.includes(s.id) ? 'P' : '-'}</td>)}<td className={`num att-pct${p < REQUIRED_PCT ? ' low' : ''}`}>{p}%</td></tr>; })}</tbody></table></div>
    </Panel>
  </>;
}

export function PortalAttendanceRecords() {
  const q = useQuery({ queryKey: ['portal', 'attendance', 'records'], queryFn: ({ signal }) => api.get<RecordsState>('portal/attendance/records', signal), retry: false });
  const [view, setView] = useState<{ kind: 'lecture' | 'course'; id: string } | null>(null);
  if (q.isLoading) return <LoadingState/>;
  if (q.error || !q.data) return <ErrorState error={q.error ?? new Error('Records unavailable')}/>;
  const d = q.data;
  const courses = [...new Map(d.sessions.map(s => [s.course_id, s])).values()];
  return <>
    <PageTitle eyebrow="CLASS REP DESK" title="Attendance records" description={`Every lecture marked for ${d.level} level in ${d.session}. Open one to see who was present, and download it as a PDF on the NACOS MOUAU letterhead.`}/>
    {view?.kind === 'lecture' ? <LectureDetail id={view.id} level={d.level} onBack={() => setView(null)}/> : view?.kind === 'course' ? <CourseView courseId={view.id} onBack={() => setView(null)}/> : d.sessions.length === 0 ? <EmptyState title="No lectures recorded yet" text="Records appear here once you open attendance for a lecture."/> : <>
      <Panel title="Course summaries"><div className="att-chips">{courses.map(c => <button key={c.course_id} onClick={() => setView({ kind: 'course', id: c.course_id })}><b>{c.code}</b><span>{d.sessions.filter(s => s.course_id === c.course_id).length} lectures</span></button>)}</div></Panel>
      <Panel title="Lectures"><ul className="att-recent">{d.sessions.map(s => <li key={s.id}><button onClick={() => setView({ kind: 'lecture', id: s.id })}><b>{s.code}</b><span>{s.title} · {s.lecture_date}</span><em>{s.verified} of {d.class_size} present{s.pending ? ` · ${s.pending} waiting` : ''}{s.by_rep ? ` · ${s.by_rep} by rep` : ''}</em></button></li>)}</ul></Panel>
    </>}
  </>;
}
