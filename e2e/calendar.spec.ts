import { test, expect } from "@playwright/test";

test.describe("Calendar", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/login");
    await page.fill('input[id="username"]', "e2euser");
    await page.fill('input[id="password"]', "e2epass123");
    await page.click('button[type="submit"]');
    await page.waitForURL("/");
    await page.goto("/calendar");
  });

  test("calendar page loads with toolbar", async ({ page }) => {
    await expect(page.locator('button:has-text("Today")')).toBeVisible();
    await expect(page.locator('button:has-text("Week")')).toBeVisible();
    await expect(page.locator('button:has-text("New")')).toBeVisible();
  });

  test("switching views works", async ({ page }) => {
    await page.getByRole("button", { name: "Month" }).click();
    await expect(page.getByRole("button", { name: "Month" })).toBeVisible();
    await page.getByRole("button", { name: "Day", exact: true }).click();
    await expect(page.getByRole("button", { name: "Day", exact: true })).toBeVisible();
    // Verify calendar content is rendered
    await expect(page.locator(".fc").first()).toBeVisible();
  });
});
