"use server";

import type { BacktestAccountRecord, BacktestAccountState } from "@/features/backtesting/types";
import { createSupabaseServerClient } from "@/lib/supabase/server";

import {
  DEFAULT_BACKTEST_ACCOUNT,
  normalizeBacktestAccount,
} from "./account-queries";

type BacktestAccountActionResult =
  | {
      ok: true;
      account: BacktestAccountRecord;
    }
  | {
      ok: false;
      reason: string;
    };

export async function saveBacktestAccount(
  input: BacktestAccountState,
): Promise<BacktestAccountActionResult> {
  const supabase = await createSupabaseServerClient();
  if (!supabase) {
    return { ok: false, reason: "supabase_not_configured" };
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { ok: false, reason: "not_authenticated" };
  }

  const payload = {
    user_id: user.id,
    starting_balance:
      Number.isFinite(input.startingBalance) && input.startingBalance > 0
        ? input.startingBalance
        : DEFAULT_BACKTEST_ACCOUNT.startingBalance,
    current_balance:
      Number.isFinite(input.currentBalance) && input.currentBalance > 0
        ? input.currentBalance
        : DEFAULT_BACKTEST_ACCOUNT.currentBalance,
    default_risk_percent:
      Number.isFinite(input.defaultRiskPercent) && input.defaultRiskPercent > 0
        ? input.defaultRiskPercent
        : DEFAULT_BACKTEST_ACCOUNT.defaultRiskPercent,
    updated_at: new Date().toISOString(),
  };

  const { data, error } = await supabase
    .from("backtest_accounts")
    .upsert(payload, { onConflict: "user_id" })
    .select(
      "id, user_id, starting_balance, current_balance, default_risk_percent, updated_at",
    )
    .single();

  if (error || !data) {
    return { ok: false, reason: error?.message ?? "save_failed" };
  }

  return {
    ok: true,
    account: normalizeBacktestAccount(data),
  };
}
