import type { AuthResponse, LoginPayload, RegistrationPayload, SessionUser, Member } from './auth';
import type { Achievement, AssociationDocument, AssociationStats, CmsPage, EventItem, Executive, GalleryAlbum, HeroSlide, NewsItem, SiteSettings } from './content';
import type { AuditEntry, ContactPayload, Election, EventRegistrationPayload, FinanceSummary, Payment, RoleGrant, WelfareRequest } from './operations';
export interface ApiSuccess<T> { data: T }
export interface ApiFailure { error: string; code?: string; details?: unknown }
export interface PageQuery { page?: number; page_size?: number; search?: string; category?: string }
export interface AuthMeResponse { user: SessionUser }
export interface RegistrationResponse { id: string; email: string; fullName: string; status: 'pending'; message: string }
export interface MembershipVerification { valid: boolean; full_name?: string; membership_id?: string; status?: string; expires_at?: string }
export interface MembershipApproval { status: 'active'|'suspended'|'rejected'; note?: string }
export interface MembershipRenewal { membership_period: string; payment_reference: string }
export interface PaymentInitialization { authorization_url: string; reference: string }
export interface PaymentVerification { reference: string; status: Payment['status']; amount_minor: number; currency: string; receipt_url: string | null }
export interface ElectionNomination { election_id: string; position_id: string; manifesto: string; photo_url?: string }
export interface ElectionBallot { election_id: string; ballot_token: string; positions: { id: string; label: string; candidate_options: { id: string; label: string }[] }[] }
export interface CastSecretBallot { ballot_token: string; encrypted_selections: string; idempotency_key: string }
export interface EventAttendanceScan { ticket_code: string }
export interface EventTicket { id: string; event_id: string; ticket_code: string; qr_payload: string; status: 'valid'|'used'|'cancelled'; created_at: string }
export interface WelfareSubmission { category: string; subject: string; details: string; confidential: boolean }
export interface AdminDashboardData { stats: AssociationStats; pending_members: number; pending_finance_approvals: number }
export interface AdminAuditResponse { items: AuditEntry[]; total: number }
export interface AdminRolesResponse { roles: RoleGrant[] }
export interface ApiEndpointContracts {
  settings: SiteSettings;
  pages: CmsPage[];
  heroSlides: HeroSlide[];
  executives: Executive[];
  news: NewsItem[];
  announcements: import('./content').Announcement[];
  events: EventItem[];
  gallery: GalleryAlbum[];
  documents: AssociationDocument[];
  achievements: Achievement[];
  stats: AssociationStats;
  members: Member[];
  payments: Payment[];
  elections: Election[];
  welfare: WelfareRequest[];
  adminDashboard: AdminDashboardData;
  adminAudit: AdminAuditResponse;
  adminRoles: AdminRolesResponse;
  authMe: AuthMeResponse;
  authLogin: AuthResponse;
  authRegister: RegistrationResponse;
  loginPayload: LoginPayload;
  registrationPayload: RegistrationPayload;
  contactPayload: ContactPayload;
  eventRegistrationPayload: EventRegistrationPayload;
  membershipApproval: MembershipApproval;
  membershipRenewal: MembershipRenewal;
  membershipVerification: MembershipVerification;
  paymentInitialization: PaymentInitialization;
  paymentVerification: PaymentVerification;
  electionNomination: ElectionNomination;
  electionBallot: ElectionBallot;
  castSecretBallot: CastSecretBallot;
  eventAttendanceScan: EventAttendanceScan;
  eventTicket: EventTicket;
  welfareSubmission: WelfareSubmission;
  financeSummary: FinanceSummary;
}
