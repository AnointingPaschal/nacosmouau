import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { CheckCircle2, Clock, Loader2, MapPin, ShieldCheck, Smartphone } from 'lucide-react';
import { api } from '../../lib/api';
import { deviceCheck, softPosition } from '../../lib/device';
import { EmptyState, ErrorState, LoadingState } from '../../components/States';
import { PageTitle, Panel, Pill } from '../../components/Workspace';
import { REQUIRED_PCT, leftText, pct, useNow, type StudentAttendance } from './attendanceApi';

export function PortalAttendance() {
  const client = useQueryClient();
  const [step, setStep] = useState('');
  const now = useNow();
  const q = useQuery({ queryKey: ['portal', 'attendance', 'open'], queryFn: ({ signal }) => api.get<StudentAttendance>('portal/attendance/open', signal), retry: false, refetchInterval: 10_000 });
  const mark = useMutation({
    mutationFn: async () => {
      setStep('Checking your phone…'); const device = await deviceCheck();
      setStep('Checking your location…'); const pos = await softPosition();
      setStep('Marking you present…');
      return api.post<{ status: 'pending' | 'verified'; flags: string | null }>('portal/attendance/mark', { ...(pos ?? {}), ...device });
    },
    onSuccess: async (r) => { setStep(''); toast.success(r.status === 'verified' ? 'You are marked present' : 'Attendance recorded. Your rep will review it.'); await client.invalidateQueries({ queryKey: ['portal', 'attendance'] }); },
    onError: e => { setStep(''); toast.error(e instanceof Error ? e.message : 'Could not mark attendance'); },
  });

  if (q.isLoading) return <LoadingState/>;
  if (q.error || !q.data) return <ErrorState error={q.error ?? new Error('Attendance unavailable')}/>;
  const { level, open, mine, history, rules } = q.data;
  if (!level) return <><PageTitle eyebrow="CLASS" title="Attendance"/><EmptyState title="Your level is not set" text="Add your level in My membership to mark attendance." icon={<Clock size={22}/>}/></>;

  return <>
    <PageTitle eyebrow="CLASS" title="Lecture attendance" description="Mark yourself present while the lecture is on. You must be in the lecture hall with your own phone."/>
    {open ? <Panel className="att-open">
      <div className="att-head"><div><span className="att-live">Open now</span><h2>{open.code}</h2><p>{open.title}</p></div><div className="att-timer"><Clock size={16}/> {leftText(open.closes_at, now)}</div></div>
      {mine ? <div className={`att-result ${mine.status}`}>
        {mine.status === 'verified' ? <CheckCircle2 size={22}/> : <Loader2 size={22}/>}
        <div><b>{mine.method === 'rep' ? 'Marked present by your class rep' : mine.status === 'verified' ? 'You are marked present' : mine.status === 'rejected' ? 'Your mark was rejected' : 'Recorded, waiting for verification'}</b>
          {mine.method === 'device' && mine.status === 'pending' && <small>Your rep will review this mark.</small>}
          {mine.flags && <small>{mine.flags.includes('far_from_rep') ? 'Your location looked far from the lecture hall.' : 'Flagged for review.'}</small>}</div>
        <Pill value={mine.status}/>
      </div> : <form className="att-form" onSubmit={e => { e.preventDefault(); mark.mutate(); }}>
        <button className="button button-green" disabled={mark.isPending}>{mark.isPending ? step || 'Working…' : 'Mark me present'}</button>
        <p className="field-hint">Only mark yourself while you are in the lecture. Your phone and browser are recorded with your mark, and your rep can see anything that looks off.</p>
      </form>}
    </Panel> : <EmptyState title="No attendance open" text="When your class rep opens a lecture, it appears here. Check back during the lecture." icon={<Clock size={22}/>}/>}

    {rules && <Panel title="How attendance is checked"><ul className="att-rules">
      <li><Clock size={16}/><span>Attendance is open for <b>{rules.window_minutes} minutes</b> after your rep starts it. After that you cannot mark.</span></li>
      <li><Smartphone size={16}/><span>One phone can mark one student. Your phone and browser are recorded with your mark.</span></li>
      <li><MapPin size={16}/><span>If you share your location and it is far from your rep, the mark waits for your rep to review it.</span></li>
      <li><ShieldCheck size={16}/><span>No smartphone? Your rep can sign and mark you present.</span></li>
    </ul></Panel>}

    <Panel title="My attendance this session">
      {history.length === 0 ? <p className="field-hint">No lectures recorded yet.</p> : <ul className="att-history">{history.map(h => { const p = pct(h.attended, h.total) ?? 0; const low = p < REQUIRED_PCT; return <li key={h.course_id} className={low ? 'low' : ''}><div><b>{h.code}</b><span>{h.title}</span></div><div className="att-bar"><i style={{ width: `${p}%` }}/></div><em>{h.attended}/{h.total} · {p}%</em></li>; })}</ul>}
      <p className="field-hint">You need at least {REQUIRED_PCT}% attendance in a course to be eligible for its exam.</p>
    </Panel>
  </>;
}
