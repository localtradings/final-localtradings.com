import { Copy } from "lucide-react";

import { Button } from "@/components/ui/button";

export function BattleRoomCode({
  lobbyCode,
  onCopy,
}: {
  lobbyCode: string | null;
  onCopy?: () => void;
}) {
  return (
    <div className="learn-tv-panel flex min-w-[16rem] items-center gap-3 rounded-[0.9rem] px-3 py-3">
      <div className="min-w-0">
        <p className="learn-tv-kicker">
          Room Code
        </p>
        <p className="mt-1 font-mono text-xl font-semibold tracking-[0.26em] text-white">
          {lobbyCode ?? "------"}
        </p>
      </div>
      <Button
        className="ml-auto min-h-10 border border-white/[0.08] bg-white/[0.04] px-3 text-white hover:bg-white/[0.08]"
        disabled={!lobbyCode}
        onClick={onCopy}
        size="sm"
        type="button"
        variant="ghost"
      >
        <Copy className="h-4 w-4" strokeWidth={1.8} />
        Copy
      </Button>
    </div>
  );
}
