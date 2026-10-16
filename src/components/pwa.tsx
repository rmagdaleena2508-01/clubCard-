"use client";
/* Browser-only state is read after hydration to keep static HTML deterministic. */
/* eslint-disable react-hooks/set-state-in-effect */
import { useEffect, useState } from "react";
import { DownloadSimple, ArrowClockwise } from "@phosphor-icons/react";
type InstallEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: string }>;
};
export function Pwa() {
  const [prompt, setPrompt] = useState<InstallEvent | null>(null),
    [installed, setInstalled] = useState(false),
    [help, setHelp] = useState(false),
    [ios, setIos] = useState(false),
    [waiting, setWaiting] = useState<ServiceWorker | null>(null);
  useEffect(() => {
    setInstalled(matchMedia("(display-mode: standalone)").matches);
    setIos(
      /iPad|iPhone|iPod/.test(navigator.userAgent) ||
        (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1),
    );
    const install = (e: Event) => {
      e.preventDefault();
      setPrompt(e as InstallEvent);
    };
    const done = () => setInstalled(true);
    addEventListener("beforeinstallprompt", install);
    addEventListener("appinstalled", done);
    let reload = false;
    let controlled = !!navigator.serviceWorker?.controller;
    const control = () => {
      if (!reload && controlled) {
        reload = true;
        location.reload();
      }
      controlled = true;
    };
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker
        .register("/sw.js")
        .then((r) => {
          if (r.waiting) setWaiting(r.waiting);
          r.addEventListener("updatefound", () => {
            const worker = r.installing;
            worker?.addEventListener("statechange", () => {
              if (
                worker.state === "installed" &&
                navigator.serviceWorker.controller
              )
                setWaiting(worker);
            });
          });
        })
        .catch(() => {});
      navigator.serviceWorker.addEventListener("controllerchange", control);
    }
    return () => {
      removeEventListener("beforeinstallprompt", install);
      removeEventListener("appinstalled", done);
      navigator.serviceWorker?.removeEventListener("controllerchange", control);
    };
  }, []);
  return (
    <>
      {waiting && (
        <button
          className="update-banner"
          onClick={() => waiting.postMessage({ type: "SKIP_WAITING" })}
        >
          <ArrowClockwise /> Update available · Reload
        </button>
      )}
      {!installed && (
        <>
          <button
            className="install-link"
            onClick={async () => {
              if (prompt) {
                await prompt.prompt();
                const c = await prompt.userChoice;
                if (c.outcome === "accepted") setInstalled(true);
                setPrompt(null);
              } else setHelp(!help);
            }}
          >
            <DownloadSimple size={17} /> Install app <span>↗</span>
          </button>
          {help && (
            <p className="install-help">
              {ios
                ? "In Safari, open Share, then choose Add to Home Screen and confirm Add."
                : "Open your browser menu and choose Install app or Add to Home Screen. If unavailable, use a supported browser over HTTPS."}
            </p>
          )}
        </>
      )}
    </>
  );
}
