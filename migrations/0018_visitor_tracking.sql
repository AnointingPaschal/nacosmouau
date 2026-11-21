-- Live visitor tracking: one row per visit (a visit ends after 30 minutes of silence) and one row per page view.
CREATE TABLE IF NOT EXISTS visitor_sessions(
  id TEXT PRIMARY KEY,
  vid TEXT NOT NULL,
  user_id TEXT REFERENCES users(id) ON DELETE SET NULL,
  started_at TEXT NOT NULL DEFAULT(datetime('now')),
  last_seen_at TEXT NOT NULL DEFAULT(datetime('now')),
  current_path TEXT NOT NULL DEFAULT '/',
  current_title TEXT,
  views INTEGER NOT NULL DEFAULT 1,
  device TEXT, browser TEXT, os TEXT,
  country TEXT, region TEXT, city TEXT,
  referrer TEXT
);
CREATE INDEX IF NOT EXISTS visitor_sessions_seen_idx ON visitor_sessions(last_seen_at DESC);
CREATE INDEX IF NOT EXISTS visitor_sessions_vid_idx ON visitor_sessions(vid, last_seen_at DESC);
CREATE INDEX IF NOT EXISTS visitor_sessions_user_idx ON visitor_sessions(user_id);
CREATE TABLE IF NOT EXISTS page_views(
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  session_id TEXT NOT NULL REFERENCES visitor_sessions(id) ON DELETE CASCADE,
  vid TEXT NOT NULL,
  user_id TEXT,
  path TEXT NOT NULL,
  title TEXT,
  viewed_at TEXT NOT NULL DEFAULT(datetime('now'))
);
CREATE INDEX IF NOT EXISTS page_views_session_idx ON page_views(session_id, viewed_at);
CREATE INDEX IF NOT EXISTS page_views_time_idx ON page_views(viewed_at DESC);
