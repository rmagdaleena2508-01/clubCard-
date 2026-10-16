import { type Page, test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
async function openOffice(page: Page) {
  await page
    .getByRole("button", { name: "Magdaleena · Demo", exact: true })
    .click();
  await page.getByRole("button", { name: "Open demo club office" }).click();
}

test("personal wallet switches gold clubs, flips to QR, and marks demo verification", async ({
  page,
}) => {
  await page.goto("/");
  await expect(
    page.getByRole("heading", {
      name: "Every community you’re part of, in one place.",
    }),
  ).toBeVisible();
  await expect(page.locator(".card-front")).toHaveClass(/gold/);
  await expect(page.locator(".card-name")).toHaveText("Magdaleena");
  await expect(page.locator(".card-role")).toHaveText("Vice President");
  await expect(page.locator(".card-brand img")).toHaveAttribute(
    "src",
    "/logos/csi.png",
  );
  await page
    .getByRole("button", {
      name: "Select Entrepreneurship Development Cell, gold",
    })
    .click();
  await expect(page.locator(".card-front")).toHaveClass(/gold/);
  await expect(page.locator(".card-role")).toHaveText("IML Ambassador");
  await expect(page.locator(".card-brand")).toContainText(
    "Entrepreneurship Development Cell",
  );
  await expect(page.locator(".card-back")).toContainText("2029-06-30");
  await page.getByRole("button", { name: "Flip card" }).click();
  await page
    .getByRole("link", { name: "Verify card — open verification" })
    .click();
  await expect(
    page.getByRole("heading", { name: "Demo credential" }),
  ).toBeVisible();
});
test("admin issues invitation, accepts it, persists, and revokes a card", async ({
  page,
}) => {
  await page.goto("/");
  await openOffice(page);
  await page.getByRole("button", { name: "Issue a card", exact: true }).click();
  const dialog = page.getByRole("dialog");
  await dialog.getByLabel("Full name").fill("Ananya Rao");
  await dialog.getByLabel("College email").fill("ananya@example.test");
  await dialog.getByRole("button", { name: "Create invitation" }).click();
  await expect(dialog).toBeHidden();
  await page.getByRole("button", { name: "invitations", exact: true }).click();
  await page.getByRole("button", { name: "Simulate acceptance" }).click();
  await page.reload();
  await openOffice(page);
  const row = page.locator(".member-row").filter({ hasText: "Ananya Rao" });
  await expect(row).toBeVisible();
  await row.getByRole("button", { name: "Revoke", exact: true }).click();
  await page
    .getByRole("alertdialog")
    .getByRole("button", { name: "Revoke card", exact: true })
    .click();
  await expect(row.locator(".status")).toHaveText("revoked");
  await page.reload();
  await openOffice(page);
  await expect(
    page
      .locator(".member-row")
      .filter({ hasText: "Ananya Rao" })
      .locator(".status"),
  ).toHaveText("revoked");
});
test("dialog traps focus and closes with Escape", async ({ page }) => {
  await page.goto("/");
  await openOffice(page);
  await page.getByRole("button", { name: "Issue a card", exact: true }).click();
  await expect(page.getByRole("dialog")).toBeVisible();
  for (let i = 0; i < 10; i++) {
    await page.keyboard.press("Tab");
    expect(
      await page.evaluate(
        () => !!document.activeElement?.closest('[role="dialog"]'),
      ),
    ).toBe(true);
  }
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog")).toBeHidden();
});
test("narrow layout has no horizontal overflow and reduced motion is static", async ({
  page,
}) => {
  await page.setViewportSize({ width: 360, height: 800 });
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  await expect(page.locator(".card-front")).toBeVisible();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  expect(
    await page
      .locator(".card-front")
      .evaluate((el) => getComputedStyle(el).transform),
  ).toBe("none");
});
test("wallet has no serious accessibility violations", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator(".card-front")).toBeVisible();
  const results = await new AxeBuilder({ page }).analyze();
  expect(
    results.violations.filter((v) =>
      ["critical", "serious"].includes(v.impact || ""),
    ),
  ).toEqual([]);
});
test("admin has no serious accessibility violations", async ({ page }) => {
  await page.goto("/");
  await openOffice(page);
  await page.getByRole("button", { name: "Issue a card", exact: true }).click();
  const results = await new AxeBuilder({ page }).analyze();
  expect(
    results.violations.filter((v) =>
      ["critical", "serious"].includes(v.impact || ""),
    ),
  ).toEqual([]);
});
test("manifest and offline shell are valid without caching personal cards", async ({
  page,
  context,
  browserName,
}) => {
  test.skip(
    browserName === "webkit",
    "WebKit automation service-worker support differs from installed iOS PWA.",
  );
  await page.goto("/");
  await page.evaluate(() => navigator.serviceWorker.ready);
  await page.reload();
  await expect(page.locator(".card-front")).toBeVisible();
  const manifest = await (
    await page.request.get("/manifest.webmanifest")
  ).json();
  expect(manifest.display).toBe("standalone");
  await context.setOffline(true);
  await page.goto("/clubs-offline-check/");
  await expect(
    page.getByRole("heading", { name: "You’re offline." }),
  ).toBeVisible();
  expect(
    await page.evaluate(async () => {
      const keys = await caches.keys();
      const urls = (
        await Promise.all(
          keys.map(async (k) =>
            (await (await caches.open(k)).keys()).map((r) => r.url),
          ),
        )
      ).flat();
      return urls.some((u) => u.includes("/verify/") || u.includes("supabase"));
    }),
  ).toBe(false);
});

test("clean header and card flip keep both faces mounted", async ({ page }) => {
  await page.goto("/");
  await expect(
    page.getByRole("button", { name: "Magdaleena · Demo", exact: true }),
  ).toBeVisible();
  await expect(page.getByText("Your campus, connected.")).toHaveCount(0);
  await expect(page.getByText("ACADEMIC YEAR")).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Explore admin" })).toHaveCount(
    0,
  );
  await expect(page.getByRole("heading", { name: "Your wallet." })).toHaveCount(
    0,
  );
  await page
    .getByRole("button", {
      name: "Flip Computer Society of India student chapter card",
      exact: true,
    })
    .click();
  await expect(page.locator(".card-flipper")).toHaveAttribute(
    "data-back",
    "true",
  );
  await expect(page.locator(".card-back")).toHaveAttribute(
    "aria-hidden",
    "false",
  );
  await expect(page.locator(".card-front")).toHaveCount(1);
  await page.getByRole("button", { name: "View front", exact: true }).click();
  await expect(page.locator(".card-flipper")).toHaveAttribute(
    "data-back",
    "false",
  );
});
test("horizontal drag turns a card", async ({ page, isMobile }) => {
  test.skip(
    isMobile,
    "Synthetic touch cannot exercise native pointer capture. Real phone swipe needs device QA.",
  );
  await page.goto("/");
  const card = page.locator(".card-perspective");
  const box = await card.boundingBox();
  if (!box) throw new Error("No card");
  await page.mouse.move(box.x + box.width * 0.75, box.y + box.height * 0.5);
  await page.mouse.down();
  await page.mouse.move(box.x + box.width * 0.3, box.y + box.height * 0.5, {
    steps: 8,
  });
  await page.mouse.up();
  await expect(page.locator(".card-flipper")).toHaveAttribute(
    "data-back",
    "true",
  );
});
