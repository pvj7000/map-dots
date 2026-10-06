import { test, expect } from "@playwright/test";
import { fixturePreset } from "../fixtures/preset";
import { readFile } from "node:fs/promises";

test("imports and restores a complete preset; rejects bad files without replacing work", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("./");
  await page.getByLabel("Import JSON preset", { exact: true }).setInputFiles({
    name: "offices.json",
    mimeType: "application/json",
    buffer: Buffer.from(JSON.stringify(fixturePreset)),
  });
  await expect(
    page.getByRole("status").filter({ hasText: "Imported offices.json" }),
  ).toBeVisible();
  const map = page.getByLabel("Live map preview");
  await expect(map.locator('[data-pin-count="2"]')).toHaveCount(1);
  await expect(map.locator(".dotmap__pin-segment")).toHaveCount(2);
  await expect(
    map.locator('.dotmap__pin-hit[data-pin="vienna-hq"]'),
  ).toHaveAttribute("aria-label", /Vienna HQ/);
  await map.locator('.dotmap__pin-hit[data-pin="vienna-lab"]').focus();
  await expect(
    map.locator('.dotmap__pin-hit[data-pin="vienna-lab"]'),
  ).toBeFocused();
  await expect
    .poll(() =>
      map
        .locator('.dotmap__pin-hit[data-pin="berlin"]')
        .evaluate(
          (node) => getComputedStyle(node.closest(".dotmap__cluster")!).opacity,
        ),
    )
    .toBe("0.2");
  await page.getByRole("tab", { name: "Export" }).click();
  await page.getByRole("button", { name: "JSON preset", exact: true }).click();
  const code = page.getByLabel("json export code");
  await expect(code).toContainText('"Vienna Lab"');
  expect(JSON.parse((await code.textContent())!)).toEqual(fixturePreset);
  await page.reload();
  await expect(
    page.getByRole("status").filter({ hasText: "Restored your saved map" }),
  ).toBeVisible();
  await page.getByRole("tab", { name: "Export" }).click();
  await page.getByRole("button", { name: "JSON preset", exact: true }).click();
  expect(
    JSON.parse((await page.getByLabel("json export code").textContent())!),
  ).toEqual(fixturePreset);
  await page.getByLabel("Import JSON preset", { exact: true }).setInputFiles({
    name: "bad.json",
    mimeType: "application/json",
    buffer: Buffer.from('{"version":2}'),
  });
  await expect(
    page.getByRole("status").filter({ hasText: "Import failed" }),
  ).toBeVisible();
  expect(
    JSON.parse((await page.getByLabel("json export code").textContent())!),
  ).toEqual(fixturePreset);
  expect(errors).toEqual([]);
});

test("downloaded HTML uses the standalone bundle with matching labels, clusters, geometry, and style", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("./");
  await page.getByLabel("Import JSON preset", { exact: true }).setInputFiles({
    name: "offices.json",
    mimeType: "application/json",
    buffer: Buffer.from(JSON.stringify(fixturePreset)),
  });
  await expect(page.locator('.stage [data-pin-count="2"]')).toHaveCount(1);
  const dotCount = await page.locator(".stage .dotmap__dot").count();
  await page.getByRole("tab", { name: "Export" }).click();
  await page.getByRole("button", { name: "HTML", exact: true }).click();
  const [download] = await Promise.all([
    page.waitForEvent("download"),
    page.getByRole("button", { name: "Download preset" }).click(),
  ]);
  const html = await readFile((await download.path())!, "utf8");
  expect(html).toContain("/map-dots/dotmap.js");
  await page.route("**/standalone.html", (route) =>
    route.fulfill({ contentType: "text/html", body: html }),
  );
  await page.goto("standalone.html");
  await expect(page.locator("dot-map svg")).toHaveAttribute(
    "viewBox",
    "0 0 640 400",
  );
  await expect(page.locator('dot-map [data-pin-count="2"]')).toHaveCount(1);
  await expect(page.locator("dot-map .dotmap__dot")).toHaveCount(dotCount);
  await expect(page.locator("dot-map .dotmap__label text")).toHaveText([
    "Vienna HQ",
    "Vienna Lab",
    "Berlin",
  ]);
  await expect(
    page.locator("dot-map .dotmap__pin-segment").first(),
  ).toHaveAttribute("fill", "#00aabb");
  await page.locator('dot-map .dotmap__pin-hit[data-pin="vienna-lab"]').focus();
  await expect(
    page.locator('dot-map .dotmap__pin-hit[data-pin="vienna-lab"]'),
  ).toBeFocused();
  await expect
    .poll(() =>
      page
        .locator('dot-map .dotmap__pin-hit[data-pin="berlin"]')
        .evaluate(
          (node) => getComputedStyle(node.closest(".dotmap__cluster")!).opacity,
        ),
    )
    .toBe("0.2");
  expect(
    await page
      .locator("dot-map")
      .evaluate((node) =>
        getComputedStyle(node).getPropertyValue("--dotmap-dot-size").trim(),
      ),
  ).toBe("3.25");
  expect(errors).toEqual([]);
});

test("storage restrictions leave the customizer and manual exports usable", async ({
  page,
}) => {
  await page.addInitScript(() =>
    Object.defineProperty(window, "localStorage", {
      get() {
        throw new Error("Storage is blocked");
      },
    }),
  );
  await page.goto("./");
  await expect(
    page.getByRole("status").filter({ hasText: "Could not restore" }),
  ).toBeVisible();
  await page.getByRole("button", { name: /A clean canvas/ }).click();
  await expect(
    page.getByRole("status").filter({ hasText: "Autosave is unavailable" }),
  ).toBeVisible();
  await page.getByRole("tab", { name: "Export" }).click();
  await page.getByRole("button", { name: "JSON preset", exact: true }).click();
  await expect(page.getByLabel("json export code")).toContainText(
    '"version": 1',
  );
});

test("Pages assets work on mobile and the separate custom-element example is included", async ({
  page,
}) => {
  const failed: string[] = [];
  page.on("response", (response) => {
    if (
      response.status() >= 400 &&
      response.url().startsWith("http://127.0.0.1:4173")
    )
      failed.push(response.url());
  });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("./");
  await expect(
    page.getByRole("heading", { name: /A world of dots/ }),
  ).toBeVisible();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
  await page.goto("element.html");
  await expect(page.locator("dot-map svg")).toBeVisible();
  expect(
    await page.locator("dot-map").evaluate(async (node) => {
      const frame = () =>
        new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
      await frame();
      await frame();
      const svg = node.shadowRoot!.querySelector("svg");
      await frame();
      await frame();
      return svg === node.shadowRoot!.querySelector("svg");
    }),
  ).toBe(true);
  expect(failed).toEqual([]);
});
