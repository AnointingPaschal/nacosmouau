import { useMemo, useState, type FormEvent } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { BookOpen, Check, Plus, Search, Trash2 } from 'lucide-react';
import { api } from '../../lib/api';
import { ErrorState, LoadingState } from '../../components/States';
import { PageTitle, Panel } from '../../components/Workspace';
import { semesterName, sessionOptions, type Course, type StudyState } from '../../lib/gpa';

const LEVELS = ['100', '200', '300', '400'];
const MAX_UNITS = 24;

export function useStudy() {
  return useQuery({ queryKey: ['portal', 'study'], queryFn: ({ signal }) => api.get<StudyState>('portal/study', signal), retry: false });
}

function AddCourse({ level, semester, onDone }: { level: string; semester: number; onDone: () => void }) {
  const [form, setForm] = useState({ code: '', title: '', units: '2' });
  const client = useQueryClient();
  const save = useMutation({
    mutationFn: () => api.post('portal/study/courses', { ...form, units: Number(form.units), level, semester }),
    onSuccess: async () => { toast.success('Course added to your list'); setForm({ code: '', title: '', units: '2' }); await client.invalidateQueries({ queryKey: ['portal', 'study'] }); onDone(); },
    onError: (error) => toast.error(error instanceof Error ? error.message : 'Could not add the course'),
  });
  const submit = (event: FormEvent) => { event.preventDefault(); save.mutate(); };
  return <form className="study-add" onSubmit={submit}>
    <p>Missing a course? Add it to your {level} level, {semesterName(semester).toLowerCase()} list. Only you can see it.</p>
    <div className="study-add-grid">
      <label className="field"><span>Course code</span><input value={form.code} onChange={e => setForm({ ...form, code: e.target.value })} placeholder="CSC 211" required/></label>
      <label className="field"><span>Credit units</span><input type="number" min={0} max={20} value={form.units} onChange={e => setForm({ ...form, units: e.target.value })} required/></label>
      <label className="field study-add-title"><span>Course title</span><input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} required/></label>
    </div>
    <button className="button button-green btn-sm" disabled={save.isPending}>{save.isPending ? 'Adding…' : 'Add course'}</button>
  </form>;
}

export function PortalCourses() {
  const q = useStudy();
  const client = useQueryClient();
  const [levelPick, setLevelPick] = useState<string | null>(null);
  const [semester, setSemester] = useState(1);
  const [session, setSession] = useState<string | null>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [search, setSearch] = useState('');
  const [adding, setAdding] = useState(false);

  const level = levelPick ?? q.data?.level ?? '100';
  const activeSession = session ?? q.data?.session ?? '';
  const registeredIds = useMemo(() => new Set((q.data?.records ?? []).filter(r => r.session === activeSession).map(r => r.course_id)), [q.data, activeSession]);
  const courses = useMemo(() => (q.data?.catalogue ?? []).filter(c => c.level === level && c.semester === semester && (`${c.code} ${c.title}`).toLowerCase().includes(search.toLowerCase())), [q.data, level, semester, search]);
  const mine = (q.data?.records ?? []).filter(r => r.session === activeSession && r.semester === semester && r.level === level);
  const myUnits = mine.reduce((sum, r) => sum + r.units, 0);
  const chosen = (q.data?.catalogue ?? []).filter(c => selected.has(c.id));
  const chosenUnits = chosen.reduce((sum, c) => sum + c.units, 0);

  const register = useMutation({
    mutationFn: () => api.post<{ added: number; skipped: number }>('portal/study/register', { course_ids: [...selected], session: activeSession }),
    onSuccess: async (result) => { toast.success(`${result.added} course${result.added === 1 ? '' : 's'} registered for ${activeSession}`); setSelected(new Set()); await client.invalidateQueries({ queryKey: ['portal', 'study'] }); },
    onError: (error) => toast.error(error instanceof Error ? error.message : 'Could not register courses'),
  });
  const remove = useMutation({
    mutationFn: (id: string) => api.delete(`portal/study/records/${id}`),
    onSuccess: async () => { toast.success('Course removed'); await client.invalidateQueries({ queryKey: ['portal', 'study'] }); },
    onError: (error) => toast.error(error instanceof Error ? error.message : 'Could not remove the course'),
  });

  if (q.isLoading) return <LoadingState/>;
  if (q.error || !q.data) return <ErrorState error={q.error ?? new Error('Course list unavailable')}/>;

  const toggle = (course: Course) => setSelected(prev => { const next = new Set(prev); if (next.has(course.id)) next.delete(course.id); else next.add(course.id); return next; });
  const pickable = courses.filter(c => !registeredIds.has(c.id));
  const allSelected = pickable.length > 0 && pickable.every(c => selected.has(c.id));
  const toggleAll = () => setSelected(prev => { const next = new Set(prev); pickable.forEach(c => (allSelected ? next.delete(c.id) : next.add(c.id))); return next; });
  const sessions = sessionOptions(q.data.session);

  return <>
    <PageTitle eyebrow="ACADEMICS" title="Course registration" description="Pick your level and semester, tick the courses you are taking and register them. Registered courses flow into your results page."/>
    <div className="study-bar">
      <div className="study-tabs" role="tablist" aria-label="Level">{LEVELS.map(l => <button key={l} role="tab" aria-selected={level === l} className={level === l ? 'active' : ''} onClick={() => { setLevelPick(l); setSelected(new Set()); }}>{l}L{q.data.level === l && <i>You</i>}</button>)}</div>
      <div className="study-tabs small" role="tablist" aria-label="Semester">{[1, 2].map(s => <button key={s} role="tab" aria-selected={semester === s} className={semester === s ? 'active' : ''} onClick={() => { setSemester(s); setSelected(new Set()); }}>{s === 1 ? 'First' : 'Second'} semester</button>)}</div>
      <label className="study-session"><span>Session</span><select value={activeSession} onChange={e => { setSession(e.target.value); setSelected(new Set()); }}>{sessions.map(s => <option key={s} value={s}>{s}{s === q.data.session ? ' (current)' : ''}</option>)}</select></label>
    </div>
    <div className="study-grid">
      <Panel title={`${level} level · ${semesterName(semester)}`} action={<label className="study-search"><Search size={15}/><input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search courses" aria-label="Search courses"/></label>}>
        {courses.length === 0 ? <p className="field-hint">No courses match. Add one below if yours is missing.</p> : <>
          <label className="study-all"><input type="checkbox" checked={allSelected} onChange={toggleAll} disabled={pickable.length === 0}/> Select all available ({pickable.length})</label>
          <ul className="study-courses">{courses.map(course => {
            const done = registeredIds.has(course.id); const on = selected.has(course.id);
            return <li key={course.id} className={`${on ? 'is-on' : ''} ${done ? 'is-done' : ''}`}>
              <label>
                <input type="checkbox" checked={on || done} disabled={done} onChange={() => toggle(course)}/>
                <span className="study-code">{course.code}</span>
                <span className="study-title">{course.title}{course.owner_user_id && <em>Yours</em>}</span>
                <span className="study-units">{course.units} <small>unit{course.units === 1 ? '' : 's'}</small></span>
              </label>
              {done && <span className="study-done"><Check size={14}/> Registered</span>}
            </li>;
          })}</ul>
        </>}
        <button type="button" className="text-action study-toggle" onClick={() => setAdding(v => !v)}><Plus size={15}/> {adding ? 'Hide' : 'Add a course that is not listed'}</button>
        {adding && <AddCourse level={level} semester={semester} onDone={() => setAdding(false)}/>}
      </Panel>
      <aside className="study-side">
        <Panel title="Your registration">
          <div className="study-meter"><strong>{myUnits}</strong><span>units registered · {activeSession}<br/>{level}L {semesterName(semester).toLowerCase()}</span></div>
          {mine.length === 0 ? <p className="field-hint"><BookOpen size={14}/> Nothing registered for this semester yet.</p> : <ul className="study-mine">{mine.map(r => <li key={r.id}><div><b>{r.code}</b><span>{r.title}</span></div><em>{r.units}u</em><button aria-label={`Remove ${r.code}`} onClick={() => { if (window.confirm(`Remove ${r.code} from ${r.session}? Any result you saved for it is removed too.`)) remove.mutate(r.id); }}><Trash2 size={15}/></button></li>)}</ul>}
        </Panel>
      </aside>
    </div>
    <div className={`study-dock${selected.size ? ' show' : ''}`} role="status" aria-live="polite">
      <div><strong>{selected.size} selected</strong><span className={myUnits + chosenUnits > MAX_UNITS ? 'warn' : ''}>{chosenUnits} units · {myUnits + chosenUnits} total this semester{myUnits + chosenUnits > MAX_UNITS ? ` (above the usual ${MAX_UNITS})` : ''}</span></div>
      <button className="button button-green" disabled={register.isPending} onClick={() => register.mutate()}>{register.isPending ? 'Registering…' : `Register for ${activeSession}`}</button>
    </div>
  </>;
}
