-- Give homepage CMS sections stable keys used by the public homepage renderer.
ALTER TABLE page_sections ADD COLUMN section_key TEXT NOT NULL DEFAULT '';
CREATE INDEX IF NOT EXISTS page_sections_key_idx ON page_sections(page_id, section_key);
