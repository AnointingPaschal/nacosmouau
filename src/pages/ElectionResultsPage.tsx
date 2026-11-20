import { useEffect, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, Crown, Download, Lock, Radio, Trophy, Users, Vote } from 'lucide-react';
import { api } from '../lib/api';
import { when } from '../lib/money';
import { EmptyState, ErrorState, LoadingState } from '../components/States';

interface Cand { id: string; display_name: string; votes: number; photo_url: string | null }
interface Result { turnout: number; eligible_voters: number; positions: Array<{ id: string; title: string; total: number; candidates: Cand[] }> }
interface ElectionInfo { title: string; status: string; closes_at: string | null }

const initials = (name: string) => name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase();
const pctOf = (votes: number, total: number) => (total > 0 ? (votes / total) * 100 : 0);
const fmt = (n: number) => n.toFixed(n % 1 === 0 ? 0 : 1);

/** Dedicated results page: headline numbers, a leader card for each post, then the full breakdown. */
export function ElectionResultsPage({ staff }: { staff: boolean }) {
  const { id = '' } = useParams(); const base = staff ? 'staff/elections' : 'portal/elections';
  const info = useQuery({ queryKey: [staff ? 'staff' : 'portal', 'elections', id, 'info'], queryFn: async ({ signal }) => { const d = await api.get<{ election: ElectionInfo }>(`${base}/${id}`, signal); return d.election; }, retry: false });
  const live = info.data?.status === 'voting';
  const res = useQuery({ queryKey: [staff ? 'staff' : 'portal', 'elections', id, 'results'], queryFn: ({ signal }) => api.get<Result>(`${base}/${id}/results`, signal), retry: false, enabled: Boolean(info.data), refetchInterval: live ? 4000 : false, staleTime: 0 });
  const previous = useRef<number | null>(null); const [bump, setBump] = useState(0); const turnout = res.data?.turnout ?? null;
  useEffect(() => { if (turnout === null) return; if (previous.current !== null && turnout > previous.current) setBump(n => n + 1); previous.current = turnout; }, [turnout]);
  const back = staff ? `/admin/elections/${id}` : '/portal/elections';

  if (info.isLoading) return <LoadingState/>;
  if (info.error || !info.data) return <ErrorState error={info.error}/>;
  const e = info.data;
  if (res.error) return <><Link className="exec-back rp-back" to={back}><ArrowLeft size={14}/> Back</Link><div className="workspace-panel"><EmptyState title="Results are not available yet" text={res.error instanceof Error ? res.error.message : 'Results will appear here once they are published.'} icon={<Lock size={22}/>}/></div></>;
  if (!res.data) return <LoadingState/>;
  const d = res.data; const closed = e.status === 'closed'; const rate = d.eligible_voters >= d.turnout && d.eligible_voters > 0 ? Math.round((d.turnout / d.eligible_voters) * 100) : null;

  const exportCsv = () => {
    const rows = [['Position', 'Candidate', 'Votes', 'Percent']];
    for (const p of d.positions) for (const c of p.candidates) rows.push([p.title, c.display_name, String(c.votes), `${fmt(pctOf(c.votes, p.total))}%`]);
    const url = URL.createObjectURL(new Blob([rows.map(r => r.map(v => `"${v.replace(/"/g, '""')}"`).join(',')).join('\n')], { type: 'text/csv' }));
    const a = document.createElement('a'); a.href = url; a.download = `${e.title.replace(/\W+/g, '-').toLowerCase()}-results.csv`; a.click(); URL.revokeObjectURL(url);
  };

  return <div className="rp">
    <header className="rp-hero">
      <Link className="exec-back" to={back}><ArrowLeft size={14}/> {staff ? 'Back to election' : 'All elections'}</Link>
      <div className="rp-title">
        <span className={`rp-badge${live ? ' is-live' : ''}`}>{live ? <><Radio size={13}/> LIVE</> : closed ? <><Trophy size={13}/> FINAL RESULT</> : 'SNAPSHOT'}</span>
        <h1>{e.title}</h1>
        <p>{live ? `Updates automatically · last update ${new Date(res.dataUpdatedAt).toLocaleTimeString('en-NG', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}` : closed ? `Voting closed ${when(e.closes_at)}` : 'Voting has not started.'}</p>
      </div>
      <dl className="rp-stats">
        <div key={bump} className="rp-stat is-big"><dt><Users size={14}/> Votes cast</dt><dd>{d.turnout}</dd></div>
        <div className="rp-stat"><dt>Eligible voters</dt><dd>{d.eligible_voters >= d.turnout && d.eligible_voters > 0 ? d.eligible_voters : '—'}</dd></div>
        <div className="rp-stat"><dt>Turnout</dt><dd>{rate !== null ? `${rate}%` : '—'}</dd></div>
        <div className="rp-stat"><dt>Posts</dt><dd>{d.positions.length}</dd></div>
      </dl>
    </header>

    {d.positions.length === 0 ? <div className="workspace-panel"><EmptyState title="No posts in this election" text="Results will show here once posts and candidates are set up." icon={<Vote size={22}/>}/></div> : <>
      <h2 className="rp-heading">{closed ? 'Winners' : 'Leading right now'}</h2>
      <div className="rp-leaders">{d.positions.map(p => {
        const top = p.candidates[0]; const second = p.candidates[1]; const leaders = top ? p.candidates.filter(c => c.votes === top.votes) : []; const tied = leaders.length > 1 && top.votes > 0;
        return <article className={`rp-leader${tied ? ' is-tied' : ''}`} key={p.id}>
          <span className="rp-post">{p.title}</span>
          {!top || top.votes === 0 ? <p className="rp-none">No votes yet</p> : tied ? <>
            <div className="rp-duo">{leaders.slice(0, 3).map(c => <span className="rp-face sm" key={c.id}>{c.photo_url ? <img src={c.photo_url} alt={c.display_name}/> : <b>{initials(c.display_name)}</b>}</span>)}</div>
            <h3>{leaders.map(c => c.display_name).join(' & ')}</h3><p className="rp-margin">Tied on {top.votes} {top.votes === 1 ? 'vote' : 'votes'}</p>
          </> : <>
            <span className="rp-face">{top.photo_url ? <img src={top.photo_url} alt={top.display_name}/> : <b>{initials(top.display_name)}</b>}<em><Crown size={14}/></em></span>
            <h3>{top.display_name}</h3>
            <p className="rp-votes"><b>{top.votes}</b> votes · {fmt(pctOf(top.votes, p.total))}%</p>
            <p className="rp-margin">{second ? `${top.votes - second.votes} ahead of ${second.display_name}` : 'Unopposed'}</p>
          </>}
        </article>; })}</div>

      <div className="rp-bar-head"><h2 className="rp-heading">Full breakdown</h2>{staff && <button className="button button-outline btn-sm" onClick={exportCsv}><Download size={14}/> Download CSV</button>}</div>
      <div className="rp-breakdown">{d.positions.map(p => <section className="rp-card" key={p.id}>
        <h3>{p.title}<small>{p.total} {p.total === 1 ? 'vote' : 'votes'}</small></h3>
        <ol>{p.candidates.map((c, i) => { const pct = pctOf(c.votes, p.total); return <li key={c.id} className={i === 0 && c.votes > 0 ? 'is-first' : ''}>
          <span className="rp-rank">{i + 1}</span>
          <span className="rp-face xs">{c.photo_url ? <img src={c.photo_url} alt="" loading="lazy"/> : <b>{initials(c.display_name)}</b>}</span>
          <div className="rp-line"><div><span>{c.display_name}</span><b>{c.votes}<small> · {fmt(pct)}%</small></b></div><i className="rp-meter"><u style={{ width: `${pct}%` }}/></i></div>
        </li>; })}</ol>
      </section>)}</div>
    </>}
  </div>;
}
