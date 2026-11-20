-- Dues, bank-teller payments, candidate forms, role assignment support.
ALTER TABLE payments ADD COLUMN purpose TEXT;
ALTER TABLE payments ADD COLUMN session TEXT;
ALTER TABLE payments ADD COLUMN method TEXT;
ALTER TABLE payments ADD COLUMN ref_id TEXT;
ALTER TABLE payments ADD COLUMN proof_key TEXT;
ALTER TABLE payments ADD COLUMN depositor_name TEXT;
ALTER TABLE payments ADD COLUMN reviewed_by TEXT;
ALTER TABLE payments ADD COLUMN reviewed_at TEXT;
ALTER TABLE payments ADD COLUMN review_note TEXT;
CREATE INDEX IF NOT EXISTS payments_purpose_idx ON payments(user_id, purpose, session, status);
CREATE INDEX IF NOT EXISTS payments_ref_idx ON payments(ref_id);

ALTER TABLE elections ADD COLUMN session TEXT;
ALTER TABLE elections ADD COLUMN form_fee_minor INTEGER NOT NULL DEFAULT 0;
ALTER TABLE election_candidates ADD COLUMN screening_note TEXT;
CREATE UNIQUE INDEX IF NOT EXISTS election_candidates_unique ON election_candidates(election_id, position_id, user_id) WHERE user_id IS NOT NULL;

INSERT OR IGNORE INTO roles(id,name,description,is_system) VALUES('admin','Administrator','Full administration of the platform',1);
INSERT OR IGNORE INTO permissions(id,resource,action,description) VALUES
('welfare.read','welfare','read','Permission to read welfare'),
('welfare.update','welfare','update','Permission to update welfare'),
('analytics.read','analytics','read','Permission to read analytics');
INSERT OR IGNORE INTO role_permissions(role_id,permission_id) SELECT 'admin',id FROM permissions;
INSERT OR IGNORE INTO role_permissions(role_id,permission_id) SELECT 'super_admin',id FROM permissions;
INSERT OR IGNORE INTO role_permissions(role_id,permission_id) SELECT 'president',id FROM permissions WHERE resource IN ('welfare','analytics','roles') AND action IN ('read','update');
INSERT OR IGNORE INTO role_permissions(role_id,permission_id) SELECT 'general_secretary',id FROM permissions WHERE resource='welfare';
INSERT OR IGNORE INTO role_permissions(role_id,permission_id) SELECT 'financial_secretary',id FROM permissions WHERE resource IN ('analytics') OR (resource='payments');
INSERT OR IGNORE INTO role_permissions(role_id,permission_id) SELECT 'treasurer',id FROM permissions WHERE resource IN ('analytics','payments','finance');
INSERT OR IGNORE INTO role_permissions(role_id,permission_id) SELECT 'election_committee',id FROM permissions WHERE resource IN ('elections','members') AND action IN ('read','create','update','delete');

INSERT OR IGNORE INTO system_settings(key,value_json) VALUES
('dues_amount_minor','0'),
('bank_name','""'),
('bank_account_name','""'),
('bank_account_number','""');
