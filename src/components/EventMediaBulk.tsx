import { useRef, useState } from 'react';
import { ImagePlus } from 'lucide-react';
import { toast } from 'sonner';
import { api } from '../lib/api';
import type { UploadedFile } from './FileUpload';

const MAX_BYTES = 8 * 1024 * 1024;

/** Uploads many photos for one event in a single step. Files go up one at a time so GitHub commits never collide. */
export function EventMediaBulk({ events, onDone }: { events: Array<{ id: string; title: string }>; onDone: () => void }) {
  const input = useRef<HTMLInputElement>(null);
  const [eventId, setEventId] = useState('');
  const [progress, setProgress] = useState<{ done: number; total: number } | null>(null);
  const selected = eventId || events[0]?.id || '';

  const run = async (files: File[]) => {
    const valid = files.filter(file => ['image/jpeg', 'image/png', 'image/webp'].includes(file.type) && file.size > 0 && file.size <= MAX_BYTES);
    if (valid.length < files.length) toast.error(`${files.length - valid.length} file(s) skipped. Use JPEG, PNG or WebP under 8 MB.`);
    if (!valid.length || !selected) return;
    let failed = 0;
    setProgress({ done: 0, total: valid.length });
    for (const [index, file] of valid.entries()) {
      try {
        const uploaded = await api.upload<UploadedFile>(file, undefined, 'media');
        await api.post('admin/event-media', { event_id: selected, kind: 'photo', image_url: uploaded.url, caption: '', display_order: Date.now() % 1_000_000 + index });
      } catch (error) {
        failed += 1;
        toast.error(error instanceof Error ? error.message : `Could not upload ${file.name}`);
      }
      setProgress({ done: index + 1, total: valid.length });
    }
    setProgress(null);
    if (failed < valid.length) toast.success(`${valid.length - failed} photo(s) added to the event`);
    onDone();
  };

  return <section className="workspace-panel bulk-upload">
    <div className="panel-heading"><div><span className="eyebrow-green">QUICK ADD</span><h2>Upload many event photos at once</h2></div></div>
    <div className="bulk-upload-row">
      <select value={selected} onChange={event => setEventId(event.target.value)} aria-label="Choose event" disabled={progress !== null}>
        {events.length === 0 && <option value="">Create an event first</option>}
        {events.map(event => <option key={event.id} value={event.id}>{event.title}</option>)}
      </select>
      <input ref={input} type="file" accept="image/jpeg,image/png,image/webp" multiple hidden onChange={event => { void run(Array.from(event.target.files ?? [])); event.currentTarget.value = ''; }}/>
      <button type="button" className="button button-green" disabled={!selected || progress !== null} onClick={() => input.current?.click()}>
        <ImagePlus size={16}/>{progress ? `Uploading ${progress.done} of ${progress.total}…` : 'Choose photos'}
      </button>
    </div>
  </section>;
}
