import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Check, ChevronLeft, ChevronRight, Search, ShieldCheck, UserX, Users, X } from 'lucide-react';
import { toast } from 'sonner';
import { api } from '../../lib/api';
import { EmptyState, ErrorState, LoadingState } from '../../components/States';
import { PageTitle, Panel, Pill } from '../../components/Workspace';

interface M { id: string; full_name: string; email: string; matric_number: string | null; academic_level: string | null; status: string; role: string; roles: string[]; membership_id: string | null }
interface Role { id: string; name: string; description: string | null; permissions: number; members: number }

function RoleDialog({ member, onClose }: { member: M; onClose: () => void }) {
  const client = useQueryClient();
  const roles = useQuery({ queryKey: ['staff', 'roles'], queryFn: ({ signal }) => api.get<Role[]>('staff/roles', signal), retry: false });
  const [busy, setBusy] = useState('');
  const toggle = async (role: Role, has: boolean) => {
    setBusy(role.id);
    try { await api.post(`staff/members/${member.id}/roles`, { role_id: role.id, action: has ? 'remove' : 'add' }); toast.success(`${has ? 'Removed' : 'Added'} ${role.name}`); await client.invalidateQueries({ queryKey: ['staff', 'members'] }); }
    catch (e) { toast.error(e instanceof Error ? e.message : 'Could not change the role'); } finally { setBusy(''); }
  };
  const current = new Set([...(client.getQueryData<{ members: M[] }>(['staff', 'members'])?.members.find(m => m.id === member.id)?.roles ?? member.roles)]);
  const live = client.getQueriesData<{ members: M[] }>({ queryKey: ['staff', 'members'] }).flatMap(([, d]) => d?.members ?? []).find(m => m.id === member.id);
  const has = new Set(live?.roles ?? [...current]);
  return <div className="modal-scrim" role="presentation" onMouseDown={e => { if (e.target === e.currentTarget) onClose(); }}><section className="workspace-panel crud-modal" role="dialog" aria-modal="true">
    <header><div><span className="eyebrow-green">ROLES</span><h2>{member.full_name}</h2><small className="mono">{member.matric_number ?? member.email}</small></div><button className="icon-button" onClick={onClose} aria-label="Close"><X size={18}/></button></header>
    {member.status !== 'active' && <p className="form-note">Approve this member first. Only active members can hold a role.</p>}
    {roles.isLoading ? <LoadingState/> : roles.error ? <ErrorState error={roles.error}/> : <div className="role-list">{(roles.data ?? []).filter(r => r.id !== 'member').map(r => { const on = has.has(r.id); return <button key={r.id} type="button" className={`role-item${on ? ' is-on' : ''}`} disabled={busy === r.id || member.status !== 'active'} onClick={() => void toggle(r, on)}><span className="role-check">{on && <Check size={14}/>}</span><span><b>{r.name}</b><small>{r.description}</small></span></button>; })}</div>}
    <footer><button className="button button-green" onClick={onClose}>Done</button></footer>
  </section></div>;
}

export function AdminMembers() {
  const client = useQueryClient();
  const [search, setSearch] = useState(''); const [level, setLevel] = useState(''); const [status, setStatus] = useState(''); const [page, setPage] = useState(1); const [roleFor, setRoleFor] = useState<M | null>(null);
  const q = useQuery({ queryKey: ['staff', 'members', search, level, status, page], queryFn: ({ signal }) => api.get<{ total: number; members: M[] }>(`staff/members?${new URLSearchParams({ search, level, status, page: String(page) })}`, signal), retry: false, placeholderData: p => p });
  const setState = async (m: M, next: string) => { try { await api.patch(`staff/members/${m.id}`, { status: next }); toast.success(next === 'active' ? `${m.full_name} approved` : `${m.full_name} ${next}`); await client.invalidateQueries({ queryKey: ['staff', 'members'] }); } catch (e) { toast.error(e instanceof Error ? e.message : 'Could not update the member'); } };
  const total = q.data?.total ?? 0; const pages = Math.max(1, Math.ceil(total / 50));
  return <>
    <PageTitle eyebrow="MEMBERSHIP" title="Members & roles" description="Search members, approve applications and give executives their roles."/>
    <Panel>
      <div className="filter-bar">
        <label className="crud-search"><Search size={16}/><input value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} placeholder="Search name, matric number or email"/></label>
        <select value={level} onChange={e => { setLevel(e.target.value); setPage(1); }} aria-label="Level"><option value="">All levels</option>{['100', '200', '300', '400'].map(l => <option key={l} value={l}>{l} Level</option>)}</select>
        <select value={status} onChange={e => { setStatus(e.target.value); setPage(1); }} aria-label="Status"><option value="">All statuses</option><option value="pending">Pending</option><option value="active">Active</option><option value="suspended">Suspended</option></select>
      </div>
      {q.isLoading ? <LoadingState/> : q.error ? <ErrorState error={q.error}/> : !q.data?.members.length ? <EmptyState title="No members found" text="Try a different name, matric number or level." icon={<Users size={22}/>}/> :
        <div className="record-list">{q.data.members.map(m => <article className="member-row" key={m.id}>
          <div className="member-info"><strong>{m.full_name}</strong><span className="mono">{m.matric_number ?? m.email}</span><span>{m.academic_level ? `${m.academic_level} Level` : 'Level not set'} · {m.email}</span>{m.roles.length > 0 && <div className="chips">{m.roles.map(r => <i key={r}>{r.replace(/_/g, ' ')}</i>)}</div>}</div>
          <div className="member-actions"><Pill value={m.status}/>
            {m.status === 'pending' && <button className="button button-green btn-sm" onClick={() => void setState(m, 'active')}><Check size={14}/> Approve</button>}
            {m.status === 'active' && <button className="button button-outline btn-sm" onClick={() => setRoleFor(m)}><ShieldCheck size={14}/> Roles</button>}
            {m.status === 'active' && m.role === 'member' && <button className="button button-outline btn-sm" onClick={() => void setState(m, 'suspended')} aria-label={`Suspend ${m.full_name}`}><UserX size={14}/></button>}
            {m.status === 'suspended' && <button className="button button-outline btn-sm" onClick={() => void setState(m, 'active')}>Restore</button>}
          </div></article>)}</div>}
      <div className="crud-pagination"><button className="button button-outline" disabled={page <= 1} onClick={() => setPage(p => p - 1)}><ChevronLeft size={14}/> Previous</button><span>Page {page} of {pages} · {total} members</span><button className="button button-outline" disabled={page >= pages} onClick={() => setPage(p => p + 1)}>Next <ChevronRight size={14}/></button></div>
    </Panel>
    {roleFor && <RoleDialog member={roleFor} onClose={() => setRoleFor(null)}/>}
  </>;
}
