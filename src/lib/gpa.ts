// Academic record maths on the Nigerian 5-point scale used at MOUAU.
export type Grade = 'A' | 'B' | 'C' | 'D' | 'E' | 'F';
/** Most credit units a member can register in one session (both semesters together). */
export const MAX_UNITS = 24;
export const GRADES: Grade[] = ['A', 'B', 'C', 'D', 'E', 'F'];
export const GRADE_POINTS: Record<Grade, number> = { A: 5, B: 4, C: 3, D: 2, E: 1, F: 0 };
export const GRADE_RANGES: Record<Grade, string> = { A: '70 - 100', B: '60 - 69', C: '50 - 59', D: '45 - 49', E: '40 - 44', F: '0 - 39' };

export interface Course { id: string; code: string; title: string; units: number; level: string; semester: number; category: string; owner_user_id: string | null }
export interface CourseRecord { id: string; course_id: string; session: string; level: string; semester: number; score: number | null; grade: Grade | null; code: string; title: string; units: number }
export interface StudyState { session: string; level: string | null; catalogue: Course[]; records: CourseRecord[] }

export const gradeFromScore = (score: number): Grade => (score >= 70 ? 'A' : score >= 60 ? 'B' : score >= 50 ? 'C' : score >= 45 ? 'D' : score >= 40 ? 'E' : 'F');

export interface Tally { units: number; points: number; gpa: number | null; graded: number }
export function tally(records: CourseRecord[]): Tally {
  let units = 0; let points = 0; let graded = 0;
  for (const r of records) {
    if (!r.grade) continue;
    units += r.units; points += r.units * GRADE_POINTS[r.grade]; graded += 1;
  }
  return { units, points, graded, gpa: units > 0 ? points / units : null };
}

/** For the cumulative figure a repeated course counts once, using its most recent attempt. */
export function latestAttempts(records: CourseRecord[]): CourseRecord[] {
  const best = new Map<string, CourseRecord>();
  for (const r of [...records].sort((a, b) => a.session.localeCompare(b.session) || a.semester - b.semester)) best.set(r.course_id, r);
  return [...best.values()];
}

export interface Term { key: string; session: string; semester: number; level: string; records: CourseRecord[]; term: Tally; cumulative: Tally }
export function buildTerms(records: CourseRecord[]): Term[] {
  const groups = new Map<string, CourseRecord[]>();
  for (const r of records) { const key = `${r.session}|${r.semester}`; groups.set(key, [...(groups.get(key) ?? []), r]); }
  const keys = [...groups.keys()].sort();
  return keys.map((key, index) => {
    const list = groups.get(key) ?? [];
    const upTo = keys.slice(0, index + 1).flatMap(k => groups.get(k) ?? []);
    const [session, semester] = key.split('|');
    return { key, session, semester: Number(semester), level: list[0]?.level ?? '', records: list, term: tally(list), cumulative: tally(latestAttempts(upTo)) };
  });
}

export function levelSummaries(records: CourseRecord[]) {
  return ['100', '200', '300', '400'].map(level => ({ level, ...tally(records.filter(r => r.level === level)) }));
}

export function classOfDegree(cgpa: number | null): string {
  if (cgpa === null) return 'No graded courses yet';
  if (cgpa >= 4.5) return 'First Class';
  if (cgpa >= 3.5) return 'Second Class Upper';
  if (cgpa >= 2.4) return 'Second Class Lower';
  if (cgpa >= 1.5) return 'Third Class';
  if (cgpa >= 1) return 'Pass';
  return 'Below pass';
}

export const fmt = (value: number | null, digits = 2) => (value === null ? 'N/A' : value.toFixed(digits));
export const semesterName = (semester: number) => (semester === 1 ? 'First semester' : 'Second semester');

/** The average GPA needed over the remaining units to land on a target CGPA. */
export function requiredGpa(current: Tally, remainingUnits: number, target: number): number | null {
  if (remainingUnits <= 0) return null;
  return (target * (current.units + remainingUnits) - current.points) / remainingUnits;
}

export function sessionOptions(current: string): string[] {
  const start = Number(current.split('/')[0]) || new Date().getFullYear() - 1;
  return Array.from({ length: 7 }, (_, i) => `${start - i}/${start - i + 1}`);
}
