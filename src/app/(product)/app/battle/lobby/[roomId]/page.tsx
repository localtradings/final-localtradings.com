import type { Metadata } from "next";

import { BattleLobbyPage } from "@/features/battle/battle-lobby-page";

type BattleLobbyRouteProps = {
  params: Promise<{
    roomId: string;
  }>;
};

export async function generateMetadata({
  params,
}: BattleLobbyRouteProps): Promise<Metadata> {
  const { roomId } = await params;
  return {
    title: `Battle Lobby ${roomId.slice(0, 8)}`,
  };
}

export default async function BattleLobbyRoute({ params }: BattleLobbyRouteProps) {
  const { roomId } = await params;

  return <BattleLobbyPage roomId={roomId} />;
}
