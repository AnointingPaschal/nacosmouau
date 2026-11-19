PRAGMA foreign_keys = OFF;

CREATE TABLE users_new (
  id TEXT PRIMARY KEY,
  email TEXT NOT NULL COLLATE NOCASE UNIQUE,
  password_hash TEXT NOT NULL,
  full_name TEXT NOT NULL,
  phone TEXT,
  matric_number TEXT UNIQUE,
  academic_level TEXT,
  faculty TEXT,
  department TEXT,
  academic_session TEXT,
  role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('member','editor','finance','election_officer','admin','super_admin')),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','active','suspended')),
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

INSERT INTO users_new (id,email,password_hash,full_name,phone,matric_number,academic_level,faculty,department,academic_session,role,status,created_at,updated_at)
SELECT id,email,password_hash,full_name,phone,matric_number,academic_level,faculty,department,academic_session,role,status,created_at,updated_at FROM users;
DROP TABLE users;
ALTER TABLE users_new RENAME TO users;
CREATE INDEX users_role_status ON users(role,status);
PRAGMA foreign_keys = ON;
