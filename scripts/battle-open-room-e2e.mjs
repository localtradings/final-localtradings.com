import assert from "node:assert/strict";

import { chromium } from "playwright";

import {
  attachPageDiagnostics,
  baseUrl,
  buildDisposableUsers,
  cleanupBattleRoom,
  createAdminClient,
  createDisposableUsers,
  deleteDisposableUsers,
  fastForwardLobbyCountdown,
  headless,
  signIn,
  waitForPath,
} from "./battle-test-helpers.mjs";

async function waitForOpenRoomPersist(admin, roomId, timeoutMs = 20_000) {
  const deadline = Date.now() + timeoutMs;

  while (Date.now() < deadline) {
    const result = await admin
      .from("battle_rooms")
      .select("id, room_type, duration_minutes, max_players, risk_limit_percent, max_drawdown_percent")
      .eq("id", roomId)
      .maybeSingle();

    if (result.error) {
      throw result.error;
    }

    if (result.data) {
      return result.data;
    }

    await new Promise((resolve) => setTimeout(resolve, 500));
  }

  throw new Error("Timed out waiting for persisted open room.");
}

async function assertOpenRoomSchema(admin) {
  const result = await admin
    .from("battle_rooms")
    .select("id, room_type, risk_limit_percent, max_drawdown_percent")
    .limit(1);

  if (result.error) {
    throw new Error(
      `Open-room schema is not applied in Supabase yet: ${result.error.message}. Apply migration 0012_battle_open_rooms_and_rules.sql first.`,
    );
  }
}

async function waitForVisibleOpenRoom(page, hostDisplayName, timeoutMs = 20_000) {
  const deadline = Date.now() + timeoutMs;

  while (Date.now() < deadline) {
    await page.goto(`${baseUrl}/app/battle`, { waitUntil: "domcontentloaded", timeout: 60_000 });
    const hostName = page.getByText(hostDisplayName, { exact: true });
    if ((await hostName.count()) > 0) {
      return;
    }
    await page.waitForTimeout(750);
  }

  throw new Error("Timed out waiting for discoverable open room card.");
}

async function runBattleOpenRoomFlow() {
  const admin = createAdminClient();
  await assertOpenRoomSchema(admin);
  const spec = buildDisposableUsers(2, "codex-open-room");
  const createdUsers = await createDisposableUsers(admin, spec);
  const [hostUser, guestUser] = createdUsers;
  let roomId = null;

  const { error: hostProfileError } = await admin.from("profiles").update({
    is_pro: true,
    updated_at: new Date().toISOString(),
  }).eq("id", hostUser.id);

  if (hostProfileError) {
    throw hostProfileError;
  }

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
      attachPageDiagnostics(page, index === 0 ? "host" : "guest", { consoleWarnings, pageErrors });
    }

    await Promise.all([
      signIn(pageA, hostUser),
      signIn(pageB, guestUser),
    ]);

    await pageA.goto(`${baseUrl}/app/battle`, { waitUntil: "domcontentloaded", timeout: 60_000 });
    await pageA.waitForTimeout(2_000);
    await pageA.locator('select[aria-label="Host room visibility"]').selectOption("open");
    await pageA.locator('select[aria-label="Host room player cap"]').waitFor({ state: "visible", timeout: 60_000 });
    await pageA.locator('select[aria-label="Host room duration"]').selectOption("30");
    await pageA.locator('select[aria-label="Host room player cap"]').selectOption("4");
    await pageA.getByRole("button", { name: "Host Room" }).click();
    await pageA.waitForFunction(() => {
      const path = window.location.pathname;
      if (/\/app\/battle\/lobby\//.test(path)) {
        return "redirected";
      }

      const text = document.body.innerText;
      if (text.includes("Apply Supabase migration 0012_battle_open_rooms_and_rules.sql")) {
        return "migration";
      }

      return null;
    }, undefined, { timeout: 60_000 });

    if (!/\/app\/battle\/lobby\//.test(pageA.url())) {
      throw new Error("Open-room creation is blocked until Supabase migration 0012_battle_open_rooms_and_rules.sql is applied.");
    }

    roomId = pageA.url().split("/").pop();
    assert.ok(roomId, "Host lobby URL did not contain an open-room id");

    const persistedRoom = await waitForOpenRoomPersist(admin, roomId);
    assert.equal(persistedRoom.room_type, "open");
    assert.equal(persistedRoom.duration_minutes, 30);
    assert.equal(persistedRoom.max_players, 4);
    assert.equal(Number(persistedRoom.risk_limit_percent), 2);
    assert.equal(Number(persistedRoom.max_drawdown_percent), 10);

    await waitForVisibleOpenRoom(pageB, hostUser.displayName);
    await pageB.getByRole("button", { name: "Join Open Room" }).click();
    await waitForPath(pageB, new RegExp(`/app/battle/lobby/${roomId}$`), 60_000);

    await pageA.getByText("Risk cap", { exact: false }).waitFor({ state: "visible", timeout: 60_000 });
    await pageA.getByText("2.00%", { exact: false }).waitFor({ state: "visible", timeout: 60_000 });
    await pageA.getByText("10.00%", { exact: false }).waitFor({ state: "visible", timeout: 60_000 });

    await pageB.getByRole("button", { name: "Ready Up" }).click({ force: true });
    await pageA.getByRole("button", { name: "Ready Up" }).click({ force: true });

    await fastForwardLobbyCountdown(roomId);

    await Promise.all([
      waitForPath(pageA, new RegExp(`/app/battle/match/${roomId}$`), 60_000),
      waitForPath(pageB, new RegExp(`/app/battle/match/${roomId}$`), 60_000),
    ]);

    await pageA.getByText("Open Room", { exact: true }).first().waitFor({ state: "visible", timeout: 60_000 });
    await pageA.getByText("Risk Cap", { exact: false }).waitFor({ state: "visible", timeout: 60_000 });
    await pageA.getByText("2.00%", { exact: false }).waitFor({ state: "visible", timeout: 60_000 });
    await pageA.getByText("Drawdown", { exact: false }).waitFor({ state: "visible", timeout: 60_000 });
    await pageA.getByText("10.00%", { exact: false }).waitFor({ state: "visible", timeout: 60_000 });

    assert.equal(pageErrors.length, 0, `Browser page errors:\n${pageErrors.join("\n")}`);

    console.log(JSON.stringify({
      ok: true,
      baseUrl,
      roomId,
      routeA: pageA.url(),
      routeB: pageB.url(),
      warnings: consoleWarnings,
    }, null, 2));
  } finally {
    await browser.close();
    if (roomId) {
      await cleanupBattleRoom(admin, roomId);
    }
    await deleteDisposableUsers(admin, createdUsers);
  }
}

await runBattleOpenRoomFlow();
