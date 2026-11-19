export type MemberStatus = 'pending' | 'active' | 'suspended' | 'alumni';
export type Role = 'member' | 'editor' | 'finance' | 'election_officer' | 'admin' | 'super_admin';
export interface Member { id: string; email: string; full_name: string; phone: string | null; matric_number: string | null; academic_level: string | null; faculty: string | null; department: string | null; session: string | null; role: Role; status: MemberStatus; membership_id: string | null; created_at: string }
export interface AuthUser { id: string; email: string; fullName: string; role: Role; status?: MemberStatus }
export interface AuthResponse { user: AuthUser }
export interface RegistrationPayload { fullName: string; email: string; phone: string; matricNumber: string; academicLevel: string; faculty: string; department: string; session: string; password: string }
export interface LoginPayload { email: string; password: string }

export interface SessionUser { id: string; email: string; full_name: string; role: Role; status: MemberStatus }
