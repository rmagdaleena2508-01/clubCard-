"use client";
/* Browser-only state is read after hydration to keep static HTML deterministic. */
/* eslint-disable react-hooks/set-state-in-effect */
import Link from "next/link";
import { useEffect, useState } from "react";
import { ShieldCheck, WarningCircle, ArrowLeft } from "@phosphor-icons/react";
import { verify, configured } from "@/lib/data";

export default function Verify() {
  const [result, setResult] =
      useState<Awaited<ReturnType<typeof verify>>>(null),
    [loading, setLoading] = useState(true),
    [error, setError] = useState("");
  async function check() {
    setLoading(true);
    setError("");
    try {
      const token = new URLSearchParams(location.search).get("token") || "";
      setResult(await verify(token));
    } catch {
      setError(
        "Verification is unavailable. Check your connection and try again.",
      );
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => {
    void check();
    const focus = () => void check();
    addEventListener("focus", focus);
    return () => removeEventListener("focus", focus);
  }, []);
  const state = result ? result.status : "invalid";
  return (
    <main className="verification-page">
      <Link href="/">
        <ArrowLeft /> Campus Cards
      </Link>
      <section className="panel verification-panel">
        <span className="eyebrow">CREDENTIAL VERIFICATION</span>
        {loading ? (
          <h1>Checking status…</h1>
        ) : error ? (
          <>
            <WarningCircle size={56} />
            <h1>Unable to verify</h1>
            <p role="alert">{error}</p>
          </>
        ) : !configured ? (
          <>
            <WarningCircle size={56} />
            <h1>Demo credential</h1>
            <p>
              This is a fictional card. It cannot verify a real college
              membership.
            </p>
          </>
        ) : (
          <>
            <ShieldCheck size={56} />
            <h1 className="capitalize">{state} credential</h1>
            {result && (
              <>
                <h2>{result.club}</h2>
                <p>
                  {result.role} · {result.tier} membership
                </p>
                <p>Valid through {result.expires}</p>
              </>
            )}
            <p>
              {state === "valid"
                ? "The issuing club confirms this credential is active."
                : "This credential must not be accepted as an active membership."}
            </p>
          </>
        )}
        <button
          className="primary"
          disabled={loading}
          onClick={() => void check()}
        >
          Check again
        </button>
        <p className="verification-disclaimer">
          This check confirms credential status only. A copied QR code or
          screenshot does not prove the presenter is the owner.
        </p>
      </section>
    </main>
  );
}
