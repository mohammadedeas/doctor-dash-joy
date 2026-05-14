import { test, expect } from "@playwright/test";

test.describe("Visits", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/login");
    await page.fill('input[id="username"]', "e2euser");
    await page.fill('input[id="password"]', "e2epass123");
    await page.click('button[type="submit"]');
    await page.waitForURL("/");
  });

  test("create visit from patient detail", async ({ page }) => {
    await page.goto("/patients");
    await page.click('button:has-text("New Patient")');
    await page.locator('div[role="dialog"] input').first().fill("Visit Test Patient");
    const responsePromise = page.waitForResponse((r) => r.url().includes("/api/patients") && r.status() === 201);
    await page.locator('div[role="dialog"] button:has-text("Add Patient")').click();
    await responsePromise;

    await page.locator("text=Visit Test Patient").first().click();
    await page.waitForLoadState("networkidle");

    await page.getByRole("button", { name: /New visit/i }).click();

    // Add procedure
    await page.click('button:has-text("Custom")');
    await page.locator('div[role="dialog"] input[placeholder*="Procedure"]').first().fill("E2E Cleaning");
    await page.locator('div[role="dialog"] input[type="number"]').first().fill("250");

    await page.click('button:has-text("Add Visit")');
    await expect(page.locator("text=E2E Cleaning").first()).toBeVisible();
  });
});
