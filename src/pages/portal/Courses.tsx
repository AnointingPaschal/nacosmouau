import { useMemo, useState, type FormEvent } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { BookOpen, Plus, Search, Trash2 } from 'lucide-react';
import { api } from '../../lib/api';
import { ErrorState, LoadingState } from '../../components/States';
import { PageTitle, Panel } from '../../components/Workspace';
import { MAX_UNITS, semesterName, sessionOptions, type Course, type StudyState } from '../../lib/gpa';

const LEVELS = ['100', '200', '300', '400'];

export function useStudy() {
  return useQuery({ queryKey: ['portal', 'study'], queryFn: ({ signal }) => api.get<StudyState>('portal/study', signal), retry: false });
}

function AddCourse({ level, onDone }: { level: string; onDone: () => void }) {
  const [form, setForm] = useState({ code: '', title: '', units: '2', semester: '1' });
  const client = useQueryClient();
  const save = useMutation({
    mutationFn: () => api.post('portal/study/courses', { ...form, units: Number(form.units), semester: Number(form.semester), level }),
    onSuccess: async () => { toast.success('Course added to your list'); setForm({ code: '', title: '', units: '2', semester: '1' }); await client.invalidateQueries({ queryKey: ['portal', 'study'] }); onDone(); },
    onError: (error) => toast.error(error instanceof Error ? error.message : 'Could not add the course'),
  });
  const submit = (event: FormEvent) => { event.preventDefault(); save.mutate(); };
  return <form className="study-add" onSubmit={submit}>
    <p>Missing a course? Add it to your {level} level list. Only you can see it.</p>
    <div className="study-add-grid">
      <label className="field"><span>Course code</span><input value={form.code} onChange={e => setForm({ ...form, code: e.target.value })} placeholder="CSC 211" required/></label>
      <label className="field"><span>Credit units</span><input type="number" min={0} max={20} value={form.units} onChange={e => setForm({ ...form, units: e.target.value })} required/></label>
      <label className="field"><span>Semester</span><select value={form.semester} onChange={e => setForm({ ...form, semester: e.target.value })}><option value="1">First</option><option value="2">Second</option></select></label>
      <label className="field study-add-title"><span>Course title</span><input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} required/></label>
    </div>
    <button className="button button-green btn-sm" disabled={save.isPending}>{save.isPending ? 'Adding…' : 'Add course'}</button>
  </form>;
}

export function PortalCourses() {
  const q = useStudy();
  const client = useQueryClient();
  const [levelPick, setLevelPick] = useState<string | null>(null);
  const [session, setSession] = useState<string | null>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [search, setSearch] = useState('');
  const [adding, setAdding] = useState(false);
  const [doomed, setDoomed] = useState<Set<string>>(new Set());

  const activeSession = session ?? q.data?.session ?? '';
  const sessionRecords = useMemo(() => (q.data?.records ?? []).filter(r => r.session === activeSession), [q.data, activeSession]);
  // A session belongs to one level: use the level already registered, otherwise work it out from the member's level.
  const lockedLevel = sessionRecords[0]?.level ?? null;
  const impliedLevel = (() => {
    const own = Number(q.data?.level); const now = Number(q.data?.session.split('/')[0]); const then = Number(activeSession.split('/')[0]);
    if (!own || !now || !then) return q.data?.level ?? '100';
    return String(Math.min(400, Math.max(100, own - 100 * (now - then))));
  })();
  const level = lockedLevel ?? levelPick ?? impliedLevel;
  const registeredIds = useMemo(() => new Set(sessionRecords.map(r => r.course_id)), [sessionRecords]);
  const heldUnits = sessionRecords.reduce((sum, r) => sum + r.units, 0);
  const byId = useMemo(() => new Map((q.data?.catalogue ?? []).map(c => [c.id, c])), [q.data]);
  const chosenUnits = [...selected].reduce((sum, id) => sum + (byId.get(id)?.units ?? 0), 0);
  const total = heldUnits + chosenUnits;
  const over = total > MAX_UNITS;

  const sections = useMemo(() => [1, 2].map(sem => ({
    semester: sem,
    courses: (q.data?.catalogue ?? []).filter(c => c.level === level && c.semester === sem && `${c.code} ${c.title}`.toLowerCase().includes(search.toLowerCase())),
  })), [q.data, level, search]);

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

  const bulkRemove = useMutation({
    mutationFn: (ids: string[]) => api.post<{ removed: number }>('portal/study/records/bulk-delete', { ids }),
    onSuccess: async (r) => { toast.success(`${r.removed} course${r.removed === 1 ? '' : 's'} removed`); setDoomed(new Set()); await client.invalidateQueries({ queryKey: ['portal', 'study'] }); },
    onError: (error) => toast.error(error instanceof Error ? error.message : 'Could not remove the courses'),
  });

  if (q.isLoading) return <LoadingState/>;
  if (q.error || !q.data) return <ErrorState error={q.error ?? new Error('Course list unavailable')}/>;

  const fits = (course: Course) => selected.has(course.id) || total + course.units <= MAX_UNITS;
  const toggle = (course: Course) => setSelected(prev => { const next = new Set(prev); if (next.has(course.id)) next.delete(course.id); else if (fits(course)) next.add(course.id); else toast.error(`That would take you above ${MAX_UNITS} units`); return next; });
  const toggleSection = (courses: Course[]) => setSelected(prev => {
    const next = new Set(prev); const free = courses.filter(c => !registeredIds.has(c.id));
    if (free.length > 0 && free.every(c => next.has(c.id))) { free.forEach(c => next.delete(c.id)); return next; }
    let running = heldUnits + [...next].reduce((sum, id) => sum + (byId.get(id)?.units ?? 0), 0);
    for (const c of free) { if (next.has(c.id)) continue; if (running + c.units > MAX_UNITS) { toast.error(`Stopped at ${MAX_UNITS} units`); break; } next.add(c.id); running += c.units; }
    return next;
  });
  const sessions = sessionOptions(q.data.session);
  const pct = Math.min(100, (total / MAX_UNITS) * 100);

  return <>
    <PageTitle eyebrow="ACADEMICS" title="Course registration" description={`Choose your level, then tick the courses for both semesters. You can register up to ${MAX_UNITS} credit units in a session.`}/>
    <div className="study-bar">
      <div className="study-tabs" role="tablist" aria-label="Level">{LEVELS.map(l => <button key={l} role="tab" aria-selected={level === l} disabled={Boolean(lockedLevel) && l !== lockedLevel} className={level === l ? 'active' : ''} onClick={() => { setLevelPick(l); setSelected(new Set()); }}>{l}L{q.data.level === l && <i>You</i>}</button>)}</div>
      <label className="study-session"><span>Session</span><select value={activeSession} onChange={e => { setSession(e.target.value); setLevelPick(null); setSelected(new Set()); }}>{sessions.map(s => <option key={s} value={s}>{s}{s === q.data.session ? ' (current)' : ''}</option>)}</select></label>
    </div>
    {lockedLevel && <p className="study-lock">{activeSession} is registered as {lockedLevel} level. To switch level for this session, remove its courses first.</p>}
    <div className="study-grid">
      <Panel title={`${level} level courses`} action={<label className="study-search"><Search size={15}/><input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search courses" aria-label="Search courses"/></label>}>
        {sections.map(({ semester, courses }) => {
          const free = courses.filter(c => !registeredIds.has(c.id)); const all = free.length > 0 && free.every(c => selected.has(c.id));
          return <section className="study-sem" key={semester}>
            <header><h3>{semesterName(semester)}</h3><span>{courses.reduce((n, c) => n + c.units, 0)} units listed</span><label className="study-all"><input type="checkbox" checked={all} onChange={() => toggleSection(courses)} disabled={free.length === 0}/> Select all</label></header>
            {courses.length === 0 ? <p className="field-hint">No courses match.</p> : <ul className="study-courses">{courses.map(course => {
              const done = registeredIds.has(course.id); const on = selected.has(course.id); const blocked = !done && !on && !fits(course);
              return <li key={course.id} className={`${on ? 'is-on' : ''} ${done ? 'is-done' : ''} ${blocked ? 'is-blocked' : ''}`}>
                <label>
                  <input type="checkbox" checked={on || done} disabled={done || blocked} onChange={() => toggle(course)}/>
                  <span className="study-code">{course.code}</span>
                  <span className="study-title">{course.title}{course.owner_user_id && <em>Yours</em>}</span>
                  <span className="study-units">{course.units}<small>u</small></span>
                </label>
              </li>;
            })}</ul>}
          </section>;
        })}
        <button type="button" className="text-action study-toggle" onClick={() => setAdding(v => !v)}><Plus size={15}/> {adding ? 'Hide' : 'Add a course that is not listed'}</button>
        {adding && <AddCourse level={level} onDone={() => setAdding(false)}/>}
      </Panel>
      <aside className="study-side">
        <Panel title={`Registered for ${activeSession}`}>
          <div className="study-meter"><strong>{heldUnits}<small>/{MAX_UNITS}</small></strong><span>credit units registered</span></div>
          {sessionRecords.length === 0 ? <p className="field-hint"><BookOpen size={14}/> Nothing registered for this session yet.</p> : <>
            <div className="study-bulk">
              <label><input type="checkbox" checked={doomed.size === sessionRecords.length} onChange={() => setDoomed(doomed.size === sessionRecords.length ? new Set() : new Set(sessionRecords.map(r => r.id)))}/> Select all ({sessionRecords.length})</label>
              <button type="button" className="study-bulk-btn" disabled={doomed.size === 0 || bulkRemove.isPending} onClick={() => { if (window.confirm(`Remove ${doomed.size} course${doomed.size === 1 ? '' : 's'} from ${activeSession}? Any grades saved for them are removed too.`)) bulkRemove.mutate([...doomed]); }}><Trash2 size={14}/> {bulkRemove.isPending ? 'Removing…' : `Remove${doomed.size ? ` (${doomed.size})` : ''}`}</button>
            </div>
            {[1, 2].map(sem => { const list = sessionRecords.filter(r => r.semester === sem); return list.length === 0 ? null : <div key={sem}><h4 className="study-mine-head">{semesterName(sem)}</h4><ul className="study-mine">{list.map(r => <li key={r.id} className={doomed.has(r.id) ? 'is-picked' : ''}><input type="checkbox" aria-label={`Select ${r.code}`} checked={doomed.has(r.id)} onChange={() => setDoomed(prev => { const next = new Set(prev); if (next.has(r.id)) next.delete(r.id); else next.add(r.id); return next; })}/><div><b>{r.code}</b><span>{r.title}</span></div><em>{r.units}u</em><button aria-label={`Remove ${r.code}`} onClick={() => { if (window.confirm(`Remove ${r.code} from ${r.session}? Any grade you saved for it is removed too.`)) remove.mutate(r.id); }}><Trash2 size={15}/></button></li>)}</ul></div>; })}
          </>}
        </Panel>
      </aside>
    </div>
    <div className={`study-dock${selected.size ? ' show' : ''}`} role="status" aria-live="polite">
      <div className="study-dock-info"><strong>{selected.size} selected · {total}/{MAX_UNITS} units</strong><div className={`study-cap${over ? ' over' : ''}`}><i style={{ width: `${pct}%` }}/></div></div>
      <button className="button button-green" disabled={register.isPending || over || selected.size === 0} onClick={() => register.mutate()}>{register.isPending ? 'Registering…' : 'Register'}</button>
    </div>
  </>;
}
