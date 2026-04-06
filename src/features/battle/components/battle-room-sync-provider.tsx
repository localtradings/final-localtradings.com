"use client";

import { createContext, useContext, useState } from "react";

import {
  createBattleRoomSyncStoreRegistry,
  type BattleRoomSyncStoreRegistry,
} from "@/features/battle/lib/room-sync-store";

const BattleRoomSyncContext = createContext<BattleRoomSyncStoreRegistry | null>(null);

export function BattleRoomSyncProvider({ children }: { children: React.ReactNode }) {
  const [registry] = useState<BattleRoomSyncStoreRegistry>(() => createBattleRoomSyncStoreRegistry());

  return (
    <BattleRoomSyncContext.Provider value={registry}>
      {children}
    </BattleRoomSyncContext.Provider>
  );
}

export function useBattleRoomSyncRegistry() {
  const registry = useContext(BattleRoomSyncContext);
  if (!registry) {
    throw new Error("useBattleRoomSyncRegistry must be used within BattleRoomSyncProvider.");
  }

  return registry;
}
