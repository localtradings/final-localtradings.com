import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";

import { createClient } from "@supabase/supabase-js";
import { chromium } from "playwright";

const baseUrl = (process.env.E2E_BASE_URL ?? process.env.NEXT_PUBLIC_APP_URL ?? "http://127.0.0.1:3002").replace(/\/$/, "");
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";
const battleSecret = process.env.BATTLE_SHARED_SECRET ?? "uHa2TkCpd3ukITf8SfeA488zPMJssQ2dp5G6w8frZtQ=";
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
  const email = `battle-results-${stamp}@example.com`;
  const password = `BattlePass-${stamp}`;
  const displayName = "Battle Results User";
  const roomId = randomUUID();
  const lobbyCode = `R${stamp.toString(36).slice(-5).toUpperCase()}`;
  let userId = null;

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

    const finalizePayload = {
      room: {
        roomId,
        roomType: "private",
        durationMinutes: 10,
        symbol: "EURUSD",
        timeframe: "5min",
        phase: "finished",
        startedAt: new Date(Date.now() - 10 * 60_000).toISOString(),
        endedAt: new Date().toISOString(),
        winnerUserId: userId,
        cancelReason: null,
        lobbyCode,
      },
      players: [
        {
          userId,
          displayName,
          status: "finished",
          finalBalance: 101_250,
          realizedPnl: 1_250,
          rank: 1,
          totalTrades: 3,
          winningTrades: 2,
          losingTrades: 1,
          penaltyReason: null,
        },
      ],
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
    const page = await browser.newPage();

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
        await page.getByText("Battle Results", { exact: true }).waitFor({
          state: "visible",
          timeout: 60_000,
        });
        await page.getByText(displayName, { exact: true }).first().waitFor({
          state: "visible",
          timeout: 60_000,
        });
        await page.getByText("EURUSD • 5min", { exact: true }).waitFor({
          state: "visible",
          timeout: 60_000,
        });
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
      await admin.auth.admin.deleteUser(userId);
    }
  }
}

await main();
