import { useEffect, useState, type FormEvent } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { api } from '../../lib/api';
import { ErrorState, LoadingState } from '../../components/States';
import { PageTitle, Panel, Pill } from '../../components/Workspace';
import { when } from '../portal/classApi';

interface Rules { window_minutes: number; radius_m: number; min_peers: number }
interface AdminSession { id: string; level: string; lecture_date: string; status: string; started_at: string | null; code: string; title: string; started_by: string; verified: number; pending: number; by_rep: number }
interface State { rules: Rules; window_max: number; sessions: AdminSession[] }

export function AdminAttendance() {
  const client = useQueryClient();
  const q = useQuery({ queryKey: ['admin', 'attendance'], queryFn: ({ signal }) => api.get<State>('admin/attendance', signal), retry: false });
  const [form, setForm] = useState({ window_minutes: '15', radius_m: '100', min_peers: '10' });
  useEffect(() => { if (q.data) setForm({ window_minutes: String(q.data.rules.window_minutes), radius_m: String(q.data.rules.radius_m), min_peers: String(q.data.rules.min_peers) }); }, [q.data]);
  const save = useMutation({
    mutationFn: () => api.put('admin/attendance', { window_minutes: Number(form.window_minutes), radius_m: Number(form.radius_m), min_peers: Number(form.min_peers) }),
    onSuccess: async () => { toast.success('Attendance rules saved. They apply to the next lecture a rep opens.'); await client.invalidateQueries({ queryKey: ['admin', 'attendance'] }); },
    onError: e => toast.error(e instanceof Error ? e.message : 'Could not save the rules'),
  });
  if (q.isLoading) return <LoadingState/>;
  if (q.error || !q.data) return <ErrorState error={q.error ?? new Error('Attendance unavailable')}/>;
  const set = (k: keyof typeof form) => (e: { target: { value: string } }) => setForm(v => ({ ...v, [k]: e.target.value }));
  const submit = (e: FormEvent) => { e.preventDefault(); save.mutate(); };
  return <>
    <PageTitle eyebrow="ACADEMICS" title="Lecture attendance" description="Course reps open attendance for each lecture. You set the rules every lecture follows."/>
    <Panel title="Attendance rules">
      <form className="form-stack" onSubmit={submit}>
        <div className="crud-form-grid">
          <label className="field"><span>Marking window (minutes, max {q.data.window_max})</span><input type="number" min={1} max={q.data.window_max} value={form.window_minutes} onChange={set('window_minutes')} required/></label>
          <label className="field"><span>Students must be within (metres of the rep)</span><input type="number" min={30} max={300} value={form.radius_m} onChange={set('radius_m')} required/></label>
          <label className="field"><span>Classmates that must be nearby to verify a mark</span><input type="number" min={0} max={40} value={form.min_peers} onChange={set('min_peers')} required/></label>
        </div>
        <p className="field-hint">A mark is verified automatically when that many classmates, on different phones, marked within the distance limit. Marks without enough neighbours wait for the rep to review them.</p>
        <div><button className="button button-green" disabled={save.isPending}>{save.isPending ? 'Saving…' : 'Save rules'}</button></div>
      </form>
    </Panel>
    <Panel title="Recent lectures">
      <div className="res-table-wrap"><table className="res-table"><thead><tr><th>Course</th><th>Level</th><th>Date</th><th>Opened by</th><th className="num">Verified</th><th className="num">Pending</th><th className="num">By rep</th><th>Status</th></tr></thead><tbody>
        {q.data.sessions.length === 0 ? <tr><td colSpan={8} className="adm-empty">No lectures yet.</td></tr> : q.data.sessions.map(s => <tr key={s.id}><td className="name"><b>{s.code}</b><span>{s.title}</span></td><td>{s.level}L</td><td>{s.lecture_date}<br/><small>{when(s.started_at)}</small></td><td>{s.started_by}</td><td className="num">{s.verified}</td><td className="num">{s.pending}</td><td className="num">{s.by_rep}</td><td><Pill value={s.status === 'open' ? 'voting' : 'closed'}/></td></tr>)}
      </tbody></table></div>
    </Panel>
  </>;
}
