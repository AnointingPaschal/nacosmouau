import type { Member, Role } from './auth';
export interface Payment { id: string; member_id: string; reference: string; purpose: string; amount_minor: number; currency: string; status: 'pending'|'successful'|'failed'|'refunded'; paid_at: string | null; receipt_url: string | null }
export interface Election { id: string; title: string; description: string | null; opens_at: string; closes_at: string; status: 'draft'|'open'|'closed'|'published'; eligible_voter_count?: number }
export interface WelfareRequest { id: string; category: string; subject: string; status: 'submitted'|'in_review'|'resolved'|'closed'; created_at: string; response?: string | null }
export interface FinanceSummary { collections_minor: number; expenses_minor: number; pending_approvals: number; currency: string }
export interface AdminUser extends Member { permissions: string[] }
export interface AuditEntry { id: string; action: string; target_type: string | null; target_id: string | null; created_at: string; actor?: Pick<Member,'id'|'full_name'> | null }
export interface RoleGrant { role: Role; permissions: string[] }
export interface ContactPayload { name: string; email: string; subject: string; message: string }
export interface EventRegistrationPayload { name: string; email: string; phone: string }
