import { useState, type FormEvent } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Download, Trash2 } from 'lucide-react';
import { api } from '../../lib/api';
import { Panel } from '../../components/Workspace';
import { DAYS, REQUIRED_PCT, hhmm, pct, toMinutes, type DeskState, type ReportState } from './attendanceApi';

export function AttendanceExtras({ desk }: { desk: DeskState }) {
  const client = useQueryClient();
  const [form, setForm] = useState({ course_id: '', day: '1', start: '08:00', end: '10:00', venue: '' });
  const [showReport, setShowReport] = useState(false);
  const refresh = async () => { await client.invalidateQueries({ queryKey: ['portal', 'attendance'] }); };
  const add = useMutation({
    mutationFn: () => api.post('portal/attendance/timetable', { course_id: form.course_id, day_of_week: Number(form.day), start_min: toMinutes(form.start), end_min: toMinutes(form.end), venue: form.venue }),
    onSuccess: async () => { toast.success('Added to the timetable'); await refresh(); }, onError: e => toast.error(e instanceof Error ? e.message : 'Could not add'),
  });
  const del = useMutation({ mutationFn: (id: string) => api.delete(`portal/attendance/timetable/${id}`), onSuccess: refresh, onError: e => toast.error(e instanceof Error ? e.message : 'Could not remove') });
  const report = useQuery({ queryKey: ['portal', 'attendance', 'report'], queryFn: ({ signal }) => api.get<ReportState>('portal/attendance/report', signal), enabled: showReport, retry: false });
  const submit = (e: FormEvent) => { e.preventDefault(); add.mutate(); };
  const exportCsv = (r: ReportState) => {
    const head = ['Name', 'Matric', ...r.courses.map(c => `${c.code} %`)];
    const rows = r.members.map(m => [`"${m.full_name}"`, m.matric_number ?? '', ...r.courses.map(c => String(pct(m.by_course[c.course_id] ?? 0, c.total) ?? ''))]);
    const url = URL.createObjectURL(new Blob([[head, ...rows].map(l => l.join(',')).join('\n')], { type: 'text/csv' })); const a = document.createElement('a'); a.href = url; a.download = `${r.level}L-attendance.csv`; a.click(); URL.revokeObjectURL(url);
  };
  return <>
    <Panel title="Weekly timetable" >
      <p className="field-hint">Add each lecture once. When you start attendance, the course scheduled for right now is picked for you.</p>
      {desk.timetable.length > 0 && <ul className="att-recent">{desk.timetable.map(t => <li key={t.id}><div className="att-tt"><div><b>{t.code}</b><span>{t.title}</span></div><em>{DAYS[t.day_of_week].slice(0, 3)} {hhmm(t.start_min)}-{hhmm(t.end_min)}{t.venue ? ` · ${t.venue}` : ''}</em><button aria-label={`Remove ${t.code}`} onClick={() => del.mutate(t.id)}><Trash2 size={15}/></button></div></li>)}</ul>}
      <form className="att-ttform" onSubmit={submit}>
        <label className="field"><span>Course</span><select value={form.course_id} onChange={e => setForm({ ...form, course_id: e.target.value })} required><option value="">Choose course</option>{desk.courses.map(c => <option key={c.id} value={c.id}>{c.code} · {c.title}</option>)}</select></label>
        <label className="field"><span>Day</span><select value={form.day} onChange={e => setForm({ ...form, day: e.target.value })}>{DAYS.map((d, i) => <option key={d} value={i}>{d}</option>)}</select></label>
        <label className="field"><span>Starts</span><input type="time" value={form.start} onChange={e => setForm({ ...form, start: e.target.value })} required/></label>
        <label className="field"><span>Ends</span><input type="time" value={form.end} onChange={e => setForm({ ...form, end: e.target.value })} required/></label>
        <label className="field"><span>Venue (optional)</span><input value={form.venue} onChange={e => setForm({ ...form, venue: e.target.value })}/></label>
        <button className="button button-green btn-sm" disabled={add.isPending}>Add lecture</button>
      </form>
    </Panel>
    <Panel title="Attendance report" action={showReport && report.data ? <button className="button button-outline btn-sm" onClick={() => exportCsv(report.data!)}><Download size={14}/> CSV</button> : <button className="button button-outline btn-sm" onClick={() => setShowReport(true)}>Load report</button>}>
      {!showReport ? <p className="field-hint">Each student's attendance per course this session. Anyone under {REQUIRED_PCT}% is highlighted.</p> : report.isLoading ? <p className="field-hint">Loading…</p> : !report.data || report.data.courses.length === 0 ? <p className="field-hint">No lectures recorded yet.</p> : <div className="res-table-wrap"><table className="res-table"><thead><tr><th>Student</th>{report.data.courses.map(c => <th key={c.course_id} className="num">{c.code}<br/><small>{c.total} lec.</small></th>)}</tr></thead><tbody>{report.data.members.map(m => <tr key={m.id}><td className="name"><b>{m.full_name}</b><span>{m.matric_number}</span></td>{report.data!.courses.map(c => { const p = pct(m.by_course[c.course_id] ?? 0, c.total) ?? 0; return <td key={c.course_id} className={`num att-pct${p < REQUIRED_PCT ? ' low' : ''}`}>{p}%</td>; })}</tr>)}</tbody></table></div>}
    </Panel>
  </>;
}
