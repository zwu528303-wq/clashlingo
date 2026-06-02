import { expect, test } from "@playwright/test";

test.describe("public smoke", () => {
  test("logged-out home page renders the soft-launch landing page", async ({
    page,
  }) => {
    await page.goto("/");

    await expect(
      page.getByRole("heading", { name: "ClashLingo", exact: true })
    ).toBeVisible();
    await expect(
      page.getByRole("link", { name: "Start learning", exact: true })
    ).toBeVisible();
    await expect(
      page.getByText("Scenario Map", { exact: true }).first()
    ).toBeVisible();
    await expect(
      page.getByText("Practice solo first, challenge a friend when you want.", {
        exact: true,
      }).first()
    ).toBeVisible();
  });

  test("login page renders and lets a visitor reach the guide", async ({
    page,
  }) => {
    await page.goto("/login");

    await expect(
      page.getByRole("heading", { name: "ClashLingo", exact: true })
    ).toBeVisible();
    await expect(
      page.getByRole("button", { name: "English", exact: true })
    ).toBeVisible();

    await page.getByRole("button", { name: "English", exact: true }).click();

    await expect(
      page.getByRole("button", { name: "Enter the Arena", exact: true })
    ).toBeVisible();

    await page
      .getByRole("link", { name: "Open Full Guide", exact: true })
      .click();

    await expect(page).toHaveURL(/\/how-it-works$/);
    await expect(
      page.getByRole("heading", {
        name: "ClashLingo, explained simply",
        exact: true,
      })
    ).toBeVisible();
  });

  test("reset-password screen renders without crashing", async ({ page }) => {
    await page.goto("/reset-password");

    await expect(
      page.getByRole("heading", {
        name: /Choose a new password|重设密码|选择一个新密码/,
      })
    ).toBeVisible();
    await expect(
      page.getByRole("heading", {
        name: /Open this page from your reset email|请从重设邮件打开此页/,
      })
    ).toBeVisible();
  });
});
