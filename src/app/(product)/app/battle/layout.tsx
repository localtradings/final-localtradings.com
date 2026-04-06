import type { ReactNode } from "react";

import { BattleRoomSyncProvider } from "@/features/battle/components/battle-room-sync-provider";

export default function BattleLayout({ children }: { children: ReactNode }) {
  return <BattleRoomSyncProvider>{children}</BattleRoomSyncProvider>;
}
