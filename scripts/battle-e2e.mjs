import assert from "node:assert/strict";

import { chromium } from "playwright";

import {
  attachPageDiagnostics,
  baseUrl,
  buildDisposableUsers,
  createAdminClient,
  createDisposableUsers,
  deleteDisposableUsers,
  expectCompactBattleSurface,
  fastForwardLobbyCountdown,
  getRoomCode,
  headless,
  signIn,
  waitForPath,
} from "./battle-test-helpers.mjs";

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
  const admin = createAdminClient();

  const spec = buildDisposableUsers(2, "codex-battle");
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
      attachPageDiagnostics(page, label, { consoleWarnings, pageErrors });
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
    await waitForPath(pageA, /\/app\/battle\/lobby\//, 60_000);
    await pageA.waitForTimeout(1_500);

    const roomId = pageA.url().split("/").pop();
    assert.ok(roomId, "Host lobby URL did not contain a room id");

    const roomCode = await getRoomCode(admin, roomId);
    assert.ok(roomCode, "Could not extract room code from host lobby");

    await pageB.getByPlaceholder("ROOM CODE").fill(roomCode);
    await pageB.getByRole("button", { name: "Join Room" }).click();
    await waitForPath(pageB, new RegExp(`/app/battle/lobby/${roomId}$`), 60_000);

    await pageB.getByRole("button", { name: "Ready Up" }).click({ force: true });
    await pageA.getByRole("button", { name: "Ready Up" }).click({ force: true });

    await pageA.waitForTimeout(3_000);
    await pageB.waitForTimeout(3_000);
    assert.match(
      pageA.url(),
      new RegExp(`/app/battle/lobby/${roomId}$`),
      "2-player room should stay in the lobby before the countdown expires",
    );
    assert.match(
      pageB.url(),
      new RegExp(`/app/battle/lobby/${roomId}$`),
      "Guest should stay in the lobby before the countdown expires",
    );

    await fastForwardLobbyCountdown(roomId);

    await Promise.all([
      waitForPath(pageA, new RegExp(`/app/battle/match/${roomId}$`), 60_000),
      waitForPath(pageB, new RegExp(`/app/battle/match/${roomId}$`), 60_000),
    ]);

    assert.equal(
      await pageA.getByRole("button", { name: "Next Candle" }).count(),
      0,
      "Battle match should not expose a next-candle button",
    );

    await expectCompactBattleSurface(pageA);

    const replayBeforeText = await pageA.locator("body").innerText();
    const replayBeforeMatch = replayBeforeText.match(/Replay\s+(\d+)\/(\d+)/i);
    assert.ok(replayBeforeMatch, "Expected replay counter before starting playback");

    await pageA.getByRole("button", { name: "Play" }).click();
    await pageA.waitForTimeout(2_600);
    await pageA.getByRole("button", { name: "Pause" }).click();
    const replayAfterText = await pageA.locator("body").innerText();
    const replayAfterMatch = replayAfterText.match(/Replay\s+(\d+)\/(\d+)/i);
    assert.ok(replayAfterMatch, "Expected replay counter after playback");
    assert.ok(
      Number(replayAfterMatch[1]) > Number(replayBeforeMatch[1]),
      `Expected replay counter to advance during playback, got ${replayBeforeMatch[0]} -> ${replayAfterMatch[0]}`,
    );
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

await runBattleFlow();
