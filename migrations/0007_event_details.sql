-- Rich event pages: summary, headline stats, featured speakers, photos and videos.
ALTER TABLE events ADD COLUMN summary TEXT;
ALTER TABLE events ADD COLUMN stats_text TEXT;

CREATE TABLE IF NOT EXISTS event_speakers(
  id TEXT PRIMARY KEY,
  event_id TEXT NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  role TEXT,
  image_key TEXT,
  display_order INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT(datetime('now')),
  updated_at TEXT NOT NULL DEFAULT(datetime('now'))
);

CREATE TABLE IF NOT EXISTS event_media(
  id TEXT PRIMARY KEY,
  event_id TEXT NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  kind TEXT NOT NULL CHECK(kind IN ('photo','video')),
  object_key TEXT,
  video_link TEXT,
  thumbnail_key TEXT,
  caption TEXT,
  duration TEXT,
  is_featured INTEGER NOT NULL DEFAULT 0,
  display_order INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT(datetime('now')),
  updated_at TEXT NOT NULL DEFAULT(datetime('now'))
);

CREATE INDEX IF NOT EXISTS event_speakers_event_idx ON event_speakers(event_id, display_order);
CREATE INDEX IF NOT EXISTS event_media_event_idx ON event_media(event_id, kind, display_order);
