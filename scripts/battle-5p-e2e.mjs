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
  expectCompactBattleSurface,
  getRoomCode,
  headless,
  installSupabaseSession,
  readReplayCounter,
  waitForPath,
} from "./battle-test-helpers.mjs";

async function waitForPlayerState(admin, roomId, userId, predicate, message, timeoutMs = 20_000) {
  const deadline = Date.now() + timeoutMs;
  let lastRow = null;

  while (Date.now() < deadline) {
    const result = await admin
      .from("battle_room_players")
      .select("user_id, display_name, status, official_balance, official_rank, trades_closed, winning_trades, losing_trades, has_open_trade")
      .eq("room_id", roomId)
      .eq("user_id", userId)
      .maybeSingle();

    if (result.error) {
      throw result.error;
    }

    lastRow = result.data;
    if (result.data && predicate(result.data)) {
      return result.data;
    }

    await new Promise((resolve) => setTimeout(resolve, 500));
  }

  throw new Error(`${message} Last persisted row: ${JSON.stringify(lastRow)}`);
}

async function clickLobbyButton(page, label, timeoutMs = 60_000) {
  const button = page.getByRole("button", { name: label });
  await button.waitFor({ state: "visible", timeout: timeoutMs });
  await page.waitForFunction((expectedLabel) => {
    const buttons = Array.from(document.querySelectorAll("button"));
    const matchingButton = buttons.find(
      (candidate) => candidate.textContent?.trim().includes(expectedLabel),
    );

    return matchingButton instanceof HTMLButtonElement && !matchingButton.disabled;
  }, label, { timeout: timeoutMs });
  await button.click();
}

async function clickEnabledButton(page, label, timeoutMs = 60_000) {
  const button = page.getByRole("button", { name: label });
  await button.waitFor({ state: "visible", timeout: timeoutMs });
  await page.waitForFunction((expectedLabel) => {
    const buttons = Array.from(document.querySelectorAll("button"));
    const matchingButton = buttons.find(
      (candidate) => candidate.textContent?.trim() === expectedLabel,
    );

    return matchingButton instanceof HTMLButtonElement && !matchingButton.disabled;
  }, label, { timeout: timeoutMs });
  await button.click();
}

async function main() {
  const admin = createAdminClient();
  const spec = buildDisposableUsers(5, "codex-battle-5p");
  const createdUsers = await createDisposableUsers(admin, spec);
  const browser = await chromium.launch({ headless });
  let roomId = null;

  try {
    const contexts = await Promise.all(
      createdUsers.map(() => browser.newContext()),
    );
    const pages = await Promise.all(contexts.map((context) => context.newPage()));
    const diagnostics = {
      consoleWarnings: [],
      pageErrors: [],
    };

    pages.forEach((page, index) => {
      attachPageDiagnostics(page, `P${index + 1}`, diagnostics);
    });

    for (const [index, context] of contexts.entries()) {
      await installSupabaseSession(context, createdUsers[index]);
    }

    const [host, playerB, playerC, playerD, playerE] = pages;

    await host.goto(`${baseUrl}/app/battle`, {
      waitUntil: "domcontentloaded",
      timeout: 60_000,
    });
    const hostRoomButton = host.getByRole("button", { name: "Host Room" });
    await hostRoomButton.waitFor({
      state: "visible",
      timeout: 60_000,
    });
    await hostRoomButton.waitFor({ state: "attached", timeout: 60_000 });
    await host.waitForFunction(() => {
      const button = document.querySelector('button[aria-label="Host Room"]');
      return button instanceof HTMLButtonElement && !button.disabled;
    }, undefined, { timeout: 60_000 });
    await hostRoomButton.click();
    await waitForPath(host, /\/app\/battle\/lobby\//, 60_000);
    await host.waitForTimeout(1_500);

    roomId = host.url().split("/").pop() ?? null;
    assert.ok(roomId, "Host lobby URL did not contain a room id");

    const roomCode = await getRoomCode(admin, roomId);
    assert.ok(roomCode, "Could not extract room code from host lobby");

    await clickLobbyButton(host, "Ready Up");

    await Promise.all(
      [playerB, playerC, playerD, playerE].map((page) =>
        page.goto(`${baseUrl}/app/battle`, {
          waitUntil: "domcontentloaded",
          timeout: 60_000,
        }),
      ),
    );

    for (const page of [playerB, playerC, playerD, playerE]) {
      await page.waitForFunction(() => {
        const button = document.querySelector('button[aria-label="Host Room"]');
        return button instanceof HTMLButtonElement && !button.disabled;
      }, undefined, { timeout: 60_000 });
      await page.getByPlaceholder("ROOM CODE").fill(roomCode);
      const joinRoomButton = page.getByRole("button", { name: "Join Room" });
      await page.waitForFunction((expectedRoomCode) => {
        const input = document.querySelector('input[aria-label="Room code"]');
        if (!(input instanceof HTMLInputElement) || input.value !== expectedRoomCode) {
          return false;
        }

        const buttons = Array.from(document.querySelectorAll("button"));
        const button = buttons.find((candidate) =>
          candidate.textContent?.trim().includes("Join Room"),
        );
        return button instanceof HTMLButtonElement && !button.disabled;
      }, roomCode, { timeout: 60_000 });
      await joinRoomButton.click();
      await waitForPath(page, new RegExp(`/app/battle/lobby/${roomId}$`), 60_000);

      await clickLobbyButton(page, "Ready Up");
    }

    const lobbyText = await host.locator("body").innerText();
    for (const user of createdUsers) {
      assert.match(lobbyText, new RegExp(user.displayName), `Expected ${user.displayName} in the lobby scoreboard`);
    }

    await Promise.all(
      pages.map((page) =>
        waitForPath(page, new RegExp(`/app/battle/match/${roomId}$`), 60_000),
      ),
    );

    for (const page of pages) {
      await expectCompactBattleSurface(page);
      const bodyText = await page.locator("body").innerText();
      assert.equal(
        await page.getByRole("button", { name: "Next Candle" }).count(),
        0,
        "Battle match should not expose a next-candle button",
      );
      assert.equal(
        bodyText.includes("4x"),
        true,
        "Expected fixed 4x replay label on the battle toolbar",
      );
    }

    const hostReplayBefore = await readReplayCounter(host);

    await host.getByRole("button", { name: "Play" }).click();
    await host.waitForTimeout(1_400);
    const hostReplayMid = await readReplayCounter(host);
    await host.waitForTimeout(1_400);
    await host.getByRole("button", { name: "Pause" }).click();
    const hostReplayAfter = await readReplayCounter(host);
    assert.ok(
      hostReplayMid.revealed > hostReplayBefore.revealed,
      `Expected host replay counter to advance after starting playback, got ${hostReplayBefore.label} -> ${hostReplayMid.label}`,
    );
    assert.ok(
      hostReplayAfter.revealed > hostReplayMid.revealed,
      `Expected host replay counter to keep advancing during playback, got ${hostReplayMid.label} -> ${hostReplayAfter.label}`,
    );
    await host.getByRole("button", { name: "Reset" }).click();
    await host.locator("#battle-order-type").selectOption("market");
    await host.getByLabel("Risk %").fill("1.50");
    await clickEnabledButton(host, "Buy");
    await waitForPlayerState(
      admin,
      roomId,
      createdUsers[0].id,
      (row) => row.has_open_trade === true,
      "Host buy trade did not open authoritatively.",
      60_000,
    );

    await playerB.getByRole("button", { name: "Play" }).click();
    await playerB.waitForTimeout(1_500);
    await playerB.getByRole("button", { name: "Pause" }).click();
    await playerB.locator("#battle-order-type").selectOption("market");
    await playerB.getByLabel("Risk %").fill("1.25");
    await clickEnabledButton(playerB, "Sell");
    await waitForPlayerState(
      admin,
      roomId,
      createdUsers[1].id,
      (row) => row.has_open_trade === true,
      "Sell-side trade did not open authoritatively.",
      60_000,
    );

    await playerC.getByRole("button", { name: "Reset" }).click();
    await playerC.locator("#battle-order-type").selectOption("market");
    await playerC.getByRole("button", { name: "+ TP" }).click();
    await playerC.getByRole("textbox", { name: "Take Profit" }).waitFor({ state: "visible", timeout: 10_000 });
    await playerC.getByLabel("Risk %").fill("2.00");
    await clickEnabledButton(playerC, "Buy");
    await waitForPlayerState(
      admin,
      roomId,
      createdUsers[2].id,
      (row) => row.has_open_trade === true,
      "TP-only trade did not open authoritatively.",
      60_000,
    );

    await playerD.getByRole("button", { name: "Reset" }).click();
    await playerD.locator("#battle-order-type").selectOption("market");
    await playerD.getByRole("button", { name: "+ SL" }).click();
    await playerD.getByRole("textbox", { name: "Stop Loss" }).waitFor({ state: "visible", timeout: 10_000 });
    await playerD.getByLabel("Risk %").fill("1.80");
    await clickEnabledButton(playerD, "Buy");
    await waitForPlayerState(
      admin,
      roomId,
      createdUsers[3].id,
      (row) => row.has_open_trade === true,
      "SL-only trade did not open authoritatively.",
      60_000,
    );

    await playerE.getByRole("button", { name: "Reset" }).click();
    await playerE.locator("#battle-order-type").selectOption("market");
    await playerE.getByRole("button", { name: "+ TP" }).click();
    await playerE.getByRole("button", { name: "+ SL" }).click();
    await playerE.getByRole("textbox", { name: "Take Profit" }).waitFor({ state: "visible", timeout: 10_000 });
    await playerE.getByRole("textbox", { name: "Stop Loss" }).waitFor({ state: "visible", timeout: 10_000 });
    await playerE.getByLabel("Risk %").fill("2.25");
    await clickEnabledButton(playerE, "Buy");
    await waitForPlayerState(
      admin,
      roomId,
      createdUsers[4].id,
      (row) => row.has_open_trade === true,
      "TP+SL trade did not open authoritatively.",
      60_000,
    );

    const roomResult = await admin
      .from("battle_rooms")
      .select("id, status, room_type, duration_minutes, symbol, timeframe, lobby_code, started_at, ended_at, winner_user_id")
      .eq("id", roomId)
      .maybeSingle();

    if (roomResult.error) {
      throw roomResult.error;
    }

    assert.ok(roomResult.data, "Expected a persisted battle_rooms row for the 5-player room");

    const playerResult = await admin
      .from("battle_room_players")
      .select("user_id, display_name, status, official_balance, official_rank, trades_closed, winning_trades, losing_trades, has_open_trade")
      .eq("room_id", roomId)
      .order("display_name", { ascending: true });

    if (playerResult.error) {
      throw playerResult.error;
    }

    assert.equal(
      playerResult.data?.length ?? 0,
      5,
      "Expected five persisted battle_room_players rows for the 5-player room",
    );

    const persistedUserIds = new Set((playerResult.data ?? []).map((row) => row.user_id));
    for (const user of createdUsers) {
      assert.equal(
        persistedUserIds.has(user.id),
        true,
        `Expected persisted battle_room_players entry for ${user.displayName}`,
      );
    }

    assert.equal(diagnostics.pageErrors.length, 0, `Browser page errors:\n${diagnostics.pageErrors.join("\n")}`);

    console.log(JSON.stringify({
      ok: true,
      roomId,
      roomCode,
      baseUrl,
      persistedRoom: roomResult.data,
      persistedPlayers: playerResult.data,
      warnings: diagnostics.consoleWarnings,
    }, null, 2));
  } finally {
    await browser.close();

    if (roomId) {
      await cleanupBattleRoom(admin, roomId);
    }

    await deleteDisposableUsers(admin, createdUsers);
  }
}

await main();
