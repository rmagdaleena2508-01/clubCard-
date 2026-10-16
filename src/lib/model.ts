export type Tier = "gold" | "silver" | "bronze";
export type Club = {
  id: string;
  name: string;
  short: string;
  category: string;
  description: string;
  symbol: string;
  logo?: string;
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
export const COLLEGE_NAME =
  "SRM Institute of Science and Technology, Vadapalli campus";
export const clubs: Club[] = [
  {
    id: "csi",
    name: "Computer Society of India student chapter",
    short: "CSI",
    category: "Technology",
    description:
      "Learn, build, and share ideas with the Computer Society of India student chapter.",
    symbol: "Code",
    logo: "/logos/csi.png",
    color: "#d5aa43",
  },
  {
    id: "edc",
    name: "Entrepreneurship Development Cell",
    short: "EDC",
    category: "Entrepreneurship",
    description:
      "Turn ideas into action with a community of student founders and ambassadors. Rocket logo pending: please upload the image again.",
    symbol: "Asterisk",
    color: "#d5aa43",
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
        name: "Committee Lead",
        tier: "silver" as Tier,
      },
      {
        id: c.id + "-member",
        club_id: c.id,
        name: "Member",
        tier: "bronze" as Tier,
      },
      {
        id: c.id + "-ambassador",
        club_id: c.id,
        name: "IML Ambassador",
        tier: "gold" as Tier,
      },
    ]),
    terms: [{ id: "2026", name: "Jun 2026 – Jun 2029", expires: "2029-06-30" }],
    cards: clubs.map((c, i) => ({
      id: "card-" + i,
      club_id: c.id,
      user_id: "demo-magdaleena",
      name: "Magdaleena",
      role: ["Vice President", "IML Ambassador"][i],
      tier: "gold" as Tier,
      number: "SRM · " + ["0001", "0002"][i],
      term: "Jun 2026 – Jun 2029",
      issued: "2026-06-01",
      expires: "2029-06-30",
      revoked: false,
      token: "demo-" + c.id + "-not-a-live-credential",
    })),
    events: [
      {
        id: "e1",
        club_id: "csi",
        title: "Your card is ready",
        detail: "Gold membership · Jun 2026 – Jun 2029",
        at: "2026-06-01T10:30:00Z",
      },
      {
        id: "e2",
        club_id: "csi",
        title: "Welcome to the board",
        detail: "Appointed as Vice President",
        at: "2026-06-01T09:00:00Z",
      },
      {
        id: "e3",
        club_id: "edc",
        title: "Your card is ready",
        detail: "Gold membership · Jun 2026 – Jun 2029",
        at: "2026-06-01T10:30:00Z",
      },
    ],
    invitations: [],
    admin_clubs: [],
    college_admin: false,
    name: "Magdaleena",
    user_id: "demo-magdaleena",
  };
}
