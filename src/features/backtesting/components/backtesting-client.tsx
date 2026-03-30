"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { ChevronDown, ChevronUp, History, Share2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { BacktestBalancePill } from "@/components/layout/backtest-balance-pill";

import {
  BACKTEST_STATUS_LABELS,
  getBacktestInstrument,
  REPLAY_SPEEDS,
} from "../constants";
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

type ToastState = {
  tone: "error" | "info";
  message: string;
};

const SELECT_CLASS =
  "h-8 min-h-8 rounded-sm border border-white/8 bg-[#0d1319] px-2.5 py-1 text-xs text-slate-100 shadow-[inset_0_1px_0_rgba(255,255,255,0.03)] focus:border-white/16 focus:ring-2 focus:ring-white/6";

const INPUT_CLASS =
  "h-8 min-h-8 rounded-sm border border-white/8 bg-[#0d1319] px-2.5 py-1 text-xs text-slate-100 shadow-[inset_0_1px_0_rgba(255,255,255,0.03)] focus:border-white/16 focus:ring-2 focus:ring-white/6";

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
    <div className="rounded-[0.5rem] border border-white/5 bg-[#0b1015] px-2.5 py-2">
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
  fieldId,
  label,
  name,
  value,
  onChange,
  disabled = false,
  readOnly = false,
  accentClassName,
}: {
  fieldId: string;
  label: string;
  name: string;
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  readOnly?: boolean;
  accentClassName?: string;
}) {
  return (
    <label className="grid gap-1" htmlFor={fieldId}>
      <ToolbarLabel>{label}</ToolbarLabel>
      <Input
        className={cn(INPUT_CLASS, accentClassName)}
        disabled={disabled}
        id={fieldId}
        inputMode="decimal"
        name={name}
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
  const [toast, setToast] = useState<ToastState | null>(null);

  const riskRewardLabel = useMemo(() => {
    if (!workspace.primaryValidation.isValid || !workspace.primaryValidation.riskReward) {
      return "Invalid";
    }

    return `${workspace.primaryValidation.riskReward.toFixed(2)}R`;
  }, [workspace.primaryValidation]);

  const resultBadge = useMemo(() => {
    if (workspace.execution.status === "active") {
      const liveLabel = formatMoney(workspace.liveResultAmount);
      return liveLabel === "N/A"
        ? BACKTEST_STATUS_LABELS.active
        : `${BACKTEST_STATUS_LABELS.active} ${liveLabel}`;
    }

    if (workspace.execution.status === "draft" || workspace.execution.status === "armed") {
      return BACKTEST_STATUS_LABELS[workspace.execution.status];
    }

    const settledLabel = formatMoney(workspace.execution.resultAmount);
    return settledLabel === "N/A"
      ? BACKTEST_STATUS_LABELS[workspace.execution.status]
      : `${BACKTEST_STATUS_LABELS[workspace.execution.status]} ${settledLabel}`;
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
    : "New Chart";

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

  useEffect(() => {
    const message = workspace.loadError ?? workspace.notice;

    if (!message) {
      return;
    }

    setToast({
      tone: workspace.loadError ? "error" : "info",
      message,
    });

    const timeout = window.setTimeout(() => {
      setToast((current) => (current?.message === message ? null : current));
    }, 3600);

    return () => window.clearTimeout(timeout);
  }, [workspace.loadError, workspace.notice]);

  return (
    <div className="relative flex h-full min-h-0 flex-col overflow-hidden rounded-[0.75rem] bg-[#080d12] shadow-[inset_0_1px_0_rgba(255,255,255,0.02)] ring-1 ring-white/5">
      {toast ? (
        <div className="pointer-events-none absolute left-1/2 top-3 z-50 -translate-x-1/2">
          <div
            className={cn(
              "min-w-[14rem] max-w-[20rem] rounded-md border px-3 py-2 text-[11px] shadow-[0_18px_48px_rgba(0,0,0,0.36)] backdrop-blur transition",
              toast.tone === "error"
                ? "border-[#7f1d1d] bg-[#2a1114]/95 text-[#fecaca]"
                : "border-white/10 bg-[#111720]/95 text-slate-200",
            )}
          >
            {toast.message}
          </div>
        </div>
      ) : null}

      <div className="shrink-0 border-b border-white/5 px-2 py-2">
        <div className="grid gap-2 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
          <div className="flex flex-wrap items-end gap-2">
            <label className="grid w-[8.5rem] min-w-0 gap-1">
              <ToolbarLabel>Symbol</ToolbarLabel>
              <Select
                className={SELECT_CLASS}
                id="backtest-symbol"
                name="backtest_symbol"
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
                id="backtest-timeframe"
                name="backtest_timeframe"
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
                id="backtest-speed"
                name="backtest_speed"
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
          </div>

          <div className="grid grid-cols-3 gap-1.5 sm:flex sm:flex-wrap sm:items-center sm:justify-end lg:ml-auto">
            <BacktestBalancePill
              className="col-span-3 h-8 rounded-sm border-white/8 bg-[#0d1319] px-2.5 text-[11px] text-slate-100 sm:col-auto"
              initialBalance={initialAccount?.currentBalance}
              userId={userId}
            />
            <Button
              className="h-8 min-h-8 rounded-sm border border-white/8 bg-[#0d1319] px-3 text-xs font-semibold text-slate-100 hover:bg-[#121922] sm:w-auto"
              disabled={workspace.isLoading}
              onClick={workspace.randomizeWindow}
              type="button"
              variant="ghost"
            >
              {loadButtonLabel}
            </Button>
            <Button
              className="h-8 min-h-8 rounded-sm border border-white/8 bg-[#0d1319] px-3 text-xs font-semibold text-slate-100 hover:bg-[#121922] sm:w-auto"
              disabled={!workspace.canStepForward || workspace.isLoading}
              onClick={workspace.togglePlayback}
              type="button"
              variant="ghost"
            >
              {workspace.replay.isPlaying ? "Pause" : "Play"}
            </Button>
            <Button
              className="h-8 min-h-8 rounded-sm border border-white/8 bg-[#0d1319] px-3 text-xs font-semibold text-slate-100 hover:bg-[#121922] sm:w-auto"
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

      <div className="grid min-h-0 flex-1 grid-cols-1 gap-2 p-1.5 lg:grid-cols-[minmax(0,1fr)_18rem]">
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

        <aside className="flex min-h-0 flex-col gap-2 overflow-y-auto overflow-x-hidden rounded-[0.6rem] bg-[#090d12] p-1.5">
          <div className="rounded-[0.55rem] border border-white/5 bg-[#0c1117] px-2.5 py-2">
            <div className="flex items-center justify-between gap-2">
              <ToolbarLabel>Loaded Chart</ToolbarLabel>
              <span
                className={cn(
                  "inline-flex rounded-[0.4rem] border px-2 py-0.5 text-[9px] font-semibold uppercase tracking-[0.16em]",
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
                ? formatSessionMoment(workspace.activeWindowStartAt)
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
              label="Risk/Reward"
              value={riskRewardLabel}
            />
          </div>

          <label className="grid gap-1 rounded-[0.55rem] border border-white/5 bg-[#0c1117] p-1.5">
            <ToolbarLabel>Order Type</ToolbarLabel>
            <Select
              className={SELECT_CLASS}
              disabled={!workspace.canDragLines}
              id="backtest-order-type"
              name="backtest_order_type"
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

          <div className="grid grid-cols-3 gap-1.5 rounded-[0.55rem] border border-white/5 bg-[#0c1117] p-1.5">
            <InlineField
              disabled={!workspace.canDragLines || workspace.orderType === "market"}
              fieldId="backtest-entry"
              label="Entry"
              name="backtest_entry"
              onChange={(value) => workspace.updateDraftField("entry", value)}
              readOnly={workspace.orderType === "market"}
              value={priceInputValues.entry}
            />
            <InlineField
              disabled={!workspace.canDragLines}
              fieldId="backtest-stop-loss"
              label="Stop Loss"
              name="backtest_stop_loss"
              onChange={(value) => workspace.updateDraftField("stop", value)}
              value={priceInputValues.stop}
            />
            <InlineField
              disabled={!workspace.canDragLines}
              fieldId="backtest-take-profit"
              label="Take Profit"
              name="backtest_take_profit"
              onChange={(value) => workspace.updateDraftField("target", value)}
              value={priceInputValues.target}
            />
          </div>

          <div className="grid grid-cols-2 gap-1.5 rounded-[0.55rem] border border-white/5 bg-[#0c1117] p-1.5">
            <InlineField
              fieldId="backtest-starting-balance"
              label="Starting Balance"
              name="backtest_starting_balance"
              onChange={(value) => workspace.updateStartingBalance(Number(value))}
              value={formatEditableNumber(workspace.account.startingBalance)}
            />
            <InlineField
              disabled={!workspace.canDragLines}
              fieldId="backtest-position-size"
              label="Position Size"
              name="backtest_position_size"
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
              className="h-8 min-h-8 rounded-sm border border-[#2563eb] bg-[#1d4ed8] px-3 text-xs font-semibold text-[#eff6ff] hover:bg-[#1e40af]"
              disabled={!workspace.canArmBuy}
              onClick={workspace.armBuy}
              type="button"
              variant="ghost"
            >
              Buy
            </Button>
            <Button
              className="h-8 min-h-8 rounded-sm border border-[#dc2626] bg-[#b91c1c] px-3 text-xs font-semibold text-[#fff1f2] hover:bg-[#991b1b]"
              disabled={!workspace.canArmSell}
              onClick={workspace.armSell}
              type="button"
              variant="ghost"
            >
              Sell
            </Button>
            <Button
              className="h-8 min-h-8 rounded-sm border border-white/8 bg-[#0d1319] px-3 text-xs font-semibold text-slate-200 hover:bg-[#121922]"
              disabled={!workspace.canDragLines}
              onClick={workspace.resetTradeLines}
              type="button"
              variant="ghost"
            >
              Reset Setup
            </Button>
            <Button
              className="h-8 min-h-8 rounded-sm border border-white/8 bg-[#0d1319] px-3 text-xs font-semibold text-slate-200 hover:bg-[#121922]"
              disabled={
                workspace.execution.status === "armed" ||
                workspace.execution.status === "active"
              }
              onClick={workspace.resetAccountBalance}
              type="button"
              variant="ghost"
            >
              Reset Balance
            </Button>
            <Button
              className="col-span-2 h-8 min-h-8 rounded-sm border border-white/8 bg-[#0d1319] px-3 text-xs font-semibold text-slate-200 hover:bg-[#121922]"
              disabled={!workspace.canCloseTrade}
              onClick={workspace.closeTrade}
              type="button"
              variant="ghost"
            >
              Close Trade
            </Button>
          </div>

          <div className="rounded-[0.55rem] border border-white/5 bg-[#0c1117]">
            <button
              className="flex w-full items-center justify-between gap-3 px-2.5 py-2 text-left text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-400"
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
                <span className="inline-flex items-center gap-2">
                  <span className="inline-flex min-w-5 items-center justify-center rounded-[0.35rem] border border-white/8 bg-[#111821] px-1.5 py-0.5 text-[9px] text-slate-300">
                    {workspace.sessions.length}
                  </span>
                  <ChevronDown className="h-3.5 w-3.5" />
                </span>
              )}
            </button>

            {sessionsOpen ? (
              <div className="max-h-56 space-y-1.5 overflow-y-auto px-2.5 pb-2.5">
                {workspace.sessions.length > 0 ? (
                  workspace.sessions.map((item) => (
                    <div
                      className="rounded-[0.5rem] border border-white/6 bg-[#0a0f15] px-2.5 py-2 text-[10px] text-slate-300"
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
                            "inline-flex rounded-[0.4rem] border px-2 py-0.5 text-[9px] font-semibold uppercase tracking-[0.16em]",
                            getSessionTone(item.status),
                          )}
                        >
                          {BACKTEST_STATUS_LABELS[item.status]}
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
                          label="Return %"
                          value={formatPercent(getHistoryPositionReturn(item))}
                        />
                      </div>
                      <div className="mt-1.5 grid grid-cols-2 gap-1 rounded-[0.45rem] bg-[#10161f] px-2 py-1.5 text-[10px] text-slate-400">
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
                            className="h-7 rounded-sm px-2.5 text-[10px]"
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
                          className="h-7 rounded-sm px-2.5 text-[10px] text-slate-500 hover:text-slate-200"
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

        </aside>
      </div>
    </div>
  );
}
