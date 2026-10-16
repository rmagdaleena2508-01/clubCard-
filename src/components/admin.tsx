"use client";
import { useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import * as AlertDialog from "@radix-ui/react-alert-dialog";
import {
  Plus,
  ArrowUpRight,
  Copy,
  Check,
  WarningCircle,
} from "@phosphor-icons/react";
import { type Workspace, type Command, type Card, status } from "@/lib/model";
import { MetalCard } from "./metal-card";
export function Admin({
  w,
  run,
  demo,
}: {
  w: Workspace;
  run: (c: Command) => Promise<void>;
  demo: boolean;
}) {
  const [view, setView] = useState("members"),
    [clubId, setClubId] = useState(w.clubs[0]?.id || ""),
    [modal, setModal] = useState(false),
    [preview, setPreview] = useState<Card | null>(null),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [copied, setCopied] = useState(""),
    [revoke, setRevoke] = useState<Card | null>(null);
  const allowed = w.college_admin
      ? w.clubs
      : w.clubs.filter((c) => w.admin_clubs.includes(c.id)),
    club = allowed.find((c) => c.id === clubId) || allowed[0];
  async function submit(c: Command) {
    setBusy(true);
    setError("");
    try {
      await run(c);
      setModal(false);
      setPreview(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not save. Try again.");
    } finally {
      setBusy(false);
    }
  }
  async function copy(token: string) {
    try {
      await navigator.clipboard.writeText(
        `${location.origin}/?invite=${token}`,
      );
      setCopied(token);
    } catch {
      setError(
        "Clipboard unavailable. Select and copy the invitation link below.",
      );
    }
  }
  if (!club)
    return (
      <div className="empty">
        <h2>No club access</h2>
        <p>A college administrator must assign you to a club.</p>
      </div>
    );
  return (
    <section className="admin">
      <div className="page-heading">
        <div>
          <span className="eyebrow">CLUB OFFICE</span>
          <h1>Make it official.</h1>
          <p>Manage the people behind your community.</p>
        </div>
        <button className="primary" onClick={() => setModal(true)}>
          <Plus size={18} /> Issue a card
        </button>
      </div>
      <div className="admin-toolbar">
        <div className="segmented">
          {["members", "invitations", "settings", "audit"].map((v) => (
            <button
              key={v}
              aria-pressed={view === v}
              onClick={() => setView(v)}
            >
              {v}
            </button>
          ))}
        </div>
        <label className="sr-only" htmlFor="admin-club">
          Manage club
        </label>
        <select
          id="admin-club"
          value={club.id}
          onChange={(e) => setClubId(e.target.value)}
        >
          {allowed.map((c) => (
            <option value={c.id} key={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      </div>
      {error && (
        <p role="alert" className="error">
          <WarningCircle />
          {error}
        </p>
      )}
      {view === "members" && (
        <div className="member-list">
          <div className="list-heading">
            <h2>{club.name}</h2>
            <span>
              {w.cards.filter((c) => c.club_id === club.id).length} credentials
            </span>
          </div>
          {w.cards
            .filter((c) => c.club_id === club.id)
            .map((c) => (
              <div className="member-row" key={c.id}>
                <div className={`avatar ${c.tier}`}>
                  {c.name
                    .split(" ")
                    .map((n) => n[0])
                    .slice(0, 2)
                    .join("")}
                </div>
                <div className="member-name">
                  <strong>{c.name}</strong>
                  <small>
                    {c.role} · {c.number}
                  </small>
                </div>
                <span className={`status ${status(c)}`}>{status(c)}</span>
                <div className="row-actions">
                  <button onClick={() => setPreview(c)}>Preview</button>
                  <button
                    disabled={busy || c.revoked}
                    onClick={() =>
                      submit({
                        action: "replace",
                        id: c.id,
                        club_id: c.club_id,
                      })
                    }
                  >
                    Replace
                  </button>
                  <button
                    disabled={busy || c.revoked}
                    onClick={() => {
                      const expires = window.prompt(
                        "New expiry date (YYYY-MM-DD)",
                        c.expires,
                      );
                      if (expires && /^\d{4}-\d{2}-\d{2}$/.test(expires))
                        void submit({
                          action: "renew",
                          id: c.id,
                          club_id: c.club_id,
                          expires,
                        });
                    }}
                  >
                    Renew
                  </button>
                  <button
                    className="danger-text"
                    disabled={busy || c.revoked}
                    onClick={() => setRevoke(c)}
                  >
                    Revoke
                  </button>
                </div>
              </div>
            ))}
          {!w.cards.some((c) => c.club_id === club.id) && (
            <div className="empty">No cards yet. Invite your first member.</div>
          )}
        </div>
      )}
      {view === "invitations" && (
        <div className="panel">
          <h2>Invitations</h2>
          <p>
            Share the invitation link with its intended recipient. They must
            sign in with the invited email.
          </p>
          {w.invitations
            .filter((i) => i.club_id === club.id)
            .map((i) => (
              <div className="invitation" key={i.id}>
                <div>
                  <strong>{i.name}</strong>
                  <small>{i.email}</small>
                </div>
                <span className="status">
                  {i.accepted ? "Accepted" : "Pending"}
                </span>
                <button
                  aria-label={`Copy invitation for ${i.name}`}
                  onClick={() => copy(i.token)}
                >
                  {copied === i.token ? <Check /> : <Copy />}
                </button>
                {demo && !i.accepted && (
                  <button
                    onClick={() =>
                      submit({
                        action: "accept",
                        token: i.token,
                        club_id: club.id,
                      })
                    }
                  >
                    Simulate acceptance <ArrowUpRight />
                  </button>
                )}
                <code>
                  {typeof window !== "undefined" ? location.origin : ""}
                  /?invite={i.token}
                </code>
              </div>
            ))}
          {!w.invitations.some((i) => i.club_id === club.id) && (
            <div className="empty">
              No pending invitations. Issue a card to get started.
            </div>
          )}
        </div>
      )}
      {view === "settings" && (
        <div className="settings-grid">
          <div className="panel">
            <h2>Role & material</h2>
            <p>
              Mappings apply to newly issued cards. Existing credentials keep
              their issued tier.
            </p>
            {w.roles
              .filter((r) => r.club_id === club.id)
              .map((r) => (
                <label className="mapping" key={r.id}>
                  {r.name}
                  <select
                    disabled={!w.college_admin || busy}
                    value={r.tier}
                    onChange={(e) =>
                      submit({
                        action: "role",
                        id: r.id,
                        tier: e.target.value,
                        club_id: club.id,
                      })
                    }
                  >
                    <option>gold</option>
                    <option>silver</option>
                    <option>bronze</option>
                  </select>
                </label>
              ))}
          </div>
          {w.college_admin && (
            <>
              <form
                className="panel form"
                onSubmit={(e) => {
                  e.preventDefault();
                  const d = new FormData(e.currentTarget);
                  void submit({
                    action: "club",
                    name: String(d.get("name")),
                    short: String(d.get("short")),
                    category: String(d.get("category")),
                    description: String(d.get("description")),
                  });
                }}
              >
                <h2>Create a club</h2>
                <label>
                  Club name
                  <input name="name" required maxLength={60} />
                </label>
                <label>
                  Short name
                  <input name="short" required maxLength={16} />
                </label>
                <label>
                  Category
                  <input name="category" required maxLength={40} />
                </label>
                <label>
                  Description
                  <textarea name="description" required maxLength={300} />
                </label>
                <button className="primary" disabled={busy}>
                  Create club
                </button>
              </form>
              <form
                className="panel form"
                onSubmit={(e) => {
                  e.preventDefault();
                  const d = new FormData(e.currentTarget);
                  void submit({
                    action: "assign",
                    email: String(d.get("email")),
                    club_id: club.id,
                  });
                }}
              >
                <h2>Assign an administrator</h2>
                <p>
                  The user must have signed in at least once. This grants access
                  to {club.name} only.
                </p>
                <label>
                  Email
                  <input name="email" type="email" required />
                </label>
                <button className="primary" disabled={busy}>
                  Assign administrator
                </button>
              </form>
              <form
                className="panel form"
                onSubmit={(e) => {
                  e.preventDefault();
                  const d = new FormData(e.currentTarget);
                  void submit({
                    action: "term",
                    name: String(d.get("name")),
                    expires: String(d.get("expires")),
                  });
                }}
              >
                <h2>Academic terms</h2>
                {w.terms.map((t) => (
                  <p key={t.id}>
                    {t.name} · ends {t.expires}
                  </p>
                ))}
                <label>
                  Term name
                  <input name="name" required maxLength={40} />
                </label>
                <label>
                  Expiry date
                  <input name="expires" type="date" required />
                </label>
                <button className="primary" disabled={busy}>
                  Add term
                </button>
              </form>
            </>
          )}
        </div>
      )}
      {view === "audit" && (
        <div className="panel">
          <h2>Activity log</h2>
          {w.events
            .filter((e) => !e.club_id || e.club_id === club.id)
            .map((e) => (
              <div className="activity-row" key={e.id}>
                <div>
                  <strong>{e.title}</strong>
                  <small>{e.detail}</small>
                </div>
                <time>{new Date(e.at).toLocaleString()}</time>
              </div>
            ))}
        </div>
      )}
      <Dialog.Root
        open={!!(modal || preview)}
        onOpenChange={(open) => {
          if (!open) {
            setModal(false);
            setPreview(null);
          }
        }}
      >
        <Dialog.Portal>
          <Dialog.Overlay className="modal-scrim" />
          <Dialog.Content className="modal" aria-describedby={undefined}>
            <Dialog.Title className="sr-only">
              {preview ? "Card preview" : "Issue a card"}
            </Dialog.Title>
            <button
              className="modal-close"
              aria-label="Close dialog"
              onClick={() => {
                setModal(false);
                setPreview(null);
              }}
            >
              ×
            </button>
            {preview ? (
              <>
                <h2>Card preview</h2>
                <MetalCard card={preview} club={club} />
              </>
            ) : (
              <form
                className="form"
                onSubmit={(e) => {
                  e.preventDefault();
                  const d = new FormData(e.currentTarget);
                  void submit({
                    action: "invite",
                    club_id: club.id,
                    name: String(d.get("name")),
                    email: String(d.get("email")),
                    role_id: String(d.get("role")),
                    term_id: String(d.get("term")),
                  });
                }}
              >
                <span className="eyebrow">{club.name}</span>
                <h2>A place in the club.</h2>
                <p>
                  Create an invitation. The card is activated when the member
                  accepts.
                </p>
                <label>
                  Full name
                  <input
                    name="name"
                    required
                    autoFocus
                    maxLength={80}
                    placeholder="e.g. Ananya Rao"
                  />
                </label>
                <label>
                  College email
                  <input
                    name="email"
                    type="email"
                    required
                    placeholder="ananya@college.edu"
                  />
                </label>
                <label>
                  Position
                  <select name="role">
                    {w.roles
                      .filter((r) => r.club_id === club.id)
                      .map((r) => (
                        <option key={r.id} value={r.id}>
                          {r.name} · {r.tier}
                        </option>
                      ))}
                  </select>
                </label>
                <label>
                  Academic term
                  <select name="term">
                    {w.terms.map((t) => (
                      <option value={t.id} key={t.id}>
                        {t.name}
                      </option>
                    ))}
                  </select>
                </label>
                {error && (
                  <p className="error" role="alert">
                    {error}
                  </p>
                )}
                <button className="primary" disabled={busy}>
                  {busy ? "Creating…" : "Create invitation"}
                </button>
              </form>
            )}
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
      <AlertDialog.Root
        open={!!revoke}
        onOpenChange={(open) => {
          if (!open) setRevoke(null);
        }}
      >
        <AlertDialog.Portal>
          <AlertDialog.Overlay className="modal-scrim" />
          <AlertDialog.Content className="modal">
            <AlertDialog.Title>Revoke this card?</AlertDialog.Title>
            <AlertDialog.Description>
              This will mark {revoke?.name}’s card as revoked. Its QR code will
              no longer verify as active.
            </AlertDialog.Description>
            <div className="dialog-actions">
              <AlertDialog.Cancel asChild>
                <button className="quiet-button">Keep card</button>
              </AlertDialog.Cancel>
              <AlertDialog.Action asChild>
                <button
                  className="primary"
                  onClick={() => {
                    if (revoke)
                      void submit({
                        action: "revoke",
                        id: revoke.id,
                        club_id: revoke.club_id,
                      });
                  }}
                >
                  Revoke card
                </button>
              </AlertDialog.Action>
            </div>
          </AlertDialog.Content>
        </AlertDialog.Portal>
      </AlertDialog.Root>
    </section>
  );
}
