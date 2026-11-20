import { useCallback, useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, ArrowRight, CalendarDays, ChevronLeft, ChevronRight, Clock, ExternalLink, Images, MapPin, Play, Ticket, Users, X } from 'lucide-react';
import { useEvent } from '../hooks/useApi';
import { EmptyState, ErrorState, LoadingState } from '../components/States';
import type { EventItem, EventPhoto, EventSpeaker, EventVideo } from '../types/content';
import { EventRegister } from './PublicPages';

const longDate = (value?: string | null) => value ? new Intl.DateTimeFormat(undefined, { dateStyle: 'full' }).format(new Date(value)) : 'Date to be announced';
const shortDate = (value?: string | null) => value ? new Intl.DateTimeFormat(undefined, { dateStyle: 'long' }).format(new Date(value)) : 'Date to be announced';
const clock = (value?: string | null) => value && value.includes('T') ? new Intl.DateTimeFormat(undefined, { timeStyle: 'short' }).format(new Date(value)) : '';
const initials = (name: string) => name.replace(/^(dr|mr|mrs|ms|prof)\.?\s+/i, '').split(/\s+/).slice(0, 2).map(part => part[0]?.toUpperCase() ?? '').join('');

type Playable = { mode: 'embed'; src: string; thumb: string | null } | { mode: 'file'; src: string } | { mode: 'link'; src: string };
function playable(url: string): Playable {
  try {
    const parsed = new URL(url);
    const host = parsed.hostname.replace(/^www\./, '');
    let youtube = '';
    if (host === 'youtu.be') youtube = parsed.pathname.slice(1);
    else if (host.endsWith('youtube.com')) youtube = parsed.searchParams.get('v') ?? parsed.pathname.match(/^\/(?:shorts|embed|live)\/([\w-]+)/)?.[1] ?? '';
    if (/^[\w-]{6,}$/.test(youtube)) return { mode: 'embed', src: `https://www.youtube-nocookie.com/embed/${youtube}?autoplay=1&rel=0`, thumb: `https://i.ytimg.com/vi/${youtube}/hqdefault.jpg` };
    const vimeo = host.endsWith('vimeo.com') ? parsed.pathname.match(/(\d{6,})/)?.[1] : '';
    if (vimeo) return { mode: 'embed', src: `https://player.vimeo.com/video/${vimeo}?autoplay=1`, thumb: null };
    if (/\.(mp4|webm|mov|m4v)$/i.test(parsed.pathname)) return { mode: 'file', src: url };
  } catch { /* fall through to a plain link */ }
  return { mode: 'link', src: url };
}

function useLock(active: boolean, onClose: () => void, onPrev?: () => void, onNext?: () => void) {
  useEffect(() => {
    if (!active) return;
    const keys = (event: KeyboardEvent) => { if (event.key === 'Escape') onClose(); if (event.key === 'ArrowLeft') onPrev?.(); if (event.key === 'ArrowRight') onNext?.(); };
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', keys);
    return () => { document.body.style.overflow = previous; window.removeEventListener('keydown', keys); };
  }, [active, onClose, onPrev, onNext]);
}

function PhotoViewer({ photos, index, onChange, onClose }: { photos: EventPhoto[]; index: number; onChange: (next: number) => void; onClose: () => void }) {
  const total = photos.length;
  const prev = useCallback(() => onChange((index - 1 + total) % total), [index, total, onChange]);
  const next = useCallback(() => onChange((index + 1) % total), [index, total, onChange]);
  useLock(true, onClose, prev, next);
  const photo = photos[index];
  if (!photo) return null;
  return <div className="ev-viewer" role="dialog" aria-modal="true" aria-label="Event photo viewer" onClick={event => { if (event.target === event.currentTarget) onClose(); }}>
    <button className="ev-viewer-close" onClick={onClose} aria-label="Close viewer"><X size={22}/></button>
    <span className="ev-viewer-count">{index + 1} / {total}</span>
    {total > 1 && <button className="ev-viewer-nav ev-viewer-prev" onClick={prev} aria-label="Previous photo"><ChevronLeft size={26}/></button>}
    <figure><img src={photo.image_url} alt={photo.caption ?? `Event photo ${index + 1}`}/>{photo.caption && <figcaption>{photo.caption}</figcaption>}</figure>
    {total > 1 && <button className="ev-viewer-nav ev-viewer-next" onClick={next} aria-label="Next photo"><ChevronRight size={26}/></button>}
  </div>;
}

function VideoPlayer({ video, onClose }: { video: EventVideo; onClose: () => void }) {
  useLock(true, onClose);
  const source = playable(video.video_url);
  return <div className="ev-viewer" role="dialog" aria-modal="true" aria-label={video.caption ?? 'Event video'} onClick={event => { if (event.target === event.currentTarget) onClose(); }}>
    <button className="ev-viewer-close" onClick={onClose} aria-label="Close video"><X size={22}/></button>
    <div className="ev-player">
      {source.mode === 'embed' && <iframe src={source.src} title={video.caption ?? 'Event video'} allow="autoplay; encrypted-media; picture-in-picture; fullscreen" allowFullScreen/>}
      {source.mode === 'file' && <video src={source.src} controls autoPlay playsInline poster={video.thumbnail_url ?? undefined}/>}
      {source.mode === 'link' && <div className="ev-player-link"><p>This video opens on its own site.</p><a className="button button-green" href={source.src} target="_blank" rel="noreferrer noopener">Watch video <ExternalLink size={15}/></a></div>}
    </div>
    {video.caption && <p className="ev-player-caption">{video.caption}</p>}
  </div>;
}

function VideoCard({ video, featured = false, onPlay }: { video: EventVideo; featured?: boolean; onPlay: () => void }) {
  const source = playable(video.video_url);
  const thumb = video.thumbnail_url ?? (source.mode === 'embed' ? source.thumb : null);
  return <button className={`ev-video${featured ? ' is-featured' : ''}`} onClick={onPlay} aria-label={`Play ${video.caption ?? 'video'}`}>
    {thumb ? <img src={thumb} alt="" loading="lazy"/> : <span className="ev-video-blank"/>}
    {featured && <span className="ev-video-tag">Featured highlight</span>}
    <span className="ev-video-play"><Play size={featured ? 30 : 22} fill="currentColor"/></span>
    <span className="ev-video-meta"><b>{video.caption ?? 'Event video'}</b>{video.duration && <i>{video.duration}</i>}</span>
  </button>;
}

function SpeakerCard({ speaker }: { speaker: EventSpeaker }) {
  return <article className="ev-speaker">
    {speaker.image_url ? <img src={speaker.image_url} alt="" loading="lazy"/> : <span className="ev-speaker-initials">{initials(speaker.name)}</span>}
    <h3>{speaker.name}</h3>{speaker.role && <p>{speaker.role}</p>}
  </article>;
}

function EventPage({ event }: { event: EventItem }) {
  const [photoIndex, setPhotoIndex] = useState<number | null>(null);
  const [video, setVideo] = useState<EventVideo | null>(null);
  const photos = event.photos ?? [];
  const videos = event.videos ?? [];
  const speakers = event.speakers ?? [];
  const stats = event.stats ?? [];
  const featured = videos.find(item => item.is_featured) ?? null;
  const otherVideos = videos.filter(item => item !== featured);
  const preview = photos.slice(0, 5);
  const hidden = Math.max(0, photos.length - preview.length);
  const paragraphs = (event.description ?? '').split(/\n+/).map(text => text.trim()).filter(Boolean);
  const lead = event.summary || (paragraphs.length > 1 ? paragraphs[0] : '');
  const body = event.summary || paragraphs.length <= 1 ? paragraphs : paragraphs.slice(1);
  const time = clock(event.starts_at);
  const free = event.price_minor <= 0;

  return <article className="ev">
    <header className="ev-hero">
      {event.image_url && <img className="ev-hero-bg" src={event.image_url} alt="" aria-hidden="true"/>}
      <div className="ev-hero-inner">
        <nav className="ev-crumbs" aria-label="Breadcrumb"><Link to="/">Home</Link><span>/</span><Link to="/events">Events</Link><span>/</span><b>{event.title}</b></nav>
        <h1>{event.title}</h1>
        {lead && <p className="ev-lead">{lead}</p>}
        <div className="ev-chips">
          <span><CalendarDays size={16}/>{shortDate(event.starts_at)}</span>
          {event.venue && <span><MapPin size={16}/>{event.venue}</span>}
          {event.capacity && <span><Users size={16}/>{event.capacity.toLocaleString()} capacity</span>}
          <span><Ticket size={16}/>{free ? 'Free entry' : `${event.currency} ${(event.price_minor / 100).toLocaleString()}`}</span>
        </div>
      </div>
    </header>

    <div className="ev-wrap">
      <Link className="ev-back" to="/events"><ArrowLeft size={16}/>Back to events</Link>
      {stats.length > 0 && <section className="ev-stats" aria-label="Event highlights">{stats.map(stat => <div key={stat.label}><strong>{stat.value}</strong><span>{stat.label}</span></div>)}</section>}

      <div className="ev-layout">
        <div className="ev-main">
          {body.length > 0 && <section className="ev-section"><span className="eyebrow-green">About this event</span><div className="ev-about">{body.map((text, i) => <p key={i}>{text}</p>)}</div></section>}

          {photos.length > 0 && <section className="ev-section" id="photos"><div className="ev-section-head"><span className="eyebrow-green">Photos</span><button className="text-action" onClick={() => setPhotoIndex(0)}>View all {photos.length}<ArrowRight size={14}/></button></div>
            <div className={`ev-mosaic count-${preview.length}`}>{preview.map((photo, i) => <button key={photo.id} className="ev-photo" onClick={() => setPhotoIndex(i)} aria-label={`Open photo ${i + 1}`}>
              <img src={photo.image_url} alt={photo.caption ?? ''} loading={i < 2 ? 'eager' : 'lazy'}/>
              {i === preview.length - 1 && hidden > 0 && <span className="ev-photo-more"><Images size={22}/>+{hidden} more</span>}
            </button>)}</div></section>}

          {videos.length > 0 && <section className="ev-section" id="videos"><span className="eyebrow-green">Videos</span>
            {featured && <VideoCard video={featured} featured onPlay={() => setVideo(featured)}/>}
            {otherVideos.length > 0 && <div className="ev-video-grid">{otherVideos.map(item => <VideoCard key={item.id} video={item} onPlay={() => setVideo(item)}/>)}</div>}</section>}

          {speakers.length > 0 && <section className="ev-section"><span className="eyebrow-green">Featured speakers</span><div className="ev-speakers">{speakers.map(speaker => <SpeakerCard key={speaker.id} speaker={speaker}/>)}</div></section>}

          {body.length === 0 && photos.length === 0 && videos.length === 0 && speakers.length === 0 && <EmptyState title="Details coming soon" text="The chapter will add the full programme, photos and videos here."/>}
        </div>

        <aside className="ev-aside"><div className="ev-card">
          <h2>Event details</h2>
          <dl>
            <div><dt><CalendarDays size={16}/>Date</dt><dd>{longDate(event.starts_at)}</dd></div>
            {time && <div><dt><Clock size={16}/>Time</dt><dd>{time}{event.ends_at && clock(event.ends_at) ? ` to ${clock(event.ends_at)}` : ''}</dd></div>}
            {event.venue && <div><dt><MapPin size={16}/>Venue</dt><dd>{event.venue}</dd></div>}
            <div><dt><Ticket size={16}/>Entry</dt><dd>{free ? 'Free' : `${event.currency} ${(event.price_minor / 100).toLocaleString()}`}</dd></div>
            {event.capacity && <div><dt><Users size={16}/>Capacity</dt><dd>{event.capacity.toLocaleString()} people</dd></div>}
          </dl>
          {event.registration_open ? <EventRegister event={event}/> : <p className="ev-closed">Registration is closed for this event.</p>}
        </div></aside>
      </div>
    </div>

    {photoIndex !== null && <PhotoViewer photos={photos} index={photoIndex} onChange={setPhotoIndex} onClose={() => setPhotoIndex(null)}/>}
    {video && <VideoPlayer video={video} onClose={() => setVideo(null)}/>}
  </article>;
}

export function EventDetailPage() {
  const { slug = '' } = useParams();
  const query = useEvent(slug);
  if (query.isLoading) return <section className="section-wrap directory-section"><LoadingState/></section>;
  if (query.error) return <section className="section-wrap directory-section"><ErrorState error={query.error}/></section>;
  if (!query.data) return <section className="section-wrap directory-section"><EmptyState title="Event not found" text="This event may have been removed or is not published."/></section>;
  return <EventPage event={query.data}/>;
}
