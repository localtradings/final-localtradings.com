import { requireUser } from "@/server/auth/session";
import { getBacktestAccount } from "@/server/backtesting/account-queries";

import { BacktestingClientShell } from "./components/backtesting-client-shell";

export async function BacktestingWorkspace() {
  const user = await requireUser();
  const account = await getBacktestAccount(user?.id);

  return (
    <BacktestingClientShell
      initialAccount={account}
      userId={user?.id ?? null}
    />
  );
}
