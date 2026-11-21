import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { BadgeCheck, Megaphone, Phone, Search, UsersRound } from 'lucide-react';
import { api } from '../../lib/api';
import { EmptyState, ErrorState, LoadingState } from '../../components/States';
import { PageTitle, Panel } from '../../components/Workspace';
import { REP_LABEL, initials, when, type MatesState } from './classApi';

export function PortalLevelMates() {
  const q = useQuery({ queryKey: ['portal', 'class', 'mates'], queryFn: ({ signal }) => api.get<MatesState>('portal/class/mates', signal), retry: false });
  const [search, setSearch] = useState('');
  const members = useMemo(() => (q.data?.members ?? []).filter(m => `${m.full_name} ${m.matric_number ?? ''}`.toLowerCase().includes(search.toLowerCase())), [q.data, search]);
  if (q.isLoading) return <LoadingState/>;
  if (q.error || !q.data) return <ErrorState error={q.error ?? new Error('Level mates unavailable')}/>;
  const { level, members: all, notices } = q.data;
  if (!level) return <><PageTitle eyebrow="CLASS" title="Level mates"/><EmptyState title="Your level is not set" text="Add your level in My membership so we can show the students in your class." icon={<UsersRound size={22}/>}/></>;
  const reps = all.filter(m => m.rep_role);
  const rest = members.filter(m => !m.rep_role);

  return <>
    <PageTitle eyebrow="CLASS" title={`${level} level mates`} description={`${all.length} active member${all.length === 1 ? '' : 's'} in your class for ${q.data.session}.`}/>
    <div className="lm-reps">{(['rep', 'assistant'] as const).map(role => { const m = reps.find(r => r.rep_role === role); return <div key={role} className={`lm-rep${m ? '' : ' empty'}`}>
      <span className="lm-badge"><BadgeCheck size={14}/> {REP_LABEL[role]}</span>
      {m ? <><b>{m.full_name}</b><small>{m.matric_number}</small>{m.phone && <a href={`tel:${m.phone}`}><Phone size={14}/> {m.phone}</a>}</> : <><b>Not elected yet</b><small><Link to="/portal/class-election">See the class election</Link></small></>}
    </div>; })}</div>
    {notices.length > 0 && <Panel title="From your class reps" action={<Megaphone size={18}/>}><ul className="lm-notices">{notices.map(n => <li key={n.id}><b>{n.title}</b><p>{n.body}</p><small>{n.author} · {when(n.created_at)}</small></li>)}</ul></Panel>}
    <Panel title="Classmates" action={<label className="study-search"><Search size={15}/><input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search name or matric" aria-label="Search classmates"/></label>}>
      {rest.length === 0 ? <p className="field-hint">No one matches your search.</p> : <ul className="lm-list">{rest.map(m => <li key={m.id}><span className="lm-avatar">{initials(m.full_name)}</span><div><b>{m.full_name}</b><small>{m.matric_number ?? 'Matric not set'}</small></div></li>)}</ul>}
    </Panel>
  </>;
}
