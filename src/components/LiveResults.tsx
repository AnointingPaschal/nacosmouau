import { useEffect, useRef, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Crown, Radio, Users } from 'lucide-react';
import { api } from '../lib/api';
import { ErrorState, LoadingState } from './States';

interface Cand { id: string; display_name: string; votes: number; photo_url: string | null }
interface Result { turnout: number; eligible_voters: number; updated_at: string; positions: Array<{ id: string; title: string; total: number; candidates: Cand[] }> }

const initials = (name: string) => name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase();
const clock = (iso: number) => new Date(iso).toLocaleTimeString('en-NG', { hour: '2-digit', minute: '2-digit', second: '2-digit' });

/** Results that refresh every few seconds while voting is open, and settle once the election closes. */
export function LiveResults({ path, queryKey, live, closed = false, title }: { path: string; queryKey: unknown[]; live: boolean; closed?: boolean; title?: string }) {
  const q = useQuery({ queryKey, queryFn: ({ signal }) => api.get<Result>(path, signal), retry: false, refetchInterval: live ? 4000 : false, refetchIntervalInBackground: false, staleTime: 0 });
  const previous = useRef<number | null>(null); const [pulse, setPulse] = useState(0);
  const turnout = q.data?.turnout ?? null;
  useEffect(() => {
    if (turnout === null) return;
    if (previous.current !== null && turnout > previous.current) setPulse(n => n + 1);
    previous.current = turnout;
  }, [turnout]);
  if (q.isLoading) return <LoadingState/>;
  if (q.error || !q.data) return <ErrorState error={q.error}/>;
  const d = q.data; const showRate = d.eligible_voters >= d.turnout && d.eligible_voters > 0; const rate = showRate ? Math.round((d.turnout / d.eligible_voters) * 100) : null;
  return <section className="live-results" aria-live="polite">
    <header className="lr-head">
      <div><h2>{title ?? (closed ? 'Final results' : 'Live results')}</h2>
        <span className={`lr-status${live ? ' is-live' : ''}`}>{live ? <><Radio size={13}/> LIVE · updated {clock(q.dataUpdatedAt)}</> : closed ? 'Voting closed' : 'Snapshot'}</span></div>
      <div className="lr-turnout" key={pulse}><Users size={16}/><div><b>{d.turnout}</b><small>{showRate ? `votes cast of ${d.eligible_voters} eligible` : 'votes cast'}</small></div>{rate !== null && <span className="lr-ring" style={{ ['--p' as string]: `${rate}%` }}><i>{rate}%</i></span>}</div>
    </header>
    <div className="lr-grid">{d.positions.map(p => {
      const top = p.candidates[0]?.votes ?? 0; const tied = p.candidates.filter(c => c.votes === top).length > 1;
      return <article className="lr-position" key={p.id}>
        <h3>{p.title}<small>{p.total} {p.total === 1 ? 'vote' : 'votes'}</small></h3>
        {p.candidates.length === 0 ? <p className="form-note">No candidates.</p> : p.candidates.map(c => {
          const pct = p.total > 0 ? (c.votes / p.total) * 100 : 0; const leading = top > 0 && c.votes === top;
          return <div className={`lr-row${leading ? ' is-leading' : ''}`} key={c.id}>
            <span className="lr-avatar">{c.photo_url ? <img src={c.photo_url} alt="" loading="lazy"/> : <b>{initials(c.display_name)}</b>}{leading && !tied && <em><Crown size={11}/></em>}</span>
            <div className="lr-main"><div className="lr-line"><span className="lr-name">{c.display_name}{leading && closed && !tied && <small>Winner</small>}{leading && tied && <small>Tied</small>}</span><b>{c.votes}<small> · {pct.toFixed(pct % 1 === 0 ? 0 : 1)}%</small></b></div>
              <div className="lr-bar"><i style={{ width: `${pct}%` }}/></div></div>
          </div>; })}
      </article>; })}</div>
  </section>;
}
