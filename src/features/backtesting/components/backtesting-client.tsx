"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { ChevronDown, ChevronUp, History, Share2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { BacktestBalancePill } from "@/components/layout/backtest-balance-pill";

import { getBacktestInstrument, REPLAY_SPEEDS } from "../constants";
import type { BacktestAccountRecord, BacktestSessionRecord, BacktestSessionStatus } from "../types";
import { useBacktestingWorkspace } from "../hooks/use-backtesting-workspace";
import { downloadBacktestShareCard } from "../utils/share-card";
import { BacktestChart } from "./backtest-chart";

type BacktestingClientProps = {
  initialAccount?: BacktestAccountRecord | null;
  initialSessions?: BacktestSessionRecord[];
  shareDisplayName: string;
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
    <div className="rounded-md bg-[#0d1218] px-2 py-1.5">
      <p className="text-[9px] font-medium uppercase tracking-[0.16em] text-slate-500">
        {label}
      </p>
      <p className={cn("mt-0.5 text-[11px] font-semibold leading-4 text-slate-100", accentClassName)}>
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

function getSessionTone(status: BacktestSessionStatus) {
  if (status === "target_hit") {
    return "border-[#14532d] bg-[#0d2315] text-[#bbf7d0]";
  }

  if (status === "stop_hit") {
    return "border-[#7f1d1d] bg-[#2c1113] text-[#fecaca]";
  }

  if (status === "manual_close" || status === "breakeven" || status === "unfinished") {
    return "border-white/10 bg-[#131922] text-slate-200";
  }

  if (status === "active") {
    return "border-[#1d4ed8] bg-[#0d1e38] text-[#dbeafe]";
  }

  if (status === "armed") {
    return "border-[#854d0e] bg-[#2b1e08] text-[#fde68a]";
  }

  return "border-white/10 bg-[#10151d] text-slate-200";
}

function formatSessionMoment(value: string) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(value));
}

function canShareSession(status: BacktestSessionStatus) {
  return (
    status === "target_hit" ||
    status === "stop_hit" ||
    status === "manual_close" ||
    status === "breakeven"
  );
}

function formatHistoryPrice(value: number | null | undefined, symbol: string) {
  if (typeof value !== "number" || Number.isNaN(value)) {
    return "N/A";
  }

  return value.toFixed(getBacktestInstrument(symbol).pricePrecision);
}

function formatPercent(value: number | null) {
  if (typeof value !== "number" || Number.isNaN(value)) {
    return "N/A";
  }

  const sign = value > 0 ? "+" : value < 0 ? "-" : "";
  return `${sign}${Math.abs(value).toFixed(2)}%`;
}

function getHistoryPositionReturn(session: BacktestSessionRecord) {
  const entry = session.sessionStateJson.execution.entry ?? session.entry;
  const volume =
    session.sessionStateJson.execution.volume ??
    Number.parseFloat(session.sessionStateJson.tradeDraft.volume);
  const pnl = session.sessionStateJson.execution.resultAmount;

  if (
    typeof entry !== "number" ||
    Number.isNaN(entry) ||
    typeof volume !== "number" ||
    Number.isNaN(volume) ||
    volume <= 0 ||
    typeof pnl !== "number" ||
    Number.isNaN(pnl)
  ) {
    return null;
  }

  const positionNotional = Math.abs(entry * volume);
  if (!Number.isFinite(positionNotional) || positionNotional <= 0) {
    return null;
  }

  return (pnl / positionNotional) * 100;
}

export function BacktestingClient({
  initialAccount,
  initialSessions,
  shareDisplayName,
  userId,
}: BacktestingClientProps) {
  const workspace = useBacktestingWorkspace({ initialAccount, initialSessions, userId });
  const [sessionsOpen, setSessionsOpen] = useState(false);
  const [sharingSessionId, setSharingSessionId] = useState<string | null>(null);

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

  const loadButtonLabel = workspace.stagedSelectionChanged
    ? `Load ${workspace.selectionDraft.symbol} ${workspace.selectionDraft.timeframe}`
    : "New Window";

  async function handleShareSession(session: BacktestSessionRecord) {
    setSharingSessionId(session.id);

    try {
      await downloadBacktestShareCard({
        session,
        traderName: shareDisplayName,
      });
    } finally {
      setSharingSessionId(null);
    }
  }

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
              {loadButtonLabel}
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

      <div className="grid min-h-0 flex-1 grid-cols-1 gap-1.5 p-1.5 lg:grid-cols-[minmax(0,1fr)_18rem]">
        <section className="flex min-h-0 min-w-0 flex-col">
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
          <p className="mt-1.5 px-1 text-[10px] text-slate-500">
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
        </section>

        <aside className="flex min-h-0 flex-col gap-1.5 overflow-y-auto overflow-x-hidden rounded-lg bg-[#090d12] p-1 pr-1.5">
          <div className="rounded-md bg-[#0c1117] px-2 py-1.5">
            <div className="flex items-center justify-between gap-2">
              <ToolbarLabel>Loaded Chart</ToolbarLabel>
              <span
                className={cn(
                  "inline-flex rounded-full border px-2 py-0.5 text-[9px] font-semibold uppercase tracking-[0.16em]",
                  getSessionTone(workspace.execution.status),
                )}
              >
                {workspace.statusLabel}
              </span>
            </div>
            <p className="mt-1 text-xs font-semibold text-slate-100">
              {workspace.activeSelection.symbol} {workspace.activeSelection.timeframe}
            </p>
            <p className="mt-0.5 text-[10px] leading-4 text-slate-500">
              {workspace.activeWindowStartAt
                ? `Loaded ${formatSessionMoment(workspace.activeWindowStartAt)}`
                : "Current chart is ready for a new backtest session."}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-1.5">
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

          <label className="grid gap-1 rounded-md bg-[#0c1117] p-1.25">
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

          <div className="grid grid-cols-3 gap-1 rounded-md bg-[#0c1117] p-1.25">
            <InlineField
              disabled={!workspace.canDragLines || workspace.orderType === "market"}
              label="Entry"
              onChange={(value) => workspace.updateDraftField("entry", value)}
              readOnly={workspace.orderType === "market"}
              value={priceInputValues.entry}
            />
            <InlineField
              disabled={!workspace.canDragLines}
              label="Stop Loss"
              onChange={(value) => workspace.updateDraftField("stop", value)}
              value={priceInputValues.stop}
            />
            <InlineField
              disabled={!workspace.canDragLines}
              label="Take Profit"
              onChange={(value) => workspace.updateDraftField("target", value)}
              value={priceInputValues.target}
            />
          </div>

          <div className="grid grid-cols-2 gap-1 rounded-md bg-[#0c1117] p-1.25">
            <InlineField
              label="Starting Balance"
              onChange={(value) => workspace.updateStartingBalance(Number(value))}
              value={formatEditableNumber(workspace.account.startingBalance)}
            />
            <InlineField
              disabled={!workspace.canDragLines}
              label="Position Size"
              onChange={(value) => workspace.updateVolume(Number(value))}
              value={workspace.tradeDraft.volume}
            />
          </div>

          <div className="grid grid-cols-2 gap-1.5">
            <CompactStat
              label="Risk %"
              value={formatEditableNumber(workspace.riskSettings.riskPercent, 2) || "N/A"}
            />
            <CompactStat label="Risk $" value={formatMoney(workspace.riskSettings.riskAmount)} />
          </div>

          <div className="grid grid-cols-2 gap-1.5">
            <Button
              className="h-8 min-h-8 rounded-md border border-[#2563eb] bg-[#1d4ed8] px-3 text-xs font-semibold text-[#eff6ff] hover:bg-[#1e40af]"
              disabled={!workspace.canArmBuy}
              onClick={workspace.armBuy}
              type="button"
              variant="ghost"
            >
              Buy
            </Button>
            <Button
              className="h-8 min-h-8 rounded-md border border-[#dc2626] bg-[#b91c1c] px-3 text-xs font-semibold text-[#fff1f2] hover:bg-[#991b1b]"
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
              Reset Setup
            </Button>
            <Button
              className="h-8 min-h-8 rounded-md border border-white/8 bg-[#0d1319] px-3 text-xs font-semibold text-slate-200 hover:bg-[#121922]"
              onClick={workspace.resetAccountBalance}
              type="button"
              variant="ghost"
            >
              Reset Balance
            </Button>
            <Button
              className="col-span-2 h-8 min-h-8 rounded-md border border-white/8 bg-[#0d1319] px-3 text-xs font-semibold text-slate-200 hover:bg-[#121922]"
              disabled={!workspace.canCloseTrade}
              onClick={workspace.closeTrade}
              type="button"
              variant="ghost"
            >
              Close Trade
            </Button>
          </div>

          <div className="rounded-md bg-[#0c1117]">
            <button
              className="flex w-full items-center justify-between px-2 py-1.5 text-left text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-400"
              onClick={() => setSessionsOpen((current) => !current)}
              type="button"
            >
              <span className="inline-flex items-center gap-1.5">
                <History className="h-3.5 w-3.5" />
                History
              </span>
              {sessionsOpen ? (
                <ChevronUp className="h-3.5 w-3.5" />
              ) : (
                <span className="inline-flex items-center gap-1.5">
                  <span>{workspace.sessions.length}</span>
                  <ChevronDown className="h-3.5 w-3.5" />
                </span>
              )}
            </button>

            {sessionsOpen ? (
              <div className="max-h-56 space-y-1.5 overflow-y-auto px-2 pb-2">
                {workspace.sessions.length > 0 ? (
                  workspace.sessions.map((item) => (
                    <div
                      className="rounded-md border border-white/6 bg-[#0a0f15] px-2 py-1.5 text-[10px] text-slate-300"
                      key={item.id}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="font-semibold text-[11px] text-slate-100">
                            {item.symbol} · {item.direction}
                          </p>
                          <p className="mt-0.5 text-slate-500">
                            Closed {formatSessionMoment(item.finishedAt ?? item.startedAt)}
                          </p>
                        </div>
                        <span
                          className={cn(
                            "inline-flex rounded-full border px-2 py-0.5 text-[9px] font-semibold uppercase tracking-[0.16em]",
                            getSessionTone(item.status),
                          )}
                        >
                          {item.status.replace("_", " ")}
                        </span>
                      </div>
                      <div className="mt-1.5 grid grid-cols-2 gap-1">
                        <CompactStat
                          accentClassName={cn(
                            (item.sessionStateJson.execution.resultAmount ?? 0) > 0 && "text-[#86efac]",
                            (item.sessionStateJson.execution.resultAmount ?? 0) < 0 && "text-[#fca5a5]",
                          )}
                          label="P&L"
                          value={formatMoney(item.sessionStateJson.execution.resultAmount)}
                        />
                        <CompactStat
                          accentClassName={cn(
                            (getHistoryPositionReturn(item) ?? 0) > 0 && "text-[#86efac]",
                            (getHistoryPositionReturn(item) ?? 0) < 0 && "text-[#fca5a5]",
                          )}
                          label="%"
                          value={formatPercent(getHistoryPositionReturn(item))}
                        />
                      </div>
                      <div className="mt-1.5 grid grid-cols-2 gap-1 rounded-md bg-[#10161f] px-2 py-1.5 text-[10px] text-slate-400">
                        <div>
                          <p className="text-[9px] uppercase tracking-[0.16em] text-slate-500">
                            Entry
                          </p>
                          <p className="mt-0.5 text-slate-200">
                            {formatHistoryPrice(
                              item.sessionStateJson.execution.entry ?? item.entry,
                              item.symbol,
                            )}
                          </p>
                        </div>
                        <div>
                          <p className="text-[9px] uppercase tracking-[0.16em] text-slate-500">
                            Exit
                          </p>
                          <p className="mt-0.5 text-slate-200">
                            {formatHistoryPrice(
                              item.sessionStateJson.execution.exitPrice,
                              item.symbol,
                            )}
                          </p>
                        </div>
                      </div>
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        {canShareSession(item.status) ? (
                          <Button
                            className="h-7 rounded-md px-2.5 text-[10px]"
                            disabled={sharingSessionId === item.id}
                            onClick={() => void handleShareSession(item)}
                            size="sm"
                            type="button"
                            variant="secondary"
                          >
                            <Share2 className="h-3 w-3" />
                            {sharingSessionId === item.id ? "Exporting" : "Share"}
                          </Button>
                        ) : null}
                        <Button
                          className="h-7 rounded-md px-2.5 text-[10px]"
                          disabled={
                            workspace.pendingSessionActionId === item.id ||
                            sharingSessionId === item.id
                          }
                          onClick={() => void workspace.deleteSession(item.id)}
                          size="sm"
                          type="button"
                          variant="ghost"
                        >
                          Delete
                        </Button>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="px-2 py-1.5 text-[10px] text-slate-500">
                    Completed simulated trades will appear here after you finish a backtest.
                  </div>
                )}
              </div>
            ) : null}
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

        </aside>
      </div>
    </div>
  );
}
