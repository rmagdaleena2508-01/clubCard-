"use client";
import { useRef, type PointerEvent } from "react";
import { cn } from "@/lib/utils";
import { motion, useReducedMotion } from "motion/react";
import {
  Asterisk,
  Code,
  Aperture,
  SealCheck,
  ArrowUpRight,
} from "@phosphor-icons/react";
import { QRCodeSVG } from "qrcode.react";
import { type Card, type Club, status } from "@/lib/model";
import { haptic } from "@/lib/haptics";
export function ClubMark({ club, size = 30 }: { club: Club; size?: number }) {
  const Icon =
    club.symbol === "Code"
      ? Code
      : club.symbol === "Aperture"
        ? Aperture
        : Asterisk;
  return <Icon size={size} weight="regular" aria-hidden="true" />;
}
export function MetalCard({
  card,
  club,
  back = false,
  origin = "",
  onFlip,
}: {
  card: Card;
  club: Club;
  back?: boolean;
  origin?: string;
  onFlip?: (back: boolean) => void;
}) {
  const tilt = useRef<HTMLDivElement>(null),
    shine = useRef<HTMLDivElement>(null),
    bounds = useRef<DOMRect | null>(null),
    gesture = useRef<{
      id: number;
      x: number;
      y: number;
      dx: number;
      horizontal: boolean;
    } | null>(null),
    suppressClick = useRef(0),
    reduced = useReducedMotion();
  function reset() {
    if (tilt.current)
      tilt.current.style.transform = "rotateX(0deg) rotateY(0deg) scale(1)";
    if (shine.current) shine.current.style.transform = "translateX(0%)";
  }
  function turn() {
    if (performance.now() < suppressClick.current) return;
    haptic(16);
    reset();
    onFlip?.(!back);
  }
  function down(e: PointerEvent<HTMLDivElement>) {
    if (
      !onFlip ||
      !e.isPrimary ||
      gesture.current ||
      (e.target as HTMLElement).closest("a")
    )
      return;
    bounds.current = e.currentTarget.getBoundingClientRect();
    gesture.current = {
      id: e.pointerId,
      x: e.clientX,
      y: e.clientY,
      dx: 0,
      horizontal: false,
    };
    haptic(10);
    if (!reduced && tilt.current) tilt.current.style.transform = "scale(.985)";
  }
  function move(e: PointerEvent<HTMLDivElement>) {
    if (document.hidden || reduced) return;
    const g = gesture.current,
      b = bounds.current;
    if (!b) return;
    if (g && g.id === e.pointerId) {
      const dx = e.clientX - g.x,
        dy = e.clientY - g.y;
      if (!g.horizontal && Math.abs(dy) > Math.abs(dx) && Math.abs(dy) > 12) {
        gesture.current = null;
        reset();
        return;
      }
      if (Math.abs(dx) > 10 && Math.abs(dx) > Math.abs(dy)) {
        if (!g.horizontal) {
          g.horizontal = true;
          e.currentTarget.setPointerCapture(e.pointerId);
          haptic(8);
        }
        g.dx = dx;
        const angle = Math.max(-55, Math.min(55, dx / 3));
        if (tilt.current)
          tilt.current.style.transform = `rotateY(${angle}deg) scale(.985)`;
      }
      return;
    }
    if (
      e.pointerType === "touch" ||
      back ||
      !matchMedia("(hover:hover) and (pointer:fine)").matches
    )
      return;
    const x = (e.clientX - b.left) / b.width,
      y = (e.clientY - b.top) / b.height;
    if (tilt.current)
      tilt.current.style.transform = `rotateX(${(0.5 - y) * 12}deg) rotateY(${(x - 0.5) * 16}deg)`;
    if (shine.current)
      shine.current.style.transform = `translateX(${(x - 0.5) * 35}%)`;
  }
  function up(e: PointerEvent<HTMLDivElement>) {
    const g = gesture.current;
    if (!g || g.id !== e.pointerId) return;
    gesture.current = null;
    if (g.horizontal) {
      suppressClick.current = performance.now() + 350;
      if (Math.abs(g.dx) > 48) {
        haptic(16);
        onFlip?.(!back);
      }
    }
    if (e.currentTarget.hasPointerCapture(e.pointerId))
      e.currentTarget.releasePointerCapture(e.pointerId);
    reset();
  }
  return (
    <motion.div
      className="card-perspective"
      key={card.id}
      initial={false}
      animate={{ opacity: 1 }}
      role="group"
      aria-label={`${club.name} ${card.tier} membership card`}
      onPointerEnter={(e) => {
        bounds.current = e.currentTarget.getBoundingClientRect();
        if (e.pointerType === "mouse") haptic(6);
      }}
      onPointerDown={down}
      onPointerMove={move}
      onPointerUp={up}
      onPointerCancel={() => {
        gesture.current = null;
        reset();
      }}
      onPointerLeave={() => {
        if (!gesture.current) reset();
      }}
    >
      <div className="card-tilt" ref={tilt}>
        <motion.div
          className="card-flipper"
          data-back={back}
          initial={false}
          animate={{
            transform: reduced
              ? "rotateY(0deg)"
              : back
                ? "rotateY(-180deg)"
                : "rotateY(0deg)",
          }}
          transition={
            reduced
              ? { duration: 0 }
              : { type: "spring", duration: 0.5, bounce: 0.2 }
          }
        >
          <div
            className={cn("metal-card", "card-front", card.tier)}
            aria-hidden={back}
            inert={back}
          >
            <div className="card-shine" ref={shine} aria-hidden="true" />
            <div className="card-top">
              <div className="card-brand">
                <ClubMark club={club} size={32} />
                <span>{club.name}</span>
              </div>
              <span className="card-tier">{card.tier}</span>
            </div>
            <div className="card-middle">
              <span className="embossed-seal">
                <ClubMark club={club} size={104} />
              </span>
              <span className="card-college">
                NORTHFIELD
                <br />
                COLLEGE
              </span>
              <span className="credential-label">CLUB MEMBERSHIP</span>
            </div>
            <div className="card-bottom">
              <div>
                <span className="card-name">{card.name}</span>
                <span className="card-role">{card.role}</span>
              </div>
              <SealCheck size={25} weight="light" aria-hidden="true" />
            </div>
            <div className="card-foot">
              <span>{card.number}</span>
              <span>{card.term}</span>
            </div>
            {onFlip && (
              <button
                className="card-touch-surface"
                aria-label={`Flip ${club.name} card`}
                onClick={turn}
                tabIndex={back ? -1 : 0}
              />
            )}
          </div>
          <div
            className={cn("metal-card", "card-back", card.tier)}
            aria-hidden={!back}
            inert={!back}
          >
            <div className="back-info">
              <span className="eyebrow">MEMBERSHIP CREDENTIAL</span>
              <strong>{card.name}</strong>
              <p>{club.name}</p>
              <dl>
                <div>
                  <dt>Issued</dt>
                  <dd>{card.issued}</dd>
                </div>
                <div>
                  <dt>Valid through</dt>
                  <dd>{card.expires}</dd>
                </div>
                <div>
                  <dt>Status</dt>
                  <dd className="capitalize">{status(card)}</dd>
                </div>
              </dl>
              {onFlip && (
                <button
                  className="back-flip"
                  onClick={turn}
                  tabIndex={back ? 0 : -1}
                >
                  Turn to front
                </button>
              )}
            </div>
            <a
              className="qr"
              href={`/verify/?token=${encodeURIComponent(card.token)}`}
              aria-label="Verify card — open verification"
              tabIndex={back ? 0 : -1}
            >
              <QRCodeSVG
                value={`${origin}/verify/?token=${card.token}`}
                size={112}
                level="M"
                marginSize={2}
              />
              <span>
                Verify card <ArrowUpRight size={12} />
              </span>
            </a>
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
}
