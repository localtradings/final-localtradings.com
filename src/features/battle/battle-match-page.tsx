import { getBattleRoomPageSession } from "@/server/battle/actions";

import { BattleMatchClient } from "./battle-match-client";

export async function BattleMatchPage({ roomId }: { roomId: string }) {
  const session = await getBattleRoomPageSession(roomId);

  return <BattleMatchClient session={session} />;
}
