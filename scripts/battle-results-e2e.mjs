import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { mkdir } from "node:fs/promises";
import path from "node:path";

import { createClient } from "@supabase/supabase-js";
import { chromium } from "playwright";

const baseUrl = (process.env.E2E_BASE_URL ?? process.env.NEXT_PUBLIC_APP_URL ?? "http://127.0.0.1:3002").replace(/\/$/, "");
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";
const battleSecret = process.env.BATTLE_SHARED_SECRET ?? "uHa2TkCpd3ukITf8SfeA488zPMJssQ2dp5G6w8frZtQ=";
const headless = process.env.PLAYWRIGHT_HEADLESS !== "false";
const screenshotPath = process.env.BATTLE_RESULTS_SCREENSHOT_PATH?.trim() || "";

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
  const email = `battle-results-${stamp}@example.com`;
  const password = `BattlePass-${stamp}`;
  const displayName = "TraderKillah";
  const roomId = randomUUID();
  const lobbyCode = `R${stamp.toString(36).slice(-5).toUpperCase()}`;
  let userId = null;
  const extraUserIds = [];

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
    assert.ok(userId, "Failed to create result test user");

    const { error: profileError } = await admin.from("profiles").upsert({
      id: userId,
      email,
      full_name: displayName,
      display_name: displayName,
      updated_at: new Date().toISOString(),
    });
    if (profileError) {
      throw profileError;
    }

    const extraPlayers = [
      { displayName: "MarketMaverick", email: `battle-results-mm-${stamp}@example.com` },
      { displayName: "LocalTrader", email: `battle-results-lt-${stamp}@example.com` },
      { displayName: "ChartMaster", email: `battle-results-cm-${stamp}@example.com` },
      { displayName: "AlphaWolf", email: `battle-results-aw-${stamp}@example.com` },
      { displayName: "QuickScalp", email: `battle-results-qs-${stamp}@example.com` },
      { displayName: "NightTrader", email: `battle-results-nt-${stamp}@example.com` },
      { displayName: "SwingKing", email: `battle-results-sk-${stamp}@example.com` },
    ];

    for (const player of extraPlayers) {
      const createdExtra = await admin.auth.admin.createUser({
        email: player.email,
        password: password,
        email_confirm: true,
        user_metadata: {
          full_name: player.displayName,
        },
      });

      if (createdExtra.error) {
        throw createdExtra.error;
      }

      const extraId = createdExtra.data.user?.id ?? null;
      assert.ok(extraId, `Failed to create result test user for ${player.displayName}`);
      extraUserIds.push(extraId);

      const { error: extraProfileError } = await admin.from("profiles").upsert({
        id: extraId,
        email: player.email,
        full_name: player.displayName,
        display_name: player.displayName,
        updated_at: new Date().toISOString(),
      });

      if (extraProfileError) {
        throw extraProfileError;
      }
    }

    const startedAt = "2024-12-13T14:00:15.000Z";
    const endedAt = "2024-12-13T14:30:15.000Z";
    const seededPlayers = [
      {
        userId,
        displayName,
        status: "finished",
        finalBalance: 1215.4,
        realizedPnl: 215.4,
        rank: 1,
        totalTrades: 15,
        winningTrades: 10,
        losingTrades: 5,
        penaltyReason: null,
      },
      {
        userId: extraUserIds[0],
        displayName: "MarketMaverick",
        status: "finished",
        finalBalance: 1143.2,
        realizedPnl: 143.2,
        rank: 2,
        totalTrades: 12,
        winningTrades: 8,
        losingTrades: 4,
        penaltyReason: null,
      },
      {
        userId: extraUserIds[1],
        displayName: "LocalTrader",
        status: "finished",
        finalBalance: 978.5,
        realizedPnl: 78.5,
        rank: 3,
        totalTrades: 9,
        winningTrades: 6,
        losingTrades: 3,
        penaltyReason: null,
      },
      {
        userId: extraUserIds[2],
        displayName: "ChartMaster",
        status: "finished",
        finalBalance: 912.3,
        realizedPnl: -12.3,
        rank: 4,
        totalTrades: 7,
        winningTrades: 3,
        losingTrades: 4,
        penaltyReason: null,
      },
      {
        userId: extraUserIds[3],
        displayName: "AlphaWolf",
        status: "no_trade",
        finalBalance: 1000,
        realizedPnl: 0,
        rank: 5,
        totalTrades: 0,
        winningTrades: 0,
        losingTrades: 0,
        penaltyReason: "no_trade",
      },
      {
        userId: extraUserIds[4],
        displayName: "QuickScalp",
        status: "left_early",
        finalBalance: 0,
        realizedPnl: 0,
        rank: 6,
        totalTrades: 6,
        winningTrades: 2,
        losingTrades: 2,
        penaltyReason: "left_early",
      },
      {
        userId: extraUserIds[5],
        displayName: "NightTrader",
        status: "forfeit",
        finalBalance: 0,
        realizedPnl: 0,
        rank: 7,
        totalTrades: 0,
        winningTrades: 0,
        losingTrades: 0,
        penaltyReason: "forfeit",
      },
      {
        userId: extraUserIds[6],
        displayName: "SwingKing",
        status: "no_trade",
        finalBalance: 0,
        realizedPnl: 0,
        rank: 8,
        totalTrades: 0,
        winningTrades: 0,
        losingTrades: 0,
        penaltyReason: "no_trade",
      },
    ];

    const finalizePayload = {
      room: {
        roomId,
        roomType: "private",
        durationMinutes: 30,
        symbol: "XAUUSD",
        timeframe: "15min",
        phase: "finished",
        startedAt,
        endedAt,
        winnerUserId: userId,
        cancelReason: null,
        lobbyCode,
      },
      players: seededPlayers,
    };

    const finalizeResponse = await fetch(`${baseUrl}/api/battle/internal/finalize-room`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-battle-internal-secret": battleSecret,
      },
      body: JSON.stringify(finalizePayload),
    });

    assert.equal(
      finalizeResponse.ok,
      true,
      `Finalize failed: ${finalizeResponse.status} ${await finalizeResponse.text()}`,
    );

    const browser = await chromium.launch({ headless });
    const page = await browser.newPage({
      viewport: {
        width: 1440,
        height: 1850,
      },
    });

    try {
      await page.goto(`${baseUrl}/sign-in`, { waitUntil: "domcontentloaded", timeout: 60_000 });
      await page.getByLabel("Email").fill(email);
      await page.getByLabel("Password").fill(password);
      await page.getByRole("button", { name: /^Sign In$/ }).click({ noWaitAfter: true });
      await page.waitForURL(/\/app(\/|$)/, { timeout: 60_000 });

      await page.goto(`${baseUrl}/app/battle/results/${roomId}`, {
        waitUntil: "domcontentloaded",
        timeout: 60_000,
      });

      try {
        await page.getByRole("link", { name: /back to battles/i }).waitFor({
          state: "visible",
          timeout: 60_000,
        });
        await page.getByText("Battle Results", { exact: true }).waitFor({
          state: "visible",
          timeout: 60_000,
        });
        await page.getByText("Official battle results", { exact: false }).waitFor({
          state: "visible",
          timeout: 60_000,
        });
        await page.getByText(displayName, { exact: true }).first().waitFor({
          state: "visible",
          timeout: 60_000,
        });
        await page.getByText("XAUUSD", { exact: true }).waitFor({
          state: "visible",
          timeout: 60_000,
        });
        await page.getByText("15min", { exact: true }).waitFor({
          state: "visible",
          timeout: 60_000,
        });
        await page.getByText("Full Leaderboard", { exact: true }).waitFor({
          state: "visible",
          timeout: 60_000,
        });

        if (screenshotPath) {
          await mkdir(path.dirname(screenshotPath), { recursive: true });
          await page.screenshot({
            path: screenshotPath,
            fullPage: true,
          });
        }
      } catch (error) {
        const bodyText = await page.locator("body").innerText().catch(() => "");
        throw new Error(
          [
            error instanceof Error ? error.message : String(error),
            `URL: ${page.url()}`,
            `Body: ${bodyText.slice(0, 1200)}`,
          ].join("\n"),
        );
      }

      console.log(
        JSON.stringify(
          {
            ok: true,
            route: `${baseUrl}/app/battle/results/${roomId}`,
          },
          null,
          2,
        ),
      );
    } finally {
      await browser.close();
    }
  } finally {
    if (userId) {
      await admin.from("battle_results").delete().eq("room_id", roomId);
      await admin.from("battle_room_players").delete().eq("room_id", roomId);
      await admin.from("battle_rooms").delete().eq("id", roomId);
      for (const extraUserId of extraUserIds) {
        await admin.auth.admin.deleteUser(extraUserId);
      }
      await admin.auth.admin.deleteUser(userId);
    }
  }
}

await main();
