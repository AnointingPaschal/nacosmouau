import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { ArrowLeft, ArrowRight, BadgeCheck } from 'lucide-react';
import { useEffect, useRef, useState, type TouchEvent } from 'react';
import { Link } from 'react-router-dom';
import type { HeroSlide } from '../types/content';
import { LoadingState } from './States';

// Official NACOS National imagery is used only until administrators publish chapter slides.
const welcomeSlides: HeroSlide[] = [
  {
    id: 'welcome-community',
    image_url: 'https://nacos.org.ng/img/carousel-2.jpg',
    badge: 'MOUAU CHAPTER · 2025/2026',
    title: 'Computing minds.\nOne community.',
    subtitle: 'A digital home for NACOS students at Michael Okpara University of Agriculture, Umudike.',
    primary_cta_text: 'Become a member', primary_cta_link: '/register',
    secondary_cta_text: 'Verify membership', secondary_cta_link: '/verify',
    display_order: 0, is_active: true,
  },
  {
    id: 'welcome-advanced-computing',
    image_url: 'https://nacos.org.ng/img/feature.jpg',
    badge: 'PART OF NACOS NATIONAL',
    title: 'Towards advanced\ncomputing.',
    subtitle: 'We develop. We create. We build capacity. Connect with the NACOS community at MOUAU.',
    primary_cta_text: 'About NACOS', primary_cta_link: '/about-nacos',
    secondary_cta_text: 'Explore events', secondary_cta_link: '/events',
    display_order: 1, is_active: true,
  },
];

function Action({ href, children, secondary = false }: { href: string; children: string; secondary?: boolean }) {
  const className = `hero-action${secondary ? ' outline' : ''}`;
  return href.startsWith('http')
    ? <a className={className} href={href} target="_blank" rel="noreferrer">{children}<ArrowRight size={16}/></a>
    : <Link className={className} to={href || '/register'}>{children}<ArrowRight size={16}/></Link>;
}

export function HeroSlider({ slides, isLoading = false }: { slides?: HeroSlide[]; isLoading?: boolean }) {
  const published = (slides ?? []).filter(slide => slide.is_active).sort((a, b) => a.display_order - b.display_order);
  const slidesToShow = published.length ? published : welcomeSlides;
  const [index, setIndex] = useState(0);
  const reduced = useReducedMotion();
  const touch = useRef<number | null>(null);

  useEffect(() => setIndex(0), [slidesToShow.length]);
  useEffect(() => {
    if (slidesToShow.length < 2 || reduced) return;
    const timer = window.setInterval(() => setIndex(current => (current + 1) % slidesToShow.length), 7000);
    return () => window.clearInterval(timer);
  }, [slidesToShow.length, reduced]);

  const move = (step: number) => setIndex(current => (current + step + slidesToShow.length) % slidesToShow.length);
  const onTouchStart = (event: TouchEvent) => { touch.current = event.touches[0]?.clientX ?? null; };
  const onTouchEnd = (event: TouchEvent) => {
    if (touch.current === null) return;
    const delta = (event.changedTouches[0]?.clientX ?? touch.current) - touch.current;
    if (Math.abs(delta) > 45) move(delta < 0 ? 1 : -1);
    touch.current = null;
  };

  if (isLoading && !slides?.length) return <section className="hero-slider"><div className="hero-skeleton"><LoadingState label="Loading chapter welcome…"/></div></section>;
  const slide = slidesToShow[index] ?? welcomeSlides[0];
  const titleLines = slide.title.replace(/\\n/g, '\n').split(/\r?\n/);

  return <section className="hero-slider" aria-roledescription="carousel" aria-label="NACOS MOUAU highlights" onTouchStart={onTouchStart} onTouchEnd={onTouchEnd}>
    <AnimatePresence mode="wait">
      <motion.div
        key={slide.id}
        className={slide.image_url ? 'hero-photo' : 'hero-geometric'}
        aria-hidden="true"
        style={slide.image_url ? { backgroundImage: `url("${slide.image_url.replaceAll('"', '%22')}")` } : undefined}
        initial={reduced ? false : { opacity: 0, scale: 1.035 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={reduced ? undefined : { opacity: 0 }}
        transition={{ duration: 0.8, ease: 'easeOut' }}
      />
    </AnimatePresence>
    <div className="hero-shade"/>
    <AnimatePresence mode="wait"><motion.div key={`${slide.id}-copy`} className="hero-copy" initial={reduced ? false : { opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} exit={reduced ? undefined : { opacity: 0, y: -8 }} transition={{ duration: 0.45 }}>
      {slide.badge && <div className="hero-badge"><BadgeCheck size={14}/>{slide.badge}</div>}
      <h1>{titleLines.map((line, lineIndex) => <span key={`${slide.id}-${lineIndex}`}>{line}{lineIndex < titleLines.length - 1 && <br/>}</span>)}</h1>
      <p>{slide.subtitle}</p>
      <div className="hero-actions">{slide.primary_cta_text && <Action href={slide.primary_cta_link || '/register'}>{slide.primary_cta_text}</Action>}{slide.secondary_cta_text && <Action secondary href={slide.secondary_cta_link || '/verify'}>{slide.secondary_cta_text}</Action>}</div>
    </motion.div></AnimatePresence>
    {slidesToShow.length > 1 && <>
      <button className="slider-arrow slider-prev" onClick={() => move(-1)} aria-label="Previous slide"><ArrowLeft/></button>
      <button className="slider-arrow slider-next" onClick={() => move(1)} aria-label="Next slide"><ArrowRight/></button>
      <div className="slider-dots" role="tablist" aria-label="Choose slide">{slidesToShow.map((item, itemIndex) => <button key={item.id} className={itemIndex === index ? 'active' : ''} aria-label={`Show slide ${itemIndex + 1}`} aria-selected={itemIndex === index} onClick={() => setIndex(itemIndex)}/>)}</div>
    </>}
  </section>;
}
