-- Fictional institution and clubs. No real users or credentials are created.
begin;
insert into public.colleges(id,name) values('10000000-0000-0000-0000-000000000001','Northfield College');
insert into public.clubs(id,college_id,name,short,category,description,symbol,color) values
('20000000-0000-0000-0000-000000000001','10000000-0000-0000-0000-000000000001','Design Collective','Design','Art & design','A space for curious minds and thoughtful makers. We explore the intersection of design, culture, and everyday life.','Asterisk','#c8b789'),
('20000000-0000-0000-0000-000000000002','10000000-0000-0000-0000-000000000001','Coding Society','Code','Technology','Build something that matters. A community of developers, problem solvers, and late-night collaborators.','Code','#a6b9c5'),
('20000000-0000-0000-0000-000000000003','10000000-0000-0000-0000-000000000001','Photography Club','Photo','Arts & culture','Find a different perspective. Photo walks, shared stories, and a community that sees the world a little differently.','Aperture','#c09378');
insert into public.club_roles(club_id,name,tier) select c.id,r.name,r.tier from public.clubs c cross join(values('President','gold'),('Vice President','gold'),('Creative Lead','silver'),('Member','bronze')) as r(name,tier);
insert into public.terms(college_id,name,expires) values('10000000-0000-0000-0000-000000000001','2026 / 2027','2027-06-30');
commit;
