import { expect, test } from "@playwright/test";

const e2eEmail = process.env.E2E_EMAIL;
const e2ePassword = process.env.E2E_PASSWORD;

test.describe("authenticated smoke", () => {
  test.skip(
    !e2eEmail || !e2ePassword,
    "Set E2E_EMAIL and E2E_PASSWORD to enable authenticated smoke coverage."
  );

  test.beforeEach(async ({ page }) => {
    await page.goto("/login");

    await page.getByTestId("login-email-input").fill(e2eEmail!);
    await page.getByTestId("login-password-input").fill(e2ePassword!);
    await page.getByTestId("login-submit-button").click();

    await expect(page).toHaveURL(/\/lounge$/);
    await expect(page.getByTestId("app-sidebar")).toBeVisible();
    await expect(page.getByTestId("lounge-shell")).toBeVisible();
  });

  test("signed-in shell routes stay reachable", async ({ page }) => {
    await expect(page.getByTestId("sidebar-link-rivalries")).toBeVisible();
    await expect(page.getByTestId("sidebar-link-scopes")).toBeVisible();
    await expect(page.getByTestId("sidebar-link-settings")).toBeVisible();
    await expect(page.getByTestId("sidebar-link-lounge")).toBeVisible();

    await page.getByTestId("sidebar-link-rivalries").click();
    await expect(page).toHaveURL(/\/rivalries/);
    await expect(page.getByTestId("rivalries-shell")).toBeVisible();

    await page.getByTestId("sidebar-link-scopes").click();
    await expect(page).toHaveURL(/\/scopes$/);
    await expect(page.getByTestId("scopes-shell")).toBeVisible();

    await page.getByTestId("sidebar-link-settings").click();
    await expect(page).toHaveURL(/\/settings$/);
    await expect(page.getByTestId("settings-shell")).toBeVisible();

    await page.getByTestId("sidebar-link-lounge").click();
    await expect(page).toHaveURL(/\/lounge$/);
    await expect(page.getByTestId("lounge-shell")).toBeVisible();
  });

  test("signed-in core surfaces render without mutating data", async ({ page }) => {
    await expect(
      page
        .locator('[data-testid="lounge-empty-state"], [data-testid="lounge-rivalry-grid"]')
        .first()
    ).toBeVisible();

    await page.getByTestId("sidebar-link-rivalries").click();
    await expect(
      page
        .locator(
          '[data-testid="rivalries-empty-state"], [data-testid="rivalries-selector-grid"]'
        )
        .first()
    ).toBeVisible();

    const rivalryHero = page.getByTestId("rivalries-hero");
    if (await rivalryHero.count()) {
      await expect(rivalryHero).toBeVisible();
    }

    await page.getByTestId("sidebar-link-scopes").click();
    await expect(page.getByTestId("scopes-current-section")).toBeVisible();
    await expect(page.getByTestId("scopes-past-section")).toBeVisible();

    await page.getByTestId("sidebar-link-settings").click();
    await expect(page.getByTestId("settings-form")).toBeVisible();
  });
});
