import type { Metadata } from "next";

import { BattleHomePage } from "@/features/battle/battle-home-page";

export const metadata: Metadata = {
  title: "Battle",
};

export default function BattleRoute() {
  return <BattleHomePage />;
}
