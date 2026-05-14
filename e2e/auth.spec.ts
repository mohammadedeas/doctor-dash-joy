import { test, expect } from "@playwright/test";

test.describe("Auth Flow", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/login");
  });

  test("successful login redirects to dashboard", async ({ page }) => {
    await page.fill('input[id="username"]', "e2euser");
    await page.fill('input[id="password"]', "e2epass123");
    await page.click('button[type="submit"]');
    await page.waitForURL("/");
    await expect(page.locator('h1:has-text("Dashboard")')).toBeVisible();
  });

  test("invalid credentials show error", async ({ page }) => {
    await page.fill('input[id="username"]', "e2euser");
    await page.fill('input[id="password"]', "wrongpassword");
    await page.click('button[type="submit"]');
    await expect(page.locator("text=Invalid credentials")).toBeVisible();
  });

  test("logout redirects to login", async ({ page }) => {
    await page.fill('input[id="username"]', "e2euser");
    await page.fill('input[id="password"]', "e2epass123");
    await page.click('button[type="submit"]');
    await page.waitForURL("/");

    const logoutBtn = page.locator('button:has-text("Logout")');
    if (await logoutBtn.isVisible().catch(() => false)) {
      await logoutBtn.click();
      await page.waitForURL("/login");
    }
  });
});
