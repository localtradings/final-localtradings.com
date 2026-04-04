"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function BattleTradePanel({
  direction,
  volume,
  onDirectionChange,
  onVolumeChange,
  onOpenTrade,
  onCloseTrade,
  hasOpenTrade,
  unrealizedPnl,
  disabled,
}: {
  direction: "Long" | "Short";
  volume: string;
  onDirectionChange: (direction: "Long" | "Short") => void;
  onVolumeChange: (value: string) => void;
  onOpenTrade: () => void;
  onCloseTrade: () => void;
  hasOpenTrade: boolean;
  unrealizedPnl: number;
  disabled?: boolean;
}) {
  return (
    <div className="learn-tv-panel space-y-5 rounded-[0.95rem] p-4">
      <div className="space-y-2">
        <p className="learn-tv-kicker">
          Position
        </p>
        <div className="learn-tv-frame grid grid-cols-2 gap-2 rounded-[0.8rem] bg-black/20 p-1">
          <Button
            className={
              direction === "Long"
                ? "bg-white/[0.08] text-white hover:bg-white/[0.1]"
                : "bg-transparent text-muted hover:bg-white/[0.04]"
            }
            disabled={disabled || hasOpenTrade}
            onClick={() => onDirectionChange("Long")}
            size="sm"
            type="button"
            variant="ghost"
          >
            Long
          </Button>
          <Button
            className={
              direction === "Short"
                ? "bg-white/[0.08] text-white hover:bg-white/[0.1]"
                : "bg-transparent text-muted hover:bg-white/[0.04]"
            }
            disabled={disabled || hasOpenTrade}
            onClick={() => onDirectionChange("Short")}
            size="sm"
            type="button"
            variant="ghost"
          >
            Short
          </Button>
        </div>
      </div>

      <div className="space-y-2">
        <p className="learn-tv-kicker">
          Volume
        </p>
        <Input
          className="min-h-11 border-white/[0.08] bg-black/20 text-white"
          disabled={disabled || hasOpenTrade}
          max="100"
          min="0.01"
          onChange={(event) => onVolumeChange(event.target.value)}
          step="0.01"
          type="number"
          value={volume}
        />
      </div>

      <div className="learn-tv-frame rounded-[0.85rem] bg-black/20 px-3 py-3">
        <p className="learn-tv-kicker">
          Unrealized
        </p>
        <p className={unrealizedPnl >= 0 ? "mt-2 text-2xl font-semibold tracking-[-0.03em] text-emerald-300" : "mt-2 text-2xl font-semibold tracking-[-0.03em] text-rose-300"}>
          ${unrealizedPnl.toLocaleString("en-US", { maximumFractionDigits: 2 })}
        </p>
      </div>

      {hasOpenTrade ? (
        <Button className="min-h-11 w-full bg-white/[0.08] text-white hover:bg-white/[0.12]" disabled={disabled} onClick={onCloseTrade} type="button">
          Close Trade
        </Button>
      ) : (
        <Button className="min-h-11 w-full bg-white text-black hover:bg-slate-100" disabled={disabled} onClick={onOpenTrade} type="button">
          Open Trade
        </Button>
      )}
    </div>
  );
}
