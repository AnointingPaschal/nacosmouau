-- Which levels may contest for a position (comma separated, e.g. "300,400"). NULL means every level.
ALTER TABLE election_positions ADD COLUMN eligible_levels TEXT;
