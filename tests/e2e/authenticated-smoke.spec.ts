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

    await page.getByRole("button", { name: "English", exact: true }).click();
    await page.getByLabel("Email").fill(e2eEmail!);
    await page.getByLabel("Password").fill(e2ePassword!);
    await page
      .getByRole("button", { name: "Enter the Arena", exact: true })
      .click();

    await expect(page).toHaveURL(/\/lounge$/);
  });

  test("signed-in shell routes stay reachable", async ({ page }) => {
    await expect(
      page.getByRole("link", { name: "Rivalries", exact: true })
    ).toBeVisible();

    await page.getByRole("link", { name: "Rivalries", exact: true }).click();
    await expect(page).toHaveURL(/\/rivalries/);

    await page.getByRole("link", { name: "Scopes", exact: true }).click();
    await expect(page).toHaveURL(/\/scopes$/);

    await page.getByRole("link", { name: "Settings", exact: true }).click();
    await expect(page).toHaveURL(/\/settings$/);

    await page.getByRole("link", { name: "Lounge", exact: true }).click();
    await expect(page).toHaveURL(/\/lounge$/);
  });
});
