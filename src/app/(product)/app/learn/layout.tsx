import type { ReactNode } from "react";

import { LearnProgressProvider } from "@/features/learn/learn-progress-provider";
import { requireUser } from "@/server/auth/session";
import { getLearnBookmarkState, getLearnProgressState } from "@/server/learn/queries";

export default async function LearnLayout({ children }: { children: ReactNode }) {
  const user = await requireUser();
  const [initialState, initialBookmarks] = await Promise.all([
    getLearnProgressState(user.id),
    getLearnBookmarkState(user.id),
  ]);

  return (
    <LearnProgressProvider
      initialBookmarks={initialBookmarks}
      initialState={initialState}
      userId={user.id}
    >
      <div className="learn-tradingview h-full min-h-0">{children}</div>
    </LearnProgressProvider>
  );
}
