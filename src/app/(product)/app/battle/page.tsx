import type { Metadata } from "next";

import { BattleHomePage } from "@/features/battle/battle-home-page";

export const metadata: Metadata = {
  title: "Battle",
};

export const dynamic = "force-dynamic";

export default function BattleRoute() {
  return <BattleHomePage />;
}
