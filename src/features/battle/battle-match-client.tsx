"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { BattleEmptyState } from "@/features/battle/components/battle-empty-state";
import { BattleScoreboard } from "@/features/battle/components/battle-scoreboard";
import { useBattleMatch } from "@/features/battle/hooks/use-battle-match";
import type {
  BattleMatchLockReason,
  BattleRoomSession,
} from "@/features/battle/types";
import { BACKTEST_STATUS_LABELS } from "@/features/backtesting/constants";
import { BacktestChart } from "@/features/backtesting/components/backtest-chart";
import {
  BacktestingToolbar,
  CompactStat,
  InlineField,
  SELECT_CLASS,
  ToolbarLabel,
  formatMoney,
  getSessionTone,
} from "@/features/backtesting/components/backtesting-ui";
import type {
  BacktestDrawingTool,
} from "@/features/backtesting/types";
import { cn } from "@/lib/utils";

function formatTimer(remainingMs: number | null) {
  if (remainingMs === null) {
    return "--:--";
  }

  const totalSeconds = Math.max(0, Math.floor(remainingMs / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
}

function getLockMessage(lockReason: BattleMatchLockReason | null) {
  if (lockReason === "no_trade") {
    return "You were eliminated after missing the no-trade deadline. Replay and trading are now locked.";
  }

  if (lockReason === "forfeit") {
    return "You were forfeited after losing room presence. Rejoin a new match to trade again.";
  }

  if (lockReason === "left_early") {
    return "You left this match early. Replay and trading are now locked.";
  }

  if (lockReason === "finished") {
    return "This match is finished. Replay and trading are now read-only.";
  }

  if (lockReason === "cancelled") {
    return "This battle room was cancelled.";
  }

  return null;
}

function HeaderMetric({
  label,
  value,
  accentClassName,
}: {
  label: string;
  value: string;
  accentClassName?: string;
}) {
  return (
    <div className="min-w-0 rounded-[0.7rem] border border-white/8 bg-[#080d12] px-3 py-2 [@media(max-height:900px)]:rounded-[0.6rem] [@media(max-height:900px)]:px-2.5 [@media(max-height:900px)]:py-1.5">
      <p className="text-[9px] font-semibold uppercase tracking-[0.18em] text-slate-500 [@media(max-height:900px)]:text-[8px]">
        {label}
      </p>
      <p className={cn("mt-1 truncate text-sm font-semibold text-white [@media(max-height:900px)]:mt-0.5 [@media(max-height:900px)]:text-[13px]", accentClassName)}>
        {value}
      </p>
    </div>
  );
}

export function BattleMatchClient({ session }: { session: BattleRoomSession }) {
  const router = useRouter();
  const [activeDrawingTool, setActiveDrawingTool] =
    useState<BacktestDrawingTool>("cursor");
  const workspace = useBattleMatch(session);

  if (!session.workerConfigured) {
    return (
      <BattleEmptyState
        detail="Configure the battle worker first. The match route depends on the Cloudflare room service."
        title="Battle worker not configured"
      />
    );
  }

  if (!workspace.roomView && session.roomToken && !workspace.hasBootstrapped) {
    return (
      <BattleEmptyState
        detail="Connecting to the live match room."
        title="Loading match"
      />
    );
  }

  if (!workspace.roomView) {
    return (
      <BattleEmptyState
        detail="This match is not available. Rejoin from the lobby or return to Battle home."
        title="Match unavailable"
        action={
          <Button onClick={() => router.push("/app/battle")} type="button">
            Back to Battle
          </Button>
        }
      />
    );
  }

  const roomView = workspace.roomView;
  const lockMessage = getLockMessage(roomView.self.lockReason);
  const isLocked =
    roomView.self.participationStatus === "eliminated" || roomView.self.lockReason !== null;
  const isEliminated =
    roomView.self.lockReason === "no_trade" ||
    roomView.self.lockReason === "forfeit" ||
    roomView.self.lockReason === "left_early" ||
    roomView.self.participationStatus === "eliminated";
  const participationValue =
    roomView.self.lockReason === "forfeit"
      ? "Forfeit"
      : roomView.self.lockReason === "no_trade"
        ? "Eliminated"
        : roomView.self.lockReason === "finished"
          ? "Finished"
          : roomView.self.lockReason === "cancelled"
            ? "Cancelled"
            : roomView.self.participationStatus === "warned"
              ? `Warn ${formatTimer(workspace.participationRemainingMs)}`
              : roomView.self.hasEnteredTrade
                ? "Active"
                : "Waiting";
  const activeExecution = workspace.execution.status === "draft" ? null : workspace.execution;
  const executionDirection = roomView.self.execution?.direction ?? workspace.tradeDraft.direction;
  const riskRewardLabel =
    workspace.primaryValidation.isValid &&
    typeof workspace.primaryValidation.riskReward === "number"
      ? `${workspace.primaryValidation.riskReward.toFixed(2)}R`
      : activeExecution?.resultR !== null && activeExecution?.resultR !== undefined
        ? `${activeExecution.resultR.toFixed(2)}R`
        : "N/A";
  const statusLabel = isEliminated
    ? "Eliminated"
    : roomView.self.lockReason === "finished"
      ? "Finished"
      : roomView.self.lockReason === "cancelled"
        ? "Cancelled"
        : activeExecution
          ? BACKTEST_STATUS_LABELS[activeExecution.status]
          : "Ready";
  const priceInputValues = {
    entry:
      workspace.canConfigureDraft && workspace.tradeDraft.orderType !== "market"
        ? workspace.tradeDraft.entry
        : workspace.lineValues.entry?.toFixed(workspace.currentInstrument.pricePrecision) ?? "",
    stop: workspace.canConfigureDraft
      ? workspace.tradeDraft.stop
      : workspace.lineValues.stop?.toFixed(workspace.currentInstrument.pricePrecision) ?? "",
    target: workspace.canConfigureDraft
      ? workspace.tradeDraft.target
      : workspace.lineValues.target?.toFixed(workspace.currentInstrument.pricePrecision) ?? "",
  };
  const validationMessage =
    workspace.canConfigureDraft && !workspace.primaryValidation.isValid
      ? workspace.primaryValidation.message ?? "Complete the battle setup to trade."
      : workspace.error;

  return (
    <div className="flex min-h-[calc(100dvh-5rem)] flex-col gap-1.5 overflow-x-hidden overflow-y-auto text-white md:h-[calc(100dvh-5rem)] md:gap-2 md:overflow-y-hidden">
      <section className="grid shrink-0 gap-1.5 md:gap-2 md:grid-cols-[minmax(0,1fr)_clamp(13.5rem,24vw,18rem)] xl:grid-cols-[minmax(0,1fr)_clamp(15rem,24vw,22rem)] [@media(max-height:900px)]:gap-1.5">
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-2 rounded-[0.9rem] border border-white/8 bg-[#070b10] px-3 py-2.5 [@media(max-height:900px)]:gap-1.5 [@media(max-height:900px)]:rounded-[0.75rem] [@media(max-height:900px)]:px-2.5 [@media(max-height:900px)]:py-2">
            <div className="min-w-0">
              <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-slate-500 [@media(max-height:900px)]:text-[9px]">
                Battle Match
              </p>
              <p className="mt-1 text-sm font-semibold text-white [@media(max-height:900px)]:mt-0.5 [@media(max-height:900px)]:text-[13px]">
                Room {roomView.room.roomId.slice(0, 8)}
              </p>
            </div>
            <div className="ml-auto flex flex-wrap gap-2">
              <HeaderMetric label="Time Left" value={formatTimer(workspace.remainingMs)} />
              <HeaderMetric label="Participation" value={
                participationValue
              } accentClassName={
                isEliminated
                  ? "text-rose-300"
                  : roomView.self.participationStatus === "warned"
                    ? "text-amber-200"
                    : undefined
              } />
              <HeaderMetric
                label="Balance"
                value={`$${workspace.displayBalance.toLocaleString("en-US", {
                  maximumFractionDigits: 2,
                })}`}
              />
              <HeaderMetric
                label="Live PnL"
                value={formatMoney(workspace.liveUnrealizedPnl)}
                accentClassName={
                  workspace.liveUnrealizedPnl >= 0 ? "text-emerald-300" : "text-rose-300"
                }
              />
            </div>
          </div>

          {roomView.self.participationStatus === "warned" ? (
            <div className="rounded-[0.8rem] border border-amber-200/15 bg-[rgba(191,145,44,0.08)] px-3 py-2 text-xs text-amber-100 [@media(max-height:900px)]:rounded-[0.7rem] [@media(max-height:900px)]:px-2.5 [@media(max-height:900px)]:py-1.5 [@media(max-height:900px)]:text-[11px]">
              Enter one trade within {formatTimer(workspace.participationRemainingMs)} or the room will forfeit this match and apply the 15-minute cooldown.
            </div>
          ) : null}

          {lockMessage ? (
            <div className="rounded-[0.8rem] border border-rose-300/15 bg-[rgba(127,29,29,0.16)] px-3 py-2 text-xs text-rose-100 [@media(max-height:900px)]:rounded-[0.7rem] [@media(max-height:900px)]:px-2.5 [@media(max-height:900px)]:py-1.5 [@media(max-height:900px)]:text-[11px]">
              {lockMessage}
            </div>
          ) : null}
        </div>

        <BattleScoreboard
          players={roomView.room.players}
          viewerUserId={roomView.viewerUserId}
        />
      </section>

      <section className="grid min-h-0 flex-1 items-stretch gap-1.5 md:gap-2 md:grid-cols-[minmax(0,1fr)_clamp(13.5rem,22vw,16rem)] xl:grid-cols-[minmax(0,1fr)_clamp(15rem,22vw,18.5rem)] [@media(max-height:900px)]:gap-1.5">
        <div className="flex min-h-[18rem] flex-col overflow-hidden rounded-[0.95rem] border border-white/8 bg-[#070b10] sm:min-h-[20rem] md:min-h-0 [@media(max-height:900px)]:min-h-[16rem]">
          <BacktestingToolbar
            canStepForward={workspace.canStepForward}
            initialCatalog={{
              instruments: [],
              timeframes: [],
            }}
            isLoading={workspace.isPending}
            loadButtonLabel=""
            onRandomizeWindow={() => undefined}
            onReplaySpeedChange={() => undefined}
            onSelectionFieldChange={() => undefined}
            onStepReplayForward={() => undefined}
            onTogglePlayback={workspace.togglePlayback}
            replay={workspace.replay}
            selectionDraft={{
              symbol: roomView.room.symbol ?? "",
              timeframe: roomView.room.timeframe ?? "15min",
            }}
            showSelectionControls={false}
            showSpeedControl={false}
            showRandomizeButton={false}
            showNextCandleButton={false}
            showBalancePill={false}
            lockedSelection={{
              symbolLabel: roomView.room.symbol ?? "Pending",
              timeframeLabel: roomView.room.timeframe ?? "Pending",
            }}
            lockedSpeedLabel="4x"
          />

          <div className="grid min-h-0 flex-1 grid-rows-[minmax(0,1fr)_auto] px-1 pt-1 pb-0.5 [@media(max-height:900px)]:pt-0.5">
            <div className="min-h-0 overflow-hidden rounded-[0.75rem]">
              <BacktestChart
                activeDrawingTool={activeDrawingTool}
                candles={workspace.revealedCandles}
                drawingStorageKey={`battle-drawings:${roomView.room.roomId}:${roomView.viewerUserId}`}
                direction={executionDirection}
                editableFields={{
                  entry:
                    activeDrawingTool === "cursor" &&
                    workspace.canConfigureDraft &&
                    workspace.tradeDraft.orderType !== "market",
                  stop: activeDrawingTool === "cursor" && workspace.canConfigureDraft,
                  target: activeDrawingTool === "cursor" && workspace.canConfigureDraft,
                }}
                execution={workspace.execution}
                instrument={workspace.currentInstrument}
                isLoading={workspace.isPending}
                lineValues={workspace.lineValues}
                onLineChange={workspace.setLineValue}
                onToolChange={setActiveDrawingTool}
                canEditLines={workspace.canManageTradeLines}
                hasStopLine={workspace.hasStop}
                hasTargetLine={workspace.hasTarget}
                onAddOptionalLine={workspace.addDraftLine}
                onRemoveOptionalLine={workspace.removeDraftLine}
                showTradeControls
                windowKey={roomView.room.roomId}
              />
            </div>
            <div className="flex justify-end pl-8 pr-2 pt-1 sm:pl-16">
              <p className="whitespace-nowrap text-right text-[10px] text-slate-500">
                Charts by{" "}
                <Link
                  className="text-slate-300 underline decoration-white/20 underline-offset-2 transition hover:text-white"
                  href="https://www.tradingview.com/"
                  rel="noreferrer"
                  target="_blank"
                >
                  TradingView
                </Link>
              </p>
            </div>
          </div>
        </div>

        <aside className="grid min-h-0 auto-rows-max gap-1.5 overflow-visible rounded-[0.95rem] border border-white/8 bg-[#070b10] p-1.5 sm:max-md:grid-cols-2 md:flex md:flex-col md:max-h-full md:gap-2 md:overflow-y-auto md:overscroll-contain md:p-2 [@media(max-height:900px)]:gap-1.5 [@media(max-height:900px)]:p-1.5">
          <div className="rounded-[0.8rem] border border-white/8 bg-[#0b1016] px-3 py-2 sm:max-md:col-span-2 [@media(max-height:900px)]:rounded-[0.7rem] [@media(max-height:900px)]:px-2.5 [@media(max-height:900px)]:py-1.5">
            <div className="flex items-center justify-between gap-2">
              <ToolbarLabel>Order Ticket</ToolbarLabel>
              <span
                className={cn(
                  "inline-flex rounded-[0.4rem] border px-2 py-0.5 text-[9px] font-semibold uppercase tracking-[0.16em]",
                  isLocked
                    ? "border-[#7f1d1d] bg-[#2c1113] text-[#fecaca]"
                    : getSessionTone(activeExecution?.status ?? "draft"),
                )}
              >
                {statusLabel}
              </span>
            </div>
            <div className="mt-2 grid grid-cols-2 gap-2 [@media(max-height:900px)]:mt-1.5 [@media(max-height:900px)]:gap-1.5">
              <CompactStat
                label="Replay"
                value={`${workspace.revealedCandles.length}/${roomView.room.candles.length}`}
              />
              <CompactStat label="R:R" value={riskRewardLabel} />
            </div>
          </div>

          <label className="grid gap-1 rounded-[0.8rem] border border-white/8 bg-[#0b1016] p-2 [@media(max-height:900px)]:rounded-[0.7rem] [@media(max-height:900px)]:p-1.5">
            <ToolbarLabel>Order Type</ToolbarLabel>
            <Select
              className={SELECT_CLASS}
              disabled={!workspace.canConfigureDraft}
              id="battle-order-type"
              name="battle_order_type"
              onChange={(event) =>
                workspace.updateOrderType(event.target.value as "market" | "limit" | "stop")
              }
              value={workspace.tradeDraft.orderType}
            >
              <option value="market">Market</option>
              <option value="limit">Limit</option>
              <option value="stop">Stop</option>
            </Select>
          </label>

          <div className="grid gap-2 rounded-[0.8rem] border border-white/8 bg-[#0b1016] p-2 [@media(max-height:900px)]:gap-1.5 [@media(max-height:900px)]:rounded-[0.7rem] [@media(max-height:900px)]:p-1.5">
            <InlineField
              disabled={!workspace.canConfigureDraft || workspace.tradeDraft.orderType === "market"}
              fieldId="battle-entry"
              label="Entry"
              name="battle_entry"
              onChange={(value) => workspace.updateDraftField("entry", value)}
              readOnly={workspace.tradeDraft.orderType === "market"}
              value={priceInputValues.entry}
            />
            {workspace.hasStop ? (
              <InlineField
                disabled={!workspace.canConfigureDraft}
                fieldId="battle-stop-loss"
                label="Stop Loss"
                name="battle_stop_loss"
                onChange={(value) => workspace.updateDraftField("stop", value)}
                value={priceInputValues.stop}
              />
            ) : null}
            {workspace.hasTarget ? (
              <InlineField
                disabled={!workspace.canConfigureDraft}
                fieldId="battle-take-profit"
                label="Take Profit"
                name="battle_take_profit"
                onChange={(value) => workspace.updateDraftField("target", value)}
                value={priceInputValues.target}
              />
            ) : null}
            <InlineField
              disabled={!workspace.canConfigureDraft}
              fieldId="battle-risk-percent"
              label="Risk %"
              name="battle_risk_percent"
              onChange={workspace.updateRiskPercent}
              value={workspace.tradeDraft.riskPercent}
            />
            {!workspace.hasStop && !workspace.hasTarget ? (
              <p className="px-1 text-[10px] text-slate-500 [@media(max-height:900px)]:hidden">
                Add TP or SL from the yellow chart pills.
              </p>
            ) : null}
          </div>

          <div className="grid grid-cols-3 gap-2 sm:max-md:col-span-2 [@media(max-height:900px)]:gap-1.5">
            <CompactStat
              label="Notional $"
              value={formatMoney(workspace.riskSettings.riskAmount)}
            />
            <CompactStat
              label="Size"
              value={
                typeof workspace.volumePreview === "number"
                  ? workspace.volumePreview.toFixed(2)
                  : "N/A"
              }
            />
            <CompactStat
              label="Risk %"
              value={`${workspace.riskSettings.riskPercent.toFixed(2)}%`}
            />
          </div>

          {validationMessage ? (
            <div className="rounded-[0.75rem] border border-white/8 bg-[#0b1016] px-3 py-2 text-[11px] leading-5 text-slate-300 sm:max-md:col-span-2 [@media(max-height:900px)]:rounded-[0.7rem] [@media(max-height:900px)]:px-2.5 [@media(max-height:900px)]:py-1.5 [@media(max-height:900px)]:text-[10px] [@media(max-height:900px)]:leading-4">
              {validationMessage}
            </div>
          ) : null}

          <div className="sticky bottom-0 z-10 mt-auto grid grid-cols-2 gap-2 border-t border-white/8 bg-[#070b10]/95 pt-2 backdrop-blur sm:max-md:col-span-2 xl:static xl:border-t-0 xl:bg-transparent xl:pt-0 [@media(max-height:900px)]:gap-1.5 [@media(max-height:900px)]:pt-1.5">
            <Button
              className="h-9 rounded-[0.7rem] border border-[#2563eb] bg-[#1d4ed8] px-3 text-xs font-semibold text-[#eff6ff] hover:bg-[#1e40af] [@media(max-height:900px)]:h-8 [@media(max-height:900px)]:rounded-[0.6rem] [@media(max-height:900px)]:px-2.5 [@media(max-height:900px)]:text-[11px]"
              disabled={workspace.isPending || !workspace.canArmBuy}
              onClick={workspace.armBuy}
              type="button"
              variant="ghost"
            >
              Buy
            </Button>
            <Button
              className="h-9 rounded-[0.7rem] border border-[#dc2626] bg-[#b91c1c] px-3 text-xs font-semibold text-[#fff1f2] hover:bg-[#991b1b] [@media(max-height:900px)]:h-8 [@media(max-height:900px)]:rounded-[0.6rem] [@media(max-height:900px)]:px-2.5 [@media(max-height:900px)]:text-[11px]"
              disabled={workspace.isPending || !workspace.canArmSell}
              onClick={workspace.armSell}
              type="button"
              variant="ghost"
            >
              Sell
            </Button>
            <Button
              className="h-9 rounded-[0.7rem] border border-white/8 bg-[#0d1319] px-3 text-xs font-semibold text-slate-200 hover:bg-[#121922] [@media(max-height:900px)]:h-8 [@media(max-height:900px)]:rounded-[0.6rem] [@media(max-height:900px)]:px-2.5 [@media(max-height:900px)]:text-[11px]"
              disabled={workspace.isPending || !workspace.canConfigureDraft}
              onClick={workspace.resetTradeLines}
              type="button"
              variant="ghost"
            >
              Reset
            </Button>
            <Button
              className="h-9 rounded-[0.7rem] border border-white/8 bg-[#0d1319] px-3 text-xs font-semibold text-slate-200 hover:bg-[#121922] [@media(max-height:900px)]:h-8 [@media(max-height:900px)]:rounded-[0.6rem] [@media(max-height:900px)]:px-2.5 [@media(max-height:900px)]:text-[11px]"
              disabled={workspace.isPending || !workspace.canCloseTrade}
              onClick={workspace.closeTrade}
              type="button"
              variant="ghost"
            >
              Close
            </Button>
          </div>
        </aside>
      </section>
    </div>
  );
}
