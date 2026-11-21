// Visual effects layer: scroll progress, scroll reveals, pointer spotlight and hero parallax.
// It only sets data attributes and CSS variables, so React-owned class names are never touched.
const REVEAL = [
  '.section-head', '.about-main', '.vision-stack article', '.affiliation', '.president-copy', '.president-portrait',
  '.executive-card', '.news-row', '.announcement-row', '.event-card', '.album-cover', '.publication-card',
  '.photo-tile', '.join-banner > *', '.page-intro > .section-wrap > *', '.cms-section', '.document-row',
  '.achievement-card', '.contact-form', '.contact-details', '.count-grid > *', '.quick-card',
  '.workspace-panel', '.dashboard-grid > *', '.footer-main > *',
].join(',');

const SPOT = [
  '.executive-card', '.event-card', '.news-row', '.publication-card',
  '.quick-card', '.workspace-panel', '.vision-stack article', '.achievement-card', '.document-row', '.auth-card',
].join(',');

export function installFx(): void {
  if (typeof window === 'undefined') return;
  const root = document.documentElement;
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const bar = document.createElement('div');
  bar.className = 'fx-progress';
  bar.setAttribute('aria-hidden', 'true');
  document.body.appendChild(bar);

  let scrollQueued = false;
  const onScroll = () => {
    if (scrollQueued) return;
    scrollQueued = true;
    requestAnimationFrame(() => {
      scrollQueued = false;
      const max = root.scrollHeight - window.innerHeight;
      bar.style.setProperty('--p', String(max > 0 ? Math.min(1, window.scrollY / max) : 0));
      root.toggleAttribute('data-scrolled', window.scrollY > 24);
    });
  };
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onScroll, { passive: true });
  onScroll();

  let moveQueued = false;
  let last: PointerEvent | null = null;
  document.addEventListener('pointermove', (e) => {
    last = e;
    if (moveQueued) return;
    moveQueued = true;
    requestAnimationFrame(() => {
      moveQueued = false;
      const ev = last;
      const target = ev?.target;
      if (!ev || !(target instanceof Element)) return;
      const spot = target.closest<HTMLElement>('[data-spot]');
      if (spot) {
        const r = spot.getBoundingClientRect();
        spot.style.setProperty('--mx', `${ev.clientX - r.left}px`);
        spot.style.setProperty('--my', `${ev.clientY - r.top}px`);
      }
      const hero = reduce ? null : target.closest<HTMLElement>('.hx');
      if (hero) {
        const r = hero.getBoundingClientRect();
        hero.style.setProperty('--px', (((ev.clientX - r.left) / r.width) * 2 - 1).toFixed(3));
        hero.style.setProperty('--py', (((ev.clientY - r.top) / r.height) * 2 - 1).toFixed(3));
      }
    });
  }, { passive: true });

  const seen = new WeakSet<Element>();
  const io = reduce ? null : new IntersectionObserver((entries) => {
    for (const entry of entries) {
      if (!entry.isIntersecting) continue;
      const el = entry.target as HTMLElement;
      io?.unobserve(el);
      el.setAttribute('data-fx', 'in');
      window.setTimeout(() => el.removeAttribute('data-fx'), 1500);
    }
  }, { threshold: 0.1, rootMargin: '0px 0px -5% 0px' });
  if (!reduce) root.classList.add('fx-ready');

  const tag = (el: HTMLElement) => {
    if (seen.has(el)) return;
    seen.add(el);
    if (!io) return;
    const siblings = el.parentElement ? Array.prototype.indexOf.call(el.parentElement.children, el) : 0;
    el.style.setProperty('--fx-i', String(Math.min(Math.max(siblings, 0), 6)));
    el.setAttribute('data-fx', '');
    io.observe(el);
  };

  const scan = (node: Element) => {
    if (node.matches(SPOT)) node.setAttribute('data-spot', '');
    node.querySelectorAll(SPOT).forEach((el) => el.setAttribute('data-spot', ''));
    if (node.matches(REVEAL)) tag(node as HTMLElement);
    node.querySelectorAll<HTMLElement>(REVEAL).forEach(tag);
  };

  new MutationObserver((mutations) => {
    for (const m of mutations) m.addedNodes.forEach((n) => { if (n.nodeType === 1) scan(n as Element); });
  }).observe(document.body, { childList: true, subtree: true });
  scan(document.body);
}
