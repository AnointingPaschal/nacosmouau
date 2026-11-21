import { useMemo, useState, type FormEvent } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Eye, EyeOff, Pencil, Plus, Search, Trash2, X } from 'lucide-react';
import { api } from '../../lib/api';
import { ErrorState, LoadingState } from '../../components/States';
import { PageTitle, Panel, Stat } from '../../components/Workspace';
import { semesterName } from '../../lib/gpa';

interface CatalogueCourse { id: string; code: string; title: string; units: number; level: string; semester: number; category: string; is_active: number; registered: number }
interface Draft { id?: string; code: string; title: string; units: string; level: string; semester: string; category: string }
const empty = (level = '100', semester = '1'): Draft => ({ code: '', title: '', units: '2', level, semester, category: 'mandatory' });
const LEVELS = ['100', '200', '300', '400'];

function CourseForm({ draft, onClose }: { draft: Draft; onClose: () => void }) {
  const client = useQueryClient();
  const [form, setForm] = useState(draft);
  const set = (key: keyof Draft) => (e: { target: { value: string } }) => setForm(v => ({ ...v, [key]: e.target.value }));
  const save = useMutation({
    mutationFn: () => { const body = { ...form, units: Number(form.units), semester: Number(form.semester) }; return form.id ? api.put(`admin/courses/${form.id}`, body) : api.post('admin/courses', body); },
    onSuccess: async () => { toast.success(form.id ? 'Course updated' : 'Course added'); await client.invalidateQueries({ queryKey: ['admin', 'courses'] }); await client.invalidateQueries({ queryKey: ['portal', 'study'] }); onClose(); },
    onError: (error) => toast.error(error instanceof Error ? error.message : 'Could not save the course'),
  });
  const submit = (e: FormEvent) => { e.preventDefault(); save.mutate(); };
  return <div className="modal-scrim" role="dialog" aria-modal="true" aria-label={form.id ? 'Edit course' : 'Add course'} onClick={onClose}>
    <form className="workspace-panel crud-modal" onClick={e => e.stopPropagation()} onSubmit={submit}>
      <header><div><span className="eyebrow-green">COURSE CATALOGUE</span><h2>{form.id ? 'Edit course' : 'Add a course'}</h2></div><button type="button" className="icon-button" onClick={onClose} aria-label="Close"><X size={18}/></button></header>
      <div className="crud-form-grid">
        <label className="field"><span>Course code</span><input value={form.code} onChange={set('code')} placeholder="CSC 211" required/></label>
        <label className="field"><span>Credit units</span><input type="number" min={0} max={20} value={form.units} onChange={set('units')} required/></label>
        <label className="field" style={{ gridColumn: '1 / -1' }}><span>Course title</span><input value={form.title} onChange={set('title')} required/></label>
        <label className="field"><span>Level</span><select value={form.level} onChange={set('level')}>{LEVELS.map(l => <option key={l} value={l}>{l} level</option>)}</select></label>
        <label className="field"><span>Semester</span><select value={form.semester} onChange={set('semester')}><option value="1">First semester</option><option value="2">Second semester</option></select></label>
        <label className="field"><span>Category</span><select value={form.category} onChange={set('category')}><option value="mandatory">Mandatory</option><option value="elective">Elective</option><option value="general">General studies</option></select></label>
      </div>
      <footer><button type="button" className="button button-outline" onClick={onClose}>Cancel</button><button className="button button-green" disabled={save.isPending}>{save.isPending ? 'Saving…' : 'Save course'}</button></footer>
    </form>
  </div>;
}

export function AdminCourses() {
  const client = useQueryClient();
  const q = useQuery({ queryKey: ['admin', 'courses'], queryFn: ({ signal }) => api.get<CatalogueCourse[]>('admin/courses', signal), retry: false });
  const [level, setLevel] = useState('all'); const [semester, setSemester] = useState('all'); const [search, setSearch] = useState('');
  const [draft, setDraft] = useState<Draft | null>(null);
  const refresh = async () => { await client.invalidateQueries({ queryKey: ['admin', 'courses'] }); await client.invalidateQueries({ queryKey: ['portal', 'study'] }); };
  const toggle = useMutation({ mutationFn: (c: CatalogueCourse) => api.put(`admin/courses/${c.id}`, { is_active: !c.is_active }), onSuccess: refresh, onError: (e) => toast.error(e instanceof Error ? e.message : 'Could not update the course') });
  const remove = useMutation({
    mutationFn: (c: CatalogueCourse) => api.delete<{ deactivated: boolean }>(`admin/courses/${c.id}`),
    onSuccess: async (r) => { toast.success(r.deactivated ? 'Members have this course on record, so it was hidden instead of deleted' : 'Course deleted'); await refresh(); },
    onError: (e) => toast.error(e instanceof Error ? e.message : 'Could not delete the course'),
  });
  const rows = useMemo(() => (q.data ?? []).filter(c => (level === 'all' || c.level === level) && (semester === 'all' || String(c.semester) === semester) && `${c.code} ${c.title}`.toLowerCase().includes(search.toLowerCase())), [q.data, level, semester, search]);
  if (q.isLoading) return <LoadingState/>;
  if (q.error) return <ErrorState error={q.error}/>;
  const all = q.data ?? []; const active = all.filter(c => c.is_active);

  return <>
    <PageTitle eyebrow="ACADEMICS" title="Course catalogue" description="The courses members pick from when they register, by level and semester. Changes show up in the member portal straight away." action={<button className="button button-green" onClick={() => setDraft(empty(level === 'all' ? '100' : level, semester === 'all' ? '1' : semester))}><Plus size={16}/> Add course</button>}/>
    <div className="count-grid"><Stat label="Courses" value={all.length}/><Stat label="Visible to members" value={active.length}/><Stat label="Total credit units" value={active.reduce((s, c) => s + c.units, 0)}/><Stat label="Registrations" value={all.reduce((s, c) => s + c.registered, 0)}/></div>
    <Panel>
      <div className="adm-course-filters">
        <div className="study-tabs small" role="tablist" aria-label="Level">{['all', ...LEVELS].map(l => <button key={l} className={level === l ? 'active' : ''} onClick={() => setLevel(l)}>{l === 'all' ? 'All levels' : `${l}L`}</button>)}</div>
        <div className="study-tabs small" role="tablist" aria-label="Semester">{[['all', 'Both'], ['1', 'First'], ['2', 'Second']].map(([v, label]) => <button key={v} className={semester === v ? 'active' : ''} onClick={() => setSemester(v)}>{label}</button>)}</div>
        <label className="study-search"><Search size={15}/><input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search code or title" aria-label="Search courses"/></label>
      </div>
      <div className="res-table-wrap"><table className="res-table adm-course-table"><thead><tr><th>Code</th><th>Title</th><th>Level</th><th>Semester</th><th className="num">Units</th><th className="num">Members</th><th/></tr></thead>
        <tbody>{rows.length === 0 ? <tr><td colSpan={7} className="adm-empty">No courses match these filters.</td></tr> : rows.map(c => <tr key={c.id} className={c.is_active ? '' : 'is-hidden'}>
          <td className="code">{c.code}</td><td className="name">{c.title}{!c.is_active && <em className="adm-hidden-tag">Hidden</em>}</td><td>{c.level}L</td><td>{semesterName(c.semester).replace(' semester', '')}</td><td className="num">{c.units}</td><td className="num">{c.registered}</td>
          <td><div className="record-actions">
            <button aria-label={`Edit ${c.code}`} onClick={() => setDraft({ id: c.id, code: c.code, title: c.title, units: String(c.units), level: c.level, semester: String(c.semester), category: c.category })}><Pencil size={15}/></button>
            <button aria-label={c.is_active ? `Hide ${c.code}` : `Show ${c.code}`} onClick={() => toggle.mutate(c)}>{c.is_active ? <EyeOff size={15}/> : <Eye size={15}/>}</button>
            <button aria-label={`Delete ${c.code}`} onClick={() => { if (window.confirm(`Delete ${c.code} ${c.title}?${c.registered ? ` ${c.registered} member(s) have it on record, so it will be hidden instead.` : ''}`)) remove.mutate(c); }}><Trash2 size={15}/></button>
          </div></td></tr>)}</tbody></table></div>
    </Panel>
    {draft && <CourseForm draft={draft} onClose={() => setDraft(null)}/>}
  </>;
}
