import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Download, GraduationCap, Target } from 'lucide-react';
import { api } from '../../lib/api';
import { EmptyState, ErrorState, LoadingState } from '../../components/States';
import { PageTitle, Panel } from '../../components/Workspace';
import { useStudy } from './Courses';
import { GRADES, GRADE_POINTS, GRADE_RANGES, buildTerms, classOfDegree, fmt, gradeFromScore, latestAttempts, levelSummaries, requiredGpa, semesterName, tally, type CourseRecord, type Grade, type Term } from '../../lib/gpa';

function Ring({ value }: { value: number | null }) {
  const radius = 62; const circumference = 2 * Math.PI * radius; const fill = value === null ? 0 : Math.min(1, value / 5);
  return <svg className="res-ring" viewBox="0 0 150 150" role="img" aria-label={`CGPA ${fmt(value)} out of 5`}>
    <circle cx="75" cy="75" r={radius} className="res-ring-track"/>
    <circle cx="75" cy="75" r={radius} className="res-ring-fill" strokeDasharray={circumference} strokeDashoffset={circumference * (1 - fill)} transform="rotate(-90 75 75)"/>
    <text x="75" y="76" textAnchor="middle" className="res-ring-value">{fmt(value)}</text>
    <text x="75" y="98" textAnchor="middle" className="res-ring-label">CGPA / 5.00</text>
  </svg>;
}

function Trend({ terms }: { terms: Term[] }) {
  const points = terms.filter(t => t.term.gpa !== null);
  if (points.length < 2) return <p className="field-hint">Record results for at least two semesters to see your trend.</p>;
  const w = 560; const h = 180; const pad = 28; const step = (w - pad * 2) / (points.length - 1);
  const y = (v: number) => h - pad - (v / 5) * (h - pad * 2);
  const line = (pick: (t: Term) => number | null) => points.map((t, i) => `${i === 0 ? 'M' : 'L'}${pad + i * step},${y(pick(t) ?? 0)}`).join(' ');
  return <svg className="res-trend" viewBox={`0 0 ${w} ${h}`} role="img" aria-label="GPA and CGPA by semester">
    {[0, 1, 2, 3, 4, 5].map(g => <g key={g}><line x1={pad} x2={w - pad} y1={y(g)} y2={y(g)} className="grid"/><text x={6} y={y(g) + 4}>{g}</text></g>)}
    <path d={line(t => t.cumulative.gpa)} className="cgpa"/>
    <path d={line(t => t.term.gpa)} className="gpa"/>
    {points.map((t, i) => <g key={t.key}><circle cx={pad + i * step} cy={y(t.term.gpa ?? 0)} r="4.5" className="dot"><title>{`${t.session} S${t.semester}: GPA ${fmt(t.term.gpa)}, CGPA ${fmt(t.cumulative.gpa)}`}</title></circle>{points.length <= 8 && <text x={pad + i * step} y={h - 6} textAnchor="middle" className="x">{t.session.slice(2, 4)}/{t.session.slice(7)} S{t.semester}</text>}</g>)}
  </svg>;
}

function ResultRow({ record }: { record: CourseRecord }) {
  const client = useQueryClient();
  const [score, setScore] = useState(record.score === null ? '' : String(record.score));
  const save = useMutation({
    mutationFn: (body: { score?: number | null; grade?: Grade | null }) => api.put(`portal/study/records/${record.id}`, body),
    onSuccess: () => client.invalidateQueries({ queryKey: ['portal', 'study'] }),
    onError: (error) => toast.error(error instanceof Error ? error.message : 'Could not save the result'),
  });
  const commitScore = () => {
    if (score === '' && record.score === null) return;
    if (score === '') { save.mutate({ score: null, grade: null }); return; }
    const n = Number(score);
    if (!Number.isFinite(n) || n < 0 || n > 100) { toast.error('Score must be between 0 and 100'); setScore(record.score === null ? '' : String(record.score)); return; }
    if (n !== record.score) save.mutate({ score: n });
  };
  const grade = record.grade ?? (score !== '' && Number.isFinite(Number(score)) ? gradeFromScore(Number(score)) : null);
  return <tr>
    <td className="code">{record.code}</td>
    <td className="name">{record.title}</td>
    <td className="num">{record.units}</td>
    <td><input className="res-score" inputMode="decimal" value={score} placeholder="Score" aria-label={`Score for ${record.code}`} onChange={e => setScore(e.target.value)} onBlur={commitScore} onKeyDown={e => { if (e.key === 'Enter') (e.target as HTMLInputElement).blur(); }}/></td>
    <td><select className={`res-grade g-${grade ?? 'none'}`} value={record.grade ?? ''} aria-label={`Grade for ${record.code}`} onChange={e => { setScore(''); save.mutate({ score: null, grade: (e.target.value || null) as Grade | null }); }}><option value="">Grade</option>{GRADES.map(g => <option key={g} value={g}>{g}</option>)}</select></td>
    <td className="num pts">{record.grade ? (record.units * GRADE_POINTS[record.grade]).toFixed(0) : '-'}</td>
  </tr>;
}

function TermPanel({ term }: { term: Term }) {
  return <Panel className="res-term">
    <header className="res-term-head"><div><span>{term.session} · {term.level} level</span><h3>{semesterName(term.semester)}</h3></div><div className="res-term-gpa"><b>{fmt(term.term.gpa)}</b><small>GPA</small></div></header>
    <div className="res-table-wrap"><table className="res-table"><thead><tr><th>Code</th><th>Course</th><th className="num">Units</th><th>Score</th><th>Grade</th><th className="num">Points</th></tr></thead><tbody>{term.records.map(r => <ResultRow key={r.id} record={r}/>)}</tbody></table></div>
    <footer className="res-term-foot"><span>Units <b>{term.term.units}</b></span><span>Credit points <b>{term.term.points}</b></span><span>GPA <b>{fmt(term.term.gpa)}</b></span><span className="hl">CGPA so far <b>{fmt(term.cumulative.gpa)}</b></span></footer>
  </Panel>;
}

function Planner({ units, points }: { units: number; points: number }) {
  const [target, setTarget] = useState('4.00'); const [remaining, setRemaining] = useState('48');
  const needed = requiredGpa({ units, points, gpa: units ? points / units : null, graded: 0 }, Number(remaining), Number(target));
  const verdict = needed === null || !Number.isFinite(needed) ? 'Enter your target and remaining units.' : needed > 5 ? 'That target is out of reach with the units left. Try a lower one.' : needed < 0 ? 'You are already above this target, whatever you score.' : `Average ${needed.toFixed(2)} GPA across the remaining ${remaining} units.`;
  return <Panel title="Plan ahead" action={<Target size={18}/>}>
    <div className="res-plan"><label className="field"><span>Target CGPA</span><input type="number" step="0.01" min={0} max={5} value={target} onChange={e => setTarget(e.target.value)}/></label><label className="field"><span>Units still to take</span><input type="number" min={1} value={remaining} onChange={e => setRemaining(e.target.value)}/></label></div>
    <p className="res-plan-out">{verdict}</p>
  </Panel>;
}

function exportCsv(terms: Term[]) {
  const rows = [['Session', 'Level', 'Semester', 'Code', 'Title', 'Units', 'Score', 'Grade', 'Points'], ...terms.flatMap(t => t.records.map(r => [t.session, t.level, String(t.semester), r.code, `"${r.title.replace(/"/g, '""')}"`, String(r.units), r.score === null ? '' : String(r.score), r.grade ?? '', r.grade ? String(r.units * GRADE_POINTS[r.grade]) : '']))];
  const url = URL.createObjectURL(new Blob([rows.map(r => r.join(',')).join('\n')], { type: 'text/csv' }));
  const link = document.createElement('a'); link.href = url; link.download = 'nacos-results.csv'; link.click(); URL.revokeObjectURL(url);
}

export function PortalResults() {
  const q = useStudy();
  const records = q.data?.records ?? [];
  const terms = useMemo(() => buildTerms(records), [records]);
  const overall = useMemo(() => tally(latestAttempts(records)), [records]);
  const levels = useMemo(() => levelSummaries(latestAttempts(records)), [records]);
  if (q.isLoading) return <LoadingState/>;
  if (q.error || !q.data) return <ErrorState error={q.error ?? new Error('Results unavailable')}/>;
  const best = terms.reduce<number | null>((m, t) => (t.term.gpa !== null && (m === null || t.term.gpa > m) ? t.term.gpa : m), null);
  const ordered = [...terms].reverse();

  return <>
    <PageTitle eyebrow="ACADEMICS" title="Results and GPA" description="Record your scores or grades for each course. Your GPA, CGPA and class of degree update as you go. This is your own record, not an official transcript." action={terms.length > 0 ? <button className="button button-outline btn-sm" onClick={() => exportCsv(terms)}><Download size={15}/> Export CSV</button> : undefined}/>
    {records.length === 0 ? <EmptyState title="No courses registered yet" text="Register your courses first, then come back to record your results." icon={<GraduationCap size={22}/>}/> : <>
      <section className="res-hero">
        <div className="res-hero-main"><Ring value={overall.gpa}/><div><span className="res-class">{classOfDegree(overall.gpa)}</span><h2>Cumulative GPA</h2><p>Across {terms.length} semester{terms.length === 1 ? '' : 's'}. Repeated courses count once, using your latest attempt.</p></div></div>
        <dl className="res-stats"><div><dt>Graded units</dt><dd>{overall.units}</dd></div><div><dt>Credit points</dt><dd>{overall.points}</dd></div><div><dt>Courses graded</dt><dd>{overall.graded}/{records.length}</dd></div><div><dt>Best semester GPA</dt><dd>{fmt(best)}</dd></div></dl>
      </section>
      <div className="res-cols">
        <Panel title="GPA by semester"><Trend terms={terms}/><div className="res-legend"><span><i className="a"/> Semester GPA</span><span><i className="b"/> CGPA</span></div></Panel>
        <Panel title="By level"><ul className="res-levels">{levels.map(l => <li key={l.level} className={l.gpa === null ? 'none' : ''}><span>{l.level}L</span><div className="bar"><i style={{ width: `${l.gpa === null ? 0 : (l.gpa / 5) * 100}%` }}/></div><b>{fmt(l.gpa)}</b><small>{l.units}u</small></li>)}</ul></Panel>
      </div>
      <div className="res-terms">{ordered.map(t => <TermPanel key={t.key} term={t}/>)}</div>
      <div className="res-cols">
        <Planner units={overall.units} points={overall.points}/>
        <Panel title="Grading scale"><ul className="res-scale">{GRADES.map(g => <li key={g}><b className={`g-${g}`}>{g}</b><span>{GRADE_RANGES[g]}</span><em>{GRADE_POINTS[g]}.0</em></li>)}</ul><p className="field-hint">GPA = total credit points / total units. Credit points = course units x grade points.</p></Panel>
      </div>
    </>}
    <p className="field-hint res-note">Need to add another session or a missing course? <Link to="/portal/courses">Go to course registration</Link>.</p>
  </>;
}
