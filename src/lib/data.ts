import { createClient } from "@supabase/supabase-js";
import { seed, type Workspace, type Command, type Card } from "./model";
export const configured = !!(
  process.env.NEXT_PUBLIC_SUPABASE_URL &&
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);
export const supabase = configured
  ? createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    )
  : null;
const KEY = "campus-cards-demo-v1";
export function readDemo(): Workspace {
  try {
    const value = localStorage.getItem(KEY);
    return value ? JSON.parse(value) : seed();
  } catch {
    return seed();
  }
}
export function saveDemo(w: Workspace) {
  localStorage.setItem(KEY, JSON.stringify(w));
}
export async function loadWorkspace(): Promise<Workspace> {
  if (!supabase) return readDemo();
  const { data, error } = await supabase.rpc("workspace");
  if (error) throw error;
  return data;
}
export async function mutate(command: Command): Promise<void> {
  if (supabase) {
    const { error } = await supabase.rpc("manage", { p: command });
    if (error) throw error;
    return;
  }
  const w = readDemo(),
    now = new Date().toISOString(),
    id = crypto.randomUUID();
  const card = w.cards.find((c) => c.id === command.id);
  if (command.action === "revoke" && card) card.revoked = true;
  if ((command.action === "renew" || command.action === "replace") && card) {
    card.revoked = true;
    w.cards.push({
      ...card,
      id,
      revoked: false,
      token: "demo-" + crypto.randomUUID(),
      issued: now.slice(0, 10),
      expires: String(command.expires || card.expires),
    });
  }
  if (command.action === "invite") {
    w.invitations.push({
      id,
      club_id: String(command.club_id),
      name: String(command.name),
      email: String(command.email),
      role_id: String(command.role_id),
      term_id: String(command.term_id),
      token: "demo-" + crypto.randomUUID(),
      accepted: false,
    });
  }
  if (command.action === "accept") {
    const inv = w.invitations.find(
      (i) => i.token === command.token && !i.accepted,
    );
    if (!inv) throw new Error("Invitation is invalid or already accepted.");
    const role = w.roles.find((r) => r.id === inv.role_id)!,
      term = w.terms.find((t) => t.id === inv.term_id)!;
    inv.accepted = true;
    w.cards.push({
      id,
      club_id: inv.club_id,
      user_id: "demo-student",
      name: inv.name,
      role: role.name,
      tier: role.tier,
      number: "NC · " + String(w.cards.length + 100).padStart(4, "0"),
      term: term.name,
      issued: now.slice(0, 10),
      expires: term.expires,
      revoked: false,
      token: "demo-" + crypto.randomUUID(),
    });
  }
  if (command.action === "club") {
    w.clubs.push({
      id,
      name: String(command.name),
      short: String(command.short),
      description: String(command.description),
      category: String(command.category),
      symbol: "Asterisk",
      color: "#c8b789",
    });
    for (const [name, tier] of [
      ["President", "gold"],
      ["Vice President", "gold"],
      ["Lead", "silver"],
      ["Member", "bronze"],
    ] as const)
      w.roles.push({ id: crypto.randomUUID(), club_id: id, name, tier });
  }
  if (command.action === "role") {
    const role = w.roles.find((r) => r.id === command.id);
    if (role) role.tier = command.tier as "gold" | "silver" | "bronze";
  }
  if (command.action === "term")
    w.terms.push({
      id,
      name: String(command.name),
      expires: String(command.expires),
    });
  if (command.action === "assign")
    w.admin_clubs = [...new Set([...w.admin_clubs, String(command.club_id)])];
  w.events.unshift({
    id,
    club_id: String(command.club_id || card?.club_id || ""),
    title:
      (
        {
          invite: "Invitation created",
          accept: "Membership activated",
          renew: "Card renewed",
          replace: "Card replaced",
          revoke: "Card revoked",
          club: "Club created",
          role: "Tier mapping updated",
          term: "Academic term created",
          assign: "Administrator assigned",
        } as Record<string, string>
      )[command.action] || command.action,
    detail: String(command.name || card?.name || "Administration"),
    at: now,
  });
  saveDemo(w);
}
export async function verify(token: string): Promise<
  | (Pick<Card, "name" | "role" | "tier" | "expires" | "revoked"> & {
      club: string;
      status: "valid" | "expired" | "revoked";
    })
  | null
> {
  if (!supabase) return null;
  const { data, error } = await supabase.rpc("verify_credential", {
    p_token: token,
  });
  if (error) throw error;
  return data;
}
