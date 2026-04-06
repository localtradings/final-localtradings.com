import assert from "node:assert/strict";

import { createClient } from "@supabase/supabase-js";
import { chromium } from "playwright";

const baseUrl = (process.env.E2E_BASE_URL ?? process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000").replace(/\/$/, "");
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";
const headless = process.env.PLAYWRIGHT_HEADLESS !== "false";

function requireEnv(name, value) {
  assert.ok(value.trim().length > 0, `Missing required environment variable: ${name}`);
}

function buildDisposableUsers() {
  const stamp = Date.now();
  const password = `BattlePass-${stamp}`;

  return {
    password,
    users: [
      {
        email: `codex-battle-a-${stamp}@example.com`,
        displayName: "Codex Battle A",
      },
      {
        email: `codex-battle-b-${stamp}@example.com`,
        displayName: "Codex Battle B",
      },
    ],
  };
}

async function createDisposableUsers(admin, spec) {
  const created = [];

  for (const user of spec.users) {
    const { data, error } = await admin.auth.admin.createUser({
      email: user.email,
      password: spec.password,
      email_confirm: true,
      user_metadata: {
        full_name: user.displayName,
      },
    });

    if (error) {
      throw error;
    }

    const userId = data.user?.id;
    assert.ok(userId, `Supabase did not return a user id for ${user.email}`);

    const { error: profileError } = await admin.from("profiles").upsert({
      id: userId,
      email: user.email,
      full_name: user.displayName,
      display_name: user.displayName,
      focus_area: "Battle E2E",
      bio: "Disposable browser test account",
      updated_at: new Date().toISOString(),
    });

    if (profileError) {
      throw profileError;
    }

    created.push({
      ...user,
      id: userId,
      password: spec.password,
    });
  }

  return created;
}

async function deleteDisposableUsers(admin, users) {
  await Promise.all(
    users.map(async (user) => {
      if (!user?.id) {
        return;
      }

      await admin.auth.admin.deleteUser(user.id);
    }),
  );
}

async function signIn(page, user) {
  await page.goto(`${baseUrl}/sign-in`, { waitUntil: "domcontentloaded", timeout: 60_000 });
  await page.getByLabel("Email").fill(user.email);
  await page.getByLabel("Password").fill(user.password);
  await Promise.all([
    page.waitForURL(/\/app(\/|$)/, { timeout: 60_000 }),
    page.getByRole("button", { name: /^Sign In$/ }).click(),
  ]);
}

function extractRoomCode(bodyText) {
  return bodyText.match(/ROOM CODE\s+([A-Z0-9]{4,12})/)?.[1] ?? null;
}

async function waitForPlayerState(admin, roomId, userId, predicate, message, timeoutMs = 20_000) {
  const deadline = Date.now() + timeoutMs;

  while (Date.now() < deadline) {
    const result = await admin
      .from("battle_room_players")
      .select("user_id, has_open_trade, trades_closed")
      .eq("room_id", roomId)
      .eq("user_id", userId)
      .maybeSingle();

    if (result.error) {
      throw result.error;
    }

    if (result.data && predicate(result.data)) {
      return result.data;
    }

    await new Promise((resolve) => setTimeout(resolve, 500));
  }

  throw new Error(message);
}

async function runBattleFlow() {
  requireEnv("NEXT_PUBLIC_SUPABASE_URL", supabaseUrl);
  requireEnv("SUPABASE_SERVICE_ROLE_KEY", serviceRoleKey);

  const admin = createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

  const spec = buildDisposableUsers();
  const createdUsers = await createDisposableUsers(admin, spec);
  const browser = await chromium.launch({ headless });

  try {
    const pages = await Promise.all([
      browser.newContext().then((context) => context.newPage()),
      browser.newContext().then((context) => context.newPage()),
    ]);

    const [pageA, pageB] = pages;
    const consoleWarnings = [];
    const pageErrors = [];

    for (const [index, page] of pages.entries()) {
      const label = index === 0 ? "A" : "B";
      page.on("console", (message) => {
        if (message.type() === "warning" || message.type() === "error") {
          consoleWarnings.push(`[${label}:${message.type()}] ${message.text()}`);
        }
      });
      page.on("pageerror", (error) => {
        pageErrors.push(`[${label}] ${error.message}`);
      });
    }

    await Promise.all([
      signIn(pageA, createdUsers[0]),
      signIn(pageB, createdUsers[1]),
    ]);

    await Promise.all([
      pageA.goto(`${baseUrl}/app/battle`, { waitUntil: "domcontentloaded", timeout: 60_000 }),
      pageB.goto(`${baseUrl}/app/battle`, { waitUntil: "domcontentloaded", timeout: 60_000 }),
    ]);

    await pageA.getByRole("button", { name: "Create Private Room" }).click();
    await pageA.waitForURL(/\/app\/battle\/lobby\//, { timeout: 60_000 });
    await pageA.waitForTimeout(1_500);

    const roomId = pageA.url().split("/").pop();
    assert.ok(roomId, "Host lobby URL did not contain a room id");

    const roomCode = extractRoomCode(await pageA.locator("body").innerText());
    assert.ok(roomCode, "Could not extract room code from host lobby");

    await pageB.getByPlaceholder("ROOM CODE").fill(roomCode);
    await pageB.getByRole("button", { name: "Join Room" }).click();
    await pageB.waitForURL(new RegExp(`/app/battle/lobby/${roomId}$`), { timeout: 60_000 });

    await pageB.getByRole("button", { name: "Ready Up" }).click();
    await pageA.getByRole("button", { name: "Ready Up" }).click();

    await Promise.all([
      pageA.waitForURL(new RegExp(`/app/battle/match/${roomId}$`), { timeout: 60_000 }),
      pageB.waitForURL(new RegExp(`/app/battle/match/${roomId}$`), { timeout: 60_000 }),
    ]);

    assert.equal(
      await pageA.getByRole("button", { name: "Next Candle" }).count(),
      0,
      "Battle match should not expose a next-candle button",
    );

    await expectCompactBattleSurface(pageA);

    await pageA.getByRole("button", { name: "Play" }).click();
    await pageA.waitForTimeout(2_600);
    await pageA.getByRole("button", { name: "Pause" }).click();
    await pageA.getByRole("button", { name: "Reset" }).click();

    await pageA.getByLabel("Risk %").fill("1.50");

    await pageA.getByRole("button", { name: "Buy" }).click();
    await waitForPlayerState(
      admin,
      roomId,
      createdUsers[0].id,
      (row) => row.has_open_trade === true,
      "Expected host trade to be open authoritatively.",
    );

    assert.equal(
      await pageA.getByRole("button", { name: "Close" }).isEnabled(),
      true,
      "Expected enabled Close button after opening a trade",
    );

    await pageA.getByRole("button", { name: "Close" }).click();
    await waitForPlayerState(
      admin,
      roomId,
      createdUsers[0].id,
      (row) => row.has_open_trade === false && (row.trades_closed ?? 0) >= 1,
      "Expected host trade to close authoritatively.",
    );

    assert.equal(
      await pageA.getByRole("button", { name: "Buy" }).isEnabled(),
      true,
      "Expected Buy button after closing the trade",
    );

    assert.equal(pageErrors.length, 0, `Browser page errors:\n${pageErrors.join("\n")}`);

    console.log(JSON.stringify({
      ok: true,
      baseUrl,
      roomId,
      roomCode,
      routeA: pageA.url(),
      routeB: pageB.url(),
      warnings: consoleWarnings,
    }, null, 2));
  } finally {
    await browser.close();
    await deleteDisposableUsers(admin, createdUsers);
  }
}

async function expectCompactBattleSurface(page) {
  await page.getByText("Battle Match", { exact: true }).first().waitFor({ state: "visible", timeout: 60_000 });
  await page.getByText("Rank", { exact: true }).first().waitFor({ state: "visible", timeout: 60_000 });
  await page.getByText("Player", { exact: true }).first().waitFor({ state: "visible", timeout: 60_000 });
  await page.getByText("Balance", { exact: true }).first().waitFor({ state: "visible", timeout: 60_000 });
  await page.getByLabel("Risk %").waitFor({ state: "visible", timeout: 60_000 });
}

await runBattleFlow();
