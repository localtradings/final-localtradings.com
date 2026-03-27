"use client";

import { useMemo, useState } from "react";
import { ChevronDown, ChevronUp, History } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { BacktestBalancePill } from "@/components/layout/backtest-balance-pill";

import { REPLAY_SPEEDS } from "../constants";
import type { BacktestAccountRecord } from "../types";
import { useBacktestingWorkspace } from "../hooks/use-backtesting-workspace";
import { BacktestChart } from "./backtest-chart";

type BacktestingClientProps = {
  initialAccount?: BacktestAccountRecord | null;
  userId?: string | null;
};

const SELECT_CLASS =
  "h-8 min-h-8 rounded-md border border-white/8 bg-[#0d1319] px-2.5 py-1 text-xs text-slate-100 shadow-[inset_0_1px_0_rgba(255,255,255,0.03)] focus:border-white/16 focus:ring-2 focus:ring-white/6";

const INPUT_CLASS =
  "h-8 min-h-8 rounded-md border border-white/8 bg-[#0d1319] px-2.5 py-1 text-xs text-slate-100 shadow-[inset_0_1px_0_rgba(255,255,255,0.03)] focus:border-white/16 focus:ring-2 focus:ring-white/6";

function ToolbarLabel({ children }: { children: string }) {
  return (
    <span className="text-[9px] font-medium uppercase tracking-[0.16em] text-slate-500">
      {children}
    </span>
  );
}

function formatMoney(value: number | null) {
  if (typeof value !== "number" || Number.isNaN(value)) {
    return "N/A";
  }

  const sign = value > 0 ? "+" : value < 0 ? "-" : "";
  return `${sign}$${Math.abs(value).toFixed(2)}`;
}

function formatEditableNumber(value: number | null, digits = 2) {
  if (typeof value !== "number" || Number.isNaN(value)) {
    return "";
  }

  return Number(value.toFixed(digits)).toString();
}

function CompactStat({
  label,
  value,
  accentClassName,
}: {
  label: string;
  value: string;
  accentClassName?: string;
}) {
  return (
    <div className="rounded-md bg-[#0d1218] px-2.5 py-2">
      <p className="text-[9px] font-medium uppercase tracking-[0.16em] text-slate-500">
        {label}
      </p>
      <p className={cn("mt-1 text-xs font-semibold text-slate-100", accentClassName)}>
        {value}
      </p>
    </div>
  );
}

function InlineField({
  label,
  value,
  onChange,
  disabled = false,
  readOnly = false,
  accentClassName,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  readOnly?: boolean;
  accentClassName?: string;
}) {
  return (
    <label className="grid gap-1">
      <ToolbarLabel>{label}</ToolbarLabel>
      <Input
        className={cn(INPUT_CLASS, accentClassName)}
        disabled={disabled}
        inputMode="decimal"
        onChange={(event) => onChange(event.target.value)}
        readOnly={readOnly}
        value={value}
      />
    </label>
  );
}

export function BacktestingClient({
  initialAccount,
  userId,
}: BacktestingClientProps) {
  const workspace = useBacktestingWorkspace({ initialAccount, userId });
  const [historyOpen, setHistoryOpen] = useState(false);

  const riskRewardLabel = useMemo(() => {
    if (!workspace.primaryValidation.isValid || !workspace.primaryValidation.riskReward) {
      return "Invalid";
    }

    return `${workspace.primaryValidation.riskReward.toFixed(2)}R`;
  }, [workspace.primaryValidation]);

  const resultBadge = useMemo(() => {
    if (workspace.execution.status === "target_hit") {
      return `Target Hit ${formatMoney(workspace.execution.resultAmount)}`;
    }

    if (workspace.execution.status === "stop_hit") {
      return `Stop Hit ${formatMoney(workspace.execution.resultAmount)}`;
    }

    if (workspace.execution.status === "armed") {
      return "Waiting For Entry";
    }

    if (workspace.execution.status === "active") {
      return `Trade Live ${formatMoney(workspace.liveResultAmount)}`;
    }

    if (workspace.execution.status === "unfinished") {
      return `Window Ended ${formatMoney(workspace.execution.resultAmount)}`;
    }

    return "Draft";
  }, [
    workspace.execution.resultAmount,
    workspace.execution.status,
    workspace.liveResultAmount,
  ]);

  const priceInputValues = {
    entry:
      workspace.execution.status === "draft"
        ? typeof workspace.lineValues.entry === "number"
          ? workspace.lineValues.entry.toFixed(workspace.currentInstrument.pricePrecision)
          : workspace.tradeDraft.entry
        : typeof workspace.lineValues.entry === "number"
          ? workspace.lineValues.entry.toFixed(workspace.currentInstrument.pricePrecision)
          : "",
    stop:
      workspace.execution.status === "draft"
        ? workspace.tradeDraft.stop
        : typeof workspace.lineValues.stop === "number"
          ? workspace.lineValues.stop.toFixed(workspace.currentInstrument.pricePrecision)
          : "",
    target:
      workspace.execution.status === "draft"
        ? workspace.tradeDraft.target
        : typeof workspace.lineValues.target === "number"
          ? workspace.lineValues.target.toFixed(workspace.currentInstrument.pricePrecision)
          : "",
  };

  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden rounded-[var(--radius-xl)] bg-[#080d12] shadow-[inset_0_1px_0_rgba(255,255,255,0.02)] ring-1 ring-white/5">
      <div className="shrink-0 border-b border-white/5 px-2 py-1.5">
        <div className="flex flex-wrap items-end gap-2">
          <label className="grid w-[8.5rem] min-w-0 gap-1">
            <ToolbarLabel>Symbol</ToolbarLabel>
            <Select
              className={SELECT_CLASS}
              onChange={(event) =>
                workspace.updateSelectionField("symbol", event.target.value)
              }
              value={workspace.selectionDraft.symbol}
            >
              {workspace.initialCatalog.instruments.map((item) => (
                <option key={item.symbol} value={item.symbol}>
                  {item.label}
                </option>
              ))}
            </Select>
          </label>

          <label className="grid w-[5.75rem] min-w-0 gap-1">
            <ToolbarLabel>Timeframe</ToolbarLabel>
            <Select
              className={SELECT_CLASS}
              onChange={(event) =>
                workspace.updateSelectionField("timeframe", event.target.value)
              }
              value={workspace.selectionDraft.timeframe}
            >
              {workspace.initialCatalog.timeframes.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </Select>
          </label>

          <label className="grid w-[5rem] min-w-0 gap-1">
            <ToolbarLabel>Speed</ToolbarLabel>
            <Select
              className={SELECT_CLASS}
              onChange={(event) =>
                workspace.setReplay((current) => ({
                  ...current,
                  speedId: event.target.value,
                  isPlaying: false,
                }))
              }
              value={workspace.replay.speedId}
            >
              {REPLAY_SPEEDS.map((speed) => (
                <option key={speed.id} value={speed.id}>
                  {speed.label}
                </option>
              ))}
            </Select>
          </label>

          <div className="ml-auto flex flex-wrap items-center gap-1.5">
            <BacktestBalancePill
              className="h-8 rounded-md border-white/8 bg-[#0d1319] px-2.5 text-[11px] text-slate-100"
              initialBalance={initialAccount?.currentBalance}
              userId={userId}
            />
            <Button
              className="h-8 min-h-8 rounded-md border border-white/8 bg-[#0d1319] px-3 text-xs font-semibold text-slate-100 hover:bg-[#121922]"
              disabled={workspace.isLoading}
              onClick={workspace.randomizeWindow}
              type="button"
              variant="ghost"
            >
              New Chart
            </Button>
            <Button
              className="h-8 min-h-8 rounded-md border border-white/8 bg-[#0d1319] px-3 text-xs font-semibold text-slate-100 hover:bg-[#121922]"
              disabled={!workspace.canStepForward || workspace.isLoading}
              onClick={workspace.togglePlayback}
              type="button"
              variant="ghost"
            >
              {workspace.replay.isPlaying ? "Pause" : "Play"}
            </Button>
            <Button
              className="h-8 min-h-8 rounded-md border border-white/8 bg-[#0d1319] px-3 text-xs font-semibold text-slate-100 hover:bg-[#121922]"
              disabled={!workspace.canStepForward || workspace.isLoading}
              onClick={workspace.stepReplayForward}
              type="button"
              variant="ghost"
            >
              Next Candle
            </Button>
          </div>
        </div>
      </div>

      <div className="grid min-h-0 flex-1 grid-cols-1 gap-2 p-2 lg:grid-cols-[minmax(0,1fr)_15rem]">
        <section className="min-h-0 min-w-0">
          <BacktestChart
            candles={workspace.revealedCandles}
            direction={workspace.tradeDraft.direction}
            editableFields={{
              entry: workspace.canDragLines && workspace.orderType !== "market",
              stop: workspace.canDragLines,
              target: workspace.canDragLines,
            }}
            execution={workspace.execution}
            instrument={workspace.currentInstrument}
            isLoading={workspace.isLoading}
            lineValues={workspace.lineValues}
            onLineChange={workspace.setLineValue}
            canEditLines={workspace.canDragLines}
            windowKey={workspace.windowKey}
          />
        </section>

        <aside className="flex min-h-0 flex-col gap-2 overflow-hidden rounded-lg bg-[#090d12] p-1.5">
          <div className="grid grid-cols-2 gap-2">
            <CompactStat label="Result" value={resultBadge} />
            <CompactStat
              accentClassName={cn(
                workspace.execution.status === "target_hit" && "text-[#86efac]",
                workspace.execution.status === "stop_hit" && "text-[#fca5a5]",
                workspace.execution.status === "active" && "text-[#93c5fd]",
              )}
              label="R / R"
              value={riskRewardLabel}
            />
          </div>

          <label className="grid gap-1 rounded-md bg-[#0c1117] p-1.5">
            <ToolbarLabel>Order Type</ToolbarLabel>
            <Select
              className={SELECT_CLASS}
              disabled={!workspace.canDragLines}
              onChange={(event) =>
                workspace.updateOrderType(event.target.value as "market" | "limit" | "stop")
              }
              value={workspace.orderType}
            >
              <option value="market">Market</option>
              <option value="limit">Limit</option>
              <option value="stop">Stop</option>
            </Select>
          </label>

          <div className="grid grid-cols-3 gap-1.5 rounded-md bg-[#0c1117] p-1.5">
            <InlineField
              disabled={!workspace.canDragLines || workspace.orderType === "market"}
              label="Entry"
              onChange={(value) => workspace.updateDraftField("entry", value)}
              readOnly={workspace.orderType === "market"}
              value={priceInputValues.entry}
            />
            <InlineField
              disabled={!workspace.canDragLines}
              label="Stop"
              onChange={(value) => workspace.updateDraftField("stop", value)}
              value={priceInputValues.stop}
            />
            <InlineField
              disabled={!workspace.canDragLines}
              label="Target"
              onChange={(value) => workspace.updateDraftField("target", value)}
              value={priceInputValues.target}
            />
          </div>

          <div className="grid grid-cols-2 gap-1.5 rounded-md bg-[#0c1117] p-1.5">
            <InlineField
              label="Start"
              onChange={(value) => workspace.updateStartingBalance(Number(value))}
              value={formatEditableNumber(workspace.account.startingBalance)}
            />
            <InlineField
              disabled={!workspace.canDragLines}
              label="Volume"
              onChange={(value) => workspace.updateVolume(Number(value))}
              value={workspace.tradeDraft.volume}
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <CompactStat
              label="Risk %"
              value={formatEditableNumber(workspace.riskSettings.riskPercent, 2) || "N/A"}
            />
            <CompactStat label="Risk $" value={formatMoney(workspace.riskSettings.riskAmount)} />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <Button
              className="h-8 min-h-8 rounded-md border border-[#3b82f6]/35 bg-[#3b82f6]/18 px-3 text-xs font-semibold text-[#cfe3ff] hover:bg-[#3b82f6]/24"
              disabled={!workspace.canArmBuy}
              onClick={workspace.armBuy}
              type="button"
              variant="ghost"
            >
              Buy
            </Button>
            <Button
              className="h-8 min-h-8 rounded-md border border-[#ef4444]/35 bg-[#ef4444]/18 px-3 text-xs font-semibold text-[#ffd0d0] hover:bg-[#ef4444]/24"
              disabled={!workspace.canArmSell}
              onClick={workspace.armSell}
              type="button"
              variant="ghost"
            >
              Sell
            </Button>
            <Button
              className="h-8 min-h-8 rounded-md border border-white/8 bg-[#0d1319] px-3 text-xs font-semibold text-slate-200 hover:bg-[#121922]"
              onClick={workspace.resetTradeLines}
              type="button"
              variant="ghost"
            >
              Reset
            </Button>
            <Button
              className="h-8 min-h-8 rounded-md border border-white/8 bg-[#0d1319] px-3 text-xs font-semibold text-slate-200 hover:bg-[#121922]"
              onClick={workspace.resetAccountBalance}
              type="button"
              variant="ghost"
            >
              Reset $
            </Button>
          </div>

          {(workspace.notice || workspace.loadError) ? (
            <div
              className={cn(
                "rounded-md bg-[#0c1117] px-2.5 py-2 text-[11px] leading-5",
                workspace.loadError ? "text-[#fca5a5]" : "text-slate-400",
              )}
            >
              {workspace.loadError ?? workspace.notice}
            </div>
          ) : null}

          <div className="mt-auto rounded-md bg-[#0c1117]">
            <button
              className="flex w-full items-center justify-between px-2.5 py-2 text-left text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400"
              onClick={() => setHistoryOpen((current) => !current)}
              type="button"
            >
              <span className="inline-flex items-center gap-1.5">
                <History className="h-3.5 w-3.5" />
                History
              </span>
              {historyOpen ? (
                <ChevronUp className="h-3.5 w-3.5" />
              ) : (
                <span className="inline-flex items-center gap-1.5">
                  <span>{workspace.history.length}</span>
                  <ChevronDown className="h-3.5 w-3.5" />
                </span>
              )}
            </button>

            {historyOpen ? (
              <div className="max-h-40 space-y-1.5 overflow-y-auto px-2.5 pb-2.5">
                {workspace.history.length > 0 ? (
                  workspace.history.map((item) => (
                    <div className="rounded-md bg-[#0a0f15] px-2.5 py-2 text-[11px] text-slate-300" key={item.id}>
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-semibold">
                          {item.symbol} {item.timeframe}
                        </span>
                        <span
                          className={cn(
                            "font-semibold",
                            item.status === "target_hit" && "text-[#86efac]",
                            item.status === "stop_hit" && "text-[#fca5a5]",
                          )}
                        >
                          {formatMoney(item.resultAmount)}
                        </span>
                      </div>
                      <div className="mt-1 flex items-center justify-between gap-2 text-slate-500">
                        <span>
                          {item.direction} · {item.orderType} · {item.volume?.toFixed(2) ?? "N/A"} vol
                        </span>
                        <span>
                          {item.resultR !== null ? `${item.resultR.toFixed(2)}R` : "N/A"}
                        </span>
                        <span>
                          {item.balanceAfter !== null ? formatMoney(item.balanceAfter) : "N/A"}
                        </span>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="px-2.5 py-2 text-[11px] text-slate-500">
                    No trades closed yet.
                  </div>
                )}
              </div>
            ) : null}
          </div>
        </aside>
      </div>
    </div>
  );
}
