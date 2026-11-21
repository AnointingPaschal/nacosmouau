-- Lecture attendance: weekly timetable, attendance sessions opened by the class rep, and student marks.
CREATE TABLE IF NOT EXISTS class_timetable(
  id TEXT PRIMARY KEY,
  level TEXT NOT NULL,
  session TEXT NOT NULL,
  course_id TEXT NOT NULL,
  day_of_week INTEGER NOT NULL CHECK(day_of_week BETWEEN 0 AND 6),
  start_min INTEGER NOT NULL CHECK(start_min BETWEEN 0 AND 1439),
  end_min INTEGER NOT NULL CHECK(end_min BETWEEN 1 AND 1440),
  venue TEXT,
  created_by TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_class_timetable_level ON class_timetable(level, session, day_of_week);

CREATE TABLE IF NOT EXISTS attendance_sessions(
  id TEXT PRIMARY KEY,
  level TEXT NOT NULL,
  session TEXT NOT NULL,
  course_id TEXT NOT NULL,
  lecture_date TEXT NOT NULL,
  started_by TEXT NOT NULL,
  started_at TEXT NOT NULL DEFAULT (datetime('now')),
  closes_at TEXT NOT NULL,
  closed_at TEXT,
  status TEXT NOT NULL DEFAULT 'open' CHECK(status IN ('open','closed')),
  secret TEXT NOT NULL,
  rep_lat REAL,
  rep_lng REAL,
  rep_accuracy REAL,
  radius_m INTEGER NOT NULL DEFAULT 100,
  min_peers INTEGER NOT NULL DEFAULT 10
);
CREATE INDEX IF NOT EXISTS idx_attendance_sessions_level ON attendance_sessions(level, session, status);

CREATE TABLE IF NOT EXISTS attendance_marks(
  id TEXT PRIMARY KEY,
  session_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  method TEXT NOT NULL CHECK(method IN ('device','rep')),
  status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending','verified','rejected')),
  reviewed INTEGER NOT NULL DEFAULT 0,
  marked_at TEXT NOT NULL DEFAULT (datetime('now')),
  lat REAL,
  lng REAL,
  accuracy REAL,
  distance_m REAL,
  neighbours INTEGER NOT NULL DEFAULT 0,
  device_id TEXT,
  cookie_id TEXT,
  fingerprint TEXT,
  ip TEXT,
  user_agent TEXT,
  device_summary TEXT,
  flags TEXT,
  signed_by TEXT,
  review_note TEXT,
  UNIQUE(session_id, user_id)
);
CREATE INDEX IF NOT EXISTS idx_attendance_marks_session ON attendance_marks(session_id, status);
CREATE INDEX IF NOT EXISTS idx_attendance_marks_user ON attendance_marks(user_id);
CREATE INDEX IF NOT EXISTS idx_attendance_marks_device ON attendance_marks(session_id, device_id);
