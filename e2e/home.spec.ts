import { expect, test } from "@playwright/test";

test("home shows composer and empty gallery", async ({ page }) => {
  await page.goto("/");

  await expect(
    page.getByRole("heading", { name: "WEB-Clipboard" }),
  ).toBeVisible();
  await expect(page.getByTestId("capture-title")).toBeVisible();
  await expect(page.getByTestId("paste-button")).toBeVisible();
  await expect(page.getByTestId("empty-gallery")).toBeVisible();
});
