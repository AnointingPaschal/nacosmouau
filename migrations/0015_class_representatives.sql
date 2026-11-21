-- Course representatives: elected per level and session. Admins only approve contestants and start voting.
CREATE TABLE IF NOT EXISTS class_elections(
  id TEXT PRIMARY KEY,
  level TEXT NOT NULL CHECK(level IN ('100','200','300','400')),
  session TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'nominations' CHECK(status IN ('nominations','voting','closed')),
  voting_started_at TEXT,
  voting_ends_at TEXT,
  closed_at TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE(level, session)
);

CREATE TABLE IF NOT EXISTS class_candidates(
  id TEXT PRIMARY KEY,
  election_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  position TEXT NOT NULL CHECK(position IN ('rep','assistant')),
  manifesto TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending','approved','rejected')),
  review_note TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE(election_id, user_id)
);
CREATE INDEX IF NOT EXISTS idx_class_candidates_election ON class_candidates(election_id, position, status);

-- Who has voted (no choice recorded here) and what was chosen (no voter recorded here), kept apart on purpose.
CREATE TABLE IF NOT EXISTS class_vote_roll(
  election_id TEXT NOT NULL,
  position TEXT NOT NULL,
  voter_id TEXT NOT NULL,
  voted_at TEXT NOT NULL DEFAULT (datetime('now')),
  PRIMARY KEY(election_id, position, voter_id)
);
CREATE TABLE IF NOT EXISTS class_ballots(
  id TEXT PRIMARY KEY,
  election_id TEXT NOT NULL,
  position TEXT NOT NULL,
  candidate_id TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_class_ballots_candidate ON class_ballots(candidate_id);

CREATE TABLE IF NOT EXISTS class_reps(
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  level TEXT NOT NULL,
  session TEXT NOT NULL,
  role TEXT NOT NULL CHECK(role IN ('rep','assistant')),
  election_id TEXT NOT NULL,
  votes INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE(level, session, role)
);
CREATE INDEX IF NOT EXISTS idx_class_reps_user ON class_reps(user_id, session);

CREATE TABLE IF NOT EXISTS class_notices(
  id TEXT PRIMARY KEY,
  level TEXT NOT NULL,
  session TEXT NOT NULL,
  author_id TEXT NOT NULL,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_class_notices_level ON class_notices(level, session, created_at);
