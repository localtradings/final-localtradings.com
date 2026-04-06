import { requireUser } from "@/server/auth/session";
import { attachBattleRoomToken } from "@/server/battle/room-session";
import { getBattleRoomSession } from "@/server/battle/queries";

import { BattleLobbyClient } from "./battle-lobby-client";

export async function BattleLobbyPage({ roomId }: { roomId: string }) {
  const user = await requireUser();
  const session = attachBattleRoomToken(
    await getBattleRoomSession(roomId, user.id, { hydrateFromWorker: false }),
    user.id,
  );

  return <BattleLobbyClient session={session} />;
}
