import type { ReactNode } from 'react';

export function PageTitle({ eyebrow, title, description, action }: { eyebrow: string; title: string; description?: string; action?: ReactNode }) {
  return <div className="workspace-title"><div><span className="eyebrow-green">{eyebrow}</span><h1>{title}</h1>{description && <p>{description}</p>}</div>{action}</div>;
}

export function Stat({ label, value, hint }: { label: string; value: ReactNode; hint?: string }) {
  return <div className="count-card"><span>{label}</span><strong>{value}</strong>{hint && <small className="stat-hint">{hint}</small>}</div>;
}

const tone: Record<string, string> = { paid: 'ok', successful: 'ok', active: 'ok', eligible: 'ok', resolved: 'ok', approved: 'ok', pending: 'wait', pending_payment: 'wait', awaiting_approval: 'wait', pending_screening: 'wait', submitted: 'wait', in_review: 'wait', nominations: 'wait', voting: 'ok', failed: 'bad', rejected: 'bad', declined: 'bad', suspended: 'bad', unpaid: 'bad', draft: 'muted', closed: 'muted' };
const labels: Record<string, string> = { pending_payment: 'Awaiting payment', awaiting_approval: 'Teller awaiting approval', pending_screening: 'Awaiting screening', in_review: 'In review', nominations: 'Nominations', failed: 'Rejected' };
export function Pill({ value }: { value: string }) {
  return <span className={`pill pill-${tone[value] ?? 'muted'}`}>{labels[value] ?? value.replace(/_/g, ' ')}</span>;
}

export function Panel({ title, action, children, className = '' }: { title?: string; action?: ReactNode; children: ReactNode; className?: string }) {
  return <section className={`workspace-panel ${className}`}>{(title || action) && <div className="panel-heading">{title && <h2>{title}</h2>}{action}</div>}{children}</section>;
}
