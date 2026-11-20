import { ArrowLeft, ArrowRight, Binary } from 'lucide-react';
import { useEffect, useRef, useState, type TouchEvent } from 'react';
import { Link } from 'react-router-dom';
import type { HeroSlide } from '../types/content';
import { LoadingState } from './States';

// Chapter imagery is served from this site (public/hero) so it loads on any phone or network,
// instead of depending on a third-party host. Administrator slides replace these once published.
const welcomeSlides: HeroSlide[] = [
  {
    id: 'welcome-community',
    image_url: '/hero/carousel-2-1600.jpg',
    badge: 'MOUAU Chapter · 2025/2026',
    title: 'Computing minds.\nOne community.',
    subtitle: 'A digital home for NACOS students at Michael Okpara University of Agriculture, Umudike.',
    primary_cta_text: 'Become a member', primary_cta_link: '/register',
    secondary_cta_text: 'Verify membership', secondary_cta_link: '/verify',
    display_order: 0, is_active: true,
  },
  {
    id: 'welcome-advanced-computing',
    image_url: '/hero/feature.jpg',
    badge: 'Part of NACOS National',
    title: 'Towards advanced\ncomputing.',
    subtitle: 'We develop. We create. We build capacity. Connect with the NACOS community at MOUAU.',
    primary_cta_text: 'About NACOS', primary_cta_link: '/about-nacos',
    secondary_cta_text: 'Explore events', secondary_cta_link: '/events',
    display_order: 1, is_active: true,
  },
];

function srcSetFor(url: string) {
  const match = url.match(/^\/hero\/(carousel-2)-1600\.jpg$/);
  return match ? `/hero/${match[1]}-800.jpg 800w, /hero/${match[1]}-1600.jpg 1600w` : undefined;
}

function Action({ href, children, secondary = false }: { href: string; children: string; secondary?: boolean }) {
  const className = `hx-action${secondary ? ' outline' : ''}`;
  return href.startsWith('http')
    ? <a className={className} href={href} target="_blank" rel="noreferrer">{children}<ArrowRight size={16}/></a>
    : <Link className={className} to={href || '/register'}>{children}<ArrowRight size={16}/></Link>;
}

function SlidePhoto({ slide, active, first }: { slide: HeroSlide; active: boolean; first: boolean }) {
  const [failed, setFailed] = useState(false);
  useEffect(() => setFailed(false), [slide.image_url]);
  if (!slide.image_url || failed) {
    return <div className={`hx-photo hx-photo-empty${active ? ' is-active' : ''}`} aria-hidden="true"><Binary size={72} strokeWidth={1.2}/></div>;
  }
  return <img
    className={`hx-photo${active ? ' is-active' : ''}`}
    src={slide.image_url}
    srcSet={srcSetFor(slide.image_url)}
    sizes="(max-width: 900px) 100vw, 46vw"
    alt=""
    aria-hidden="true"
    decoding="async"
    loading="eager"
    fetchPriority={first ? 'high' : 'auto'}
    onError={() => setFailed(true)}
  />;
}

export function HeroSlider({ slides, isLoading = false }: { slides?: HeroSlide[]; isLoading?: boolean }) {
  const published = (slides ?? []).filter(slide => slide.is_active).sort((a, b) => a.display_order - b.display_order);
  const slidesToShow = published.length ? published : welcomeSlides;
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const touch = useRef<number | null>(null);

  useEffect(() => setIndex(0), [slidesToShow.length]);
  useEffect(() => {
    if (slidesToShow.length < 2 || paused || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const timer = window.setInterval(() => setIndex(current => (current + 1) % slidesToShow.length), 7000);
    return () => window.clearInterval(timer);
  }, [slidesToShow.length, paused]);

  const move = (step: number) => setIndex(current => (current + step + slidesToShow.length) % slidesToShow.length);
  const onTouchStart = (event: TouchEvent) => { touch.current = event.touches[0]?.clientX ?? null; };
  const onTouchEnd = (event: TouchEvent) => {
    if (touch.current === null) return;
    const delta = (event.changedTouches[0]?.clientX ?? touch.current) - touch.current;
    if (Math.abs(delta) > 45) move(delta < 0 ? 1 : -1);
    touch.current = null;
  };

  if (isLoading && !slides?.length) return <section className="hx"><div className="hx-skeleton"><LoadingState label="Loading chapter welcome…"/></div></section>;
  const slide = slidesToShow[index] ?? welcomeSlides[0];
  const titleLines = slide.title.replace(/\\n/g, '\n').split(/\r?\n/);
  const count = String(slidesToShow.length).padStart(2, '0');

  return <section className="hx" aria-roledescription="carousel" aria-label="NACOS MOUAU highlights" onTouchStart={onTouchStart} onTouchEnd={onTouchEnd} onMouseEnter={() => setPaused(true)} onMouseLeave={() => setPaused(false)}>
    <div className="hx-grid">
      <div className="hx-copy" key={slide.id}>
        {slide.badge && <span className="hx-badge"><i/>{slide.badge}</span>}
        <h1>{titleLines.map((line, lineIndex) => <span key={`${slide.id}-${lineIndex}`} className={lineIndex > 0 ? 'hx-title-alt' : undefined}>{line}</span>)}</h1>
        <p>{slide.subtitle}</p>
        <div className="hx-actions">{slide.primary_cta_text && <Action href={slide.primary_cta_link || '/register'}>{slide.primary_cta_text}</Action>}{slide.secondary_cta_text && <Action secondary href={slide.secondary_cta_link || '/verify'}>{slide.secondary_cta_text}</Action>}</div>
        {slidesToShow.length > 1 && <div className="hx-controls">
          <span className="hx-counter">{String(index + 1).padStart(2, '0')}<em> / {count}</em></span>
          <div className="hx-dots" role="tablist" aria-label="Choose slide">{slidesToShow.map((item, itemIndex) => <button key={item.id} className={itemIndex === index ? 'active' : ''} aria-label={`Show slide ${itemIndex + 1}`} aria-selected={itemIndex === index} onClick={() => setIndex(itemIndex)}/>)}</div>
          <button className="hx-arrow" onClick={() => move(-1)} aria-label="Previous slide"><ArrowLeft size={18}/></button>
          <button className="hx-arrow" onClick={() => move(1)} aria-label="Next slide"><ArrowRight size={18}/></button>
        </div>}
      </div>
      <div className="hx-frame">
        <div className="hx-arch">
          {slidesToShow.map((item, itemIndex) => <SlidePhoto key={item.id} slide={item} active={itemIndex === index} first={itemIndex === 0}/>)}
        </div>
        <svg className="hx-seal" viewBox="0 0 120 120" aria-hidden="true"><defs><path id="seal-path" d="M60,60 m-42,0 a42,42 0 1,1 84,0 a42,42 0 1,1 -84,0"/></defs><text><textPath href="#seal-path" startOffset="0">NACOS · MOUAU · UMUDIKE · 2025/26 ·</textPath></text></svg>
      </div>
    </div>
  </section>;
}
