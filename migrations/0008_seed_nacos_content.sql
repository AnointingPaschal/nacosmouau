-- NACOS MOUAU 2025/2026 content, imported from the original static site (Anselm-web/NACOS-MOUAU-2025-2026).
-- Images are served from public/seed-media through /api/files. Safe to read top to bottom: sample records are removed first.
DELETE FROM executive_assignments WHERE id LIKE 'sample-%';
DELETE FROM executive_positions WHERE id LIKE 'sample-%';
DELETE FROM executive_administrations WHERE id LIKE 'sample-%';
DELETE FROM events WHERE id LIKE 'sample-%';
DELETE FROM news WHERE id LIKE 'sample-%';
DELETE FROM announcements WHERE id LIKE 'sample-%';
DELETE FROM achievements WHERE id LIKE 'sample-%';
DELETE FROM gallery_albums WHERE id LIKE 'sample-%';
INSERT OR REPLACE INTO media_objects(object_key,uploaded_by,filename,mime_type,size_bytes) VALUES
('uploads/seed/logo/nacos-logo.webp',NULL,'nacos-logo.webp','image/webp',13046),
('uploads/seed/logo/mouau-logo.webp',NULL,'mouau-logo.webp','image/webp',4350),
('uploads/seed/executives/president.webp',NULL,'president.webp','image/webp',68458),
('uploads/seed/executives/vice-president.webp',NULL,'vice-president.webp','image/webp',55994),
('uploads/seed/executives/exec-01.webp',NULL,'exec-01.webp','image/webp',43510),
('uploads/seed/executives/exec-02.webp',NULL,'exec-02.webp','image/webp',42658),
('uploads/seed/executives/exec-03.webp',NULL,'exec-03.webp','image/webp',48656),
('uploads/seed/executives/exec-04.webp',NULL,'exec-04.webp','image/webp',48080),
('uploads/seed/executives/exec-05.webp',NULL,'exec-05.webp','image/webp',21518),
('uploads/seed/executives/exec-06.webp',NULL,'exec-06.webp','image/webp',53848),
('uploads/seed/executives/exec-07.webp',NULL,'exec-07.webp','image/webp',54634),
('uploads/seed/executives/exec-08.webp',NULL,'exec-08.webp','image/webp',14150);
INSERT OR REPLACE INTO media_objects(object_key,uploaded_by,filename,mime_type,size_bytes) VALUES
('uploads/seed/executives/exec-09.webp',NULL,'exec-09.webp','image/webp',41368),
('uploads/seed/executives/exec-10.webp',NULL,'exec-10.webp','image/webp',47380),
('uploads/seed/executives/exec-11.webp',NULL,'exec-11.webp','image/webp',47978),
('uploads/seed/executives/exec-12.webp',NULL,'exec-12.webp','image/webp',66242),
('uploads/seed/administration/admin-01.webp',NULL,'admin-01.webp','image/webp',11724),
('uploads/seed/administration/admin-02.webp',NULL,'admin-02.webp','image/webp',27654),
('uploads/seed/administration/admin-03.webp',NULL,'admin-03.webp','image/webp',17878),
('uploads/seed/administration/admin-04.webp',NULL,'admin-04.webp','image/webp',20048),
('uploads/seed/administration/admin-05.webp',NULL,'admin-05.webp','image/webp',122732),
('uploads/seed/covers/tech-summit.webp',NULL,'tech-summit.webp','image/webp',93868),
('uploads/seed/covers/induction.webp',NULL,'induction.webp','image/webp',151948),
('uploads/seed/covers/award-night.webp',NULL,'award-night.webp','image/webp',98444);
INSERT OR REPLACE INTO media_objects(object_key,uploaded_by,filename,mime_type,size_bytes) VALUES
('uploads/seed/covers/uyo-outreach.webp',NULL,'uyo-outreach.webp','image/webp',31254),
('uploads/seed/covers/inauguration.webp',NULL,'inauguration.webp','image/webp',71770),
('uploads/seed/covers/nacos-tutorial.webp',NULL,'nacos-tutorial.webp','image/webp',70630),
('uploads/seed/covers/nacos-travail.webp',NULL,'nacos-travail.webp','image/webp',72796),
('uploads/seed/gallery-tech-summit/01.webp',NULL,'01.webp','image/webp',57578),
('uploads/seed/gallery-tech-summit/02.webp',NULL,'02.webp','image/webp',56384),
('uploads/seed/gallery-tech-summit/03.webp',NULL,'03.webp','image/webp',48338),
('uploads/seed/gallery-tech-summit/04.webp',NULL,'04.webp','image/webp',64596),
('uploads/seed/gallery-tech-summit/05.webp',NULL,'05.webp','image/webp',39796),
('uploads/seed/gallery-tech-summit/06.webp',NULL,'06.webp','image/webp',65958),
('uploads/seed/gallery-tech-summit/07.webp',NULL,'07.webp','image/webp',45126),
('uploads/seed/gallery-tech-summit/08.webp',NULL,'08.webp','image/webp',55882);
INSERT OR REPLACE INTO media_objects(object_key,uploaded_by,filename,mime_type,size_bytes) VALUES
('uploads/seed/gallery-tech-summit/09.webp',NULL,'09.webp','image/webp',80940),
('uploads/seed/gallery-tech-summit/10.webp',NULL,'10.webp','image/webp',74630),
('uploads/seed/gallery-tech-summit/11.webp',NULL,'11.webp','image/webp',45662),
('uploads/seed/gallery-tech-summit/12.webp',NULL,'12.webp','image/webp',68130),
('uploads/seed/gallery-tech-summit/13.webp',NULL,'13.webp','image/webp',56100),
('uploads/seed/gallery-tech-summit/14.webp',NULL,'14.webp','image/webp',96436),
('uploads/seed/gallery-tech-summit/15.webp',NULL,'15.webp','image/webp',87744),
('uploads/seed/gallery-tech-summit/16.webp',NULL,'16.webp','image/webp',48902),
('uploads/seed/gallery-tech-summit/17.webp',NULL,'17.webp','image/webp',35066),
('uploads/seed/gallery-tech-summit/18.webp',NULL,'18.webp','image/webp',44760),
('uploads/seed/gallery-tech-summit/19.webp',NULL,'19.webp','image/webp',77720),
('uploads/seed/gallery-tech-summit/20.webp',NULL,'20.webp','image/webp',83180);
INSERT OR REPLACE INTO media_objects(object_key,uploaded_by,filename,mime_type,size_bytes) VALUES
('uploads/seed/gallery-tech-summit/21.webp',NULL,'21.webp','image/webp',43402),
('uploads/seed/gallery-tech-summit/22.webp',NULL,'22.webp','image/webp',68580),
('uploads/seed/gallery-tech-summit/23.webp',NULL,'23.webp','image/webp',139336),
('uploads/seed/gallery-tech-summit/24.webp',NULL,'24.webp','image/webp',68760),
('uploads/seed/gallery-tech-summit/25.webp',NULL,'25.webp','image/webp',43178),
('uploads/seed/gallery-tech-summit/26.webp',NULL,'26.webp','image/webp',47002),
('uploads/seed/gallery-tech-summit/27.webp',NULL,'27.webp','image/webp',148476),
('uploads/seed/gallery-tech-summit/28.webp',NULL,'28.webp','image/webp',101870),
('uploads/seed/gallery-tech-summit/29.webp',NULL,'29.webp','image/webp',76548),
('uploads/seed/gallery-induction/01.webp',NULL,'01.webp','image/webp',83504),
('uploads/seed/gallery-induction/02.webp',NULL,'02.webp','image/webp',153424),
('uploads/seed/gallery-induction/03.webp',NULL,'03.webp','image/webp',155128);
INSERT OR REPLACE INTO media_objects(object_key,uploaded_by,filename,mime_type,size_bytes) VALUES
('uploads/seed/gallery-induction/04.webp',NULL,'04.webp','image/webp',84186),
('uploads/seed/gallery-induction/05.webp',NULL,'05.webp','image/webp',161942),
('uploads/seed/gallery-induction/06.webp',NULL,'06.webp','image/webp',109552),
('uploads/seed/gallery-induction/07.webp',NULL,'07.webp','image/webp',163222),
('uploads/seed/gallery-induction/08.webp',NULL,'08.webp','image/webp',68094),
('uploads/seed/gallery-induction/09.webp',NULL,'09.webp','image/webp',44740),
('uploads/seed/gallery-induction/10.webp',NULL,'10.webp','image/webp',43124),
('uploads/seed/gallery-induction/11.webp',NULL,'11.webp','image/webp',68336),
('uploads/seed/gallery-induction/12.webp',NULL,'12.webp','image/webp',63142),
('uploads/seed/gallery-induction/13.webp',NULL,'13.webp','image/webp',70406),
('uploads/seed/gallery-induction/14.webp',NULL,'14.webp','image/webp',90374),
('uploads/seed/gallery-induction/15.webp',NULL,'15.webp','image/webp',66708);
INSERT OR REPLACE INTO media_objects(object_key,uploaded_by,filename,mime_type,size_bytes) VALUES
('uploads/seed/gallery-induction/16.webp',NULL,'16.webp','image/webp',67932),
('uploads/seed/gallery-award-night/01.webp',NULL,'01.webp','image/webp',125020),
('uploads/seed/gallery-award-night/02.webp',NULL,'02.webp','image/webp',113126),
('uploads/seed/gallery-award-night/03.webp',NULL,'03.webp','image/webp',93938),
('uploads/seed/gallery-award-night/04.webp',NULL,'04.webp','image/webp',105478),
('uploads/seed/gallery-award-night/05.webp',NULL,'05.webp','image/webp',118886),
('uploads/seed/gallery-award-night/06.webp',NULL,'06.webp','image/webp',130922),
('uploads/seed/gallery-uyo-outreach/01.webp',NULL,'01.webp','image/webp',55012),
('uploads/seed/gallery-uyo-outreach/02.webp',NULL,'02.webp','image/webp',57080),
('uploads/seed/gallery-uyo-outreach/03.webp',NULL,'03.webp','image/webp',46806),
('uploads/seed/gallery-uyo-outreach/04.webp',NULL,'04.webp','image/webp',138706),
('uploads/seed/gallery-uyo-outreach/05.webp',NULL,'05.webp','image/webp',84356);
INSERT OR REPLACE INTO media_objects(object_key,uploaded_by,filename,mime_type,size_bytes) VALUES
('uploads/seed/gallery-uyo-outreach/06.webp',NULL,'06.webp','image/webp',117702),
('uploads/seed/gallery-nacos-travail/01.webp',NULL,'01.webp','image/webp',76226),
('uploads/seed/gallery-nacos-travail/02.webp',NULL,'02.webp','image/webp',64562),
('uploads/seed/gallery-nacos-travail/03.webp',NULL,'03.webp','image/webp',69642),
('uploads/seed/gallery-nacos-travail/04.webp',NULL,'04.webp','image/webp',72796),
('uploads/seed/thumbs/inauguration-thumb.webp',NULL,'inauguration-thumb.webp','image/webp',13234),
('uploads/seed/thumbs/induction-thumb.webp',NULL,'induction-thumb.webp','image/webp',33050),
('uploads/seed/thumbs/nacos-travail-1-thumb.webp',NULL,'nacos-travail-1-thumb.webp','image/webp',9384),
('uploads/seed/thumbs/nacos-travail-2-thumb.webp',NULL,'nacos-travail-2-thumb.webp','image/webp',13550),
('uploads/seed/thumbs/nacos-tutorial-thumb.webp',NULL,'nacos-tutorial-thumb.webp','image/webp',13840),
('uploads/seed/thumbs/tech-summit-extra-thumb.webp',NULL,'tech-summit-extra-thumb.webp','image/webp',36396),
('uploads/seed/thumbs/tech-summit-featured-thumb.webp',NULL,'tech-summit-featured-thumb.webp','image/webp',36736);
INSERT OR REPLACE INTO media_objects(object_key,uploaded_by,filename,mime_type,size_bytes) VALUES
('uploads/seed/thumbs/thumb-v1.webp',NULL,'thumb-v1.webp','image/webp',62162),
('uploads/seed/thumbs/thumb-v2.webp',NULL,'thumb-v2.webp','image/webp',61106),
('uploads/seed/thumbs/thumb-v3.webp',NULL,'thumb-v3.webp','image/webp',28176),
('uploads/seed/thumbs/thumb-v4.webp',NULL,'thumb-v4.webp','image/webp',53116),
('uploads/seed/thumbs/uyo-outreach-thumb.webp',NULL,'uyo-outreach-thumb.webp','image/webp',11134);
INSERT INTO system_settings(key,value_json) VALUES('association_name','"NACOS MOUAU"') ON CONFLICT(key) DO UPDATE SET value_json=excluded.value_json,updated_at=datetime('now');
INSERT INTO system_settings(key,value_json) VALUES('institution_name','"Michael Okpara University of Agriculture, Umudike"') ON CONFLICT(key) DO UPDATE SET value_json=excluded.value_json,updated_at=datetime('now');
INSERT INTO system_settings(key,value_json) VALUES('academic_session','"2025/2026"') ON CONFLICT(key) DO UPDATE SET value_json=excluded.value_json,updated_at=datetime('now');
INSERT INTO system_settings(key,value_json) VALUES('address','"Michael Okpara University of Agriculture, Umudike, Abia State, Nigeria"') ON CONFLICT(key) DO UPDATE SET value_json=excluded.value_json,updated_at=datetime('now');
INSERT INTO system_settings(key,value_json) VALUES('social_links','[{"label": "Instagram", "url": "https://www.instagram.com/nacosmouau"}]') ON CONFLICT(key) DO UPDATE SET value_json=excluded.value_json,updated_at=datetime('now');
INSERT INTO system_settings(key,value_json) VALUES('logo_key','"uploads/seed/logo/nacos-logo.webp"') ON CONFLICT(key) DO UPDATE SET value_json=excluded.value_json,updated_at=datetime('now');
INSERT INTO system_settings(key,value_json) VALUES('contact_email','"nacostechsummit@gmail.com"') ON CONFLICT(key) DO UPDATE SET value_json=excluded.value_json,updated_at=datetime('now');
INSERT INTO pages(id,slug,title,summary,body,status,published_at) VALUES('cms-home','home','NACOS MOUAU','The campus chapter of the National Association of Computing Students at Michael Okpara University of Agriculture, Umudike.',NULL,'published',datetime('now')) ON CONFLICT(slug) DO UPDATE SET title=excluded.title,summary=excluded.summary,status='published',published_at=COALESCE(pages.published_at,excluded.published_at),updated_at=datetime('now');
INSERT INTO pages(id,slug,title,summary,body,status,published_at) VALUES('seed-page-executives','executives','Meet the Executives','Driven by purpose and student excellence forging academic leadership and professional development initiatives.',NULL,'published',datetime('now')) ON CONFLICT(slug) DO UPDATE SET title=excluded.title,summary=excluded.summary,status='published',published_at=COALESCE(pages.published_at,excluded.published_at),updated_at=datetime('now');
INSERT INTO pages(id,slug,title,summary,body,status,published_at) VALUES('seed-page-achievements','achievements','Our Achievements','Documenting the milestones, events, and impact of the NACOS MOUAU 2025/2026 executive tenure.',NULL,'published',datetime('now')) ON CONFLICT(slug) DO UPDATE SET title=excluded.title,summary=excluded.summary,status='published',published_at=COALESCE(pages.published_at,excluded.published_at),updated_at=datetime('now');
INSERT INTO pages(id,slug,title,summary,body,status,published_at) VALUES('seed-page-contact','contact','Reach out to us','Have a question, suggestion, or want to collaborate? We''d love to hear from you.',NULL,'published',datetime('now')) ON CONFLICT(slug) DO UPDATE SET title=excluded.title,summary=excluded.summary,status='published',published_at=COALESCE(pages.published_at,excluded.published_at),updated_at=datetime('now');
INSERT INTO page_sections(id,page_id,section_key,title,body,display_order,is_published) SELECT 'home-section-about',id,'about','Precision in Leadership','NACOS MOUAU Executives represent the pinnacle of student-led technical governance. Our association bridges the gap between academic theory and practical innovation, ensuring that technology serves as a catalyst for excellence across the department, faculty, and beyond.',0,1 FROM pages WHERE slug='home' ON CONFLICT(id) DO UPDATE SET section_key=excluded.section_key,title=excluded.title,body=excluded.body,display_order=excluded.display_order,is_published=1,updated_at=datetime('now');
INSERT INTO page_sections(id,page_id,section_key,title,body,display_order,is_published) SELECT 'home-section-vision',id,'vision','Our Vision','To build a vibrant, innovative, and inclusive community of computer science students, empowering them with relevant digital skills, leadership capacity, and opportunities that prepare them to excel in technology and positively impact society.',1,1 FROM pages WHERE slug='home' ON CONFLICT(id) DO UPDATE SET section_key=excluded.section_key,title=excluded.title,body=excluded.body,display_order=excluded.display_order,is_published=1,updated_at=datetime('now');
INSERT INTO page_sections(id,page_id,section_key,title,body,display_order,is_published) SELECT 'home-section-executives',id,'executives','Meet the Leadership','Driving technological excellence and visionary leadership across the university ecosystem. We empower the next generation of technical pioneers.',3,1 FROM pages WHERE slug='home' ON CONFLICT(id) DO UPDATE SET section_key=excluded.section_key,title=excluded.title,body=excluded.body,display_order=excluded.display_order,is_published=1,updated_at=datetime('now');
INSERT INTO page_sections(id,page_id,section_key,title,body,display_order,is_published) SELECT 'home-section-events',id,'events','Operational Highlights','Documenting the milestones of NACOS 2025/2026 Executives through dedicated initiatives and amazing events.',4,1 FROM pages WHERE slug='home' ON CONFLICT(id) DO UPDATE SET section_key=excluded.section_key,title=excluded.title,body=excluded.body,display_order=excluded.display_order,is_published=1,updated_at=datetime('now');
INSERT INTO page_sections(id,page_id,section_key,title,body,display_order,is_published) SELECT 'home-section-achievements',id,'achievements','Achievements & Milestones','Documenting the milestones, events, and impact of the NACOS MOUAU 2025/2026 executive tenure.',7,1 FROM pages WHERE slug='home' ON CONFLICT(id) DO UPDATE SET section_key=excluded.section_key,title=excluded.title,body=excluded.body,display_order=excluded.display_order,is_published=1,updated_at=datetime('now');
INSERT INTO page_sections(id,page_id,section_key,title,body,display_order,is_published) SELECT 'home-section-gallery',id,'gallery','NACOS MOUAU Gallery','Moments from the Tech Summit, Induction Ceremony, Award Night, the General Conference and more.',8,1 FROM pages WHERE slug='home' ON CONFLICT(id) DO UPDATE SET section_key=excluded.section_key,title=excluded.title,body=excluded.body,display_order=excluded.display_order,is_published=1,updated_at=datetime('now');
INSERT INTO navigation_menus(id,label,href,location,display_order,is_visible) VALUES('menu-achievements','Achievements','/achievements','header',7,1) ON CONFLICT(id) DO UPDATE SET label=excluded.label,href=excluded.href,is_visible=1;
INSERT INTO hero_slides(id,image_key,badge,title,subtitle,primary_cta_text,primary_cta_link,secondary_cta_text,secondary_cta_link,display_order,is_active) VALUES('seed-hero-leadership','uploads/seed/covers/tech-summit.webp','NACOS MOUAU CHAPTER 2025/2026 EXECUTIVES','Meet the\nLeadership','Driving technological excellence and visionary leadership across the university ecosystem. We empower the next generation of technical pioneers.','View Executives','/executives','Our Achievements','/achievements',1,1) ON CONFLICT(id) DO UPDATE SET image_key=excluded.image_key,badge=excluded.badge,title=excluded.title,subtitle=excluded.subtitle,is_active=1;
INSERT INTO executive_administrations(id,name,starts_at,ends_at,is_current,handover_notes) VALUES('seed-admin-2025-2026','2025/2026','2025-11-26',NULL,1,'Inaugurated 26th November 2025 at the Old Colpas Hall.') ON CONFLICT(id) DO UPDATE SET name=excluded.name,is_current=1;
INSERT INTO executive_administrations(id,name,starts_at,ends_at,is_current,handover_notes) VALUES('seed-admin-advisers','Patrons & Advisers','2025-11-26',NULL,1,'Leadership and advisory team guiding NACOS MOUAU.') ON CONFLICT(id) DO UPDATE SET name=excluded.name,is_current=1;
INSERT OR REPLACE INTO executive_positions(id,name,description,display_order) VALUES
('seed-pos-00','President',NULL,0),
('seed-pos-01','Vice President',NULL,1),
('seed-pos-02','Secretary General',NULL,2),
('seed-pos-03','Assistant Secretary General',NULL,3),
('seed-pos-04','Director of Finance',NULL,4),
('seed-pos-05','Director of Hardware',NULL,5),
('seed-pos-06','Director of Software I',NULL,6),
('seed-pos-07','Director of Software II',NULL,7),
('seed-pos-08','Director of Socials',NULL,8),
('seed-pos-09','Director of Welfare',NULL,9);
INSERT OR REPLACE INTO executive_positions(id,name,description,display_order) VALUES
('seed-pos-10','Director of Sports',NULL,10),
('seed-pos-11','Librarian',NULL,11),
('seed-pos-12','Public Relations Officer I',NULL,12),
('seed-pos-13','Public Relations Officer II',NULL,13);
INSERT OR REPLACE INTO executive_assignments(id,administration_id,position_id,user_id,full_name,bio,image_key,responsibilities) VALUES
('seed-exec-00','seed-admin-2025-2026','seed-pos-00',NULL,'Ario Benelizer Nwachukwu','Ario Benelizer Nwachukwu is a tech-driven creative and problem solver passionate about building practical solutions that improve people''s lives. Skilled in design, technology, and hands-on troubleshooting, with a focus on progress over perfection. Outside work, I enjoy researching, traveling, and cooking.

Supporting executive operations, optimising governance workflows and contributing to leadership initiatives across the department and university community.','uploads/seed/executives/president.webp','As the Nacos MOUAU President, I am responsible for driving key areas of the association. My responsibilities include the following:
- Academic & skill growth: Push workshops, hackathons, peer learning.
- Representation: Speak for students and fight for their rights.
- Events & projects: Organise meaningful, impactful initiatives.
- Team leadership: Guide and support every executive member.

Key contributions
- The 2026 Tech Summit: Led the organisation of the largest student-run technical conference in the region, connecting industry leaders and students to advance technical excellence.
- Induction Ceremony 2026: Oversaw the successful welcome of new NACOS members into the community, fostering a culture of purpose, belonging, and academic pride.
- Uyo Outreach Programme: Initiated community outreach connecting NACOS MOUAU with secondary school students across Uyo, inspiring the next generation of computer science students.
- 2025/2026 NACOS EXECUTIVES: Shaping the university''s digital future through strong technical leadership and governance.
- Resources: Privacy Policy Terms of Service Faculty Portal'),
('seed-exec-01','seed-admin-2025-2026','seed-pos-01',NULL,'Umeh Onyinyechi Christiana','I''m Umeh Onyinyechi Christiana from Imo State, Vice President of NACOS MOUAU CHAPTER 2025/2026. I love tech a lot it keeps me busy and makes me think smarter, gives me room to learn new things and explore. I''m really ready to take it all to the next level.

As Vice President, I support the President, execute strategies, and bridge the gap between leadership and members to ensure smooth coordination and effective implementation of all association decisions.','uploads/seed/executives/vice-president.webp','As the Vice President, I am responsible for driving key areas of the association''s mandate. My responsibilities include the following:
- Support the President in all executive functions and decision-making.
- Bridge communication between executives and the student body.
- Coordinate implementation of approved strategies and programmes.
- Represent the association in the President''s absence.

Key contributions
- Executive Coordination: Played a central role in coordinating the executive team, ensuring smooth collaboration between all departments and consistent delivery on the association''s agenda.
- Induction Ceremony Organisation: Actively contributed to planning and executing the 2026 Induction Ceremony, creating a welcoming and memorable experience for new NACOS members.
- Member Welfare & Engagement: Championed student welfare initiatives and ensured that members'' voices were heard and properly represented at the executive level.
- 2025/2026 NACOS EXECUTIVES: Shaping the university''s digital future through strong technical leadership and governance.
- Resources: Privacy Policy Terms of Service Faculty Portal'),
('seed-exec-02','seed-admin-2025-2026','seed-pos-02',NULL,'Ndukwe Okechi Peter','I''m a Graduate of Computer Science at Michael Okpara University of Agriculture, Umudike. I am highly organised, articulate, and committed to maintaining smooth administrative operations within the NACOS executive.

As Secretary General, I coordinate all administrative affairs of the association, manages official correspondence, and ensures meetings are properly documented and followed up on.','uploads/seed/executives/exec-02.webp','As the Secretary General, I coordinate the administrative backbone of NACOS MOUAU. My responsibilities include:
- Record and distribute minutes of all executive and general meetings.
- Manage all official correspondence and documentation.
- Maintain the association''s records and institutional memory.
- Coordinate scheduling and communication between executives.

Key contributions
- Meeting Documentation: Maintained thorough and accurate records of all NACOS executive meetings throughout the 2025/2026 session, ensuring accountability and continuity.
- Administrative Coordination: Streamlined internal communication between executive members, reducing delays in decision-making and implementation.
- Correspondence Management: Handled all official association correspondence with the university faculty and external organisations professionally and promptly.
- 2025/2026 NACOS EXECUTIVES: Shaping the university''s digital future through strong technical leadership and governance.
- Resources: Privacy Policy Terms of Service Faculty Portal'),
('seed-exec-03','seed-admin-2025-2026','seed-pos-03',NULL,'Uche Goodnews','Uche Goodnews is a Computer Science student at Michael Okpara University of Agriculture, Umudike. He supports the Secretary General in all administrative duties, with a particular focus on meeting documentation and member communication.

As Assistant Secretary General, he ensures no administrative task falls through the cracks, providing reliable support across the full scope of secretarial duties.','uploads/seed/executives/exec-03.webp','As the Assistant Secretary General, I assist the Secretary General in all administrative operations. My responsibilities include:
- Assist in recording and distributing meeting minutes.
- Support the management of official association documents.
- Coordinate follow-up on action items from meetings.
- Stand in for the Secretary General when required.

Key contributions
- Meeting Support: Consistently provided accurate meeting notes and follow-up reports, ensuring executive decisions were properly documented and actioned.
- Administrative Backup: Served as a reliable second in all administrative matters, ensuring no task was delayed due to unavailability of the Secretary General.
- Member Communication: Assisted in drafting and distributing official communications to NACOS members across departments and levels.
- 2025/2026 NACOS EXECUTIVES: Shaping the university''s digital future through strong technical leadership and governance.
- Resources: Privacy Policy Terms of Service Faculty Portal');
INSERT OR REPLACE INTO executive_assignments(id,administration_id,position_id,user_id,full_name,bio,image_key,responsibilities) VALUES
('seed-exec-04','seed-admin-2025-2026','seed-pos-04',NULL,'Onuoha Wisdom','I''m a Graduate of Computer Science at Michael Okpara University of Agriculture, Umudike, with a strong background in financial management and student governance. I am detail-oriented and committed to ensuring the association operates with full fiscal accountability.

As Director of Finance, I oversee all financial matters of the association, maintaining transparent records and ensuring every naira is well accounted for.','uploads/seed/executives/exec-01.webp','As the Director of Finance, I am responsible for managing the financial health of NACOS MOUAU. My responsibilities include:
- Prepare and manage the association''s annual budget.
- Oversee the collection and disbursement of association dues and funds.
- Ensure accurate and transparent financial record-keeping.
- Present financial reports at executive meetings and general assemblies.

Key contributions
- Budget Management: Developed and maintained a clear, transparent budget framework for the 2025/2026 session, ensuring every association programme was properly funded.
- Financial Transparency: Introduced structured financial reporting that gave every executive and member visibility into how association funds were being used.
- Event Funding: Coordinated the allocation and disbursement of funds for major events including the Tech Summit, Induction Ceremony, and Award Night.
- 2025/2026 NACOS EXECUTIVES: Shaping the university''s digital future through strong technical leadership and governance.
- Resources: Privacy Policy Terms of Service Faculty Portal'),
('seed-exec-05','seed-admin-2025-2026','seed-pos-05',NULL,'Chukwuma Mac-Davidson','I''m a Graduate of Computer Science at Michael Okpara University of Agriculture, Umudike, with a passion for hardware systems and technical infrastructure. I am hands-on, methodical, and dedicated to keeping the department''s computing resources in top condition.

As Director of Hardware, my role involves overseeing the maintenance, protection, and operational readiness of all departmental computer hardware, ensuring students always have access to functional technical resources.','uploads/seed/executives/exec-04.webp','As the Director of Hardware, I ensure that all departmental computer hardware is properly maintained and operational. My responsibilities include:
- Oversee the maintenance and servicing of all departmental hardware.
- Coordinate repairs and replacements of faulty equipment.
- Maintain an inventory of all hardware assets.
- Advise on hardware acquisitions and upgrades.

Key contributions
- Hardware Maintenance Drive: Conducted a full audit and maintenance exercise on departmental computer systems, identifying and resolving faults that had disrupted student access to lab resources.
- Equipment Inventory: Created a comprehensive hardware inventory for the department, giving the association and faculty a clear picture of available and needed resources.
- Lab Uptime Improvement: Worked with lab technicians to reduce equipment downtime, ensuring students had more reliable access during exam preparation periods.
- 2025/2026 NACOS EXECUTIVES: Shaping the university''s digital future through strong technical leadership and governance.
- Resources: Privacy Policy Terms of Service Faculty Portal'),
('seed-exec-06','seed-admin-2025-2026','seed-pos-06',NULL,'Chikezie Chimaobi Anselm','I''m a Graduate of Computer Science at Michael Okpara University of Agriculture, Umudike, A tech-driven builder with a passion for software development, he spearheads the association''s software initiatives and student technical development programmes.

As Director of Software I, he coordinates all software-related activities, champions skill-building workshops, and drives the digital projects that define NACOS MOUAU''s technical identity.','uploads/seed/executives/exec-05.webp','As the Director of Software I, I coordinate software initiatives and support students'' technical growth. My responsibilities include:
- Plan and coordinate software workshops, hackathons, and coding sessions.
- Lead the development of NACOS digital projects and platforms.
- Mentor students in software development best practices.
- Collaborate with the Director of Software II on all technical programmes.

Key contributions
- NACOS Website: Led the design and development of the official NACOS MOUAU 2025/2026 website, creating a polished digital presence for the association''s executives and events.
- Tech Workshops: Organised and facilitated hands-on software development workshops, helping students build practical skills beyond the classroom curriculum.
- Tech Summit: Played a key technical and organisational role in the 2026 NACOS Tech Summit, ensuring the event showcased the best of student technical ability.
- 2025/2026 NACOS EXECUTIVES: Shaping the university''s digital future through strong technical leadership and governance.
- Resources: Privacy Policy Terms of Service Faculty Portal'),
('seed-exec-07','seed-admin-2025-2026','seed-pos-07',NULL,'Udoka Emmanuel Chijindu','Udoka Emmanuel Chijindu is a Computer Science student at Michael Okpara University of Agriculture, Umudike, with a strong interest in software development and student-led technical initiatives.

As Director of Software II, he assists the Director of Software I in coordinating and supervising all software-related activities, projects, and events within NACOS MOUAU.','uploads/seed/executives/exec-06.webp','As the Director of Software II, I assist in coordinating software activities and technical programmes. My responsibilities include:
- Assist the Director of Software I in all software initiatives.
- Support planning and execution of coding workshops and tech events.
- Contribute to NACOS digital projects and online platforms.
- Provide technical support during association events.

Key contributions
- Workshop Delivery: Co-facilitated multiple software workshops that gave students exposure to practical development tools and modern programming frameworks.
- Technical Support: Provided on-ground technical support at major NACOS events, ensuring all digital and software components ran smoothly.
- Project Collaboration: Contributed to the development of NACOS digital assets including the association website and internal management tools.
- 2025/2026 NACOS EXECUTIVES: Shaping the university''s digital future through strong technical leadership and governance.
- Resources: Privacy Policy Terms of Service Faculty Portal');
INSERT OR REPLACE INTO executive_assignments(id,administration_id,position_id,user_id,full_name,bio,image_key,responsibilities) VALUES
('seed-exec-08','seed-admin-2025-2026','seed-pos-08',NULL,'Osueke Chibuike Isaac','I''m a Graduate of Computer Science at Michael Okpara University of Agriculture, Umudike,, known for his outgoing personality and ability to bring people together. I am passionate about student life and building a vibrant, connected NACOS community.

As Director of Socials, I take charge of all social activities and events, ensuring NACOS MOUAU remains a lively, engaged, and well-connected association.','uploads/seed/executives/exec-07.webp','As the Director of Socials, I oversee all social activities and events for NACOS MOUAU. My responsibilities include:
- Plan and execute all NACOS social events and hangouts.
- Build community and foster relationships among members.
- Coordinate social media presence and online community engagement.
- Organise recreational activities that boost member morale.

Key contributions
- Induction Ceremony: Coordinated the social and celebratory aspects of the 2026 Induction Ceremony, creating a warm and memorable welcome for new NACOS members.
- Award Night: Played a central role in organising the NACOS Award Night, ensuring the event was a joyful celebration of excellence and community.
- Community Building: Consistently drove social engagement efforts that strengthened bonds between NACOS members across different levels and departments.
- 2025/2026 NACOS EXECUTIVES: Shaping the university''s digital future through strong technical leadership and governance.
- Resources: Privacy Policy Terms of Service Faculty Portal'),
('seed-exec-09','seed-admin-2025-2026','seed-pos-09',NULL,'Godson Miracle Ogemdi','Godson Miracle Ogemdi is a Computer Science student at Michael Okpara University of Agriculture, Umudike, with a compassionate disposition and a deep commitment to student wellbeing.

As Director of Welfare, he is responsible for overseeing the welfare of all NACOS members, coordinating refreshments at events, and ensuring every student feels valued and supported by the association.','uploads/seed/executives/exec-08.webp','As the Director of Welfare, I oversee the wellbeing of NACOS MOUAU members. My responsibilities include:
- Attend to the welfare needs of NACOS members.
- Coordinate refreshments and catering at association events.
- Identify and address student welfare concerns to the executive.
- Ensure all members feel included and supported.

Key contributions
- Member Welfare: Championed initiatives to ensure the physical and emotional wellbeing of NACOS members was prioritised throughout the executive''s tenure.
- Event Refreshments: Consistently coordinated catering and refreshments for all major NACOS events, ensuring a comfortable and enjoyable experience for attendees.
- Student Support: Served as a point of contact for members facing challenges, connecting them with appropriate resources and executive support.
- 2025/2026 NACOS EXECUTIVES: Shaping the university''s digital future through strong technical leadership and governance.
- Resources: Privacy Policy Terms of Service Faculty Portal'),
('seed-exec-10','seed-admin-2025-2026','seed-pos-10',NULL,'Sabastine Evans Oluebube','Sabastine Evans Oluebube is a Computer Science student at Michael Okpara University of Agriculture, Umudike, with a passion for sports and an energetic approach to student engagement.

As Director of Sports, he organises sports activities and inter-departmental competitions, promoting physical fitness, healthy competition, and team spirit among NACOS members.','uploads/seed/executives/exec-09.webp','As the Director of Sports, I organise and oversee all sports activities for NACOS MOUAU. My responsibilities include:
- Plan and organise sports events and inter-departmental competitions.
- Coordinate NACOS participation in university sports programmes.
- Promote physical fitness and healthy lifestyle among members.
- Manage sports equipment and facilities used by the association.

Key contributions
- Sports Events: Organised competitive and recreational sports activities that brought NACOS members together and promoted team spirit across all levels.
- Inter-Departmental Competitions: Led NACOS MOUAU''s participation in university inter-departmental sports competitions, representing the association with pride.
- Fitness Promotion: Championed a culture of physical wellness among members, organising regular sporting activities beyond formal competitions.
- 2025/2026 NACOS EXECUTIVES: Shaping the university''s digital future through strong technical leadership and governance.
- Resources: Privacy Policy Terms of Service Faculty Portal'),
('seed-exec-11','seed-admin-2025-2026','seed-pos-11',NULL,'Kalu Moses','Kalu Moses is a Computer Science student at Michael Okpara University of Agriculture, Umudike, with a love for knowledge management and academic resources. He is methodical, detail-oriented, and passionate about supporting student academic success.

As Librarian, he manages the association''s library resources, supports academic research, and ensures NACOS members have access to the materials they need to excel academically.','uploads/seed/executives/exec-10.webp','As the NACOS Librarian, I manage the association''s library and academic resources. My responsibilities include:
- Maintain and expand the NACOS library collection.
- Assist members in accessing academic materials and research resources.
- Organise and catalogue library assets for easy access.
- Promote a reading culture and academic excellence among members.

Key contributions
- Library Organisation: Conducted a full cataloguing exercise of the NACOS library, making it easier for members to find and borrow academic resources.
- Academic Support: Provided research assistance and resource guidance to members during exam periods, contributing to improved academic performance.
- Resource Expansion: Worked to grow the NACOS library collection with relevant Computer Science materials, textbooks, and reference resources.
- 2025/2026 NACOS EXECUTIVES: Shaping the university''s digital future through strong technical leadership and governance.
- Resources: Privacy Policy Terms of Service Faculty Portal');
INSERT OR REPLACE INTO executive_assignments(id,administration_id,position_id,user_id,full_name,bio,image_key,responsibilities) VALUES
('seed-exec-12','seed-admin-2025-2026','seed-pos-12',NULL,'Onuoha Isaac','Onuoha Isaac is a Computer Science student at Michael Okpara University of Agriculture, Umudike, with a talent for communication and a keen sense of how to present the association to the wider world.

As Public Relations Officer I, he manages the association''s public image, coordinates official communications, and ensures NACOS MOUAU is well-represented both within the university and externally.','uploads/seed/executives/exec-11.webp','As PRO I, I manage the public image and communications of NACOS MOUAU. My responsibilities include:
- Manage the association''s public image and branding.
- Draft and release official statements and press communications.
- Coordinate media coverage for NACOS events.
- Maintain relationships with university media channels and external partners.

Key contributions
- Public Communications: Managed all official NACOS public communications throughout the session, ensuring the association always projected a professional and credible image.
- Event Coverage: Coordinated media coverage for major NACOS events including the Tech Summit, Induction Ceremony, and Award Night.
- Brand Management: Worked to strengthen the NACOS MOUAU brand identity, ensuring consistent messaging and visual identity across all public-facing materials.
- 2025/2026 NACOS EXECUTIVES: Shaping the university''s digital future through strong technical leadership and governance.
- Resources: Privacy Policy Terms of Service Faculty Portal'),
('seed-exec-13','seed-admin-2025-2026','seed-pos-13',NULL,'Ikpeazu Precious Ifunanya','Ikpeazu Precious Ifunanya is a Computer Science student at Michael Okpara University of Agriculture, Umudike. She is articulate, proactive, and dedicated to ensuring the right information reaches the right people at the right time.

As Public Relations Officer II, she assists in information dissemination, ensures awareness of NACOS activities and opportunities, and supports the overall communications strategy of the association.','uploads/seed/executives/exec-12.webp','As PRO II, I assist in delivering information and ensuring proper awareness across NACOS MOUAU. My responsibilities include:
- Assist PRO I in all public communications and media activities.
- Ensure timely dissemination of information to members.
- Create awareness content for NACOS events and programmes.
- Manage the association''s social media and digital presence.

Key contributions
- Information Dissemination: Ensured that members were consistently informed and updated about NACOS activities, deadlines, and opportunities in a timely manner.
- Social Media: Managed and grew the association''s social media platforms, increasing engagement and visibility among students and stakeholders.
- Event Publicity: Created awareness campaigns for major NACOS events that drove strong attendance and participation from across the student body.
- 2025/2026 NACOS EXECUTIVES: Shaping the university''s digital future through strong technical leadership and governance.
- Resources: Privacy Policy Terms of Service Faculty Portal');
INSERT OR REPLACE INTO executive_positions(id,name,description,display_order) VALUES
('seed-adv-pos-0','Dean, COLPAS',NULL,100),
('seed-adv-pos-1','Staff Adviser, COLPAS',NULL,101),
('seed-adv-pos-2','Head of Department, Computer Science',NULL,102),
('seed-adv-pos-3','Patron',NULL,103),
('seed-adv-pos-4','Matron',NULL,104);
INSERT OR REPLACE INTO executive_assignments(id,administration_id,position_id,user_id,full_name,bio,image_key,responsibilities) VALUES
('seed-adv-0','seed-admin-advisers','seed-adv-pos-0',NULL,'Prof. I.E. Otuokere',NULL,'uploads/seed/administration/admin-01.webp',NULL),
('seed-adv-1','seed-admin-advisers','seed-adv-pos-1',NULL,'Comr. Uchendu Kingsely',NULL,'uploads/seed/administration/admin-02.webp',NULL),
('seed-adv-2','seed-admin-advisers','seed-adv-pos-2',NULL,'Dr. Samuel Ugboaja',NULL,'uploads/seed/administration/admin-03.webp',NULL),
('seed-adv-3','seed-admin-advisers','seed-adv-pos-3',NULL,'Dr. Samuel Osodeke',NULL,'uploads/seed/administration/admin-04.webp',NULL),
('seed-adv-4','seed-admin-advisers','seed-adv-pos-4',NULL,'Mrs. Prisca Okochi (Ph.D)',NULL,'uploads/seed/administration/admin-05.webp',NULL);

INSERT INTO events(id,title,slug,description,image_key,starts_at,ends_at,venue,price_minor,currency,capacity,registration_open,summary,stats_text) VALUES('seed-ev-inauguration','Inauguration Ceremony 2025','inauguration','The Inauguration Ceremony marked the formal swearing-in of the 2025/2026 NACOS MOUAU executive team, led by Comr. Ario Benelizer Nwachukwu as President-Elect. Held at the Old Colpas Hall on Wednesday 26th November 2025 starting at 12 Noon, the event ushered in a new era of leadership committed to technological excellence, student welfare, and innovation at Michael Okpara University of Agriculture, Umudike.','uploads/seed/covers/inauguration.webp','2025-11-26T12:00',NULL,'Old Colpas Hall',0,'NGN',NULL,0,'The official inauguration of the 2025/2026 NACOS MOUAU executive team, a landmark moment marking the beginning of a new chapter in student-led tech governance.','2025 | Session Start
26 | November
1 | Historic Day
100% | New Start') ON CONFLICT(slug) DO UPDATE SET title=excluded.title,description=excluded.description,image_key=excluded.image_key,starts_at=excluded.starts_at,ends_at=excluded.ends_at,venue=excluded.venue,registration_open=0,summary=excluded.summary,stats_text=excluded.stats_text,updated_at=datetime('now');
INSERT INTO events(id,title,slug,description,image_key,starts_at,ends_at,venue,price_minor,currency,capacity,registration_open,summary,stats_text) VALUES('seed-ev-nacos-tutorial','NACOS Free Tutorial 2026','nacos-tutorial','Free Tutorial for All Nacosites 100L to 400L
The 2025/2026 NACOS MOUAU executives organised a comprehensive free tutorial programme for all Nacosite students across every level, held at New Colpas Hall from 15th to 17th January 2026.
In partnership with Hypers & Elites Tutorial, the programme covered MTH 112, CHM 113, PHY 112, MTH 211, STAT 212, CSC 218, CSC 318, CSC 314, CSC 316, CSC 418, CSC 414 and CSC 411 — with gifts including cash giveaways, calculators, and past questions for participants.
Coordinated by NACOS President Comr. Ario Benelizer Nwachukwu alongside Sec-Gen Comr. Ndukwe Okechi Peter and Librarian Comr. Kalu Moses Uchechukwu.','uploads/seed/covers/nacos-tutorial.webp','2026-01-15T16:00','2026-01-17T18:00','New Colpas Hall',0,'NGN',NULL,0,'A free academic tutorial for all Nacosite students from 100L to 400L covering key courses across all levels, in partnership with Hypers & Elites Tutorial.','4 | Levels Covered
3 | Days
Free | For All Nacosites
100% | Student Welfare') ON CONFLICT(slug) DO UPDATE SET title=excluded.title,description=excluded.description,image_key=excluded.image_key,starts_at=excluded.starts_at,ends_at=excluded.ends_at,venue=excluded.venue,registration_open=0,summary=excluded.summary,stats_text=excluded.stats_text,updated_at=datetime('now');
INSERT INTO events(id,title,slug,description,image_key,starts_at,ends_at,venue,price_minor,currency,capacity,registration_open,summary,stats_text) VALUES('seed-ev-tech-summit','Nacos Tech Summit 2026','tech-summit','The NACOS Tech Summit 2026 brought together software engineers, designers, entrepreneurs, and computer science students for a full day of talks, panels, and hands-on workshops. Industry experts from Cowrywise, Google Developer Groups, and Danify International, alongside MOUAU faculty, inspired the next generation of tech professionals. The event, a flagship achievement of the 2025/2026 executive tenure, was graced by the Head of Department, Dr. Samuel Ugboaja (Ph.D), the Matron, Mrs. Prisca Okochi, and the Patron, Dr. Charles Osodeke and some amazing speakers .','uploads/seed/covers/tech-summit.webp','2026-03-28',NULL,'New Colpas Hall',0,'NGN',NULL,0,'Connecting industry leaders and students to share ideas, advance technical excellence, and inspire the next generation of technology professionals.','400+ | Attendees
7 | Speakers
2 | Workshops
5 | Panelist') ON CONFLICT(slug) DO UPDATE SET title=excluded.title,description=excluded.description,image_key=excluded.image_key,starts_at=excluded.starts_at,ends_at=excluded.ends_at,venue=excluded.venue,registration_open=0,summary=excluded.summary,stats_text=excluded.stats_text,updated_at=datetime('now');
INSERT INTO events(id,title,slug,description,image_key,starts_at,ends_at,venue,price_minor,currency,capacity,registration_open,summary,stats_text) VALUES('seed-ev-induction','Induction Ceremony 2026','induction','The 2026 Induction Ceremony officially welcomed a new cohort of computer science students into the NACOS MOUAU family. The event featured four keynote addresses from senior executives, certificate presentations, and a special discussion where Executive leaders shared wisdom with incoming members. A full house of 300+ attendees made it a landmark moment for the association.','uploads/seed/covers/induction.webp','2026-04-10',NULL,'New Colpas Hall',0,'NGN',NULL,0,'Welcoming new members into the NACOS MOUAU community with purpose, pride, and a celebration of the spirit of computing.','300+ | Inductees
4 | Keynote Talks
1 | Day Event
100% | Full House') ON CONFLICT(slug) DO UPDATE SET title=excluded.title,description=excluded.description,image_key=excluded.image_key,starts_at=excluded.starts_at,ends_at=excluded.ends_at,venue=excluded.venue,registration_open=0,summary=excluded.summary,stats_text=excluded.stats_text,updated_at=datetime('now');
INSERT INTO events(id,title,slug,description,image_key,starts_at,ends_at,venue,price_minor,currency,capacity,registration_open,summary,stats_text) VALUES('seed-ev-award-night','Award Night 2026','award-night','The NACOS Award Night 2026 was an elegant evening dedicated to recognising the exceptional contributions of members, executives, and faculty supporters throughout the academic year. Awards were presented across five categories including academic excellence, leadership, innovation, community service, and sportsmanship.','uploads/seed/covers/award-night.webp','2026-04-20',NULL,'MOUAU Conference Centre',0,'NGN',NULL,0,'A glamorous evening celebrating excellence, recognising outstanding contributions, and honouring members who embodied the NACOS spirit.','400+ | Guests
20 | Awards Given
5 | Categories
1 | Memorable Night') ON CONFLICT(slug) DO UPDATE SET title=excluded.title,description=excluded.description,image_key=excluded.image_key,starts_at=excluded.starts_at,ends_at=excluded.ends_at,venue=excluded.venue,registration_open=0,summary=excluded.summary,stats_text=excluded.stats_text,updated_at=datetime('now');
INSERT INTO events(id,title,slug,description,image_key,starts_at,ends_at,venue,price_minor,currency,capacity,registration_open,summary,stats_text) VALUES('seed-ev-uyo-outreach','Nacos General Conference 2026','uyo-outreach','A national gathering of tech students focused on Innovation and Digital Transformation, driving learning, collaboration, and ideas for the future of technology. Q&A session with fellow nacossites.','uploads/seed/covers/uyo-outreach.webp','2026-04-28','2026-04-29','Uyo, Akwa Ibom State',0,'NGN',NULL,0,'Connecting with NACOS top executives and fellow nacossites in the university community to inspire the next generation of computer science innovators.','500+ | Students Reached
1 | School Visited
2 | Days
2 | Volunteers') ON CONFLICT(slug) DO UPDATE SET title=excluded.title,description=excluded.description,image_key=excluded.image_key,starts_at=excluded.starts_at,ends_at=excluded.ends_at,venue=excluded.venue,registration_open=0,summary=excluded.summary,stats_text=excluded.stats_text,updated_at=datetime('now');
INSERT INTO events(id,title,slug,description,image_key,starts_at,ends_at,venue,price_minor,currency,capacity,registration_open,summary,stats_text) VALUES('seed-ev-nacos-travail','NACOS Travail 2026','nacos-travail','NACOS Travail was a powerful night of worship and intercession organised by the NACOS Director of Socials (Social Oluwa) in collaboration with Umuahia Gospel Hub. The event featured intense worship and prayers for all Nacosite students from 100L to 400L, with guest minister Pst. Manny Ohuche leading the congregation. NACOS President Comr. Ario Benelizer Nwachukwu and DOS Chibuike Isaac Osueke (Oluwa Diamond) anchored the programme at New Colpas Hall on 12th June 2026.','uploads/seed/covers/nacos-travail.webp','2026-06-12T16:00',NULL,'New Colpas Hall',0,'NGN',NULL,0,'An intense evening of worship, prayers and spiritual empowerment for all NACOS students 100L to 400L, organised by the Director of Socials in collaboration with Umuahia Gospel Hub.','4 | Levels Present
2 | Videos
4 | Photos
1 | Powerful Night') ON CONFLICT(slug) DO UPDATE SET title=excluded.title,description=excluded.description,image_key=excluded.image_key,starts_at=excluded.starts_at,ends_at=excluded.ends_at,venue=excluded.venue,registration_open=0,summary=excluded.summary,stats_text=excluded.stats_text,updated_at=datetime('now');
INSERT OR REPLACE INTO event_speakers(id,event_id,name,role,image_key,display_order) VALUES
('seed-sp-inauguration-0',(SELECT id FROM events WHERE slug='inauguration'),'Comr. Ario Benelizer Nwachukwu','President-Elect, NACOS MOUAU',NULL,0),
('seed-sp-inauguration-1',(SELECT id FROM events WHERE slug='inauguration'),'Comr. Onuoha Isaac Chinaecherem','PRO 1 Elect, NACOS MOUAU',NULL,1),
('seed-sp-inauguration-2',(SELECT id FROM events WHERE slug='inauguration'),'NACOS MOUAU Executives','2025/2026 Full Executive Council',NULL,2),
('seed-sp-nacos-tutorial-0',(SELECT id FROM events WHERE slug='nacos-tutorial'),'Comr. Ario Benelizer Nwachukwu','NACOS President',NULL,0),
('seed-sp-nacos-tutorial-1',(SELECT id FROM events WHERE slug='nacos-tutorial'),'Comr. Ndukwe Okechi Peter','NACOS Secretary General',NULL,1),
('seed-sp-nacos-tutorial-2',(SELECT id FROM events WHERE slug='nacos-tutorial'),'Comr. Kalu Moses Uchechukwu','NACOS Librarian',NULL,2),
('seed-sp-tech-summit-0',(SELECT id FROM events WHERE slug='tech-summit'),'Dr. Samuel Ugboaja','Head of Department Computer Science',NULL,0),
('seed-sp-tech-summit-1',(SELECT id FROM events WHERE slug='tech-summit'),'Mrs. Prisca Okochi','Matron',NULL,1);
INSERT OR REPLACE INTO event_speakers(id,event_id,name,role,image_key,display_order) VALUES
('seed-sp-tech-summit-2',(SELECT id FROM events WHERE slug='tech-summit'),'Dr. Charles Osodeke','Patron',NULL,2),
('seed-sp-tech-summit-3',(SELECT id FROM events WHERE slug='tech-summit'),'Daniel Obiyo','AI Researcher & Data Scientist',NULL,3),
('seed-sp-tech-summit-4',(SELECT id FROM events WHERE slug='tech-summit'),'Kelechi Imo','Executive Director TRAJDEN',NULL,4),
('seed-sp-tech-summit-5',(SELECT id FROM events WHERE slug='tech-summit'),'Ogbonna Ohakwe','Digital Entrepreneur',NULL,5),
('seed-sp-induction-0',(SELECT id FROM events WHERE slug='induction'),'Dr. Samuel Ugboaja','Head of Department Computer Science',NULL,0),
('seed-sp-induction-1',(SELECT id FROM events WHERE slug='induction'),'Mrs. Okochi Prisca Ph.D','Matron',NULL,1),
('seed-sp-induction-2',(SELECT id FROM events WHERE slug='induction'),'Umeh Christiana Onyinyechi','Vice President',NULL,2),
('seed-sp-award-night-0',(SELECT id FROM events WHERE slug='award-night'),'Hon Comr. Nwogu Bright Addison','SUG President',NULL,0);
INSERT OR REPLACE INTO event_speakers(id,event_id,name,role,image_key,display_order) VALUES
('seed-sp-award-night-1',(SELECT id FROM events WHERE slug='award-night'),'Comr. Arior Benelizer Nwachukwu','NACOS MOUAU President',NULL,1),
('seed-sp-award-night-2',(SELECT id FROM events WHERE slug='award-night'),'Comr. Innocent Emmanuel','SUG Director Of Socials',NULL,2),
('seed-sp-uyo-outreach-0',(SELECT id FROM events WHERE slug='uyo-outreach'),'Dr. Mustapha Abdullahi, PhD','Director-General/CEO of the Energy Commission of Nigeria',NULL,0),
('seed-sp-uyo-outreach-1',(SELECT id FROM events WHERE slug='uyo-outreach'),'Dr. Femi Adeluyi','Head of Partnership Development at the National Information Technology Development Agency (NITDA)',NULL,1),
('seed-sp-nacos-travail-0',(SELECT id FROM events WHERE slug='nacos-travail'),'Pst. Manny Ohuche','Guest Minister',NULL,0),
('seed-sp-nacos-travail-1',(SELECT id FROM events WHERE slug='nacos-travail'),'Comr. Ario Benelizer Nwachukwu','NACOS President',NULL,1),
('seed-sp-nacos-travail-2',(SELECT id FROM events WHERE slug='nacos-travail'),'Chibuike Osueke Isaac','Director Of Socials',NULL,2);
INSERT OR REPLACE INTO event_media(id,event_id,kind,object_key,video_link,thumbnail_key,caption,duration,is_featured,display_order) VALUES
('seed-vd-inauguration-0',(SELECT id FROM events WHERE slug='inauguration'),'video',NULL,'https://anselm-web.github.io/NACOS-MOUAU-2025-2026/videos/inauguration.mp4','uploads/seed/thumbs/inauguration-thumb.webp','Inauguration Ceremony 2025 Highlights',NULL,1,100),
('seed-vd-nacos-tutorial-0',(SELECT id FROM events WHERE slug='nacos-tutorial'),'video',NULL,'https://anselm-web.github.io/NACOS-MOUAU-2025-2026/videos/nacos-tutorial.mp4','uploads/seed/thumbs/nacos-tutorial-thumb.webp','NACOS Free Tutorial 2026 Highlights',NULL,1,100),
('seed-ph-tech-summit-00',(SELECT id FROM events WHERE slug='tech-summit'),'photo','uploads/seed/gallery-tech-summit/01.webp',NULL,NULL,NULL,NULL,0,0),
('seed-ph-tech-summit-01',(SELECT id FROM events WHERE slug='tech-summit'),'photo','uploads/seed/gallery-tech-summit/02.webp',NULL,NULL,NULL,NULL,0,1),
('seed-ph-tech-summit-02',(SELECT id FROM events WHERE slug='tech-summit'),'photo','uploads/seed/gallery-tech-summit/03.webp',NULL,NULL,NULL,NULL,0,2),
('seed-ph-tech-summit-03',(SELECT id FROM events WHERE slug='tech-summit'),'photo','uploads/seed/gallery-tech-summit/04.webp',NULL,NULL,NULL,NULL,0,3),
('seed-ph-tech-summit-04',(SELECT id FROM events WHERE slug='tech-summit'),'photo','uploads/seed/gallery-tech-summit/05.webp',NULL,NULL,NULL,NULL,0,4),
('seed-ph-tech-summit-05',(SELECT id FROM events WHERE slug='tech-summit'),'photo','uploads/seed/gallery-tech-summit/06.webp',NULL,NULL,NULL,NULL,0,5);
INSERT OR REPLACE INTO event_media(id,event_id,kind,object_key,video_link,thumbnail_key,caption,duration,is_featured,display_order) VALUES
('seed-ph-tech-summit-06',(SELECT id FROM events WHERE slug='tech-summit'),'photo','uploads/seed/gallery-tech-summit/07.webp',NULL,NULL,NULL,NULL,0,6),
('seed-ph-tech-summit-07',(SELECT id FROM events WHERE slug='tech-summit'),'photo','uploads/seed/gallery-tech-summit/08.webp',NULL,NULL,NULL,NULL,0,7),
('seed-ph-tech-summit-08',(SELECT id FROM events WHERE slug='tech-summit'),'photo','uploads/seed/gallery-tech-summit/09.webp',NULL,NULL,NULL,NULL,0,8),
('seed-ph-tech-summit-09',(SELECT id FROM events WHERE slug='tech-summit'),'photo','uploads/seed/gallery-tech-summit/10.webp',NULL,NULL,NULL,NULL,0,9),
('seed-ph-tech-summit-10',(SELECT id FROM events WHERE slug='tech-summit'),'photo','uploads/seed/gallery-tech-summit/11.webp',NULL,NULL,NULL,NULL,0,10),
('seed-ph-tech-summit-11',(SELECT id FROM events WHERE slug='tech-summit'),'photo','uploads/seed/gallery-tech-summit/12.webp',NULL,NULL,NULL,NULL,0,11),
('seed-ph-tech-summit-12',(SELECT id FROM events WHERE slug='tech-summit'),'photo','uploads/seed/gallery-tech-summit/13.webp',NULL,NULL,NULL,NULL,0,12),
('seed-ph-tech-summit-13',(SELECT id FROM events WHERE slug='tech-summit'),'photo','uploads/seed/gallery-tech-summit/14.webp',NULL,NULL,NULL,NULL,0,13);
INSERT OR REPLACE INTO event_media(id,event_id,kind,object_key,video_link,thumbnail_key,caption,duration,is_featured,display_order) VALUES
('seed-ph-tech-summit-14',(SELECT id FROM events WHERE slug='tech-summit'),'photo','uploads/seed/gallery-tech-summit/15.webp',NULL,NULL,NULL,NULL,0,14),
('seed-ph-tech-summit-15',(SELECT id FROM events WHERE slug='tech-summit'),'photo','uploads/seed/gallery-tech-summit/16.webp',NULL,NULL,NULL,NULL,0,15),
('seed-ph-tech-summit-16',(SELECT id FROM events WHERE slug='tech-summit'),'photo','uploads/seed/gallery-tech-summit/17.webp',NULL,NULL,NULL,NULL,0,16),
('seed-ph-tech-summit-17',(SELECT id FROM events WHERE slug='tech-summit'),'photo','uploads/seed/gallery-tech-summit/18.webp',NULL,NULL,NULL,NULL,0,17),
('seed-ph-tech-summit-18',(SELECT id FROM events WHERE slug='tech-summit'),'photo','uploads/seed/gallery-tech-summit/19.webp',NULL,NULL,NULL,NULL,0,18),
('seed-ph-tech-summit-19',(SELECT id FROM events WHERE slug='tech-summit'),'photo','uploads/seed/gallery-tech-summit/20.webp',NULL,NULL,NULL,NULL,0,19),
('seed-ph-tech-summit-20',(SELECT id FROM events WHERE slug='tech-summit'),'photo','uploads/seed/gallery-tech-summit/21.webp',NULL,NULL,NULL,NULL,0,20),
('seed-ph-tech-summit-21',(SELECT id FROM events WHERE slug='tech-summit'),'photo','uploads/seed/gallery-tech-summit/22.webp',NULL,NULL,NULL,NULL,0,21);
INSERT OR REPLACE INTO event_media(id,event_id,kind,object_key,video_link,thumbnail_key,caption,duration,is_featured,display_order) VALUES
('seed-ph-tech-summit-22',(SELECT id FROM events WHERE slug='tech-summit'),'photo','uploads/seed/gallery-tech-summit/23.webp',NULL,NULL,NULL,NULL,0,22),
('seed-ph-tech-summit-23',(SELECT id FROM events WHERE slug='tech-summit'),'photo','uploads/seed/gallery-tech-summit/24.webp',NULL,NULL,NULL,NULL,0,23),
('seed-ph-tech-summit-24',(SELECT id FROM events WHERE slug='tech-summit'),'photo','uploads/seed/gallery-tech-summit/25.webp',NULL,NULL,NULL,NULL,0,24),
('seed-ph-tech-summit-25',(SELECT id FROM events WHERE slug='tech-summit'),'photo','uploads/seed/gallery-tech-summit/26.webp',NULL,NULL,NULL,NULL,0,25),
('seed-ph-tech-summit-26',(SELECT id FROM events WHERE slug='tech-summit'),'photo','uploads/seed/gallery-tech-summit/27.webp',NULL,NULL,NULL,NULL,0,26),
('seed-ph-tech-summit-27',(SELECT id FROM events WHERE slug='tech-summit'),'photo','uploads/seed/gallery-tech-summit/28.webp',NULL,NULL,NULL,NULL,0,27),
('seed-ph-tech-summit-28',(SELECT id FROM events WHERE slug='tech-summit'),'photo','uploads/seed/gallery-tech-summit/29.webp',NULL,NULL,NULL,NULL,0,28),
('seed-vd-tech-summit-0',(SELECT id FROM events WHERE slug='tech-summit'),'video',NULL,'https://anselm-web.github.io/NACOS-MOUAU-2025-2026/videos/v1.mp4','uploads/seed/thumbs/thumb-v1.webp','Tech Summit Clip 1','0:45',0,100);
INSERT OR REPLACE INTO event_media(id,event_id,kind,object_key,video_link,thumbnail_key,caption,duration,is_featured,display_order) VALUES
('seed-vd-tech-summit-1',(SELECT id FROM events WHERE slug='tech-summit'),'video',NULL,'https://anselm-web.github.io/NACOS-MOUAU-2025-2026/videos/v2.mp4','uploads/seed/thumbs/thumb-v2.webp','Tech Summit Clip 2','0:54',0,101),
('seed-vd-tech-summit-2',(SELECT id FROM events WHERE slug='tech-summit'),'video',NULL,'https://anselm-web.github.io/NACOS-MOUAU-2025-2026/videos/v3.mp4','uploads/seed/thumbs/thumb-v3.webp','Tech Summit Clip 3','0:50',0,102),
('seed-vd-tech-summit-3',(SELECT id FROM events WHERE slug='tech-summit'),'video',NULL,'https://anselm-web.github.io/NACOS-MOUAU-2025-2026/videos/v4.mp4','uploads/seed/thumbs/thumb-v4.webp','Tech Summit Clip 4','0:29',0,103),
('seed-vd-tech-summit-4',(SELECT id FROM events WHERE slug='tech-summit'),'video',NULL,'https://anselm-web.github.io/NACOS-MOUAU-2025-2026/videos/tech-summit-extra.mp4','uploads/seed/thumbs/tech-summit-extra-thumb.webp','Tech Summit Clip 5','0:31',0,104),
('seed-vd-tech-summit-5',(SELECT id FROM events WHERE slug='tech-summit'),'video',NULL,'https://anselm-web.github.io/NACOS-MOUAU-2025-2026/videos/tech-summit-featured.mp4','uploads/seed/thumbs/tech-summit-featured-thumb.webp','Tech Summit 2026 — Full Event Highlight',NULL,1,105),
('seed-ph-induction-00',(SELECT id FROM events WHERE slug='induction'),'photo','uploads/seed/gallery-induction/01.webp',NULL,NULL,NULL,NULL,0,0),
('seed-ph-induction-01',(SELECT id FROM events WHERE slug='induction'),'photo','uploads/seed/gallery-induction/02.webp',NULL,NULL,NULL,NULL,0,1),
('seed-ph-induction-02',(SELECT id FROM events WHERE slug='induction'),'photo','uploads/seed/gallery-induction/03.webp',NULL,NULL,NULL,NULL,0,2);
INSERT OR REPLACE INTO event_media(id,event_id,kind,object_key,video_link,thumbnail_key,caption,duration,is_featured,display_order) VALUES
('seed-ph-induction-03',(SELECT id FROM events WHERE slug='induction'),'photo','uploads/seed/gallery-induction/04.webp',NULL,NULL,NULL,NULL,0,3),
('seed-ph-induction-04',(SELECT id FROM events WHERE slug='induction'),'photo','uploads/seed/gallery-induction/05.webp',NULL,NULL,NULL,NULL,0,4),
('seed-ph-induction-05',(SELECT id FROM events WHERE slug='induction'),'photo','uploads/seed/gallery-induction/06.webp',NULL,NULL,NULL,NULL,0,5),
('seed-ph-induction-06',(SELECT id FROM events WHERE slug='induction'),'photo','uploads/seed/gallery-induction/07.webp',NULL,NULL,NULL,NULL,0,6),
('seed-ph-induction-07',(SELECT id FROM events WHERE slug='induction'),'photo','uploads/seed/gallery-induction/08.webp',NULL,NULL,NULL,NULL,0,7),
('seed-ph-induction-08',(SELECT id FROM events WHERE slug='induction'),'photo','uploads/seed/gallery-induction/09.webp',NULL,NULL,NULL,NULL,0,8),
('seed-ph-induction-09',(SELECT id FROM events WHERE slug='induction'),'photo','uploads/seed/gallery-induction/10.webp',NULL,NULL,NULL,NULL,0,9),
('seed-ph-induction-10',(SELECT id FROM events WHERE slug='induction'),'photo','uploads/seed/gallery-induction/11.webp',NULL,NULL,NULL,NULL,0,10);
INSERT OR REPLACE INTO event_media(id,event_id,kind,object_key,video_link,thumbnail_key,caption,duration,is_featured,display_order) VALUES
('seed-ph-induction-11',(SELECT id FROM events WHERE slug='induction'),'photo','uploads/seed/gallery-induction/12.webp',NULL,NULL,NULL,NULL,0,11),
('seed-ph-induction-12',(SELECT id FROM events WHERE slug='induction'),'photo','uploads/seed/gallery-induction/13.webp',NULL,NULL,NULL,NULL,0,12),
('seed-ph-induction-13',(SELECT id FROM events WHERE slug='induction'),'photo','uploads/seed/gallery-induction/14.webp',NULL,NULL,NULL,NULL,0,13),
('seed-ph-induction-14',(SELECT id FROM events WHERE slug='induction'),'photo','uploads/seed/gallery-induction/15.webp',NULL,NULL,NULL,NULL,0,14),
('seed-ph-induction-15',(SELECT id FROM events WHERE slug='induction'),'photo','uploads/seed/gallery-induction/16.webp',NULL,NULL,NULL,NULL,0,15),
('seed-vd-induction-0',(SELECT id FROM events WHERE slug='induction'),'video',NULL,'https://anselm-web.github.io/NACOS-MOUAU-2025-2026/videos/induction.mp4','uploads/seed/thumbs/induction-thumb.webp','Induction Ceremony 2026 Highlights',NULL,1,100),
('seed-ph-award-night-00',(SELECT id FROM events WHERE slug='award-night'),'photo','uploads/seed/gallery-award-night/01.webp',NULL,NULL,NULL,NULL,0,0),
('seed-ph-award-night-01',(SELECT id FROM events WHERE slug='award-night'),'photo','uploads/seed/gallery-award-night/02.webp',NULL,NULL,NULL,NULL,0,1);
INSERT OR REPLACE INTO event_media(id,event_id,kind,object_key,video_link,thumbnail_key,caption,duration,is_featured,display_order) VALUES
('seed-ph-award-night-02',(SELECT id FROM events WHERE slug='award-night'),'photo','uploads/seed/gallery-award-night/03.webp',NULL,NULL,NULL,NULL,0,2),
('seed-ph-award-night-03',(SELECT id FROM events WHERE slug='award-night'),'photo','uploads/seed/gallery-award-night/04.webp',NULL,NULL,NULL,NULL,0,3),
('seed-ph-award-night-04',(SELECT id FROM events WHERE slug='award-night'),'photo','uploads/seed/gallery-award-night/05.webp',NULL,NULL,NULL,NULL,0,4),
('seed-ph-award-night-05',(SELECT id FROM events WHERE slug='award-night'),'photo','uploads/seed/gallery-award-night/06.webp',NULL,NULL,NULL,NULL,0,5),
('seed-ph-uyo-outreach-00',(SELECT id FROM events WHERE slug='uyo-outreach'),'photo','uploads/seed/gallery-uyo-outreach/01.webp',NULL,NULL,NULL,NULL,0,0),
('seed-ph-uyo-outreach-01',(SELECT id FROM events WHERE slug='uyo-outreach'),'photo','uploads/seed/gallery-uyo-outreach/02.webp',NULL,NULL,NULL,NULL,0,1),
('seed-ph-uyo-outreach-02',(SELECT id FROM events WHERE slug='uyo-outreach'),'photo','uploads/seed/gallery-uyo-outreach/03.webp',NULL,NULL,NULL,NULL,0,2),
('seed-ph-uyo-outreach-03',(SELECT id FROM events WHERE slug='uyo-outreach'),'photo','uploads/seed/gallery-uyo-outreach/04.webp',NULL,NULL,NULL,NULL,0,3);
INSERT OR REPLACE INTO event_media(id,event_id,kind,object_key,video_link,thumbnail_key,caption,duration,is_featured,display_order) VALUES
('seed-ph-uyo-outreach-04',(SELECT id FROM events WHERE slug='uyo-outreach'),'photo','uploads/seed/gallery-uyo-outreach/05.webp',NULL,NULL,NULL,NULL,0,4),
('seed-ph-uyo-outreach-05',(SELECT id FROM events WHERE slug='uyo-outreach'),'photo','uploads/seed/gallery-uyo-outreach/06.webp',NULL,NULL,NULL,NULL,0,5),
('seed-vd-uyo-outreach-0',(SELECT id FROM events WHERE slug='uyo-outreach'),'video',NULL,'https://anselm-web.github.io/NACOS-MOUAU-2025-2026/videos/uyo-outreach.mp4','uploads/seed/thumbs/uyo-outreach-thumb.webp','Nacos General Conference 2026 — Highlights',NULL,0,100),
('seed-ph-nacos-travail-00',(SELECT id FROM events WHERE slug='nacos-travail'),'photo','uploads/seed/gallery-nacos-travail/01.webp',NULL,NULL,NULL,NULL,0,0),
('seed-ph-nacos-travail-01',(SELECT id FROM events WHERE slug='nacos-travail'),'photo','uploads/seed/gallery-nacos-travail/02.webp',NULL,NULL,NULL,NULL,0,1),
('seed-ph-nacos-travail-02',(SELECT id FROM events WHERE slug='nacos-travail'),'photo','uploads/seed/gallery-nacos-travail/03.webp',NULL,NULL,NULL,NULL,0,2),
('seed-ph-nacos-travail-03',(SELECT id FROM events WHERE slug='nacos-travail'),'photo','uploads/seed/gallery-nacos-travail/04.webp',NULL,NULL,NULL,NULL,0,3),
('seed-vd-nacos-travail-0',(SELECT id FROM events WHERE slug='nacos-travail'),'video',NULL,'https://anselm-web.github.io/NACOS-MOUAU-2025-2026/videos/nacos-travail-1.mp4','uploads/seed/thumbs/nacos-travail-1-thumb.webp','NACOS Travail — Worship Session',NULL,0,100);
INSERT OR REPLACE INTO event_media(id,event_id,kind,object_key,video_link,thumbnail_key,caption,duration,is_featured,display_order) VALUES
('seed-vd-nacos-travail-1',(SELECT id FROM events WHERE slug='nacos-travail'),'video',NULL,'https://anselm-web.github.io/NACOS-MOUAU-2025-2026/videos/nacos-travail-2.mp4','uploads/seed/thumbs/nacos-travail-2-thumb.webp','NACOS Travail — Prayer Moments',NULL,0,101);
INSERT OR REPLACE INTO achievements(id,title,description,achieved_at,image_key) VALUES
('seed-ach-inauguration','Inauguration Ceremony 2025','The official swearing-in of the 2025/2026 NACOS MOUAU executive team marking the bold beginning of a new chapter in student-led tech governance at MOUAU. 2025/2026 Session. New Leadership.','2025-11-26','uploads/seed/covers/inauguration.webp'),
('seed-ach-nacos-tutorial','NACOS Free Tutorial 2026','A free academic tutorial for all Nacosite students from 100L to 400L, covering key courses across every level in partnership with Hypers & Elites Tutorial. Free for all. 4 levels. 3 days.','2026-01-15','uploads/seed/covers/nacos-tutorial.webp'),
('seed-ach-tech-summit','NACOS-MOUAU Tech Summit 2026','Connecting industry leaders and students to share ideas and advance technical excellence. The flagship event of the 2025/2026 tenure with 400+ attendees and 5 amazing speakers. 2 workshops.','2026-03-28','uploads/seed/covers/tech-summit.webp'),
('seed-ach-induction','Induction Ceremony 2026','Welcoming new members into the NACOS community with purpose and pride featuring keynote addresses, certificate presentations, and a mentorship panel. 200+ members. 5 keynotes.','2026-04-10','uploads/seed/covers/induction.webp');
INSERT OR REPLACE INTO achievements(id,title,description,achieved_at,image_key) VALUES
('seed-ach-award-night','Award Night 2026','A glamorous evening celebrating excellence, recognising 20+ outstanding contributions across five categories including academics, leadership, and innovation. 300+ guests.','2026-04-20','uploads/seed/covers/award-night.webp'),
('seed-ach-uyo-outreach','2026 NACOS National Convention','A national gathering of tech students focused on Innovation and Digital Transformation, driving learning, collaboration, and ideas for the future of technology. 500+ students. 5+ schools. 3 days.','2026-04-28','uploads/seed/covers/uyo-outreach.webp'),
('seed-ach-nacos-travail','NACOS Travail 2026','An intense night of worship, prayers and spiritual empowerment for all NACOS students from 100L to 400L, organised by the Director of Socials in collaboration with Umuahia Gospel Hub. 4 photos. 2 videos.','2026-06-12','uploads/seed/covers/nacos-travail.webp');
INSERT OR REPLACE INTO gallery_albums(id,title,description,cover_key,is_public) VALUES
('seed-album-tech-summit','Tech Summit 2026 Gallery','All 29 captured moments from a day of innovation, inspiration, and community at the NACOS Tech Summit 2026.','uploads/seed/gallery-tech-summit/01.webp',1),
('seed-album-induction','Induction Ceremony 2026 Gallery','Moments from the 2026 Induction Ceremony at New Colpas Hall.','uploads/seed/gallery-induction/01.webp',1),
('seed-album-award-night','Award Night 2026 Gallery','Photos from the NACOS Award Night 2026.','uploads/seed/gallery-award-night/01.webp',1),
('seed-album-uyo-outreach','Nacos General Conference 2026 Gallery','All 6 captured moments from the national gathering of tech students in Uyo, Akwa Ibom State.','uploads/seed/gallery-uyo-outreach/01.webp',1),
('seed-album-nacos-travail','NACOS Travail 2026 Gallery','All captured moments from a powerful night of worship, prayer, and spiritual empowerment for NACOS MOUAU students.','uploads/seed/gallery-nacos-travail/01.webp',1);
INSERT OR REPLACE INTO gallery_media(id,album_id,object_key,caption,display_order) VALUES
('seed-gm-tech-summit-00','seed-album-tech-summit','uploads/seed/gallery-tech-summit/01.webp',NULL,0),
('seed-gm-tech-summit-01','seed-album-tech-summit','uploads/seed/gallery-tech-summit/02.webp',NULL,1),
('seed-gm-tech-summit-02','seed-album-tech-summit','uploads/seed/gallery-tech-summit/03.webp',NULL,2),
('seed-gm-tech-summit-03','seed-album-tech-summit','uploads/seed/gallery-tech-summit/04.webp',NULL,3),
('seed-gm-tech-summit-04','seed-album-tech-summit','uploads/seed/gallery-tech-summit/05.webp',NULL,4),
('seed-gm-tech-summit-05','seed-album-tech-summit','uploads/seed/gallery-tech-summit/06.webp',NULL,5),
('seed-gm-tech-summit-06','seed-album-tech-summit','uploads/seed/gallery-tech-summit/07.webp',NULL,6),
('seed-gm-tech-summit-07','seed-album-tech-summit','uploads/seed/gallery-tech-summit/08.webp',NULL,7),
('seed-gm-tech-summit-08','seed-album-tech-summit','uploads/seed/gallery-tech-summit/09.webp',NULL,8),
('seed-gm-tech-summit-09','seed-album-tech-summit','uploads/seed/gallery-tech-summit/10.webp',NULL,9);
INSERT OR REPLACE INTO gallery_media(id,album_id,object_key,caption,display_order) VALUES
('seed-gm-tech-summit-10','seed-album-tech-summit','uploads/seed/gallery-tech-summit/11.webp',NULL,10),
('seed-gm-tech-summit-11','seed-album-tech-summit','uploads/seed/gallery-tech-summit/12.webp',NULL,11),
('seed-gm-tech-summit-12','seed-album-tech-summit','uploads/seed/gallery-tech-summit/13.webp',NULL,12),
('seed-gm-tech-summit-13','seed-album-tech-summit','uploads/seed/gallery-tech-summit/14.webp',NULL,13),
('seed-gm-tech-summit-14','seed-album-tech-summit','uploads/seed/gallery-tech-summit/15.webp',NULL,14),
('seed-gm-tech-summit-15','seed-album-tech-summit','uploads/seed/gallery-tech-summit/16.webp',NULL,15),
('seed-gm-tech-summit-16','seed-album-tech-summit','uploads/seed/gallery-tech-summit/17.webp',NULL,16),
('seed-gm-tech-summit-17','seed-album-tech-summit','uploads/seed/gallery-tech-summit/18.webp',NULL,17),
('seed-gm-tech-summit-18','seed-album-tech-summit','uploads/seed/gallery-tech-summit/19.webp',NULL,18),
('seed-gm-tech-summit-19','seed-album-tech-summit','uploads/seed/gallery-tech-summit/20.webp',NULL,19);
INSERT OR REPLACE INTO gallery_media(id,album_id,object_key,caption,display_order) VALUES
('seed-gm-tech-summit-20','seed-album-tech-summit','uploads/seed/gallery-tech-summit/21.webp',NULL,20),
('seed-gm-tech-summit-21','seed-album-tech-summit','uploads/seed/gallery-tech-summit/22.webp',NULL,21),
('seed-gm-tech-summit-22','seed-album-tech-summit','uploads/seed/gallery-tech-summit/23.webp',NULL,22),
('seed-gm-tech-summit-23','seed-album-tech-summit','uploads/seed/gallery-tech-summit/24.webp',NULL,23),
('seed-gm-tech-summit-24','seed-album-tech-summit','uploads/seed/gallery-tech-summit/25.webp',NULL,24),
('seed-gm-tech-summit-25','seed-album-tech-summit','uploads/seed/gallery-tech-summit/26.webp',NULL,25),
('seed-gm-tech-summit-26','seed-album-tech-summit','uploads/seed/gallery-tech-summit/27.webp',NULL,26),
('seed-gm-tech-summit-27','seed-album-tech-summit','uploads/seed/gallery-tech-summit/28.webp',NULL,27),
('seed-gm-tech-summit-28','seed-album-tech-summit','uploads/seed/gallery-tech-summit/29.webp',NULL,28),
('seed-gm-induction-00','seed-album-induction','uploads/seed/gallery-induction/01.webp',NULL,0);
INSERT OR REPLACE INTO gallery_media(id,album_id,object_key,caption,display_order) VALUES
('seed-gm-induction-01','seed-album-induction','uploads/seed/gallery-induction/02.webp',NULL,1),
('seed-gm-induction-02','seed-album-induction','uploads/seed/gallery-induction/03.webp',NULL,2),
('seed-gm-induction-03','seed-album-induction','uploads/seed/gallery-induction/04.webp',NULL,3),
('seed-gm-induction-04','seed-album-induction','uploads/seed/gallery-induction/05.webp',NULL,4),
('seed-gm-induction-05','seed-album-induction','uploads/seed/gallery-induction/06.webp',NULL,5),
('seed-gm-induction-06','seed-album-induction','uploads/seed/gallery-induction/07.webp',NULL,6),
('seed-gm-induction-07','seed-album-induction','uploads/seed/gallery-induction/08.webp',NULL,7),
('seed-gm-induction-08','seed-album-induction','uploads/seed/gallery-induction/09.webp',NULL,8),
('seed-gm-induction-09','seed-album-induction','uploads/seed/gallery-induction/10.webp',NULL,9),
('seed-gm-induction-10','seed-album-induction','uploads/seed/gallery-induction/11.webp',NULL,10);
INSERT OR REPLACE INTO gallery_media(id,album_id,object_key,caption,display_order) VALUES
('seed-gm-induction-11','seed-album-induction','uploads/seed/gallery-induction/12.webp',NULL,11),
('seed-gm-induction-12','seed-album-induction','uploads/seed/gallery-induction/13.webp',NULL,12),
('seed-gm-induction-13','seed-album-induction','uploads/seed/gallery-induction/14.webp',NULL,13),
('seed-gm-induction-14','seed-album-induction','uploads/seed/gallery-induction/15.webp',NULL,14),
('seed-gm-induction-15','seed-album-induction','uploads/seed/gallery-induction/16.webp',NULL,15),
('seed-gm-award-night-00','seed-album-award-night','uploads/seed/gallery-award-night/01.webp',NULL,0),
('seed-gm-award-night-01','seed-album-award-night','uploads/seed/gallery-award-night/02.webp',NULL,1),
('seed-gm-award-night-02','seed-album-award-night','uploads/seed/gallery-award-night/03.webp',NULL,2),
('seed-gm-award-night-03','seed-album-award-night','uploads/seed/gallery-award-night/04.webp',NULL,3),
('seed-gm-award-night-04','seed-album-award-night','uploads/seed/gallery-award-night/05.webp',NULL,4);
INSERT OR REPLACE INTO gallery_media(id,album_id,object_key,caption,display_order) VALUES
('seed-gm-award-night-05','seed-album-award-night','uploads/seed/gallery-award-night/06.webp',NULL,5),
('seed-gm-uyo-outreach-00','seed-album-uyo-outreach','uploads/seed/gallery-uyo-outreach/01.webp',NULL,0),
('seed-gm-uyo-outreach-01','seed-album-uyo-outreach','uploads/seed/gallery-uyo-outreach/02.webp',NULL,1),
('seed-gm-uyo-outreach-02','seed-album-uyo-outreach','uploads/seed/gallery-uyo-outreach/03.webp',NULL,2),
('seed-gm-uyo-outreach-03','seed-album-uyo-outreach','uploads/seed/gallery-uyo-outreach/04.webp',NULL,3),
('seed-gm-uyo-outreach-04','seed-album-uyo-outreach','uploads/seed/gallery-uyo-outreach/05.webp',NULL,4),
('seed-gm-uyo-outreach-05','seed-album-uyo-outreach','uploads/seed/gallery-uyo-outreach/06.webp',NULL,5),
('seed-gm-nacos-travail-00','seed-album-nacos-travail','uploads/seed/gallery-nacos-travail/01.webp',NULL,0),
('seed-gm-nacos-travail-01','seed-album-nacos-travail','uploads/seed/gallery-nacos-travail/02.webp',NULL,1),
('seed-gm-nacos-travail-02','seed-album-nacos-travail','uploads/seed/gallery-nacos-travail/03.webp',NULL,2);
INSERT OR REPLACE INTO gallery_media(id,album_id,object_key,caption,display_order) VALUES
('seed-gm-nacos-travail-03','seed-album-nacos-travail','uploads/seed/gallery-nacos-travail/04.webp',NULL,3);
