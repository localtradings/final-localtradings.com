import { requireUser } from "@/server/auth/session";
import { getBacktestAccount } from "@/server/backtesting/account-queries";
import {
  deleteIncompleteBacktestSessions,
  getBacktestSessions,
} from "@/server/backtesting/queries";
import { getCurrentProfile } from "@/server/profile/queries";

import { BacktestingClientShell } from "./components/backtesting-client-shell";

export async function BacktestingWorkspace() {
  const user = await requireUser();
  const account = await getBacktestAccount(user?.id);
  if (user?.id) {
    await deleteIncompleteBacktestSessions(user.id);
  }
  const sessions = user ? await getBacktestSessions(user.id) : [];
  const profile = user ? await getCurrentProfile(user.id) : null;
  const shareDisplayName =
    profile?.displayName.trim() ||
    profile?.fullName.trim() ||
    (typeof user?.user_metadata.display_name === "string"
      ? user.user_metadata.display_name
      : "") ||
    (typeof user?.user_metadata.full_name === "string"
      ? user.user_metadata.full_name
      : "") ||
    "localtradings.com trader";

  return (
    <BacktestingClientShell
      initialAccount={account}
      initialSessions={sessions}
      shareDisplayName={shareDisplayName}
      userId={user?.id ?? null}
    />
  );
}
