import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

const KEY = 'nacos_vid';
function visitorId() {
  try {
    let id = window.localStorage.getItem(KEY);
    if (!id) { id = crypto.randomUUID(); window.localStorage.setItem(KEY, id); }
    return id;
  } catch { return `s-${Math.random().toString(36).slice(2)}${Date.now().toString(36)}`; }
}
function send(type: 'view' | 'ping', path: string) {
  void fetch('/api/track', {
    method: 'POST', keepalive: true, credentials: 'include',
    headers: { 'Content-Type': 'application/json', 'X-Nacos-Space': 'member' },
    body: JSON.stringify({ vid: visitorId(), path, title: document.title, type, referrer: document.referrer }),
  }).catch(() => undefined);
}

/** Tells the server which page a visitor is on, and that they are still here, so admins can see live traffic. */
export function usePageTracking() {
  const { pathname } = useLocation();
  useEffect(() => {
    if (pathname.startsWith('/admin')) return;
    const first = window.setTimeout(() => send('view', pathname), 400); // let the page set its title first
    const beat = window.setInterval(() => { if (document.visibilityState === 'visible') send('ping', pathname); }, 20000);
    const onVisible = () => { if (document.visibilityState === 'visible') send('ping', pathname); };
    document.addEventListener('visibilitychange', onVisible);
    return () => { window.clearTimeout(first); window.clearInterval(beat); document.removeEventListener('visibilitychange', onVisible); };
  }, [pathname]);
}
