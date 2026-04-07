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
  getRoomCode,
  headless,
  signIn,
  waitForPath,
} from "./battle-test-helpers.mjs";

async function main() {
  const admin = createAdminClient();
  const spec = buildDisposableUsers(3, "codex-battle-leave");
  const createdUsers = await createDisposableUsers(admin, spec);
  const browser = await chromium.launch({ headless });
  let roomId = null;

  try {
    const contexts = await Promise.all(createdUsers.map(() => browser.newContext()));
    const pages = await Promise.all(contexts.map((context) => context.newPage()));
    const [host, leaver, replacement] = pages;
    const diagnostics = {
      consoleWarnings: [],
      pageErrors: [],
    };

    pages.forEach((page, index) => {
      attachPageDiagnostics(page, `P${index + 1}`, diagnostics);
    });

    await Promise.all(pages.map((page, index) => signIn(page, createdUsers[index])));
    await Promise.all(
      pages.map((page) =>
        page.goto(`${baseUrl}/app/battle`, {
          waitUntil: "domcontentloaded",
          timeout: 60_000,
        }),
      ),
    );

    await host.getByRole("button", { name: "Create Private Room" }).waitFor({
      state: "visible",
      timeout: 60_000,
    });
    await host.getByRole("button", { name: "Create Private Room" }).click({ noWaitAfter: true });
    await waitForPath(host, /\/app\/battle\/lobby\//, 60_000);
    await host.waitForTimeout(1_500);

    roomId = host.url().split("/").pop() ?? null;
    assert.ok(roomId, "Host lobby URL did not contain a room id");

    const roomCode = await getRoomCode(admin, roomId);
    assert.ok(roomCode, "Expected a room code for the created lobby");

    await leaver.getByPlaceholder("ROOM CODE").fill(roomCode);
    await leaver.getByRole("button", { name: "Join Room" }).click({ noWaitAfter: true });
    await waitForPath(leaver, new RegExp(`/app/battle/lobby/${roomId}$`), 60_000);
    await leaver.waitForTimeout(1_500);

    await host.getByText(createdUsers[1].displayName, { exact: true }).waitFor({
      state: "visible",
      timeout: 30_000,
    });

    await leaver.getByRole("button", { name: "Leave Lobby" }).click({
      force: true,
      noWaitAfter: true,
    });
    await waitForPath(leaver, "/app/battle", 60_000);

    await host.getByText(createdUsers[1].displayName, { exact: true }).waitFor({
      state: "hidden",
      timeout: 30_000,
    });

    await replacement.getByPlaceholder("ROOM CODE").fill(roomCode);
    await replacement.getByRole("button", { name: "Join Room" }).click({ noWaitAfter: true });
    await waitForPath(replacement, new RegExp(`/app/battle/lobby/${roomId}$`), 60_000);

    await host.getByText(createdUsers[2].displayName, { exact: true }).waitFor({
      state: "visible",
      timeout: 30_000,
    });

    const roomResult = await admin
      .from("battle_room_players")
      .select("user_id, display_name, status")
      .eq("room_id", roomId)
      .order("display_name", { ascending: true });

    if (roomResult.error) {
      throw roomResult.error;
    }

    const participantStatuses = new Map(
      (roomResult.data ?? []).map((row) => [row.user_id, row.status]),
    );

    assert.equal(
      participantStatuses.has(createdUsers[1].id),
      false,
      "Expected the leaving player to be removed from the lobby player rows",
    );
    assert.equal(
      participantStatuses.get(createdUsers[2].id),
      "joined",
      "Expected the replacement player to take the freed lobby slot",
    );
    assert.equal(diagnostics.pageErrors.length, 0, `Browser page errors:\n${diagnostics.pageErrors.join("\n")}`);

    console.log(
      JSON.stringify(
        {
          ok: true,
          roomId,
          roomCode,
          hostUrl: host.url(),
          leaverUrl: leaver.url(),
          replacementUrl: replacement.url(),
          players: roomResult.data,
          warnings: diagnostics.consoleWarnings,
        },
        null,
        2,
      ),
    );
  } finally {
    await browser.close();

    if (roomId) {
      await cleanupBattleRoom(admin, roomId);
    }

    await deleteDisposableUsers(admin, createdUsers);
  }
}

await main();
