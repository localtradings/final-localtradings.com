import assert from "node:assert/strict";
import { mkdir } from "node:fs/promises";
import path from "node:path";

import { createClient } from "@supabase/supabase-js";
import { chromium } from "playwright";

const baseUrl = (process.env.E2E_BASE_URL ?? process.env.NEXT_PUBLIC_APP_URL ?? "http://127.0.0.1:3000").replace(/\/$/, "");
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";
const headless = process.env.PLAYWRIGHT_HEADLESS !== "false";

function requireEnv(name, value) {
  assert.ok(value.trim().length > 0, `Missing required environment variable: ${name}`);
}

async function main() {
  requireEnv("NEXT_PUBLIC_SUPABASE_URL", supabaseUrl);
  requireEnv("SUPABASE_SERVICE_ROLE_KEY", serviceRoleKey);

  const admin = createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

  const stamp = Date.now();
  const email = `battle-home-${stamp}@example.com`;
  const password = `BattlePass-${stamp}`;
  const displayName = "Battle Home QA";
  const freeEmail = `battle-home-free-${stamp}@example.com`;
  const freeDisplayName = "Battle Home Free";
  let userId = null;
  let freeUserId = null;

  try {
    const createdUser = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        full_name: displayName,
      },
    });

    if (createdUser.error) {
      throw createdUser.error;
    }

    userId = createdUser.data.user?.id ?? null;
    assert.ok(userId, "Failed to create battle home UI test user");

    const { error: profileError } = await admin.from("profiles").upsert({
      id: userId,
      email,
      full_name: displayName,
      display_name: displayName,
      is_pro: true,
      updated_at: new Date().toISOString(),
    });

    if (profileError) {
      throw profileError;
    }

    const createdFreeUser = await admin.auth.admin.createUser({
      email: freeEmail,
      password,
      email_confirm: true,
      user_metadata: {
        full_name: freeDisplayName,
      },
    });

    if (createdFreeUser.error) {
      throw createdFreeUser.error;
    }

    freeUserId = createdFreeUser.data.user?.id ?? null;
    assert.ok(freeUserId, "Failed to create non-pro battle home UI test user");

    const { error: freeProfileError } = await admin.from("profiles").upsert({
      id: freeUserId,
      email: freeEmail,
      full_name: freeDisplayName,
      display_name: freeDisplayName,
      is_pro: false,
      updated_at: new Date().toISOString(),
    });

    if (freeProfileError) {
      throw freeProfileError;
    }

    const browser = await chromium.launch({ headless });
    const page = await browser.newPage({
      viewport: {
        width: 1440,
        height: 1024,
      },
    });

    const consoleWarnings = [];
    const pageErrors = [];

    page.on("console", (message) => {
      if (message.type() === "warning" || message.type() === "error") {
        consoleWarnings.push(`[${message.type()}] ${message.text()}`);
      }
    });

    page.on("pageerror", (error) => {
      pageErrors.push(error.message);
    });

    await page.goto(`${baseUrl}/sign-in`, { waitUntil: "domcontentloaded", timeout: 60_000 });
    await page.getByLabel("Email").fill(email);
    await page.getByLabel("Password").fill(password);
    await page.getByRole("button", { name: /^Sign In$/ }).click({ noWaitAfter: true });
    await page.waitForURL(/\/app(\/|$)/, { timeout: 60_000 });

    await page.goto(`${baseUrl}/app/battle`, {
      waitUntil: "domcontentloaded",
      timeout: 60_000,
    });
    await page.waitForTimeout(2_000);

    await page.getByRole("button", { name: "Join Public Match" }).waitFor({ state: "visible", timeout: 60_000 });
    await page.getByRole("button", { name: "Join Room" }).waitFor({ state: "visible", timeout: 60_000 });
    await page.getByRole("button", { name: "Host Room" }).waitFor({ state: "visible", timeout: 60_000 });
    await page.getByText("Open Rooms", { exact: true }).first().waitFor({ state: "visible", timeout: 60_000 });
    await page.getByRole("button", { name: /^Recent Results$/ }).waitFor({ state: "visible", timeout: 60_000 });

    assert.equal(
      await page.getByText("15M MATCH", { exact: true }).count(),
      0,
      "Top public-match pills should be removed",
    );

    await page.getByRole("button", { name: /^Recent Results$/ }).click();
    await page.getByText("Your latest 10 official battles").waitFor({ state: "visible", timeout: 60_000 });
    await page.getByRole("button", { name: "Close recent results" }).click();
    await page.getByText("Your latest 10 official battles").waitFor({ state: "hidden", timeout: 60_000 });

    assert.equal(
      await page.getByText("Only Pro users can create open rooms.", { exact: true }).count(),
      0,
      "Pro-only notice should not be permanently visible",
    );

    const desktopHeight = await page.evaluate(() => ({
      innerHeight: window.innerHeight,
      bodyScrollHeight: document.body.scrollHeight,
      bodyClientHeight: document.body.clientHeight,
    }));

    await mkdir(path.join(process.cwd(), "tmp"), { recursive: true });
    const desktopScreenshotPath = path.join(process.cwd(), "tmp", "battle-home-ui-desktop.png");
    await page.screenshot({ path: desktopScreenshotPath, fullPage: false });

    await page.setViewportSize({ width: 1180, height: 780 });
    await page.goto(`${baseUrl}/app/battle`, {
      waitUntil: "domcontentloaded",
      timeout: 60_000,
    });
    await page.waitForTimeout(2_000);

    const laptopScreenshotPath = path.join(process.cwd(), "tmp", "battle-home-ui-laptop.png");
    await page.screenshot({ path: laptopScreenshotPath, fullPage: false });

    const laptopBounds = await Promise.all([
      page.getByRole("button", { name: "Join Public Match" }).boundingBox(),
      page.getByRole("button", { name: "Join Room" }).boundingBox(),
      page.getByRole("button", { name: "Host Room" }).boundingBox(),
      page.getByRole("button", { name: /^Recent Results$/ }).boundingBox(),
    ]);

    assert.ok(laptopBounds.every(Boolean), "Primary battle buttons should remain visible on the laptop viewport");
    assert.ok(
      laptopBounds.every((box) => box && box.y + box.height <= 780),
      "Primary battle actions should remain inside the laptop viewport",
    );

    assert.equal(pageErrors.length, 0, `Browser page errors:\n${pageErrors.join("\n")}`);

    console.log(JSON.stringify({
      ok: true,
      baseUrl,
      desktopHeight,
      warnings: consoleWarnings,
      desktopScreenshotPath,
      laptopScreenshotPath,
    }, null, 2));

    await browser.close();

    const freeBrowser = await chromium.launch({ headless });
    const freePage = await freeBrowser.newPage({
      viewport: {
        width: 1280,
        height: 900,
      },
    });

    await freePage.goto(`${baseUrl}/sign-in`, { waitUntil: "domcontentloaded", timeout: 60_000 });
    await freePage.getByLabel("Email").fill(freeEmail);
    await freePage.getByLabel("Password").fill(password);
    await freePage.getByRole("button", { name: /^Sign In$/ }).click({ noWaitAfter: true });
    await freePage.waitForURL(/\/app(\/|$)/, { timeout: 60_000 });
    await freePage.goto(`${baseUrl}/app/battle`, { waitUntil: "domcontentloaded", timeout: 60_000 });
    await freePage.waitForTimeout(2_000);
    await freePage.getByLabel("Host room visibility").selectOption("open");
    await freePage.getByRole("button", { name: "Host Room" }).click();
    await freePage.getByText("Only Pro users can create open rooms.").waitFor({ state: "visible", timeout: 60_000 });
    await freeBrowser.close();
  } finally {
    if (userId) {
      await admin.auth.admin.deleteUser(userId);
    }

    if (freeUserId) {
      await admin.auth.admin.deleteUser(freeUserId);
    }
  }
}

await main();
