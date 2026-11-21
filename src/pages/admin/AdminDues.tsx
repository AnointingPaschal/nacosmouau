import { useEffect, useState, type FormEvent } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { CalendarClock, Landmark, Pencil, Plus, Power, ShieldCheck, Trash2, Wallet } from 'lucide-react';
import { toast } from 'sonner';
import { api } from '../../lib/api';
import { fromKobo, naira, toKobo, when } from '../../lib/money';
import { EmptyState, ErrorState, LoadingState } from '../../components/States';
import { PageTitle, Panel, Pill } from '../../components/Workspace';

const LEVELS = ['100', '200', '300', '400'];
interface Item { id: string; title: string; description: string | null; amount_minor: number; levels: string | null; session: string; due_date: string | null; is_active: number; paid_count: number; collected_minor: number; pending_count: number; payments_count: number }
interface Nacos { level: string; amount_minor: number; explicit: boolean; members: number; payers: number; collected_minor: number }
interface Data { session: string; nacos: Nacos[]; items: Item[]; caller_is_super_admin: boolean }
const levelText = (v: string | null) => (v ? `${v.split(',').join(', ')} level` : 'All levels');

function LevelPicker({ value, onChange }: { value: string[]; onChange: (v: string[]) => void }) {
  const all = value.length === 0 || value.length === LEVELS.length;
  return <div className="field"><span>Who pays</span><div className="level-pick" role="group" aria-label="Levels that pay">
    <button type="button" className={`level-chip${all ? ' is-on' : ''}`} onClick={() => onChange([])}>All levels</button>
    {LEVELS.map(l => { const on = !all && value.includes(l); return <button type="button" key={l} className={`level-chip${on ? ' is-on' : ''}`} aria-pressed={on} onClick={() => onChange(on ? value.filter(x => x !== l) : [...(all ? [] : value), l])}>{l}L</button>; })}
  </div></div>;
}

function DuesForm({ item, onClose, onDone }: { item: Item | null; onClose: () => void; onDone: () => void }) {
  const locked = Boolean(item && item.payments_count > 0);
  const [f, setF] = useState({ title: item?.title ?? '', description: item?.description ?? '', amount: item ? fromKobo(item.amount_minor) : '', levels: item?.levels ? item.levels.split(',') : [] as string[], due: item?.due_date ?? '' });
  const [busy, setBusy] = useState(false);
  const save = async (e: FormEvent) => {
    e.preventDefault(); setBusy(true);
    try {
      const body = { title: f.title, description: f.description, due_date: f.due, ...(locked ? {} : { amount_minor: toKobo(f.amount || 0), levels: f.levels.length ? f.levels : null }) };
      if (item) await api.patch(`staff/dues/${item.id}`, body); else await api.post('staff/dues', body);
      toast.success(item ? 'Dues updated' : 'Dues created. Members can pay now.'); onDone(); onClose();
    } catch (err) { toast.error(err instanceof Error ? err.message : 'Could not save'); } finally { setBusy(false); }
  };
  return <div className="modal-scrim" role="presentation"><section className="workspace-panel crud-modal" role="dialog" aria-modal="true"><h2>{item ? 'Edit dues' : 'Create new dues'}</h2>
    <form className="form-stack" onSubmit={save}>
      <label className="field"><span>Name</span><input value={f.title} onChange={e => setF(v => ({ ...v, title: e.target.value }))} placeholder="e.g. Tech Summit levy" required minLength={3}/></label>
      <label className="field"><span>Description (optional)</span><textarea rows={2} value={f.description} onChange={e => setF(v => ({ ...v, description: e.target.value }))} placeholder="What the money is for"/></label>
      <div className="crud-form-grid">
        <label className="field"><span>Amount (₦)</span><input inputMode="decimal" value={f.amount} onChange={e => setF(v => ({ ...v, amount: e.target.value }))} required disabled={locked} placeholder="2000"/></label>
        <label className="field"><span>Pay by (optional)</span><input type="date" value={f.due} onChange={e => setF(v => ({ ...v, due: e.target.value }))}/></label>
      </div>
      {locked ? <p className="field-hint">Payments have started, so the amount and levels are locked.</p> : <LevelPicker value={f.levels} onChange={levels => setF(v => ({ ...v, levels }))}/>}
      <footer><button type="button" className="button button-outline" onClick={onClose}>Cancel</button><button className="button button-green" disabled={busy}>{busy ? 'Saving…' : item ? 'Save' : 'Create dues'}</button></footer>
    </form></section></div>;
}

export function AdminDues() {
  const client = useQueryClient();
  const q = useQuery({ queryKey: ['staff', 'dues'], queryFn: ({ signal }) => api.get<Data>('staff/dues', signal), retry: false });
  const [amounts, setAmounts] = useState<Record<string, string>>({}); const [email, setEmail] = useState(''); const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false); const [form, setForm] = useState<Item | 'new' | null>(null);
  useEffect(() => { if (q.data) setAmounts(Object.fromEntries(q.data.nacos.map(n => [n.level, fromKobo(n.amount_minor)]))); }, [q.data]);
  if (q.isLoading) return <LoadingState/>;
  if (q.error || !q.data) return <ErrorState error={q.error}/>;
  const d = q.data; const refresh = () => client.invalidateQueries({ queryKey: ['staff'] }).then(() => client.invalidateQueries({ queryKey: ['portal'] }));
  const changed = d.nacos.some(n => toKobo(amounts[n.level] || 0) !== n.amount_minor);
  const saveNacos = async (e: FormEvent) => {
    e.preventDefault(); setBusy(true);
    try { await api.put('staff/dues/nacos', { dues_by_level: Object.fromEntries(LEVELS.map(l => [l, toKobo(amounts[l] || 0)])), super_admin_email: d.caller_is_super_admin ? undefined : email, super_admin_password: password }); toast.success('NACOS dues saved'); setPassword(''); await refresh(); }
    catch (err) { toast.error(err instanceof Error ? err.message : 'Could not save'); } finally { setBusy(false); }
  };
  const toggle = async (i: Item) => { try { await api.patch(`staff/dues/${i.id}`, { is_active: !i.is_active }); toast.success(i.is_active ? 'Dues closed' : 'Dues reopened'); await refresh(); } catch (e) { toast.error(e instanceof Error ? e.message : 'Could not update'); } };
  const remove = async (i: Item) => { if (!window.confirm(`Delete "${i.title}"?`)) return; try { await api.delete(`staff/dues/${i.id}`); toast.success('Dues deleted'); await refresh(); } catch (e) { toast.error(e instanceof Error ? e.message : 'Could not delete'); } };
  return <>
    <PageTitle eyebrow="FINANCE" title="Dues" description={`Set the NACOS dues for each level and create other dues for ${d.session}. Bank and Paystack details are under Payment details.`}
      action={<button className="button button-green btn-sm" onClick={() => setForm('new')}><Plus size={15}/> New dues</button>}/>
    <Panel title={`NACOS dues ${d.session}`}>
      <p className="form-note">The main yearly dues. A member who pays these can vote in NACOS elections. A level set to 0 shows "not set" to those members.</p>
      <form className="form-stack" onSubmit={saveNacos}>
        <div className="nacos-grid">{d.nacos.map(n => <div className="nacos-cell" key={n.level}>
          <b>{n.level} level</b>
          <label className="field"><span>Amount (₦)</span><input inputMode="decimal" value={amounts[n.level] ?? ''} onChange={e => setAmounts(v => ({ ...v, [n.level]: e.target.value }))} placeholder="0"/></label>
          <div className="dues-stat"><span><b>{n.payers}</b> of {n.members} paid</span><span><b>{naira(n.collected_minor)}</b></span></div>
        </div>)}</div>
        {changed && <div className="flow-card"><p className="field-hint"><ShieldCheck size={14}/> {d.caller_is_super_admin ? 'Enter your password to save the new amounts.' : 'Enter a super administrator\'s email and password to save the new amounts.'}</p>
          <div className="crud-form-grid">
            {!d.caller_is_super_admin && <label className="field"><span>Super administrator email</span><input type="email" value={email} onChange={e => setEmail(e.target.value)} required autoComplete="off"/></label>}
            <label className="field"><span>{d.caller_is_super_admin ? 'Your password' : 'Super administrator password'}</span><input type="password" value={password} onChange={e => setPassword(e.target.value)} required autoComplete="current-password"/></label>
          </div>
          <div className="row-right" style={{ justifyContent: 'flex-start' }}><button className="button button-green" disabled={busy || !password}><Landmark size={15}/> {busy ? 'Saving…' : 'Save NACOS dues'}</button></div></div>}
      </form>
    </Panel>
    <div className="section-line"><h2>Other dues</h2><span>{d.items.length} created</span></div>
    {d.items.length === 0 ? <Panel><EmptyState title="No other dues yet" text="Create dues for every level or only some levels, such as a departmental levy, a jersey fee or an event contribution." icon={<Wallet size={22}/>}/></Panel> :
      <div className="dues-admin-grid">{d.items.map(i => <article className={`workspace-panel${i.is_active ? '' : ' is-muted'}`} key={i.id}>
        <div className="dues-item-head"><div><h3>{i.title}</h3><small className="form-note">{i.session}</small></div><Pill value={i.is_active ? 'active' : 'closed'}/></div>
        {i.description && <p className="form-note">{i.description}</p>}
        <div className="due-amount">{naira(i.amount_minor)}</div>
        <div className="chips"><i>{levelText(i.levels)}</i>{i.due_date && <i><CalendarClock size={11}/> {when(i.due_date)}</i>}</div>
        <div className="dues-stat"><span><b>{i.paid_count}</b> paid</span><span><b>{naira(i.collected_minor)}</b> collected</span>{i.pending_count > 0 && <span><b>{i.pending_count}</b> awaiting approval</span>}</div>
        <div className="member-actions" style={{ justifyContent: 'flex-start', marginTop: 8 }}>
          <button className="button button-outline btn-sm" onClick={() => setForm(i)}><Pencil size={13}/> Edit</button>
          <button className="button button-outline btn-sm" onClick={() => void toggle(i)}><Power size={13}/> {i.is_active ? 'Close' : 'Reopen'}</button>
          {i.payments_count === 0 && <button className="icon-button" aria-label={`Delete ${i.title}`} onClick={() => void remove(i)}><Trash2 size={15}/></button>}
        </div>
      </article>)}</div>}
    {form && <DuesForm item={form === 'new' ? null : form} onClose={() => setForm(null)} onDone={() => void refresh()}/>}
  </>;
}
