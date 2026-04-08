import assert from "node:assert/strict";

import { createClient } from "@supabase/supabase-js";

export const baseUrl = (process.env.E2E_BASE_URL ?? process.env.NEXT_PUBLIC_APP_URL ?? "http://127.0.0.1:3000").replace(/\/$/, "");
export const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
export const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";
export const battleSecret = process.env.BATTLE_SHARED_SECRET ?? "uHa2TkCpd3ukITf8SfeA488zPMJssQ2dp5G6w8frZtQ=";
export const battleWorkerUrl = (process.env.CLOUDFLARE_BATTLE_WORKER_URL ?? "").replace(/\/$/, "");
export const headless = process.env.PLAYWRIGHT_HEADLESS !== "false";

export function requireEnv(name, value) {
  assert.ok(value.trim().length > 0, `Missing required environment variable: ${name}`);
}

export function createAdminClient() {
  requireEnv("NEXT_PUBLIC_SUPABASE_URL", supabaseUrl);
  requireEnv("SUPABASE_SERVICE_ROLE_KEY", serviceRoleKey);

  return createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

export function buildDisposableUsers(count, prefix) {
  const stamp = Date.now();
  const password = `BattlePass-${stamp}`;

  return {
    password,
    users: Array.from({ length: count }, (_, index) => ({
      email: `${prefix}-${index + 1}-${stamp}@example.com`,
      displayName: `${prefix.replace(/-/g, " ")} ${String.fromCharCode(65 + index)}`,
    })),
  };
}

export async function createDisposableUsers(admin, spec) {
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

export async function deleteDisposableUsers(admin, users) {
  await Promise.all(
    users.map(async (user) => {
      if (!user?.id) {
        return;
      }

      await admin.auth.admin.deleteUser(user.id);
    }),
  );
}

export async function cleanupBattleRoom(admin, roomId) {
  await admin.from("battle_results").delete().eq("room_id", roomId);
  await admin.from("battle_penalties").delete().eq("room_id", roomId);
  await admin.from("battle_room_players").delete().eq("room_id", roomId);
  await admin.from("battle_rooms").delete().eq("id", roomId);
}

export async function getRoomCode(admin, roomId) {
  const result = await admin
    .from("battle_rooms")
    .select("lobby_code")
    .eq("id", roomId)
    .maybeSingle();

  if (result.error) {
    throw result.error;
  }

  return result.data?.lobby_code ?? null;
}

export async function fastForwardParticipationStage(roomId, stage) {
  requireEnv("CLOUDFLARE_BATTLE_WORKER_URL", battleWorkerUrl);

  const response = await fetch(`${battleWorkerUrl}/internal/rooms/test-participation`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-battle-internal-secret": battleSecret,
    },
    body: JSON.stringify({
      roomId,
      stage,
    }),
  });

  const payload = await response.json().catch(() => null);
  assert.ok(
    response.ok && payload?.ok,
    `Failed to fast-forward participation stage "${stage}": ${response.status} ${JSON.stringify(payload)}`,
  );

  return payload;
}

export async function fastForwardLobbyCountdown(roomId) {
  requireEnv("CLOUDFLARE_BATTLE_WORKER_URL", battleWorkerUrl);

  const response = await fetch(`${battleWorkerUrl}/internal/rooms/test-lobby-countdown`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-battle-internal-secret": battleSecret,
    },
    body: JSON.stringify({
      roomId,
    }),
  });

  const payload = await response.json().catch(() => null);
  assert.ok(
    response.ok && payload?.ok,
    `Failed to fast-forward lobby countdown: ${response.status} ${JSON.stringify(payload)}`,
  );

  return payload;
}

export async function signIn(page, user) {
  await page.goto(`${baseUrl}/sign-in`, { waitUntil: "domcontentloaded", timeout: 60_000 });
  await page.getByLabel("Email").fill(user.email);
  await page.getByLabel("Password").fill(user.password);
  await page.getByRole("button", { name: /^Sign In$/ }).click({ noWaitAfter: true });
  await page.waitForFunction(
    () => window.location.pathname === "/app" || window.location.pathname.startsWith("/app/"),
    undefined,
    { timeout: 60_000 },
  );
}

export async function waitForPath(page, matcher, timeout = 60_000) {
  await page.waitForFunction(
    (expected) => {
      const pathname = window.location.pathname;
      if (typeof expected === "string") {
        return pathname === expected;
      }

      return new RegExp(expected.pattern, expected.flags).test(pathname);
    },
    typeof matcher === "string"
      ? matcher
      : { pattern: matcher.source, flags: matcher.flags },
    { timeout },
  );
}

export function attachPageDiagnostics(page, label, bucket) {
  page.on("console", (message) => {
    if (message.type() === "warning" || message.type() === "error") {
      bucket.consoleWarnings.push(`[${label}:${message.type()}] ${message.text()}`);
    }
  });

  page.on("pageerror", (error) => {
    bucket.pageErrors.push(`[${label}] ${error.message}`);
  });
}

export async function expectCompactBattleSurface(page) {
  await page.getByText("Battle Match", { exact: true }).first().waitFor({ state: "visible", timeout: 60_000 });
  await page.getByText("Rank", { exact: true }).first().waitFor({ state: "visible", timeout: 60_000 });
  await page.getByText("Player", { exact: true }).first().waitFor({ state: "visible", timeout: 60_000 });
  await page.getByText("Balance", { exact: true }).first().waitFor({ state: "visible", timeout: 60_000 });
  await page.getByLabel("Risk %").waitFor({ state: "visible", timeout: 60_000 });
  await page.getByRole("button", { name: "+ TP" }).waitFor({ state: "visible", timeout: 60_000 });
  await page.getByRole("button", { name: "+ SL" }).waitFor({ state: "visible", timeout: 60_000 });
}

export async function readReplayCounter(page) {
  const bodyText = await page.locator("body").innerText();
  const match = bodyText.match(/Replay\s+(\d+)\/(\d+)/i);
  assert.ok(match, "Expected replay counter on the battle surface");

  return {
    revealed: Number(match[1]),
    total: Number(match[2]),
    label: match[0],
  };
}
