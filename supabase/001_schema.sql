-- Campus Cards. Run on a new Supabase project as postgres.
begin;
create table public.colleges(id uuid primary key default gen_random_uuid(), name text not null);
create table public.profiles(id uuid primary key references auth.users(id) on delete cascade, college_id uuid not null references public.colleges, name text not null check(length(name) between 1 and 80));
create table public.college_admins(user_id uuid references public.profiles on delete cascade, college_id uuid references public.colleges, primary key(user_id,college_id));
create table public.clubs(id uuid primary key default gen_random_uuid(),college_id uuid not null references public.colleges,name text not null check(length(name) between 1 and 60),short text not null check(length(short) between 1 and 16),category text not null,description text not null check(length(description)<=300),symbol text not null default 'Asterisk',color text not null default '#c8b789');
create table public.club_admins(user_id uuid references public.profiles on delete cascade,club_id uuid references public.clubs,primary key(user_id,club_id));
create table public.club_roles(id uuid primary key default gen_random_uuid(),club_id uuid not null references public.clubs,name text not null,tier text not null check(tier in ('gold','silver','bronze')),unique(club_id,name));
create table public.terms(id uuid primary key default gen_random_uuid(),college_id uuid not null references public.colleges,name text not null check(length(name) between 1 and 40),expires date not null);
create table public.memberships(id uuid primary key default gen_random_uuid(),club_id uuid not null references public.clubs,user_id uuid not null references public.profiles,role_id uuid not null references public.club_roles,term_id uuid not null references public.terms,unique(club_id,user_id,term_id));
create table public.credentials(id uuid primary key default gen_random_uuid(),membership_id uuid not null references public.memberships,name text not null,role text not null,tier text not null check(tier in('gold','silver','bronze')),issued date not null default current_date,expires date not null,revoked boolean not null default false,token text unique not null default replace(gen_random_uuid()::text||gen_random_uuid()::text,'-',''),number bigint generated always as identity);
create unique index one_active_credential on public.credentials(membership_id) where not revoked;
create table public.invitations(id uuid primary key default gen_random_uuid(),club_id uuid not null references public.clubs,email text not null,name text not null check(length(name) between 1 and 80),role_id uuid not null references public.club_roles,term_id uuid not null references public.terms,token text not null unique default replace(gen_random_uuid()::text||gen_random_uuid()::text,'-',''),accepted boolean not null default false,expires_at timestamptz not null default now()+interval '7 days');
create table public.audit_events(id uuid primary key default gen_random_uuid(),club_id uuid references public.clubs,college_id uuid not null references public.colleges,actor_id uuid not null references public.profiles,target_user uuid references public.profiles,title text not null,detail text not null,at timestamptz not null default now());
create index memberships_user on public.memberships(user_id);
create index events_club on public.audit_events(club_id,at desc);
create function public.is_college_admin(cid uuid) returns boolean language sql stable security definer set search_path='' as $$ select exists(select 1 from public.college_admins where user_id=auth.uid() and college_id=cid) $$;
create function public.can_manage(cid uuid) returns boolean language sql stable security definer set search_path='' as $$ select exists(select 1 from public.clubs c where c.id=cid and (public.is_college_admin(c.college_id) or exists(select 1 from public.club_admins a where a.club_id=c.id and a.user_id=auth.uid()))) $$;
create function public.my_college() returns uuid language sql stable security definer set search_path='' as $$ select college_id from public.profiles where id=auth.uid() $$;
-- Deny all direct writes. Mutations go through validated transaction RPCs.
alter table public.colleges enable row level security;
alter table public.profiles enable row level security;
alter table public.college_admins enable row level security;
alter table public.clubs enable row level security;
alter table public.club_admins enable row level security;
alter table public.club_roles enable row level security;
alter table public.terms enable row level security;
alter table public.memberships enable row level security;
alter table public.credentials enable row level security;
alter table public.invitations enable row level security;
alter table public.audit_events enable row level security;
create policy own_profile on public.profiles for select to authenticated using(id=auth.uid());
create policy college_read on public.colleges for select to authenticated using(id=public.my_college());
create policy club_read on public.clubs for select to authenticated using(college_id=public.my_college());
create policy roles_read on public.club_roles for select to authenticated using(exists(select 1 from public.clubs c where c.id=club_id and c.college_id=public.my_college()));
create policy terms_read on public.terms for select to authenticated using(college_id=public.my_college());
create policy member_read on public.memberships for select to authenticated using(user_id=auth.uid() or public.can_manage(club_id));
create policy credential_read on public.credentials for select to authenticated using(exists(select 1 from public.memberships m where m.id=membership_id and(m.user_id=auth.uid() or public.can_manage(m.club_id))));
create policy invitation_read on public.invitations for select to authenticated using(public.can_manage(club_id));
create policy audit_read on public.audit_events for select to authenticated using(target_user=auth.uid() or public.can_manage(club_id) or public.is_college_admin(college_id));
create policy club_admin_read on public.club_admins for select to authenticated using(user_id=auth.uid() or public.can_manage(club_id));
create policy college_admin_read on public.college_admins for select to authenticated using(user_id=auth.uid());
revoke all on public.colleges,public.profiles,public.college_admins,public.clubs,public.club_admins,public.club_roles,public.terms,public.memberships,public.credentials,public.invitations,public.audit_events from anon,authenticated;
grant select on public.colleges,public.profiles,public.college_admins,public.clubs,public.club_admins,public.club_roles,public.terms,public.memberships,public.credentials,public.invitations,public.audit_events to authenticated;
create function public.workspace() returns jsonb language plpgsql security definer set search_path='' as $$
declare uid uuid:=auth.uid(); cid uuid; nm text;
begin
if uid is null then raise exception 'Sign in to access your wallet'; end if;
select college_id,name into cid,nm from public.profiles where id=uid;
-- New users do not acquire an institution or permissions merely by signing in.
if cid is null then return jsonb_build_object('clubs','[]'::jsonb,'roles','[]'::jsonb,'terms','[]'::jsonb,'cards','[]'::jsonb,'events','[]'::jsonb,'invitations','[]'::jsonb,'admin_clubs','[]'::jsonb,'college_admin',false,'name','New member','user_id',uid);end if;
return jsonb_build_object(
'name',nm,'user_id',uid,'college_admin',public.is_college_admin(cid),
'admin_clubs',coalesce((select jsonb_agg(club_id) from public.club_admins where user_id=uid),'[]'),
'clubs',coalesce((select jsonb_agg(to_jsonb(c)) from public.clubs c where c.college_id=cid),'[]'),
'roles',coalesce((select jsonb_agg(to_jsonb(r)) from public.club_roles r join public.clubs c on c.id=r.club_id where c.college_id=cid),'[]'),
 'terms',coalesce((select jsonb_agg(to_jsonb(t)) from public.terms t where t.college_id=cid),'[]'),
'cards',coalesce((select jsonb_agg(jsonb_build_object('id',cr.id,'club_id',m.club_id,'user_id',m.user_id,'name',cr.name,'role',cr.role,'tier',cr.tier,'number','NC · '||lpad(cr.number::text,4,'0'),'term',t.name,'issued',cr.issued,'expires',cr.expires,'revoked',cr.revoked,'token',cr.token) order by cr.number) from public.credentials cr join public.memberships m on m.id=cr.membership_id join public.terms t on t.id=m.term_id where m.user_id=uid or public.can_manage(m.club_id)),'[]'),
'invitations',coalesce((select jsonb_agg(to_jsonb(i)) from public.invitations i where public.can_manage(i.club_id)),'[]'),
'events',coalesce((select jsonb_agg(jsonb_build_object('id',a.id,'club_id',a.club_id,'title',a.title,'detail',a.detail,'at',a.at) order by a.at desc) from public.audit_events a where a.target_user=uid or public.can_manage(a.club_id) or public.is_college_admin(a.college_id)),'[]'));
end $$;
create function public.manage(p jsonb) returns void language plpgsql security definer set search_path='' as $$
declare uid uuid:=auth.uid(); cid uuid; club uuid; rid uuid; tid uuid; mid uuid; target uuid; inv public.invitations%rowtype; cr public.credentials%rowtype; r public.club_roles%rowtype; t public.terms%rowtype; a text:=p->>'action'; event_title text; detail text; mail text; nm text;
begin
if uid is null then raise exception 'Authentication required';end if;
select college_id into cid from public.profiles where id=uid;
if a='accept' then
select * into inv from public.invitations where token=p->>'token' for update;
select lower(email) into mail from auth.users where id=uid and email_confirmed_at is not null;
if inv.id is null or inv.accepted or inv.expires_at<now() or mail is distinct from lower(inv.email) then raise exception 'Invitation invalid, expired, or belongs to another email';end if;
select college_id into cid from public.clubs where id=inv.club_id;
if exists(select 1 from public.profiles where id=uid and college_id<>cid) then raise exception 'Invitation belongs to a different college';end if;
insert into public.profiles(id,college_id,name) values(uid,cid,inv.name) on conflict(id) do nothing;
select * into r from public.club_roles where id=inv.role_id;
select * into t from public.terms where id=inv.term_id;
if t.expires<current_date then raise exception 'Academic term has expired';end if;
insert into public.memberships(club_id,user_id,role_id,term_id) values(inv.club_id,uid,r.id,t.id) returning id into mid;
insert into public.credentials(membership_id,name,role,tier,expires) values(mid,inv.name,r.name,r.tier,t.expires);
update public.invitations set accepted=true where id=inv.id;
club:=inv.club_id;target:=uid;event_title:='Membership activated';detail:=inv.name;
else
if cid is null then raise exception 'Administrator access required';end if;
if a in('revoke','renew','replace') then
select * into cr from public.credentials where id=(p->>'id')::uuid for update;
select club_id,user_id into club,target from public.memberships where id=cr.membership_id;
if cr.id is null or not public.can_manage(club) then raise exception 'Not authorized';end if;
if cr.revoked then raise exception 'Card already revoked';end if;
update public.credentials set revoked=true where id=cr.id;
if a in('renew','replace') then
if a='renew' and ((p->>'expires')::date<=cr.expires or (p->>'expires')::date<current_date) then raise exception 'Renewal must extend expiry';end if;
insert into public.credentials(membership_id,name,role,tier,expires) values(cr.membership_id,cr.name,cr.role,cr.tier,case when a='renew' then(p->>'expires')::date else cr.expires end);
end if;
event_title:=case a when 'revoke' then 'Card revoked' when 'renew' then 'Card renewed' else 'Card replaced' end;detail:=cr.name;
elsif a='invite' then
club:=(p->>'club_id')::uuid;
if not public.can_manage(club) then raise exception 'Not authorized';end if;
select * into r from public.club_roles where id=(p->>'role_id')::uuid and club_id=club;
select * into t from public.terms where id=(p->>'term_id')::uuid and college_id=cid;
mail:=lower(trim(p->>'email'));nm:=trim(p->>'name');
if r.id is null or t.id is null or t.expires<current_date or mail !~ '^[^\s@]+@[^\s@]+\.[^\s@]+$' or length(mail)>254 or length(nm) not between 1 and 80 then raise exception 'Invalid invitation details';end if;
insert into public.invitations(club_id,email,name,role_id,term_id) values(club,mail,nm,r.id,t.id);event_title:='Invitation created';detail:=nm;
elsif a in('club','role','term','assign') then
if not public.is_college_admin(cid) then raise exception 'College administrator access required';end if;
if a='club' then
insert into public.clubs(college_id,name,short,category,description) values(cid,trim(p->>'name'),trim(p->>'short'),p->>'category',p->>'description') returning id into club;
insert into public.club_roles(club_id,name,tier) values(club,'President','gold'),(club,'Vice President','gold'),(club,'Lead','silver'),(club,'Member','bronze');event_title:='Club created';detail:=p->>'name';
elsif a='role' then
select r0.club_id into club from public.club_roles r0 join public.clubs c on c.id=r0.club_id where r0.id=(p->>'id')::uuid and c.college_id=cid;
if club is null then raise exception 'Role not found';end if;
update public.club_roles set tier=p->>'tier' where id=(p->>'id')::uuid;event_title:='Tier mapping updated';detail:=p->>'tier';
elsif a='term' then
if (p->>'expires')::date<current_date then raise exception 'Term expiry must be in the future';end if;
insert into public.terms(college_id,name,expires) values(cid,p->>'name',(p->>'expires')::date);event_title:='Academic term created';detail:=p->>'name';
else
club:=(p->>'club_id')::uuid;
if not exists(select 1 from public.clubs where id=club and college_id=cid) then raise exception 'Club not found';end if;
select pr.id into target from public.profiles pr join auth.users u on u.id=pr.id where lower(u.email)=lower(p->>'email') and pr.college_id=cid;
if target is null then raise exception 'User must first accept a membership invitation for this college';end if;
insert into public.club_admins(user_id,club_id) values(target,club) on conflict do nothing;event_title:='Administrator assigned';detail:=p->>'email';
end if;
else raise exception 'Unsupported action';end if;
end if;
insert into public.audit_events(club_id,college_id,actor_id,target_user,title,detail) values(club,cid,uid,target,event_title,detail);
end $$;
-- Public projection contains no name, student number, email, or internal IDs.
create function public.verify_credential(p_token text) returns jsonb language sql stable security definer set search_path='' as $$
select jsonb_build_object('club',c.name,'role',cr.role,'tier',cr.tier,'expires',cr.expires,'revoked',cr.revoked,'status',case when cr.revoked then 'revoked' when cr.expires<current_date then 'expired' else 'valid' end)
from public.credentials cr join public.memberships m on m.id=cr.membership_id join public.clubs c on c.id=m.club_id where cr.token=p_token and length(p_token)=64
$$;
revoke all on function public.is_college_admin(uuid),public.can_manage(uuid),public.my_college(),public.workspace(),public.manage(jsonb),public.verify_credential(text) from public;
grant execute on function public.is_college_admin(uuid),public.can_manage(uuid),public.my_college(),public.workspace(),public.manage(jsonb) to authenticated;
grant execute on function public.verify_credential(text) to anon,authenticated;
-- Portraits are deliberately not exposed or uploadable in this release.
insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types) values('portraits','portraits',false,2097152,array['image/jpeg','image/png','image/webp']) on conflict(id) do nothing;
-- No storage policies = no client uploads or reads. Add scoped policies before enabling portraits.
commit;
