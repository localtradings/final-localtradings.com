import { requireUser } from "@/server/auth/session";

import { BattleHomeClient } from "./battle-home-client";
import { getBattleHomeData } from "@/server/battle/queries";

export async function BattleHomePage() {
  const user = await requireUser();
  const data = await getBattleHomeData(user.id);

  return <BattleHomeClient data={data} />;
}
