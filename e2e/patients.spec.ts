import { test, expect } from "@playwright/test";

test.describe("Patients", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/login");
    await page.fill('input[id="username"]', "e2euser");
    await page.fill('input[id="password"]', "e2epass123");
    await page.click('button[type="submit"]');
    await page.waitForURL("/");
    await page.goto("/patients");
  });

  test("add a new patient", async ({ page }) => {
    await page.click('button:has-text("New Patient")');
    // Fill the "Full name" input (first input in the dialog)
    await page.locator('div[role="dialog"] input').first().fill("E2E Test Patient");
    const responsePromise = page.waitForResponse((r) => r.url().includes("/api/patients") && r.status() === 201);
    await page.locator('div[role="dialog"] button:has-text("Add Patient")').click();
    await responsePromise;
    await expect(page.locator("text=E2E Test Patient").first()).toBeVisible();
  });

  test("search filters patients", async ({ page }) => {
    // Ensure at least one patient exists so we test filtering, not empty state
    await page.click('button:has-text("New Patient")');
    await page.locator('div[role="dialog"] input').first().fill("Searchable Patient");
    const responsePromise = page.waitForResponse((r) => r.url().includes("/api/patients") && r.status() === 201);
    await page.locator('div[role="dialog"] button:has-text("Add Patient")').click();
    await responsePromise;

    await page.fill('input[placeholder*="Search" i]', "NonExistentName");
    await expect(page.locator("text=No patients match your search").first()).toBeVisible();
  });
});
