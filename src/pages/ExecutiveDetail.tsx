import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, ArrowRight, UserRound } from 'lucide-react';
import { EmptyState, ErrorState, LoadingState } from '../components/States';
import { useExecutives } from '../hooks/useApi';

/** Responsibilities are stored as plain text: an intro, "- " bullets, then "Key contributions" with "- Title: text" lines. */
function parse(text?: string | null) {
  const [roleBlock = '', contribBlock = ''] = (text ?? '').split(/\n+Key contributions\n/i);
  const lines = roleBlock.split('\n').map(l => l.trim()).filter(Boolean);
  const intro = lines.filter(l => !l.startsWith('- '));
  const duties = lines.filter(l => l.startsWith('- ')).map(l => l.slice(2));
  const contributions = contribBlock.split('\n').map(l => l.trim()).filter(l => l.startsWith('- ')).map(l => { const [title, ...rest] = l.slice(2).split(': '); return rest.length ? { title, body: rest.join(': ') } : { title: '', body: title }; });
  return { intro, duties, contributions };
}

export function ExecutiveDetailPage() {
  const { id = '' } = useParams();
  const q = useExecutives();
  const all = q.data ?? [];
  const person = all.find(e => e.id === id);
  const others = all.filter(e => e.id !== id && e.is_current).slice(0, 4);
  if (q.isLoading) return <section className="section-wrap directory-section"><LoadingState/></section>;
  if (q.error) return <section className="section-wrap directory-section"><ErrorState error={q.error}/></section>;
  if (!person) return <section className="section-wrap directory-section"><EmptyState title="Executive not found" text="This profile may have been removed or is not published."/><Link className="text-action" to="/executives"><ArrowLeft size={14}/> All executives</Link></section>;
  const { intro, duties, contributions } = parse(person.responsibilities);
  const about = (person.bio ?? '').split('\n').map(p => p.trim()).filter(Boolean);
  return <>
    <section className="exec-hero">
      <div className="exec-hero-inner">
        <div className="exec-portrait">{person.image_url ? <img src={person.image_url} alt={person.full_name}/> : <UserRound size={72}/>}</div>
        <div className="exec-intro">
          <Link className="exec-back" to="/executives"><ArrowLeft size={15}/> All executives</Link>
          <span className="eyebrow-green">{person.tenure}</span>
          <h1>{person.full_name}</h1>
          <p className="exec-role">{person.position}</p>
        </div>
      </div>
    </section>
    <section className="section-wrap exec-body">
      <div className="exec-main">
        {about.length > 0 && <div className="exec-block"><h2>Background</h2>{about.map((p, i) => <p key={i}>{p}</p>)}</div>}
        {(intro.length > 0 || duties.length > 0) && <div className="exec-block"><h2>Role description</h2>{intro.map((p, i) => <p key={i}>{p}</p>)}{duties.length > 0 && <ul className="exec-list">{duties.map((d, i) => <li key={i}>{d}</li>)}</ul>}</div>}
        {contributions.length > 0 && <div className="exec-block"><h2>Key contributions</h2><div className="exec-contrib">{contributions.map((c, i) => <article key={i}><span>{String(i + 1).padStart(2, '0')}</span>{c.title && <h3>{c.title}</h3>}<p>{c.body}</p></article>)}</div></div>}
      </div>
      {others.length > 0 && <aside className="exec-side"><h2>Also on the council</h2>{others.map(o => <Link key={o.id} to={`/executives/${o.id}`} className="exec-mini">{o.image_url ? <img src={o.image_url} alt=""/> : <span><UserRound size={18}/></span>}<div><b>{o.full_name}</b><small>{o.position}</small></div><ArrowRight size={14}/></Link>)}<Link className="text-action" to="/executives">See everyone <ArrowRight size={14}/></Link></aside>}
    </section>
  </>;
}
