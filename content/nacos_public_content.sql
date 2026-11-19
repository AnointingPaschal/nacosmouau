
INSERT INTO pages (id, slug, title, summary, body, status, published_at)
VALUES
(
  'cms-home',
  'home',
  'NACOS MOUAU',
  'The campus chapter of the National Association of Computing Students at Michael Okpara University of Agriculture, Umudike.',
  'A home for computing students to connect, share knowledge, and take part in the wider NACOS community.',
  'published',
  datetime('now')
),
(
  'cms-about-nacos',
  'about-nacos',
  'About NACOS',
  'The Nigeria Association of Computing Students is an umbrella association for students in computing and related disciplines.',
  'NACOS brings together students in Computer Science, Computer Engineering, Information Systems, Cyber Security, Software Engineering, Telecommunications Engineering, and other IT-related disciplines. Its national mission is to unite student IT professionals and advance technology, innovation, and entrepreneurship in Nigeria.\n\nThe association promotes the study and practice of computing through activities such as seminars, workshops, symposia, webinars, and computing contests. It also aims to encourage professional and ethical standards and protect the interests of the computing profession.',
  'published',
  datetime('now')
),
(
  'cms-about-mouau',
  'about-mouau',
  'About NACOS MOUAU',
  'The NACOS chapter at Michael Okpara University of Agriculture, Umudike.',
  'NACOS MOUAU is the campus chapter serving computing students at Michael Okpara University of Agriculture, Umudike. This website is the chapter’s place to publish verified information about its leadership, activities, announcements, and resources.\n\nChapter history, constitutional information, and current priorities can be added and maintained by authorized chapter administrators.',
  'published',
  datetime('now')
)
ON CONFLICT(slug) DO UPDATE SET
  title = excluded.title,
  summary = excluded.summary,
  body = excluded.body,
  status = excluded.status,
  published_at = excluded.published_at;

INSERT INTO hero_slides (
  id, badge, title, subtitle,
  primary_cta_text, primary_cta_link,
  secondary_cta_text, secondary_cta_link,
  display_order, is_active
)
VALUES (
  'cms-welcome-slide',
  'MOUAU CHAPTER · 2025/2026',
  'Computing minds.\nOne community.',
  'A digital home for NACOS students at Michael Okpara University of Agriculture, Umudike.',
  'Become a member', '/register',
  'Verify membership', '/verify',
  0, 1
)
ON CONFLICT(id) DO UPDATE SET
  badge = excluded.badge,
  title = excluded.title,
  subtitle = excluded.subtitle,
  primary_cta_text = excluded.primary_cta_text,
  primary_cta_link = excluded.primary_cta_link,
  secondary_cta_text = excluded.secondary_cta_text,
  secondary_cta_link = excluded.secondary_cta_link,
  display_order = excluded.display_order,
  is_active = excluded.is_active;

INSERT INTO navigation_menus (id, label, href, location, display_order, is_visible)
VALUES
  ('menu-home', 'Home', '/', 'header', 0, 1),
  ('menu-about', 'About NACOS', '/about-nacos', 'header', 1, 1),
  ('menu-chapter', 'MOUAU Chapter', '/about-mouau', 'header', 2, 1),
  ('menu-executives', 'Executives', '/executives', 'header', 3, 1),
  ('menu-news', 'News', '/news', 'header', 4, 1),
  ('menu-events', 'Events', '/events', 'header', 5, 1),
  ('menu-gallery', 'Gallery', '/gallery', 'header', 6, 1),
  ('menu-documents', 'Documents', '/documents', 'footer', 0, 1),
  ('menu-contact', 'Contact', '/contact', 'footer', 1, 1)
ON CONFLICT(id) DO UPDATE SET
  label = excluded.label,
  href = excluded.href,
  location = excluded.location,
  display_order = excluded.display_order,
  is_visible = excluded.is_visible;

INSERT INTO system_settings (key, value_json)
VALUES (
  'address',
  '"Department of Computer Science, Michael Okpara University of Agriculture, Umudike, Abia State, Nigeria"'
)
ON CONFLICT(key) DO UPDATE SET value_json = excluded.value_json;

INSERT INTO page_sections (
  id, page_id, section_key, title, body, display_order, is_published
)
SELECT 'home-section-about', id, 'about',
       'A community for computing students at MOUAU',
       'NACOS is the umbrella association for students in computing and related disciplines across Nigeria. At MOUAU, the chapter connects students with the wider NACOS community and its focus on computing, innovation, and entrepreneurship.',
       0, 1
FROM pages WHERE slug = 'home'
ON CONFLICT(id) DO UPDATE SET
  section_key = excluded.section_key, title = excluded.title,
  body = excluded.body, display_order = excluded.display_order,
  is_published = excluded.is_published;

INSERT INTO page_sections (id, page_id, section_key, title, body, display_order, is_published)
SELECT 'home-section-vision', id, 'vision',
       'Advance computing and innovation',
       'NACOS aspires to be a leading student organization in information technology and entrepreneurship, setting a standard for excellence and innovation.',
       1, 1
FROM pages WHERE slug = 'home'
ON CONFLICT(id) DO UPDATE SET
  section_key = excluded.section_key, title = excluded.title,
  body = excluded.body, display_order = excluded.display_order,
  is_published = excluded.is_published;

INSERT INTO page_sections (id, page_id, section_key, title, body, display_order, is_published)
SELECT 'home-section-mission', id, 'mission',
       'Build a connected community',
       'NACOS brings student IT professionals together to advance technology, innovation, and entrepreneurship, and to promote digital inclusion.',
       2, 1
FROM pages WHERE slug = 'home'
ON CONFLICT(id) DO UPDATE SET
  section_key = excluded.section_key, title = excluded.title,
  body = excluded.body, display_order = excluded.display_order,
  is_published = excluded.is_published;

INSERT INTO page_sections (id, page_id, section_key, title, body, display_order, is_published)
SELECT 'home-section-executives', id, 'executives', 'Executive Council', '', 3, 1
FROM pages WHERE slug = 'home'
ON CONFLICT(id) DO UPDATE SET section_key = excluded.section_key, title = excluded.title;
INSERT INTO page_sections (id, page_id, section_key, title, body, display_order, is_published)
SELECT 'home-section-news', id, 'news', 'Latest news', '', 4, 1
FROM pages WHERE slug = 'home'
ON CONFLICT(id) DO UPDATE SET section_key = excluded.section_key, title = excluded.title;
INSERT INTO page_sections (id, page_id, section_key, title, body, display_order, is_published)
SELECT 'home-section-announcements', id, 'announcements', 'Announcements', '', 5, 1
FROM pages WHERE slug = 'home'
ON CONFLICT(id) DO UPDATE SET section_key = excluded.section_key, title = excluded.title;
INSERT INTO page_sections (id, page_id, section_key, title, body, display_order, is_published)
SELECT 'home-section-events', id, 'events', 'Upcoming events', '', 6, 1
FROM pages WHERE slug = 'home'
ON CONFLICT(id) DO UPDATE SET section_key = excluded.section_key, title = excluded.title;
INSERT INTO page_sections (id, page_id, section_key, title, body, display_order, is_published)
SELECT 'home-section-achievements', id, 'achievements', 'Achievements & milestones', '', 7, 1
FROM pages WHERE slug = 'home'
ON CONFLICT(id) DO UPDATE SET section_key = excluded.section_key, title = excluded.title;
INSERT INTO page_sections (id, page_id, section_key, title, body, display_order, is_published)
SELECT 'home-section-gallery', id, 'gallery', 'Chapter gallery', '', 8, 1
FROM pages WHERE slug = 'home'
ON CONFLICT(id) DO UPDATE SET section_key = excluded.section_key, title = excluded.title;
