"use client";
/* Browser-only state is read after hydration to keep static HTML deterministic. */
/* eslint-disable react-hooks/set-state-in-effect */
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import {
  Wallet,
  SquaresFour,
  UserCircle,
  ArrowUpRight,
  ArrowRight,
  ArrowsClockwise,
  ShieldCheck,
  GearSix,
  SignOut,
  QrCode,
  CheckCircle,
  GraduationCap,
} from "@phosphor-icons/react";
import { MetalCard, ClubMark } from "@/components/metal-card";
import { haptic } from "@/lib/haptics";
import { Pwa } from "@/components/pwa";
import { Admin } from "@/components/admin";
import { configured, supabase, loadWorkspace, mutate } from "@/lib/data";
import { type Workspace, type Command, status } from "@/lib/model";
export default function Home() {
  const [w, setW] = useState<Workspace | null>(null),
    [tab, setTab] = useState("wallet"),
    [selected, setSelected] = useState(""),
    [back, setBack] = useState(false),
    [demoAdmin, setDemoAdmin] = useState(false),
    [signedIn, setSignedIn] = useState(!configured),
    [loading, setLoading] = useState(true),
    [error, setError] = useState(""),
    [notice, setNotice] = useState(""),
    [origin, setOrigin] = useState(""),
    [invite, setInvite] = useState(""),
    [offline, setOffline] = useState(false);
  const refresh = useCallback(async () => {
    try {
      setError("");
      setW(await loadWorkspace());
    } catch (e) {
      setError(
        e instanceof Error
          ? e.message
          : "Could not load your wallet. Please sign in again.",
      );
    } finally {
      setLoading(false);
    }
  }, []);
  useEffect(() => {
    setOrigin(location.origin);
    setInvite(new URLSearchParams(location.search).get("invite") || "");
    const network = () => setOffline(!navigator.onLine);
    network();
    addEventListener("online", network);
    addEventListener("offline", network);
    if (supabase) {
      supabase.auth.getSession().then(({ data }) => {
        setSignedIn(!!data.session);
        if (data.session) void refresh();
        else setLoading(false);
      });
      const { data } = supabase.auth.onAuthStateChange((_event, session) => {
        setSignedIn(!!session);
        if (session) setTimeout(() => void refresh(), 0);
        else setW(null);
      });
      return () => {
        data.subscription.unsubscribe();
        removeEventListener("online", network);
        removeEventListener("offline", network);
      };
    }
    void refresh();
    return () => {
      removeEventListener("online", network);
      removeEventListener("offline", network);
    };
  }, [refresh]);
  async function run(c: Command) {
    await mutate(c);
    await refresh();
    setNotice("Changes saved.");
    setTimeout(() => setNotice(""), 3500);
  }
  const ownCards =
      w?.cards.filter((c) => c.user_id === w.user_id && !c.revoked) || [],
    card = ownCards.find((c) => c.id === selected) || ownCards[0],
    club = w?.clubs.find((c) => c.id === card?.club_id),
    admin = !!(w && (w.college_admin || w.admin_clubs.length || demoAdmin));
  async function signOut() {
    if (supabase) await supabase.auth.signOut();
    setW(null);
    setSignedIn(false);
    setDemoAdmin(false);
    setTab("wallet");
    sessionStorage.clear();
  }
  const tabs = [
    { id: "wallet", name: "Wallet", Icon: Wallet },
    { id: "clubs", name: "Clubs", Icon: SquaresFour },
    { id: "profile", name: "Profile", Icon: UserCircle },
    ...(admin ? [{ id: "admin", name: "Club office", Icon: GearSix }] : []),
  ];
  return (
    <div className="app-shell">
      <a className="skip-link" href="#main">
        Skip to content
      </a>
      <aside className="sidebar">
        <Link className="wordmark" href="/" aria-label="campuscards home">
          <span className="brand-icon">
            <Wallet size={23} />
          </span>
          campus<span className="wordmark-light">cards</span>
        </Link>
        <div className="college-switch">
          <span className="college-emblem">
            <GraduationCap size={23} />
          </span>
          <div>
            <strong>Northfield College</strong>
            <small>Student communities</small>
          </div>
          <span className="college-chevron">⌄</span>
        </div>
        <span className="nav-label">YOUR CAMPUS</span>
        <nav aria-label="Main navigation">
          {tabs.map(({ id, name, Icon }) => (
            <button
              key={id}
              className={tab === id ? "active" : ""}
              aria-current={tab === id ? "page" : undefined}
              onClick={() => setTab(id)}
            >
              <Icon size={21} weight={tab === id ? "fill" : "regular"} />
              {name}
              {id === "wallet" && (
                <span className="nav-count">
                  {String(ownCards.length).padStart(2, "0")}
                </span>
              )}
            </button>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <Pwa />
          <div className="sidebar-profile">
            <span className="profile-monogram">AM</span>
            <div>
              <strong>{w?.name || "Your campus identity"}</strong>
              <small>{configured ? "Member account" : "Demo student"}</small>
            </div>
            <button aria-label="Open profile" onClick={() => setTab("profile")}>
              <ArrowUpRight size={19} />
            </button>
          </div>
        </div>
      </aside>
      <div className="main-shell">
        <header className="topbar">
          <Link className="wordmark" href="/" aria-label="campuscards home">
            <span className="brand-icon">
              <Wallet size={23} />
            </span>
            campus<span className="wordmark-light">cards</span>
          </Link>
          <button className="account-button" onClick={() => setTab("profile")}>
            <span className="account-label">
              {configured ? w?.name || "Sign in" : "Demo account"}
            </span>
            <span className="profile-monogram" aria-hidden="true">
              {w?.name
                .split(" ")
                .map((n) => n[0])
                .slice(0, 2)
                .join("") || "CC"}
            </span>
          </button>
        </header>
        {offline && (
          <div className="error" role="status">
            Offline — status not verified. Connect to refresh your wallet.
          </div>
        )}
        <main id="main">
          {error && (
            <div className="error" role="alert">
              {error}
              <button onClick={() => void refresh()}>Try again</button>
            </div>
          )}
          {notice && (
            <div className="toast" role="status">
              <CheckCircle size={18} />
              {notice}
            </div>
          )}
          {loading ? (
            <div className="loading">
              <div className="skeleton-card" />
              <p>Opening your wallet…</p>
            </div>
          ) : !signedIn ? (
            <section className="login panel">
              <span className="eyebrow">CAMPUS CARDS</span>
              <h1>
                Your place
                <br />
                on campus.
              </h1>
              <p>Sign in with your college email to access your club cards.</p>
              {configured ? (
                <form
                  className="form"
                  onSubmit={async (e) => {
                    e.preventDefault();
                    const email = String(
                      new FormData(e.currentTarget).get("email"),
                    );
                    const { error } = await supabase!.auth.signInWithOtp({
                      email,
                      options: {
                        emailRedirectTo:
                          origin +
                          (invite
                            ? "/?invite=" + encodeURIComponent(invite)
                            : "/"),
                      },
                    });
                    if (error) setError(error.message);
                    else setNotice("Check your email for a sign-in link.");
                  }}
                >
                  <label>
                    College email
                    <input
                      type="email"
                      name="email"
                      placeholder="you@college.edu"
                      required
                    />
                  </label>
                  <button className="primary">
                    Send sign-in link <ArrowRight />
                  </button>
                </form>
              ) : (
                <button
                  className="primary"
                  onClick={() => {
                    setSignedIn(true);
                    void refresh();
                  }}
                >
                  Open demo wallet <ArrowRight />
                </button>
              )}
            </section>
          ) : (
            w && (
              <>
                {invite && (
                  <div className="invite-banner">
                    <div>
                      <strong>You have a club invitation</strong>
                      <p>Accept to add your new membership card.</p>
                    </div>
                    <button
                      className="primary"
                      onClick={async () => {
                        try {
                          await run({ action: "accept", token: invite });
                          setInvite("");
                          history.replaceState({}, "", "/");
                        } catch (e) {
                          setError(
                            e instanceof Error
                              ? e.message
                              : "Unable to accept invitation",
                          );
                        }
                      }}
                    >
                      Accept invitation
                    </button>
                  </div>
                )}
                {tab === "wallet" && (
                  <>
                    <div className="page-heading wallet-heading">
                      <h1>
                        Every community you’re part of,
                        <br className="desktop-break" /> in one place.
                      </h1>
                    </div>
                    {card && club ? (
                      <div className="wallet-grid">
                        <section
                          className="wallet-stage"
                          aria-label="Your membership cards"
                        >
                          <div className="stage-heading">
                            <div>
                              <h2>{club.name}</h2>
                              <p>
                                {card.role} <span>·</span> {club.category}
                              </p>
                            </div>
                            <span className="card-counter">
                              {String(ownCards.indexOf(card) + 1).padStart(
                                2,
                                "0",
                              )}
                              <span>
                                {" "}
                                / {String(ownCards.length).padStart(2, "0")}
                              </span>
                            </span>
                          </div>
                          <div className="card-space">
                            <MetalCard
                              card={card}
                              club={club}
                              back={back}
                              origin={origin}
                              onFlip={setBack}
                            />
                          </div>
                          <div className="card-controls">
                            <span>
                              {back
                                ? "Your membership details."
                                : "Tap or drag to turn your card."}
                            </span>
                            <button
                              onClick={() => {
                                haptic(16);
                                setBack(!back);
                              }}
                            >
                              <ArrowsClockwise size={15} />
                              {back ? "View front" : "Flip card"}
                            </button>
                          </div>
                          <div
                            className="club-selectors"
                            role="group"
                            aria-label="Choose membership card"
                          >
                            {ownCards.map((c) => {
                              const cl = w.clubs.find(
                                (x) => x.id === c.club_id,
                              )!;
                              return (
                                <button
                                  key={c.id}
                                  className={c.id === card.id ? "selected" : ""}
                                  aria-pressed={c.id === card.id}
                                  aria-label={`${cl.short} — Select ${cl.name}, ${c.tier}`}
                                  onClick={() => {
                                    haptic(10);
                                    setSelected(c.id);
                                    setBack(false);
                                  }}
                                >
                                  <span
                                    style={
                                      {
                                        "--club-color": cl.color,
                                      } as React.CSSProperties
                                    }
                                  >
                                    <ClubMark club={cl} size={25} />
                                  </span>
                                  <small>{cl.short}</small>
                                </button>
                              );
                            })}
                          </div>
                          <div className="stage-footer">
                            <ShieldCheck size={14} />
                            <span>
                              {configured
                                ? "Issued by your college. Made for you."
                                : "Demo credential · not a valid college ID"}
                            </span>
                          </div>
                        </section>
                        <aside className="wallet-details">
                          <div className="membership-info">
                            <div className="section-title">
                              <h2>Membership details</h2>
                              <span className={`status ${status(card)}`}>
                                {status(card) === "valid"
                                  ? "Active"
                                  : status(card)}
                              </span>
                            </div>
                            <dl>
                              <div>
                                <dt>Member</dt>
                                <dd>{card.name}</dd>
                              </div>
                              <div>
                                <dt>Position</dt>
                                <dd>{card.role}</dd>
                              </div>
                              <div>
                                <dt>Card tier</dt>
                                <dd className="tier-value">
                                  <i className={card.tier} />
                                  <span className="capitalize">
                                    {card.tier}
                                  </span>
                                </dd>
                              </div>
                              <div>
                                <dt>Membership ID</dt>
                                <dd className="mono">{card.number}</dd>
                              </div>
                              <div>
                                <dt>Valid through</dt>
                                <dd>
                                  {new Date(
                                    card.expires + "T12:00:00",
                                  ).toLocaleDateString("en-GB", {
                                    day: "numeric",
                                    month: "long",
                                    year: "numeric",
                                  })}
                                </dd>
                              </div>
                            </dl>
                            <button
                              className="verify-button"
                              onClick={() => setBack(true)}
                            >
                              <QrCode size={19} /> Show verification QR{" "}
                              <ArrowUpRight size={16} />
                            </button>
                          </div>
                          <div className="club-note">
                            <span className="tiny-label">
                              A PART OF SOMETHING GOOD
                            </span>
                            <h3>
                              Different minds.
                              <br />
                              Shared possibilities.
                            </h3>
                            <p>{club.description}</p>
                            <button onClick={() => setTab("clubs")}>
                              Meet your community <ArrowRight size={16} />
                            </button>
                          </div>
                        </aside>
                        <section className="recent-activity">
                          <div className="section-title">
                            <h2>Recent activity</h2>
                            <span>THIS MEMBERSHIP</span>
                          </div>
                          {w.events
                            .filter((e) => e.club_id === club.id)
                            .slice(0, 4)
                            .map((e, i) => (
                              <div className="activity-row" key={e.id}>
                                <span className="activity-icon">
                                  {i === 0 ? (
                                    <Wallet size={19} />
                                  ) : (
                                    <ShieldCheck size={19} />
                                  )}
                                </span>
                                <div>
                                  <strong>{e.title}</strong>
                                  <small>{e.detail}</small>
                                </div>
                                <time>
                                  {new Date(e.at).toLocaleDateString("en-GB", {
                                    day: "numeric",
                                    month: "short",
                                  })}
                                </time>
                                <CheckCircle
                                  size={17}
                                  className="activity-check"
                                />
                              </div>
                            ))}
                          {!w.events.some((e) => e.club_id === club.id) && (
                            <p>No recent activity for this club.</p>
                          )}
                        </section>
                      </div>
                    ) : (
                      <div className="empty">
                        <Wallet size={42} />
                        <h2>Your wallet is waiting.</h2>
                        <p>
                          Accept a club invitation to receive your first card.
                        </p>
                        <button
                          className="primary"
                          onClick={() => setTab("clubs")}
                        >
                          Explore clubs
                        </button>
                      </div>
                    )}
                  </>
                )}
                {tab === "clubs" && (
                  <>
                    <div className="page-heading">
                      <div>
                        <span className="eyebrow">FIND YOUR PEOPLE</span>
                        <h1>Life beyond class.</h1>
                        <p>Small communities. A bigger college experience.</p>
                      </div>
                    </div>
                    <div className="clubs-grid">
                      {w.clubs.map((c) => (
                        <article className="club-panel" key={c.id}>
                          <span
                            className="club-large-mark"
                            style={{ color: c.color }}
                          >
                            <ClubMark club={c} size={55} />
                          </span>
                          <span className="eyebrow">{c.category}</span>
                          <h2>{c.name}</h2>
                          <p>{c.description}</p>
                          {ownCards.some((x) => x.club_id === c.id) ? (
                            <button
                              onClick={() => {
                                setSelected(
                                  ownCards.find((x) => x.club_id === c.id)!.id,
                                );
                                setTab("wallet");
                                setBack(false);
                              }}
                            >
                              View your card <ArrowUpRight />
                            </button>
                          ) : (
                            <p className="join-note">
                              Contact this club’s board for a membership
                              invitation.
                            </p>
                          )}
                        </article>
                      ))}
                    </div>
                  </>
                )}
                {tab === "profile" && (
                  <>
                    <div className="page-heading">
                      <div>
                        <span className="eyebrow">YOUR CAMPUS IDENTITY</span>
                        <h1>A little about you.</h1>
                      </div>
                    </div>
                    <div className="profile-layout">
                      <section className="panel">
                        <span className="profile-monogram large">
                          {w.name
                            .split(" ")
                            .map((n) => n[0])
                            .slice(0, 2)
                            .join("")}
                        </span>
                        <h2>{w.name}</h2>
                        <p>
                          Northfield College · {ownCards.length} club
                          memberships
                        </p>
                        <p>
                          {configured
                            ? "Your name and role are managed by your issuing clubs. Contact a club administrator for changes."
                            : "You’re exploring a fictional student account. Changes in this demo stay in this browser."}
                        </p>
                        {!configured && (
                          <div className="demo-tools">
                            <h3>Demo tools</h3>
                            <p>
                              Try issuing and managing fictional cards. Changes
                              stay in this browser.
                            </p>
                            <button
                              className="quiet-button"
                              onClick={() => {
                                setDemoAdmin(true);
                                setTab("admin");
                              }}
                            >
                              Open demo club office <ArrowUpRight />
                            </button>
                          </div>
                        )}
                        <button
                          className="quiet-button"
                          onClick={() => void signOut()}
                        >
                          <SignOut /> Sign out
                        </button>
                      </section>
                      <section className="panel">
                        <h2>Take campus with you.</h2>
                        <p>
                          Install Campus Cards for quick access from your home
                          screen.
                        </p>
                        <Pwa />
                        <hr />
                        <h3>Your privacy</h3>
                        <p>
                          Personal cards are not cached for offline viewing.
                          Verification confirms credential status; a screenshot
                          or QR code does not prove the presenter’s identity.
                        </p>
                      </section>
                    </div>
                  </>
                )}
                {tab === "admin" && admin && (
                  <Admin
                    w={demoAdmin ? { ...w, college_admin: true } : w}
                    run={run}
                    demo={!configured}
                  />
                )}
              </>
            )
          )}
        </main>
        <footer className="page-footer">
          <span>Made for the communities that make you.</span>
          <span>
            Campus Cards <span className="footer-star">✳</span>
          </span>
        </footer>
      </div>
      <nav className="mobile-nav" aria-label="Mobile navigation">
        {tabs.map(({ id, name, Icon }) => (
          <button
            key={id}
            aria-current={tab === id ? "page" : undefined}
            onClick={() => setTab(id)}
          >
            <Icon size={23} weight={tab === id ? "fill" : "regular"} />
            <span>{name}</span>
          </button>
        ))}
      </nav>
    </div>
  );
}
