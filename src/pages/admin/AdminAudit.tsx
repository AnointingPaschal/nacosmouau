import { useState, type FormEvent } from 'react';
import { useQuery } from '@tanstack/react-query';
import { CheckCircle2, ChevronLeft, ChevronRight, Download, KeyRound, PencilLine, ScrollText, ShieldAlert, Trash2 } from 'lucide-react';
import { api } from '../../lib/api';
import { EmptyState, ErrorState, LoadingState } from '../../components/States';
import { PageTitle, Panel } from '../../components/Workspace';

interface Row { id: string; action: string; resource: string; record_id: string | null; details_json: string | null; created_at: string; actor: string | null; matric_number: string | null }
interface Page { rows: Row[]; total: number; page: number; page_size: number; resources: string[] }

const utc = (s: string) => new Date(`${s.replace(' ', 'T')}Z`);
const stamp = (s: string) => utc(s).toLocaleString('en-NG', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
const words = (v: string) => v.replace(/[._-]+/g, ' ').trim();
const kind = (action: string) => /delete|remove|reject|denied|fail|disabled|suspend|end_vote/i.test(action) ? 'bad' : /create|approv|enable|saved|apply|register|start|add/i.test(action) ? 'ok' : /key|secret|password|two_factor|role/i.test(action) ? 'key' : 'edit';
const icons = { bad: Trash2, ok: CheckCircle2, key: KeyRound, edit: PencilLine };
const blank = { q: '', resource: '', from: '', to: '' };

function Details({ json }: { json: string }) {
  const [more, setMore] = useState(false);
  let parsed: unknown; try { parsed = JSON.parse(json); } catch { parsed = json; }
  const entries: Array<[string, string]> = parsed && typeof parsed === 'object' && !Array.isArray(parsed)
    ? Object.entries(parsed as Record<string, unknown>).map(([k, v]) => [k, Array.isArray(v) ? v.join(', ') : typeof v === 'object' && v !== null ? JSON.stringify(v) : String(v)])
    : [['details', String(parsed)]];
  const shown = more ? entries : entries.slice(0, 3);
  return <div className="audit-details">{shown.map(([k, v]) => <span key={k}><b>{words(k)}</b> {v.length > 160 && !more ? `${v.slice(0, 160)}…` : v}</span>)}{entries.length > 3 && <button type="button" onClick={() => setMore(m => !m)}>{more ? 'Show less' : `Show ${entries.length - 3} more`}</button>}</div>;
}

export function AdminAudit() {
  const [draft, setDraft] = useState(blank); const [f, setF] = useState(blank); const [page, setPage] = useState(1); const [busy, setBusy] = useState(false);
  const qs = (extra: Record<string, string> = {}) => new URLSearchParams(Object.entries({ ...f, ...extra }).filter(([, v]) => v)).toString();
  const q = useQuery({ queryKey: ['staff', 'audit', f, page], queryFn: ({ signal }) => api.get<Page>(`staff/audit?${qs({ page: String(page) })}`, signal), retry: false, placeholderData: prev => prev });
  const apply = (e: FormEvent) => { e.preventDefault(); setF(draft); setPage(1); };
  const exportCsv = async () => {
    setBusy(true);
    try {
      const all = await api.get<Page>(`staff/audit?${qs({ all: '1' })}`);
      const rows = all.rows.map(r => [r.created_at, r.actor ?? 'System', r.matric_number ?? '', r.action, r.resource, r.record_id ?? '', r.details_json ?? '']);
      const csv = [['Time (UTC)', 'Actor', 'Matric', 'Action', 'Resource', 'Record', 'Details'], ...rows].map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(',')).join('\n');
      const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv' })); const a = document.createElement('a'); a.href = url; a.download = `audit-log-${new Date().toISOString().slice(0, 10)}.csv`; a.click(); URL.revokeObjectURL(url);
    } finally { setBusy(false); }
  };
  const d = q.data; const pages = d ? Math.max(1, Math.ceil(d.total / d.page_size)) : 1;
  return <>
    <PageTitle eyebrow="SECURITY" title="Audit log" description="Who changed what and when, newest first. Search, filter by area or date, and export."
      action={<button className="button button-outline btn-sm" onClick={() => void exportCsv()} disabled={busy}><Download size={14}/> {busy ? 'Preparing…' : 'Export CSV'}</button>}/>
    <form className="filter-bar" onSubmit={apply}>
      <input className="crud-search" value={draft.q} onChange={e => setDraft(v => ({ ...v, q: e.target.value }))} placeholder="Search person, action or details" aria-label="Search the audit log"/>
      <select value={draft.resource} onChange={e => setDraft(v => ({ ...v, resource: e.target.value }))} aria-label="Area"><option value="">All areas</option>{d?.resources.map(r => <option key={r} value={r}>{words(r)}</option>)}</select>
      <input type="date" value={draft.from} onChange={e => setDraft(v => ({ ...v, from: e.target.value }))} aria-label="From date"/>
      <input type="date" value={draft.to} onChange={e => setDraft(v => ({ ...v, to: e.target.value }))} aria-label="To date"/>
      <button className="button button-green btn-sm">Apply</button>
      {(f.q || f.resource || f.from || f.to) && <button type="button" className="button button-outline btn-sm" onClick={() => { setDraft(blank); setF(blank); setPage(1); }}>Clear</button>}
    </form>
    <Panel>{q.isLoading ? <LoadingState/> : q.error || !d ? <ErrorState error={q.error}/> : d.rows.length === 0 ? <EmptyState title="Nothing logged" text="Approvals, role changes and settings updates are recorded here." icon={<ScrollText size={22}/>}/> : <>
      <p className="form-note">{d.total} {d.total === 1 ? 'entry' : 'entries'}</p>
      <ol className="audit-list">{d.rows.map(a => { const k = kind(a.action); const Icon = k === 'bad' && /denied|fail/i.test(a.action) ? ShieldAlert : icons[k]; return <li key={a.id} className={`audit-item is-${k}`}>
        <span className="audit-icon"><Icon size={16}/></span>
        <div className="audit-main">
          <p><b>{a.actor ?? 'System'}</b> <span>{words(a.action)}</span> <em>{words(a.resource)}</em></p>
          {a.details_json && <Details json={a.details_json}/>}
          <small>{stamp(a.created_at)}{a.matric_number ? ` · ${a.matric_number}` : ''}{a.record_id ? ` · record ${a.record_id.slice(0, 8)}` : ''}</small>
        </div>
      </li>; })}</ol>
      <div className="pager"><button className="button button-outline btn-sm" disabled={page <= 1} onClick={() => setPage(p => p - 1)}><ChevronLeft size={14}/> Newer</button><span>Page {page} of {pages}</span><button className="button button-outline btn-sm" disabled={page >= pages} onClick={() => setPage(p => p + 1)}>Older <ChevronRight size={14}/></button></div>
    </>}</Panel>
  </>;
}
