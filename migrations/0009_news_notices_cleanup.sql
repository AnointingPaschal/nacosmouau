-- Achievements now live under Events: remove the separate Achievements section, then add starter news and notices.
DELETE FROM achievements WHERE id LIKE 'seed-ach-%';
DELETE FROM navigation_menus WHERE id='menu-achievements';
DELETE FROM page_sections WHERE id='home-section-achievements';
DELETE FROM pages WHERE slug='achievements' AND id='seed-page-achievements';

INSERT INTO news(id,title,slug,excerpt,body,image_key,category,status,published_at) VALUES
('seed-news-inauguration','2025/2026 NACOS MOUAU executives inaugurated','executives-inaugurated','The new executive council was sworn in at the Old Colpas Hall, led by Comr. Ario Benelizer Nwachukwu.',
'The 2025/2026 NACOS MOUAU executive team was officially inaugurated on Wednesday 26th November 2025 at the Old Colpas Hall, starting at 12 noon.' || char(10) || 'The ceremony was led by Comr. Ario Benelizer Nwachukwu as President-Elect and ushered in a new era of leadership committed to technological excellence, student welfare, and innovation at Michael Okpara University of Agriculture, Umudike.' || char(10) || 'See the full event page for photos, highlights and the officials who were inaugurated.',
'uploads/seed/covers/inauguration.webp','News','published','2025-11-26 12:00:00'),
('seed-news-tutorial','Free tutorial for all Nacosite students holds at New Colpas Hall','free-tutorial-2026','A three day free tutorial covered key courses from 100 level to 400 level, in partnership with Hypers & Elites Tutorial.',
'From 15th to 17th January 2026, the executives organised a free tutorial programme for all Nacosite students at New Colpas Hall.' || char(10) || 'In partnership with Hypers & Elites Tutorial, the sessions covered MTH 112, CHM 113, PHY 112, MTH 211, STAT 212, CSC 218, CSC 318, CSC 314, CSC 316, CSC 418, CSC 414 and CSC 411, with gifts including cash giveaways, calculators and past questions for participants.',
'uploads/seed/covers/nacos-tutorial.webp','News','published','2026-01-18 09:00:00'),
('seed-news-tech-summit','Tech Summit 2026 brings together 400+ students and industry leaders','tech-summit-2026-recap','The flagship event of the 2025/2026 tenure featured talks, panels and hands-on workshops.',
'The NACOS Tech Summit 2026 took place on 28th March 2026 at New Colpas Hall. It brought together software engineers, designers, entrepreneurs and computer science students for a full day of talks, panels and workshops.' || char(10) || 'Experts from Cowrywise, Google Developer Groups and Danify International joined MOUAU faculty, with the Head of Department, the Matron and the Patron in attendance.',
'uploads/seed/covers/tech-summit.webp','Achievement','published','2026-03-30 09:00:00'),
('seed-news-induction','Induction Ceremony welcomes new members into the NACOS family','induction-ceremony-2026-recap','More than 300 new members were inducted at New Colpas Hall.',
'The 2026 Induction Ceremony officially welcomed a new cohort of computer science students into NACOS MOUAU on 10th April 2026.' || char(10) || 'The programme featured keynote addresses from senior executives, certificate presentations and a discussion where executive leaders shared advice with incoming members.',
'uploads/seed/covers/induction.webp','News','published','2026-04-11 09:00:00'),
('seed-news-conference','NACOS MOUAU represented at the General Conference in Uyo','general-conference-2026-recap','A national gathering of tech students focused on innovation and digital transformation.',
'NACOS MOUAU took part in the Nacos General Conference 2026 in Uyo, Akwa Ibom State, on 28th and 29th April 2026.' || char(10) || 'The gathering focused on innovation and digital transformation and featured speakers from the Energy Commission of Nigeria and the National Information Technology Development Agency (NITDA).',
'uploads/seed/covers/uyo-outreach.webp','News','published','2026-04-30 09:00:00')
ON CONFLICT(slug) DO UPDATE SET title=excluded.title,excerpt=excluded.excerpt,body=excluded.body,image_key=excluded.image_key,category=excluded.category,status='published',published_at=excluded.published_at,updated_at=datetime('now');

INSERT INTO announcements(id,title,body,priority,published_at) VALUES
('seed-notice-registration','Membership registration is open','Register with your full name, email, phone number, level and matric number. 100 level students may use their JAMB registration number instead. Your account stays pending until an executive approves it.','important',datetime('now')),
('seed-notice-login','Sign in with your matric or registration number','After approval, sign in to the member portal using your matric number (or JAMB registration number for 100 level) and your password. Use the Forgot password link if you need to reset it.','normal',datetime('now')),
('seed-notice-events','Event photos and videos are now online','Browse photos, videos and speakers for the Tech Summit, Induction Ceremony, Award Night and other events on the Events page.','normal',datetime('now')),
('seed-notice-contact','Need help? Reach the executives','Use the Contact page to send a message to the executives. We usually respond within 24 to 48 hours. Add URGENT to the subject line for time-sensitive matters.','normal',datetime('now'))
ON CONFLICT(id) DO UPDATE SET title=excluded.title,body=excluded.body,priority=excluded.priority,expires_at=NULL;
