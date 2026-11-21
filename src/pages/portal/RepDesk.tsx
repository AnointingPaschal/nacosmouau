import { useMemo, useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { BadgeCheck, BookOpenCheck, Copy, Download, Megaphone, Search, Trash2, UsersRound, Wallet } from 'lucide-react';
import { api } from '../../lib/api';
import { ErrorState, LoadingState } from '../../components/States';
import { PageTitle, Panel } from '../../components/Workspace';
import { REP_LABEL, when, type MatesState, type RepDeskState } from './classApi';

export function useRepDesk(enabled = true) {
  return useQuery({ queryKey: ['portal', 'class', 'rep'], queryFn: ({ signal }) => api.get<RepDeskState>('portal/class/rep', signal), retry: false, enabled });
}

export function RepStats({ desk }: { desk: RepDeskState }) {
  const registered = desk.members.filter(m => m.units > 0).length; const dues = desk.members.filter(m => m.dues_paid).length;
  return <div className="rep-stats">
    <div><UsersRound size={18}/><b>{desk.members.length}</b><span>Classmates</span></div>
    <div><BookOpenCheck size={18}/><b>{registered}<small>/{desk.members.length}</small></b><span>Registered courses</span></div>
    <div><Wallet size={18}/><b>{dues}<small>/{desk.members.length}</small></b><span>Paid dues</span></div>
  </div>;
}

export function PortalRepDesk() {
  const client = useQueryClient();
  const desk = useRepDesk();
  const notices = useQuery({ queryKey: ['portal', 'class', 'mates'], queryFn: ({ signal }) => api.get<MatesState>('portal/class/mates', signal), retry: false });
  const [search, setSearch] = useState(''); const [filter, setFilter] = useState<'all' | 'noreg' | 'nodues'>('all');
  const [form, setForm] = useState({ title: '', body: '' });
  const post = useMutation({ mutationFn: () => api.post('portal/class/notices', form), onSuccess: async () => { toast.success('Notice sent to your class'); setForm({ title: '', body: '' }); await client.invalidateQueries({ queryKey: ['portal', 'class'] }); }, onError: e => toast.error(e instanceof Error ? e.message : 'Could not post the notice') });
  const remove = useMutation({ mutationFn: (id: string) => api.delete(`portal/class/notices/${id}`), onSuccess: async () => { toast.success('Notice removed'); await client.invalidateQueries({ queryKey: ['portal', 'class'] }); }, onError: e => toast.error(e instanceof Error ? e.message : 'Could not remove the notice') });
  const rows = useMemo(() => (desk.data?.members ?? []).filter(m => `${m.full_name} ${m.matric_number ?? ''}`.toLowerCase().includes(search.toLowerCase()) && (filter === 'all' || (filter === 'noreg' ? m.units === 0 : !m.dues_paid))), [desk.data, search, filter]);

  if (desk.isLoading) return <LoadingState/>;
  if (desk.error || !desk.data) return <ErrorState error={desk.error ?? new Error('Rep desk unavailable')}/>;
  const d = desk.data;
  const submit = (e: FormEvent) => { e.preventDefault(); post.mutate(); };
  const copyPhones = async () => { const list = rows.map(m => m.phone).filter(Boolean).join(', '); if (!list) { toast.error('No phone numbers in this list'); return; } await navigator.clipboard.writeText(list); toast.success(`${rows.filter(m => m.phone).length} numbers copied`); };
  const exportCsv = () => {
    const lines = [['Name', 'Matric', 'Phone', 'Email', 'Units registered', 'Dues paid'], ...rows.map(m => [`"${m.full_name}"`, m.matric_number ?? '', m.phone ?? '', m.email ?? '', String(m.units), m.dues_paid ? 'Yes' : 'No'])];
    const url = URL.createObjectURL(new Blob([lines.map(l => l.join(',')).join('\n')], { type: 'text/csv' })); const a = document.createElement('a'); a.href = url; a.download = `${d.level}L-class-list.csv`; a.click(); URL.revokeObjectURL(url);
  };

  return <>
    <PageTitle eyebrow="CLASS REP DESK" title={`${d.level} level desk`} description={`You are the ${REP_LABEL[d.role]} for ${d.session}. Keep your class informed and see who still needs a nudge.`}/>
    <RepStats desk={d}/>
    <div className="rep-cols">
      <Panel title="Post a class notice" action={<Megaphone size={18}/>}>
        <form className="form-stack" onSubmit={submit}>
          <label className="field"><span>Title</span><input value={form.title} maxLength={120} onChange={e => setForm({ ...form, title: e.target.value })} required/></label>
          <label className="field"><span>Message</span><textarea rows={3} maxLength={1500} value={form.body} onChange={e => setForm({ ...form, body: e.target.value })} required/></label>
          <div><button className="button button-green" disabled={post.isPending}>{post.isPending ? 'Sending…' : 'Send to the class'}</button></div>
        </form>
      </Panel>
      <Panel title="Your recent notices">
        {(notices.data?.notices ?? []).length === 0 ? <p className="field-hint">Nothing posted yet. Level mates see notices on their Level mates page.</p> : <ul className="lm-notices">{(notices.data?.notices ?? []).map(n => <li key={n.id}><div className="lm-notice-row"><b>{n.title}</b><button aria-label="Remove notice" onClick={() => { if (window.confirm('Remove this notice?')) remove.mutate(n.id); }}><Trash2 size={14}/></button></div><p>{n.body}</p><small>{n.author} · {when(n.created_at)}</small></li>)}</ul>}
      </Panel>
    </div>
    <Panel title="Class tracker" action={<div className="rep-actions"><button className="button button-outline btn-sm" onClick={() => void copyPhones()}><Copy size={14}/> Copy phones</button><button className="button button-outline btn-sm" onClick={exportCsv}><Download size={14}/> CSV</button></div>}>
      <div className="adm-course-filters">
        <div className="study-tabs small" role="tablist" aria-label="Filter">{([['all', 'Everyone'], ['noreg', 'No courses'], ['nodues', 'Unpaid dues']] as const).map(([v, label]) => <button key={v} className={filter === v ? 'active' : ''} onClick={() => setFilter(v)}>{label}</button>)}</div>
        <label className="study-search"><Search size={15}/><input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search name or matric" aria-label="Search class"/></label>
      </div>
      <div className="res-table-wrap"><table className="res-table"><thead><tr><th>Student</th><th>Phone</th><th className="num">Units</th><th>Dues</th></tr></thead><tbody>{rows.length === 0 ? <tr><td colSpan={4} className="adm-empty">No one matches.</td></tr> : rows.map(m => <tr key={m.id}><td className="name"><b>{m.full_name}</b><span>{m.matric_number}</span></td><td>{m.phone ? <a href={`tel:${m.phone}`}>{m.phone}</a> : '-'}</td><td className="num">{m.units}</td><td>{m.dues_paid ? <span className="rep-ok">Paid</span> : <span className="rep-no">Unpaid</span>}</td></tr>)}</tbody></table></div>
    </Panel>
    <p className="field-hint res-note">Student details are for class business only. <Link to="/portal/level-mates">Open Level mates</Link></p>
  </>;
}

export function RepHome() {
  const desk = useRepDesk();
  if (!desk.data) return null;
  const d = desk.data;
  return <section className="rep-home">
    <div className="rep-home-head"><span className="lm-badge dark"><BadgeCheck size={14}/> {REP_LABEL[d.role]}</span><h2>{d.level} level · {d.session}</h2><p>Your class rep dashboard.</p></div>
    <RepStats desk={d}/>
    <div className="rep-links"><Link to="/portal/rep-desk">Open rep desk</Link><Link to="/portal/level-mates">Level mates</Link><Link to="/portal/class-election">Class election</Link></div>
  </section>;
}
