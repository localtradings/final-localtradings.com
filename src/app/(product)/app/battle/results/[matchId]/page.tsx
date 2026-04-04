import type { Metadata } from "next";

import { BattleResultsPage } from "@/features/battle/battle-results-page";

type BattleResultsRouteProps = {
  params: Promise<{
    matchId: string;
  }>;
};

export async function generateMetadata({
  params,
}: BattleResultsRouteProps): Promise<Metadata> {
  const { matchId } = await params;
  return {
    title: `Battle Results ${matchId.slice(0, 8)}`,
  };
}

export default async function BattleResultsRoute({
  params,
}: BattleResultsRouteProps) {
  const { matchId } = await params;

  return <BattleResultsPage roomId={matchId} />;
}
