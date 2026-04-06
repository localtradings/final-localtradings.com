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
  extractRoomCode,
  headless,
  signIn,
} from "./battle-test-helpers.mjs";

async function main() {
  const admin = createAdminClient();
  const spec = buildDisposableUsers(2, "codex-battle-participation");
  const createdUsers = await createDisposableUsers(admin, spec);
  const browser = await chromium.launch({ headless });
  let roomId = null;

  try {
    const contexts = await Promise.all(
      createdUsers.map(() => browser.newContext()),
    );
    const pages = await Promise.all(contexts.map((context) => context.newPage()));
    const [host, guest] = pages;
    const diagnostics = {
      consoleWarnings: [],
      pageErrors: [],
    };

    pages.forEach((page, index) => {
      attachPageDiagnostics(page, `P${index + 1}`, diagnostics);
    });

    await Promise.all(
      pages.map((page, index) => signIn(page, createdUsers[index])),
    );

    await Promise.all(
      pages.map((page) =>
        page.goto(`${baseUrl}/app/battle`, {
          waitUntil: "domcontentloaded",
          timeout: 60_000,
        }),
      ),
    );

    await host.getByRole("button", { name: "Create Private Room" }).click();
    await host.waitForURL(/\/app\/battle\/lobby\//, { timeout: 60_000 });
    await host.waitForTimeout(1_500);

    roomId = host.url().split("/").pop() ?? null;
    assert.ok(roomId, "Host lobby URL did not contain a room id");

    const roomCode = extractRoomCode(await host.locator("body").innerText());
    assert.ok(roomCode, "Could not extract room code from host lobby");

    await guest.getByPlaceholder("ROOM CODE").fill(roomCode);
    await guest.getByRole("button", { name: "Join Room" }).click();
    await guest.waitForURL(new RegExp(`/app/battle/lobby/${roomId}$`), { timeout: 60_000 });

    await guest.getByRole("button", { name: "Ready Up" }).click();
    await host.getByRole("button", { name: "Ready Up" }).click();

    await Promise.all(
      pages.map((page) =>
        page.waitForURL(new RegExp(`/app/battle/match/${roomId}$`), { timeout: 60_000 }),
      ),
    );

    assert.equal(
      await host.getByText(/Enter one trade within/i).count(),
      0,
      "Warning banner should not render immediately after match start",
    );

    await host.waitForTimeout(4 * 60_000 + 50_000);

    assert.equal(
      await host.getByText(/Enter one trade within/i).count(),
      0,
      "Warning banner appeared before the 5-minute threshold",
    );

    await host.getByText(/Enter one trade within/i).waitFor({
      state: "visible",
      timeout: 30_000,
    });

    await guest.getByText(/Enter one trade within/i).waitFor({
      state: "visible",
      timeout: 30_000,
    });

    await host.getByText(/You were eliminated after missing the no-trade deadline/i).waitFor({
      state: "visible",
      timeout: 90_000,
    });

    await guest.getByText(/You were eliminated after missing the no-trade deadline/i).waitFor({
      state: "visible",
      timeout: 90_000,
    });

    const penaltyResult = await admin
      .from("battle_penalties")
      .select("user_id, reason, room_id, starts_at, ends_at")
      .eq("room_id", roomId)
      .eq("reason", "no_trade")
      .order("user_id", { ascending: true });

    if (penaltyResult.error) {
      throw penaltyResult.error;
    }

    assert.equal(
      penaltyResult.data?.length ?? 0,
      2,
      "Expected two no_trade penalties after the participation deadline elapsed",
    );

    const playerResult = await admin
      .from("battle_room_players")
      .select("user_id, display_name, status")
      .eq("room_id", roomId)
      .order("display_name", { ascending: true });

    if (playerResult.error) {
      throw playerResult.error;
    }

    for (const row of playerResult.data ?? []) {
      assert.equal(
        row.status,
        "no_trade",
        `Expected participant ${row.display_name} to be marked no_trade after the deadline`,
      );
    }

    assert.equal(diagnostics.pageErrors.length, 0, `Browser page errors:\n${diagnostics.pageErrors.join("\n")}`);

    console.log(JSON.stringify({
      ok: true,
      roomId,
      roomCode,
      penalties: penaltyResult.data,
      players: playerResult.data,
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
