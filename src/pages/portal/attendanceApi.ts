import { useEffect, useState } from 'react';

export interface OpenSession { id: string; level: string; session: string; course_id: string; code: string; title: string; lecture_date: string; started_at: string | null; closes_at: string | null; closed_at: string | null; status: 'open' | 'closed'; radius_m: number; min_peers: number }
export interface MyMark { status: 'pending' | 'verified' | 'rejected'; neighbours: number; distance_m: number | null; flags: string | null; marked_at: string; method: 'device' | 'rep' }
export interface HistoryRow { course_id: string; code: string; title: string; total: number; attended: number }
export interface StudentAttendance { level: string | null; session: string; open: OpenSession | null; mine?: MyMark | null; history: HistoryRow[]; rules?: { window_minutes: number; radius_m: number; min_peers: number } }
export interface TimetableRow { id: string; course_id: string; day_of_week: number; start_min: number; end_min: number; venue: string | null; code: string; title: string }
export interface DeskState {
  session: string; role: 'rep' | 'assistant'; level: string; rules: { window_minutes: number; radius_m: number; min_peers: number };
  timetable: TimetableRow[]; courses: { id: string; code: string; title: string; semester: number }[]; suggested: TimetableRow | null; open: OpenSession | null;
  recent: { id: string; lecture_date: string; status: string; started_at: string | null; code: string; title: string; verified: number; pending: number }[];
  roster: { id: string; full_name: string; matric_number: string | null }[];
}
export interface LiveMark { id: string; user_id: string; method: 'device' | 'rep'; status: 'pending' | 'verified' | 'rejected'; distance_m: number | null; neighbours: number; flags: string | null; marked_at: string | null; ip: string | null; review_note: string | null; full_name: string; matric_number: string | null }
export interface LiveState { session: OpenSession; code: string | null; seconds_left: number; marks: LiveMark[] }
export interface ReportState { session: string; level: string; courses: { course_id: string; code: string; title: string; total: number }[]; members: { id: string; full_name: string; matric_number: string | null; by_course: Record<string, number> }[] }

export const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
export const hhmm = (min: number) => `${String(Math.floor(min / 60)).padStart(2, '0')}:${String(min % 60).padStart(2, '0')}`;
export const toMinutes = (value: string) => { const [h, m] = value.split(':').map(Number); return (h || 0) * 60 + (m || 0); };
export const pct = (attended: number, total: number) => (total ? Math.round((attended / total) * 100) : null);
export const REQUIRED_PCT = 75;

export function useNow(intervalMs = 1000) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => { const t = window.setInterval(() => setNow(Date.now()), intervalMs); return () => window.clearInterval(t); }, [intervalMs]);
  return now;
}
export function leftText(endIso: string | null, now: number) {
  if (!endIso) return '';
  const ms = new Date(endIso).getTime() - now; if (ms <= 0) return 'Closed';
  const s = Math.floor(ms / 1000); return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')} left`;
}

export interface RecordSession { id: string; course_id: string; lecture_date: string; status: 'open' | 'closed'; started_at: string | null; code: string; title: string; verified: number; pending: number; by_rep: number }
export interface RecordsState { session: string; level: string; role: 'rep' | 'assistant'; class_size: number; sessions: RecordSession[] }
export interface RecordDetail {
  session: OpenSession; started_by: string | null;
  marks: { id: string; user_id: string; method: 'device' | 'rep'; status: 'pending' | 'verified' | 'rejected'; marked_at: string | null; distance_m: number | null; flags: string | null; full_name: string; matric_number: string | null }[];
  roster: { id: string; full_name: string; matric_number: string | null }[];
}
export interface CourseMatrix { session: string; level: string; course: { code: string; title: string }; sessions: { id: string; lecture_date: string }[]; members: { id: string; full_name: string; matric_number: string | null; present: string[] }[] }
export const shortDate = (iso: string) => { const [, m, d] = iso.split('-'); return `${d}/${m}`; };
export const timeOf = (iso: string | null) => (iso ? new Intl.DateTimeFormat(undefined, { hour: '2-digit', minute: '2-digit' }).format(new Date(iso)) : '');
