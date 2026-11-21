-- Encrypted secrets saved from the admin area (for example the Paystack secret key) and Google Authenticator 2FA for super administrators.
CREATE TABLE IF NOT EXISTS secure_settings(
  key TEXT PRIMARY KEY,
  cipher TEXT NOT NULL,
  iv TEXT NOT NULL,
  last4 TEXT,
  updated_by TEXT,
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS admin_totp(
  user_id TEXT PRIMARY KEY,
  secret_cipher TEXT NOT NULL,
  iv TEXT NOT NULL,
  enabled INTEGER NOT NULL DEFAULT 0,
  last_step INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  confirmed_at TEXT
);

CREATE TABLE IF NOT EXISTS admin_backup_codes(
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  code_hash TEXT NOT NULL,
  used_at TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_admin_backup_codes_user ON admin_backup_codes(user_id, used_at);
