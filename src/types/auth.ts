export type MemberStatus = 'pending' | 'active' | 'suspended' | 'alumni';
export type Role = 'member' | 'editor' | 'finance' | 'election_officer' | 'admin' | 'super_admin' | 'president' | 'vice_president' | 'general_secretary' | 'financial_secretary' | 'treasurer' | 'public_relations_officer' | 'event_manager' | 'election_committee' | 'content_manager';
export interface Member { id: string; email: string; full_name: string; phone: string | null; matric_number: string | null; academic_level: string | null; faculty: string | null; department: string | null; session: string | null; role: Role; status: MemberStatus; membership_id: string | null; created_at: string }
export interface AuthUser { id: string; email: string; fullName: string; role: Role; status?: MemberStatus }
export interface AuthResponse { user: AuthUser }
export interface RegistrationPayload { fullName: string; email: string; phone: string; academicLevel: '100' | '200' | '300' | '400'; idType: 'matric' | 'jamb'; idValue: string; password: string; confirmPassword: string }
export interface LoginPayload { identifier: string; password: string }

export interface SessionUser { id: string; email: string; full_name: string; role: Role; status: MemberStatus }
