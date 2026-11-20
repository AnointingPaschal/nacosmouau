-- Whether members can watch results update while voting is open (admins always can).
ALTER TABLE elections ADD COLUMN live_results INTEGER NOT NULL DEFAULT 0;
UPDATE elections SET live_results = 1 WHERE id = 'demo-election-2026';
