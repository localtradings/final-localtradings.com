import type { Metadata } from "next";

import { BattleMatchPage } from "@/features/battle/battle-match-page";

type BattleMatchRouteProps = {
  params: Promise<{
    roomId: string;
  }>;
};

export async function generateMetadata({
  params,
}: BattleMatchRouteProps): Promise<Metadata> {
  const { roomId } = await params;
  return {
    title: `Battle Match ${roomId.slice(0, 8)}`,
  };
}

export default async function BattleMatchRoute({ params }: BattleMatchRouteProps) {
  const { roomId } = await params;

  return <BattleMatchPage roomId={roomId} />;
}
