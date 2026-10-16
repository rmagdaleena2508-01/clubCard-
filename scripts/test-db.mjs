import { PGlite } from "@electric-sql/pglite";
import { readFile } from "node:fs/promises";
import assert from "node:assert/strict";
const db = new PGlite();
await db.exec(
  `create role anon;create role authenticated;create schema auth;create schema storage;create table auth.users(id uuid primary key,email text,email_confirmed_at timestamptz);create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid $$;create table storage.buckets(id text primary key,name text,public boolean,file_size_limit bigint,allowed_mime_types text[]);grant usage on schema public,auth to authenticated,anon;`,
);
await db.exec(await readFile("supabase/001_schema.sql", "utf8"));
await db.exec(await readFile("supabase/002_seed.sql", "utf8"));
const admin = "30000000-0000-0000-0000-000000000001",
  member = "30000000-0000-0000-0000-000000000002",
  other = "30000000-0000-0000-0000-000000000003",
  clubAdmin = "30000000-0000-0000-0000-000000000004",
  college = "10000000-0000-0000-0000-000000000001",
  club = "20000000-0000-0000-0000-000000000001",
  club2 = "20000000-0000-0000-0000-000000000002";
await db.exec(
  `insert into auth.users values('${admin}','admin@example.test',now()),('${member}','member@example.test',now()),('${other}','other@example.test',now()),('${clubAdmin}','clubadmin@example.test',now());insert into public.profiles values('${admin}','${college}','College Admin'),('${clubAdmin}','${college}','Club Admin');insert into public.college_admins values('${admin}','${college}');insert into public.club_admins values('${clubAdmin}','${club}');`,
);
async function as(uid, role = "authenticated") {
  await db.exec("reset role");
  await db.query("select set_config('request.jwt.claim.sub',$1,false)", [uid]);
  await db.exec(`set role ${role}`);
}
async function manage(p) {
  return db.query("select public.manage($1::jsonb)", [JSON.stringify(p)]);
}
async function fails(fn, match) {
  await assert.rejects(fn, match);
}
await as(admin);
let roles = (
  await db.query(
    "select id from public.club_roles where club_id=$1 and tier=$2",
    [club, "gold"],
  )
).rows;
let term = (await db.query("select id from public.terms")).rows[0].id;
await manage({
  action: "invite",
  club_id: club,
  name: "Test Student",
  email: "member@example.test",
  role_id: roles[0].id,
  term_id: term,
});
let inv = (await db.query("select token from public.invitations")).rows[0]
  .token;
await as(other);
await fails(
  () => manage({ action: "accept", token: inv }),
  /belongs to another email/,
);
await as(member);
await manage({ action: "accept", token: inv });
let workspace = (await db.query("select public.workspace() as w")).rows[0].w;
assert.equal(workspace.cards.length, 1);
assert.equal(workspace.cards[0].tier, "gold");
assert.equal(workspace.college_admin, false);
assert.deepEqual(workspace.admin_clubs, []);
let card = workspace.cards[0];
await fails(() => manage({ action: "revoke", id: card.id }), /Not authorized/);
await fails(
  () => manage({ action: "role", id: roles[0].id, tier: "gold" }),
  /College administrator/,
);
await fails(
  () => db.query("update public.credentials set revoked=true"),
  /permission denied/,
);
await fails(
  () =>
    db.query("insert into public.college_admins values($1,$2)", [
      member,
      college,
    ]),
  /permission denied/,
);
await as(other);
assert.equal(
  (await db.query("select * from public.credentials")).rows.length,
  0,
);
await as("", "anon");
await fails(
  () => db.query("select * from public.credentials"),
  /permission denied/,
);
let verified = (
  await db.query("select public.verify_credential($1) as v", [card.token])
).rows[0].v;
assert.equal(verified.revoked, false);
assert.equal("name" in verified, false);
assert.equal("email" in verified, false);
await as(clubAdmin);
await fails(
  () =>
    manage({
      action: "invite",
      club_id: club2,
      name: "No",
      email: "other@example.test",
      role_id: roles[0].id,
      term_id: term,
    }),
  /Not authorized/,
);
await manage({ action: "replace", id: card.id });
await as("", "anon");
assert.equal(
  (await db.query("select public.verify_credential($1) as v", [card.token]))
    .rows[0].v.revoked,
  true,
);
await as(member);
workspace = (await db.query("select public.workspace() as w")).rows[0].w;
const fresh = workspace.cards.find((c) => !c.revoked);
assert.notEqual(fresh.token, card.token);
await as(clubAdmin);
await manage({ action: "revoke", id: fresh.id });
await as("", "anon");
assert.equal(
  (await db.query("select public.verify_credential($1) as v", [fresh.token]))
    .rows[0].v.revoked,
  true,
);
assert.equal(
  (await db.query("select public.verify_credential($1) as v", ["invalid"]))
    .rows[0].v,
  null,
);
await as(member);
await fails(
  () => manage({ action: "accept", token: inv }),
  /Invitation invalid/,
);
await db.exec("reset role");
await db.query(
  "update public.credentials set expires='2020-01-01',revoked=false where id=$1",
  [card.id],
);
await as("", "anon");
assert.ok(
  new Date(
    (await db.query("select public.verify_credential($1) as v", [card.token]))
      .rows[0].v.expires,
  ) < new Date(),
);
assert.equal(
  (await db.query("select public.verify_credential($1) as v", [card.token]))
    .rows[0].v.status,
  "expired",
);
await db.close();
console.log(
  "PASS: SQL migration, invitation acceptance, email matching, member isolation, no self-promotion, cross-club denial, direct-write denial, public privacy, replacement, revocation, invalid token, replay rejection, expired credential date.",
);
