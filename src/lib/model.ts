export type Tier = "gold" | "silver" | "bronze";
export type Club = {
  id: string;
  name: string;
  short: string;
  category: string;
  description: string;
  symbol: string;
  color: string;
};
export type Role = { id: string; club_id: string; name: string; tier: Tier };
export type Term = { id: string; name: string; expires: string };
export type Card = {
  id: string;
  club_id: string;
  user_id: string;
  name: string;
  role: string;
  tier: Tier;
  number: string;
  term: string;
  issued: string;
  expires: string;
  revoked: boolean;
  token: string;
};
export type Event = {
  id: string;
  club_id: string;
  title: string;
  detail: string;
  at: string;
};
export type Invitation = {
  id: string;
  club_id: string;
  email: string;
  name: string;
  role_id: string;
  term_id: string;
  token: string;
  accepted: boolean;
};
export type Workspace = {
  clubs: Club[];
  roles: Role[];
  terms: Term[];
  cards: Card[];
  events: Event[];
  invitations: Invitation[];
  admin_clubs: string[];
  college_admin: boolean;
  name: string;
  user_id: string;
};
export type Command = { action: string; [key: string]: string | boolean };
export function status(card: Pick<Card, "revoked" | "expires">) {
  return card.revoked
    ? "revoked"
    : new Date(card.expires + "T23:59:59Z").getTime() < Date.now()
      ? "expired"
      : "valid";
}
export const clubs: Club[] = [
  {
    id: "design",
    name: "Design Collective",
    short: "Design",
    category: "Art & design",
    description:
      "A space for curious minds and thoughtful makers. We explore the intersection of design, culture, and everyday life.",
    symbol: "Asterisk",
    color: "#c8b789",
  },
  {
    id: "tech",
    name: "Coding Society",
    short: "Code",
    category: "Technology",
    description:
      "Build something that matters. A community of developers, problem solvers, and late-night collaborators.",
    symbol: "Code",
    color: "#a6b9c5",
  },
  {
    id: "photo",
    name: "Photography Club",
    short: "Photo",
    category: "Arts & culture",
    description:
      "Find a different perspective. Photo walks, shared stories, and a community that sees the world a little differently.",
    symbol: "Aperture",
    color: "#c09378",
  },
];
export function seed(): Workspace {
  return {
    clubs,
    roles: clubs.flatMap((c) => [
      {
        id: c.id + "-president",
        club_id: c.id,
        name: "President",
        tier: "gold" as Tier,
      },
      {
        id: c.id + "-vp",
        club_id: c.id,
        name: "Vice President",
        tier: "gold" as Tier,
      },
      {
        id: c.id + "-lead",
        club_id: c.id,
        name: "Creative Lead",
        tier: "silver" as Tier,
      },
      {
        id: c.id + "-member",
        club_id: c.id,
        name: "Member",
        tier: "bronze" as Tier,
      },
    ]),
    terms: [{ id: "2026", name: "2026 / 2027", expires: "2027-06-30" }],
    cards: clubs.map((c, i) => ({
      id: "card-" + i,
      club_id: c.id,
      user_id: "demo-student",
      name: "Aarav Mehta",
      role: ["President", "Creative Lead", "Member"][i],
      tier: (["gold", "silver", "bronze"] as Tier[])[i],
      number: "NC · " + ["0018", "0042", "0106"][i],
      term: "2026 / 2027",
      issued: "2026-08-12",
      expires: "2027-06-30",
      revoked: false,
      token: "demo-" + c.id + "-not-a-live-credential",
    })),
    events: [
      {
        id: "e1",
        club_id: "design",
        title: "Your card is ready",
        detail: "Gold membership · 2026 / 2027",
        at: "2026-08-12T10:30:00Z",
      },
      {
        id: "e2",
        club_id: "design",
        title: "Welcome to the board",
        detail: "Appointed as President",
        at: "2026-08-12T09:00:00Z",
      },
      {
        id: "e3",
        club_id: "tech",
        title: "Your card is ready",
        detail: "Silver membership · 2026 / 2027",
        at: "2026-08-12T10:30:00Z",
      },
    ],
    invitations: [],
    admin_clubs: [],
    college_admin: false,
    name: "Aarav Mehta",
    user_id: "demo-student",
  };
}
