INSERT INTO pages (id, slug, title, summary, body, status, published_at)
VALUES
('mouau-about-2025-2026','about-mouau','About NACOS MOUAU','NACOS MOUAU Chapter 2025/2026.','The Nigeria Association of Computing Students at Michael Okpara University of Agriculture, Umudike connects computing students and builds an inclusive community focused on digital skills, leadership, innovation, and positive impact.', 'published', datetime('now'))
ON CONFLICT(slug) DO UPDATE SET title=excluded.title,summary=excluded.summary,body=excluded.body,status=excluded.status,published_at=excluded.published_at;

INSERT INTO pages (id, slug, title, summary, body, status, published_at)
VALUES
('mouau-executives-2025-2026','executives','Meet the Leadership','Driving technological excellence and visionary leadership across the university ecosystem. We empower the next generation of technical pioneers.','NACOS MOUAU Executives represent the pinnacle of student-led technical governance. Our association bridges the gap between academic theory and practical innovation, ensuring that technology serves as a catalyst for excellence across the department, faculty, and beyond.\nNACOS MOUAU Institutional Governance\nTechnological Strategy\nStudent Community Advancement','published',datetime('now'))
ON CONFLICT(slug) DO UPDATE SET title=excluded.title,summary=excluded.summary,body=excluded.body,status=excluded.status,published_at=excluded.published_at;

INSERT INTO page_sections (id,page_id,section_key,title,body,display_order,is_published)
SELECT 'home-section-about',id,'about','A community for computing students at MOUAU','NACOS MOUAU connects students in computing and related disciplines with the wider NACOS community and its focus on computing, innovation, entrepreneurship, and digital inclusion.',0,1 FROM pages WHERE slug='home'
ON CONFLICT(id) DO UPDATE SET section_key=excluded.section_key,title=excluded.title,body=excluded.body,display_order=excluded.display_order,is_published=excluded.is_published;

INSERT INTO page_sections (id,page_id,section_key,title,body,display_order,is_published)
SELECT 'home-section-vision',id,'vision','Our Vision','To build a vibrant, innovative, and inclusive community of computer science students, empowering them with relevant digital skills, leadership capacity, and opportunities that prepare them to excel in technology and positively impact society.',1,1 FROM pages WHERE slug='home'
ON CONFLICT(id) DO UPDATE SET section_key=excluded.section_key,title=excluded.title,body=excluded.body,display_order=excluded.display_order,is_published=excluded.is_published;

INSERT INTO page_sections (id,page_id,section_key,title,body,display_order,is_published)
SELECT 'home-section-mission',id,'mission','Our Mission','To advance technology, innovation, and entrepreneurship by connecting computing students, encouraging digital inclusion, and supporting opportunities for learning, leadership, and practical contribution.',2,1 FROM pages WHERE slug='home'
ON CONFLICT(id) DO UPDATE SET section_key=excluded.section_key,title=excluded.title,body=excluded.body,display_order=excluded.display_order,is_published=excluded.is_published;

INSERT INTO page_sections (id,page_id,section_key,title,body,display_order,is_published)
SELECT 'home-section-executives',id,'executives','2025/2026 NACOS Executives','Shaping the university’s digital future through strong technical leadership and governance.',3,1 FROM pages WHERE slug='home'
ON CONFLICT(id) DO UPDATE SET section_key=excluded.section_key,title=excluded.title,body=excluded.body,display_order=excluded.display_order,is_published=excluded.is_published;

INSERT INTO page_sections (id,page_id,section_key,title,body,display_order,is_published)
SELECT 'home-section-events',id,'events','Operational Highlights','Sample NACOS MOUAU events for testing the event cards and registration flow. Replace sample schedules with confirmed details.',4,1 FROM pages WHERE slug='home'
ON CONFLICT(id) DO UPDATE SET section_key=excluded.section_key,title=excluded.title,body=excluded.body,display_order=excluded.display_order,is_published=excluded.is_published;

INSERT INTO page_sections (id,page_id,section_key,title,body,display_order,is_published)
SELECT 'home-section-news',id,'news','NACOS MOUAU News','Sample NACOS-related news records for testing. Replace them with approved chapter publications.',5,1 FROM pages WHERE slug='home'
ON CONFLICT(id) DO UPDATE SET section_key=excluded.section_key,title=excluded.title,body=excluded.body,display_order=excluded.display_order,is_published=excluded.is_published;

INSERT INTO page_sections (id,page_id,section_key,title,body,display_order,is_published)
SELECT 'home-section-announcements',id,'announcements','Student Notices','Sample notices for testing the NACOS MOUAU announcements feed.',6,1 FROM pages WHERE slug='home'
ON CONFLICT(id) DO UPDATE SET section_key=excluded.section_key,title=excluded.title,body=excluded.body,display_order=excluded.display_order,is_published=excluded.is_published;

INSERT INTO page_sections (id,page_id,section_key,title,body,display_order,is_published)
SELECT 'home-section-achievements',id,'achievements','Achievements & Milestones','Clearly marked sample records. Replace with verified chapter achievements.',7,1 FROM pages WHERE slug='home'
ON CONFLICT(id) DO UPDATE SET section_key=excluded.section_key,title=excluded.title,body=excluded.body,display_order=excluded.display_order,is_published=excluded.is_published;

INSERT INTO page_sections (id,page_id,section_key,title,body,display_order,is_published)
SELECT 'home-section-gallery',id,'gallery','NACOS MOUAU Gallery','Sample album record; upload approved chapter photographs in the admin gallery manager.',8,1 FROM pages WHERE slug='home'
ON CONFLICT(id) DO UPDATE SET section_key=excluded.section_key,title=excluded.title,body=excluded.body,display_order=excluded.display_order,is_published=excluded.is_published;

INSERT INTO system_settings (key,value_json) VALUES
('contact_email','"nacostechsummit@gmail.com"'),
('address','"Michael Okpara University of Agriculture, Umudike, Abia State, Nigeria"')
ON CONFLICT(key) DO UPDATE SET value_json=excluded.value_json;

INSERT INTO executive_administrations (id,name,starts_at,ends_at,is_current,handover_notes)
VALUES ('sample-admin-2025-2026','2025/2026 NACOS MOUAU Executive Council','2025-01-01','2026-12-31',1,'Sample test administration; replace sample profiles with the approved executive roster.')
ON CONFLICT(id) DO UPDATE SET name=excluded.name,starts_at=excluded.starts_at,ends_at=excluded.ends_at,is_current=excluded.is_current,handover_notes=excluded.handover_notes;

INSERT INTO executive_positions (id,name,description,display_order) VALUES
('sample-position-president','President','Sample test position.',0),
('sample-position-vp','Vice President','Sample test position.',1),
('sample-position-secretary','General Secretary','Sample test position.',2),
('sample-position-publicity','Director of Publicity and Media','Sample test position.',3)
ON CONFLICT(id) DO UPDATE SET name=excluded.name,description=excluded.description,display_order=excluded.display_order;

INSERT INTO executive_assignments (id,administration_id,position_id,user_id,full_name,bio,responsibilities)
VALUES
('sample-exec-president','sample-admin-2025-2026','sample-position-president',NULL,'Sample NACOS President (TEST)','Sample test profile. Replace with the verified 2025/2026 office holder.','Association leadership and representation.'),
('sample-exec-vp','sample-admin-2025-2026','sample-position-vp',NULL,'Sample NACOS Vice President (TEST)','Sample test profile. Replace with the verified 2025/2026 office holder.','Supports executive coordination and student initiatives.'),
('sample-exec-secretary','sample-admin-2025-2026','sample-position-secretary',NULL,'Sample NACOS General Secretary (TEST)','Sample test profile. Replace with the verified 2025/2026 office holder.','Association records and official correspondence.'),
('sample-exec-publicity','sample-admin-2025-2026','sample-position-publicity',NULL,'Sample NACOS Publicity Director (TEST)','Sample test profile. Replace with the verified 2025/2026 office holder.','Public information and media communications.')
ON CONFLICT(id) DO UPDATE SET administration_id=excluded.administration_id,position_id=excluded.position_id,full_name=excluded.full_name,bio=excluded.bio,responsibilities=excluded.responsibilities;

INSERT INTO events (id,title,slug,description,starts_at,ends_at,venue,price_minor,currency,registration_open)
VALUES
('sample-event-summit','TEST DATA — NACOS Tech Summit','sample-nacos-tech-summit','Sample event record based on the operational highlight supplied. Schedule and venue are test values; registration remains closed until verified.','2026-12-10T09:00:00Z','2026-12-10T17:00:00Z','MOUAU (test venue)',0,'NGN',0),
('sample-event-induction','TEST DATA — Induction Ceremony','sample-induction-ceremony','Sample event record based on the operational highlight supplied. Schedule and venue are test values; registration remains closed until verified.','2026-12-17T09:00:00Z','2026-12-17T13:00:00Z','MOUAU (test venue)',0,'NGN',0),
('sample-event-award-night','TEST DATA — Award Night','sample-award-night','Sample event record based on the operational highlight supplied. Schedule and venue are test values; registration remains closed until verified.','2027-01-15T17:00:00Z','2027-01-15T21:00:00Z','MOUAU (test venue)',0,'NGN',0),
('sample-event-uyo-outreach','TEST DATA — Uyo Outreach','sample-uyo-outreach','Sample event record based on the operational highlight supplied. Schedule and venue are test values; registration remains closed until verified.','2027-02-20T09:00:00Z','2027-02-20T16:00:00Z','Uyo (test venue)',0,'NGN',0)
ON CONFLICT(slug) DO UPDATE SET title=excluded.title,description=excluded.description,starts_at=excluded.starts_at,ends_at=excluded.ends_at,venue=excluded.venue,price_minor=excluded.price_minor,currency=excluded.currency,registration_open=excluded.registration_open;

INSERT INTO news (id,title,slug,excerpt,body,category,status,published_at)
VALUES
('sample-news-skills','TEST DATA — Building Digital Skills at NACOS MOUAU','sample-building-digital-skills','Sample NACOS-themed publication for testing the homepage news feed.','This is a clearly marked sample record for testing the NACOS MOUAU publications feed. Replace it with an approved report about an actual chapter activity before using the site for public communications.','Test data','published',datetime('now')),
('sample-news-community','TEST DATA — A Connected Computing Community','sample-connected-computing-community','Sample NACOS-themed publication for testing the news list.','This is a clearly marked sample record. It does not report a verified event or achievement. Replace it with an approved NACOS MOUAU publication.','Test data','published',datetime('now'))
ON CONFLICT(slug) DO UPDATE SET title=excluded.title,excerpt=excluded.excerpt,body=excluded.body,category=excluded.category,status=excluded.status,published_at=excluded.published_at;

INSERT INTO announcements (id,title,body,priority,published_at,expires_at)
VALUES
('sample-announcement-profile','TEST DATA — Update your NACOS profile','Sample notice for testing. Members should keep their contact and academic details current. Replace this message with an approved chapter notice.','normal',datetime('now'),datetime('now','+30 days')),
('sample-announcement-summit','TEST DATA — NACOS Tech Summit schedule','Sample notice only. The event schedule and venue have not been confirmed; registration is closed in this test record.','important',datetime('now'),datetime('now','+30 days'))
ON CONFLICT(id) DO UPDATE SET title=excluded.title,body=excluded.body,priority=excluded.priority,published_at=excluded.published_at,expires_at=excluded.expires_at;

INSERT INTO achievements (id,title,description,achieved_at)
VALUES
('sample-achievement-skills','TEST DATA — Digital Skills Initiative','Sample NACOS MOUAU milestone record. Replace with a verified chapter achievement.','2026-01-15'),
('sample-achievement-summit','TEST DATA — NACOS Tech Summit','Sample milestone record only; it does not assert that this event has taken place. Replace with a verified outcome.','2026-02-15'),
('sample-achievement-outreach','TEST DATA — Student Outreach','Sample NACOS MOUAU milestone record. Replace with verified outreach details.','2026-03-15')
ON CONFLICT(id) DO UPDATE SET title=excluded.title,description=excluded.description,achieved_at=excluded.achieved_at;

INSERT INTO gallery_albums (id,title,description,is_public)
VALUES ('sample-gallery-2025-2026','TEST DATA — NACOS MOUAU 2025/2026','Sample album record. Upload approved chapter photographs to populate this album.',1)
ON CONFLICT(id) DO UPDATE SET title=excluded.title,description=excluded.description,is_public=excluded.is_public;
