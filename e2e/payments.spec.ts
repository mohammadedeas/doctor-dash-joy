import { test, expect } from "@playwright/test";

test.describe("Payments", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/login");
    await page.fill('input[id="username"]', "e2euser");
    await page.fill('input[id="password"]', "e2epass123");
    await page.click('button[type="submit"]');
    await page.waitForURL("/");
  });

  test("record payment for a visit with treatment", async ({ page }) => {
    await page.goto("/patients");
    await page.click('button:has-text("New Patient")');
    await page.locator('div[role="dialog"] input').first().fill("Payment Test Patient");
    const responsePromise = page.waitForResponse((r) => r.url().includes("/api/patients") && r.status() === 201);
    await page.locator('div[role="dialog"] button:has-text("Add Patient")').click();
    await responsePromise;

    await page.locator("text=Payment Test Patient").first().click();
    await page.waitForLoadState("networkidle");

    await page.getByRole("button", { name: /New visit/i }).click();
    await page.click('button:has-text("Custom")');
    await page.locator('div[role="dialog"] input[placeholder*="Procedure"]').first().fill("E2E Root Canal");
    await page.locator('div[role="dialog"] input[type="number"]').first().fill("1500");
    await page.click('button:has-text("Add Visit")');
    await page.waitForTimeout(500);

    await page.getByRole("button", { name: /New payment/i }).click();
    // Link to visit — the visit combobox is the SECOND combobox in the dialog
    await page.locator('div[role="dialog"] [role="combobox"]').nth(1).click();
    await page.locator('[role="option"]').nth(1).click();

    // Select treatment — Radix Checkbox renders as button[role="checkbox"]
    await page.locator('div[role="dialog"] label:has-text("E2E Root Canal") [role="checkbox"]').click();

    await page.locator('div[role="dialog"] input[type="number"]').first().fill("1500");
    await page.click('button:has-text("Add Payment")');

    await expect(page.locator("text=E2E Root Canal").first()).toBeVisible();
  });
});
