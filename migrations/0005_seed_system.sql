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
INSERT OR IGNORE INTO permissions(id,resource,action,description)
SELECT resource||'.'||action,resource,action,'Permission to '||action||' '||resource FROM (
 SELECT 'members' resource, 'read' action UNION ALL SELECT 'members','create' UNION ALL SELECT 'members','update' UNION ALL SELECT 'members','delete' UNION ALL
 SELECT 'payments','read' UNION ALL SELECT 'payments','create' UNION ALL SELECT 'payments','update' UNION ALL SELECT 'payments','delete' UNION ALL
 SELECT 'finance','read' UNION ALL SELECT 'finance','create' UNION ALL SELECT 'finance','update' UNION ALL SELECT 'finance','delete' UNION ALL
 SELECT 'elections','read' UNION ALL SELECT 'elections','create' UNION ALL SELECT 'elections','update' UNION ALL SELECT 'elections','delete' UNION ALL
 SELECT 'events','read' UNION ALL SELECT 'events','create' UNION ALL SELECT 'events','update' UNION ALL SELECT 'events','delete' UNION ALL
 SELECT 'executives','read' UNION ALL SELECT 'executives','create' UNION ALL SELECT 'executives','update' UNION ALL SELECT 'executives','delete' UNION ALL
 SELECT 'cms','read' UNION ALL SELECT 'cms','create' UNION ALL SELECT 'cms','update' UNION ALL SELECT 'cms','delete' UNION ALL
 SELECT 'news','read' UNION ALL SELECT 'news','create' UNION ALL SELECT 'news','update' UNION ALL SELECT 'news','delete' UNION ALL
 SELECT 'announcements','read' UNION ALL SELECT 'announcements','create' UNION ALL SELECT 'announcements','update' UNION ALL SELECT 'announcements','delete' UNION ALL
 SELECT 'achievements','read' UNION ALL SELECT 'achievements','create' UNION ALL SELECT 'achievements','update' UNION ALL SELECT 'achievements','delete' UNION ALL
 SELECT 'gallery','read' UNION ALL SELECT 'gallery','create' UNION ALL SELECT 'gallery','update' UNION ALL SELECT 'gallery','delete' UNION ALL
 SELECT 'documents','read' UNION ALL SELECT 'documents','create' UNION ALL SELECT 'documents','update' UNION ALL SELECT 'documents','delete' UNION ALL
 SELECT 'settings','read' UNION ALL SELECT 'settings','update' UNION ALL SELECT 'messages','read' UNION ALL SELECT 'messages','update' UNION ALL SELECT 'messages','delete' UNION ALL
 SELECT 'academics','read' UNION ALL SELECT 'academics','create' UNION ALL SELECT 'academics','update' UNION ALL SELECT 'academics','delete' UNION ALL
 SELECT 'roles','read' UNION ALL SELECT 'roles','update' UNION ALL SELECT 'audit','read'
);
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
