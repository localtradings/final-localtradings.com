import { requireUser } from "@/server/auth/session";
import { getBattleResult } from "@/server/battle/queries";

import { BattleResultsClient } from "./battle-results-client";

export async function BattleResultsPage({ roomId }: { roomId: string }) {
  const user = await requireUser();
  const result = await getBattleResult(user.id, roomId);

  return <BattleResultsClient result={result} />;
}
