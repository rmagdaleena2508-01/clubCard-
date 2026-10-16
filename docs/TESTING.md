# Test record

Checked on macOS on 16 October 2026.

## Passed

- Production static build (`npm run build`, Webpack).
- TypeScript check.
- ESLint.
- Real SQL migration and permission tests using PGlite.
- Desktop Chromium: card colors, QR side, demo invite/accept/revoke flow, saved state after reload, dialog focus and Escape, narrow-screen overflow, reduced motion, clean header, mounted card faces, and horizontal mouse drag.
- iPhone-sized WebKit: card colors, QR side, demo invite/accept/revoke flow, saved state, dialog focus, narrow-screen overflow, reduced motion, clean header, and mounted card faces.
- axe: no serious or critical findings on the wallet and invite dialog in both browser projects.
- Chromium: service worker, manifest, offline page, and no personal data/verification responses in the cache.

The first full run of the new design had 15 passing checks, two skipped checks, and one failed check. The failed offline test found a missing UTF-8 declaration. That was fixed. The offline and card/QR checks then passed in a focused Chromium rerun. The QR arrow sizing was also fixed after visual review.

## Database checks

The real SQL files were loaded in a fresh PGlite PostgreSQL instance. Test-only `auth.users`, `auth.uid()`, and storage metadata stand in for the Supabase platform. Calls were made as `authenticated` and `anon` roles, not just as the database owner.

Passed: invited-email matching, acceptance, one-time invite use, no member self-promotion, no direct table writes, no cross-club admin writes, member isolation, public response privacy, card replacement, revoked old tokens, invalid tokens, and server-computed expired status.

This checks SQL behavior. It does not prove Supabase email delivery, live deployment settings, or production auth integration.

## Skipped or not yet checked

- Real iPhone and Android hardware.
- Real phone vibration. iPhone Safari lacks the standard Vibration API.
- Native touch swiping on real hardware. Mouse drag was tested; touch layout and tap behavior were checked in WebKit.
- Actual Add to Home Screen and standalone launch on phones.
- WebKit offline test: skipped because installed iOS PWA behavior needs real-device coverage.
- Supabase sign-in emails and live invite links: no project keys were supplied.
- QR scanning with a phone camera.
- Production abuse/rate-limit behavior and load tests.
- Complete WCAG conformance. Automated checks are a useful subset, not a full audit.

## Dependency check

`npm audit --omit=dev` reported zero runtime vulnerabilities at setup. The full audit reported five high-severity development-tool findings through the ESLint/fast-glob/micromatch/braces chain. npm proposed an unrelated major downgrade of the Next ESLint config, so that was not applied. Recheck upstream fixes before a production release. These tools do not ship in the static app.

## Repeat it

```bash
npm ci
npm run typecheck
npm run lint
npm run test:db
npm run build
npx playwright install chromium webkit
npm test
```

GitHub Actions repeats these checks on pushes and pull requests. Local screenshot files are made with `node scripts/screenshots.mjs` while `npm start` is running.

## Magdaleena wallet update — October 16, 2026

The local wallet now has two gold cards for Magdaleena: CSI Vice President and EDC IML Ambassador. Both run from June 1, 2026 through June 30, 2029. The CSI image loads from the supplied file. The EDC rocket image needs to be uploaded again; its temporary attachment path no longer exists.

Validation: production build, TypeScript, and ESLint passed. Playwright passed 16 tests across desktop Chromium and iPhone-sized WebKit. Two checks remain skipped in WebKit: installed-PWA offline behavior and native touch pointer capture. These are automated browser checks, not tests on a physical iPhone or Android phone. Updated screenshots show the wallet and demo office. SQL and live authentication were not changed in this update.
