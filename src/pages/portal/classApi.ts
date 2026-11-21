import { useQuery } from '@tanstack/react-query';
import { api } from '../../lib/api';

export type RepRole = 'rep' | 'assistant';
export const REP_LABEL: Record<RepRole, string> = { rep: 'Course Rep', assistant: 'Assistant Course Rep' };
export const REP_SHORT: Record<RepRole, string> = { rep: 'Course Rep', assistant: 'Asst. Course Rep' };

export interface ClassMe { session: string; level: string | null; roles: { role: RepRole; level: string; session: string }[]; election: { status: 'nominations' | 'voting' | 'closed'; voting_ends_at: string | null } | null }
export interface Mate { id: string; full_name: string; matric_number: string | null; rep_role: RepRole | null; phone: string | null }
export interface Notice { id: string; title: string; body: string; created_at: string | null; author_id: string; author: string }
export interface MatesState { level: string | null; session: string; members: Mate[]; notices: Notice[]; me?: string }
export interface Candidate { id: string; position: RepRole; manifesto: string; status: 'pending' | 'approved' | 'rejected'; review_note: string | null; user_id: string; full_name: string; matric_number: string | null; votes?: number }
export interface ClassElectionState {
  session: string; level: string | null; me?: string;
  election?: { id: string; status: 'nominations' | 'voting' | 'closed'; voting_started_at: string | null; voting_ends_at: string | null; closed_at: string | null };
  candidates?: Candidate[]; voted?: string[]; winners?: { role: RepRole; user_id: string; votes: number; full_name: string }[];
}
export interface RepDeskState { session: string; role: RepRole; level: string; members: { id: string; full_name: string; matric_number: string | null; phone: string | null; email: string | null; units: number; dues_paid: number }[] }

export const useClassMe = (enabled = true) => useQuery({ queryKey: ['portal', 'class', 'me'], queryFn: ({ signal }) => api.get<ClassMe>('portal/class/me', signal), retry: false, staleTime: 30_000, enabled });

export const initials = (name: string) => name.split(/\s+/).filter(Boolean).slice(0, 2).map(w => w[0]?.toUpperCase()).join('');
export const when = (iso: string | null) => (iso ? new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(iso)) : '');
