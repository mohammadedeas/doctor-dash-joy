import { test, expect } from "@playwright/test";

test.describe("Appointments", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/login");
    await page.fill('input[id="username"]', "e2euser");
    await page.fill('input[id="password"]', "e2epass123");
    await page.click('button[type="submit"]');
    await page.waitForURL("/");
  });

  test("create appointment from calendar", async ({ page }) => {
    // Ensure patient exists first
    await page.goto("/patients");
    await page.click('button:has-text("New Patient")');
    await page.locator('div[role="dialog"] input').first().fill("Appt Patient");
    const responsePromise = page.waitForResponse((r) => r.url().includes("/api/patients") && r.status() === 201);
    await page.locator('div[role="dialog"] button:has-text("Add Patient")').click();
    await responsePromise;

    await page.goto("/calendar");
    await page.click('button:has-text("New")');

    // Switch to Details tab to select patient
    await page.click('button:has-text("Details")');
    await page.locator('div[role="dialog"] [role="combobox"]').first().click();
    await page.locator('[role="option"]').first().click();

    // Switch back to Scheduling tab to set date and visit type
    await page.click('button:has-text("Scheduling")');
    await page.fill('input[type="date"]', "2026-09-20");
    await page.fill('input[placeholder*="Cleaning"]', "Consultation");

    await page.click('button:has-text("Add Appointment")');
    await expect(page.locator("text=Appointment added").first()).toBeVisible();
  });
});
