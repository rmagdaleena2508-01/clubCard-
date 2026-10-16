import { chromium } from "@playwright/test";
const browser = await chromium.launch();
const page = await browser.newPage({
  viewport: { width: 1440, height: 1080 },
  deviceScaleFactor: 1,
});
await page.goto("http://127.0.0.1:3000");
await page.locator(".card-front").waitFor();
await page.emulateMedia({ reducedMotion: "reduce" });
await page.screenshot({ path: "docs/wallet-desktop.png", fullPage: true });
await page
  .getByRole("button", { name: "Magdaleena · Demo", exact: true })
  .click();
await page.getByRole("button", { name: "Open demo club office" }).click();
await page.getByRole("heading", { name: "Make it official." }).waitFor();
await page.screenshot({ path: "docs/admin-desktop.png", fullPage: true });
await page.reload();
await page.locator(".card-front").waitFor();
await page.setViewportSize({ width: 393, height: 852 });
await page.screenshot({ path: "docs/wallet-mobile.png", fullPage: true });
await browser.close();
