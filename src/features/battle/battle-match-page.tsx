import { requireUser } from "@/server/auth/session";
import { attachBattleRoomToken } from "@/server/battle/room-session";
import { getBattleRoomSession } from "@/server/battle/queries";

import { BattleMatchClient } from "./battle-match-client";

export async function BattleMatchPage({ roomId }: { roomId: string }) {
  const user = await requireUser();
  const session = attachBattleRoomToken(await getBattleRoomSession(roomId, user.id), user.id);

  return <BattleMatchClient session={session} />;
}
