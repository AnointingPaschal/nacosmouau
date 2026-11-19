ALTER TABLE users ADD COLUMN phone TEXT;
ALTER TABLE users ADD COLUMN matric_number TEXT;
ALTER TABLE users ADD COLUMN academic_level TEXT;
ALTER TABLE users ADD COLUMN faculty TEXT;
ALTER TABLE users ADD COLUMN department TEXT;
ALTER TABLE users ADD COLUMN academic_session TEXT;
CREATE UNIQUE INDEX users_matric_number_unique ON users(matric_number) WHERE matric_number IS NOT NULL;
