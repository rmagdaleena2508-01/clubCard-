/// <reference lib="webworker" />
import { Serwist, CacheFirst, NetworkOnly } from "serwist";
declare const self: ServiceWorkerGlobalScope;
const sw = new Serwist({
  precacheEntries: [
    { url: "/offline.html", revision: "2" },
    { url: "/icon-192.png", revision: "1" },
    { url: "/icon-512.png", revision: "1" },
  ],
  skipWaiting: false,
  clientsClaim: true,
  navigationPreload: true,
  runtimeCaching: [
    {
      matcher: ({ request, url }) =>
        request.method === "POST" ||
        url.pathname.startsWith("/verify") ||
        url.hostname.includes("supabase"),
      handler: new NetworkOnly(),
    },
    {
      matcher: ({ url }) =>
        url.origin === self.location.origin &&
        url.pathname.startsWith("/_next/static/"),
      handler: new CacheFirst({ cacheName: "campus-static-v1" }),
    },
    {
      matcher: ({ request }) => request.mode === "navigate",
      handler: new NetworkOnly(),
      method: "GET",
    },
  ],
  fallbacks: {
    entries: [
      {
        url: "/offline.html",
        matcher: ({ request }) => request.destination === "document",
      },
    ],
  },
});
sw.addEventListeners();
