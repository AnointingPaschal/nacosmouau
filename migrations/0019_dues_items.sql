-- Extra dues that executives create for every level or for chosen levels (the main NACOS dues stay in settings).
CREATE TABLE IF NOT EXISTS dues_items(
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  amount_minor INTEGER NOT NULL CHECK(amount_minor > 0),
  levels TEXT,                         -- NULL means every level, otherwise "200,300"
  session TEXT NOT NULL,
  due_date TEXT,
  is_active INTEGER NOT NULL DEFAULT 1,
  created_by TEXT,
  created_at TEXT NOT NULL DEFAULT(datetime('now'))
);
CREATE INDEX IF NOT EXISTS dues_items_session_idx ON dues_items(session, is_active);
CREATE INDEX IF NOT EXISTS payments_ref_idx ON payments(ref_id, purpose, status);
