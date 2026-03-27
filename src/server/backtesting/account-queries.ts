import "server-only";

import type { BacktestAccountRecord, BacktestAccountState } from "@/features/backtesting/types";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const DEFAULT_BACKTEST_ACCOUNT: BacktestAccountState = {
  startingBalance: 100000,
  currentBalance: 100000,
  defaultRiskPercent: 1,
};

type BacktestAccountRow = {
  id: string;
  user_id: string;
  starting_balance: number;
  current_balance: number;
  default_risk_percent: number;
  updated_at: string;
};

export function normalizeBacktestAccount(
  row: BacktestAccountRow,
): BacktestAccountRecord {
  return {
    id: row.id,
    userId: row.user_id,
    startingBalance: row.starting_balance,
    currentBalance: row.current_balance,
    defaultRiskPercent: row.default_risk_percent,
    updatedAt: row.updated_at,
  };
}

export async function getBacktestAccount(userId: string | null | undefined) {
  if (!userId) {
    return null;
  }

  const supabase = await createSupabaseServerClient();
  if (!supabase) {
    return null;
  }

  const { data, error } = await supabase
    .from("backtest_accounts")
    .select(
      "id, user_id, starting_balance, current_balance, default_risk_percent, updated_at",
    )
    .eq("user_id", userId)
    .maybeSingle();

  if (error || !data) {
    return null;
  }

  return normalizeBacktestAccount(data as BacktestAccountRow);
}
