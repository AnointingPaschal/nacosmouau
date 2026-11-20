INSERT OR IGNORE INTO roles(id,name,description,is_system) VALUES
('super_admin','Super Administrator','Full platform administration',1),
('president','Association President','Association-wide executive oversight',1),
('vice_president','Vice President','Deputy association administration',1),
('general_secretary','General Secretary','Records and official communication',1),
('financial_secretary','Financial Secretary','Collections and finance records',1),
('treasurer','Treasurer','Finance approvals and reporting',1),
('public_relations_officer','Public Relations Officer','Publications and public communication',1),
('event_manager','Event Manager','Events, registrations and attendance',1),
('election_committee','Election Committee','Election administration',1),
('content_manager','Content Manager','Public website and content management',1),
('member','Member','Standard member access',1);
INSERT OR IGNORE INTO permissions(id,resource,action,description) VALUES
('members.read','members','read','Permission to read members'),
('members.create','members','create','Permission to create members'),
('members.update','members','update','Permission to update members'),
('members.delete','members','delete','Permission to delete members'),
('payments.read','payments','read','Permission to read payments'),
('payments.create','payments','create','Permission to create payments'),
('payments.update','payments','update','Permission to update payments'),
('payments.delete','payments','delete','Permission to delete payments'),
('finance.read','finance','read','Permission to read finance'),
('finance.create','finance','create','Permission to create finance'),
('finance.update','finance','update','Permission to update finance'),
('finance.delete','finance','delete','Permission to delete finance'),
('elections.read','elections','read','Permission to read elections'),
('elections.create','elections','create','Permission to create elections'),
('elections.update','elections','update','Permission to update elections');
INSERT OR IGNORE INTO permissions(id,resource,action,description) VALUES
('elections.delete','elections','delete','Permission to delete elections'),
('events.read','events','read','Permission to read events'),
('events.create','events','create','Permission to create events'),
('events.update','events','update','Permission to update events'),
('events.delete','events','delete','Permission to delete events'),
('executives.read','executives','read','Permission to read executives'),
('executives.create','executives','create','Permission to create executives'),
('executives.update','executives','update','Permission to update executives'),
('executives.delete','executives','delete','Permission to delete executives'),
('cms.read','cms','read','Permission to read cms'),
('cms.create','cms','create','Permission to create cms'),
('cms.update','cms','update','Permission to update cms'),
('cms.delete','cms','delete','Permission to delete cms'),
('news.read','news','read','Permission to read news'),
('news.create','news','create','Permission to create news');
INSERT OR IGNORE INTO permissions(id,resource,action,description) VALUES
('news.update','news','update','Permission to update news'),
('news.delete','news','delete','Permission to delete news'),
('announcements.read','announcements','read','Permission to read announcements'),
('announcements.create','announcements','create','Permission to create announcements'),
('announcements.update','announcements','update','Permission to update announcements'),
('announcements.delete','announcements','delete','Permission to delete announcements'),
('achievements.read','achievements','read','Permission to read achievements'),
('achievements.create','achievements','create','Permission to create achievements'),
('achievements.update','achievements','update','Permission to update achievements'),
('achievements.delete','achievements','delete','Permission to delete achievements'),
('gallery.read','gallery','read','Permission to read gallery'),
('gallery.create','gallery','create','Permission to create gallery'),
('gallery.update','gallery','update','Permission to update gallery'),
('gallery.delete','gallery','delete','Permission to delete gallery'),
('documents.read','documents','read','Permission to read documents');
INSERT OR IGNORE INTO permissions(id,resource,action,description) VALUES
('documents.create','documents','create','Permission to create documents'),
('documents.update','documents','update','Permission to update documents'),
('documents.delete','documents','delete','Permission to delete documents'),
('settings.read','settings','read','Permission to read settings'),
('settings.update','settings','update','Permission to update settings'),
('messages.read','messages','read','Permission to read messages'),
('messages.update','messages','update','Permission to update messages'),
('messages.delete','messages','delete','Permission to delete messages'),
('academics.read','academics','read','Permission to read academics'),
('academics.create','academics','create','Permission to create academics'),
('academics.update','academics','update','Permission to update academics'),
('academics.delete','academics','delete','Permission to delete academics'),
('roles.read','roles','read','Permission to read roles'),
('roles.update','roles','update','Permission to update roles'),
('audit.read','audit','read','Permission to read audit');
INSERT OR IGNORE INTO role_permissions(role_id,permission_id)
SELECT 'super_admin',id FROM permissions;
INSERT OR IGNORE INTO role_permissions(role_id,permission_id)
SELECT 'president',id FROM permissions WHERE resource IN ('members','payments','finance','elections','events','executives','cms','news','announcements','achievements','gallery','documents','settings','messages','academics','audit') AND action IN ('read','create','update');
INSERT OR IGNORE INTO role_permissions(role_id,permission_id)
SELECT 'vice_president',id FROM permissions WHERE resource IN ('members','events','executives','news','announcements','welfare','audit') AND action IN ('read','create','update');
INSERT OR IGNORE INTO role_permissions(role_id,permission_id)
SELECT 'general_secretary',id FROM permissions WHERE resource IN ('members','executives','cms','news','announcements','documents','messages','academics','audit') AND action IN ('read','create','update');
INSERT OR IGNORE INTO role_permissions(role_id,permission_id)
SELECT 'financial_secretary',id FROM permissions WHERE resource IN ('payments','finance','members','audit') AND action IN ('read','create','update');
INSERT OR IGNORE INTO role_permissions(role_id,permission_id)
SELECT 'treasurer',id FROM permissions WHERE resource IN ('payments','finance','audit') AND action IN ('read','create','update');
INSERT OR IGNORE INTO role_permissions(role_id,permission_id)
SELECT 'public_relations_officer',id FROM permissions WHERE resource IN ('cms','news','announcements','gallery','documents') AND action IN ('read','create','update','delete');
INSERT OR IGNORE INTO role_permissions(role_id,permission_id)
SELECT 'event_manager',id FROM permissions WHERE resource IN ('events','gallery','documents') AND action IN ('read','create','update','delete');
INSERT OR IGNORE INTO role_permissions(role_id,permission_id)
SELECT 'election_committee',id FROM permissions WHERE resource='elections' AND action IN ('read','create','update','delete');
INSERT OR IGNORE INTO role_permissions(role_id,permission_id)
SELECT 'content_manager',id FROM permissions WHERE resource IN ('cms','news','announcements','achievements','gallery','documents') AND action IN ('read','create','update','delete');
INSERT OR IGNORE INTO role_permissions(role_id,permission_id)
SELECT 'member',id FROM permissions WHERE (resource IN ('events','news','announcements','documents','elections') AND action='read');
INSERT OR IGNORE INTO user_roles(user_id,role_id)
SELECT id,CASE role WHEN 'super_admin' THEN 'super_admin' WHEN 'admin' THEN 'super_admin' WHEN 'finance' THEN 'financial_secretary' WHEN 'election_officer' THEN 'election_committee' WHEN 'editor' THEN 'content_manager' ELSE 'member' END FROM users;
INSERT OR IGNORE INTO academic_levels(id,name,display_order) VALUES
('level-100','100 Level',100),('level-200','200 Level',200),('level-300','300 Level',300),('level-400','400 Level',400),('level-500','500 Level',500);
INSERT OR IGNORE INTO system_settings(key,value_json) VALUES
('association_name','"National Association of Computing Students, MOUAU Chapter"'),
('institution_name','"Michael Okpara University of Agriculture, Umudike"'),
('academic_session','"2025/2026"'),
('registration_open','false'),('maintenance_mode','false'),('contact_email','null'),('contact_phone','null'),('address','null'),('social_links','[]'),('logo_key','null');
