"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { cn } from "@/lib/utils";

import { BACKTEST_STATUS_LABELS } from "../constants";
import type {
  BacktestAccountRecord,
  BacktestDrawingTool,
  BacktestSessionRecord,
} from "../types";
import { useBacktestingWorkspace } from "../hooks/use-backtesting-workspace";
import { downloadBacktestShareCard } from "../utils/share-card";
import { BacktestChart } from "./backtest-chart";
import {
  BacktestingHistoryPanel,
  BacktestingToolbar,
  CompactStat,
  formatEditableNumber,
  formatMoney,
  formatSessionMoment,
  getSessionTone,
  InlineField,
  SELECT_CLASS,
  ToolbarLabel,
} from "./backtesting-ui";

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
  const [activeDrawingTool, setActiveDrawingTool] =
    useState<BacktestDrawingTool>("cursor");

  const riskRewardLabel = useMemo(() => {
    if (!workspace.primaryValidation.isValid) {
      return "Invalid";
    }

    if (typeof workspace.primaryValidation.riskReward !== "number") {
      return "N/A";
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

  const resultAccentClassName = useMemo(() => {
    const resultValue =
      workspace.execution.status === "active"
        ? workspace.liveResultAmount
        : workspace.execution.resultAmount;

    if (typeof resultValue !== "number" || Number.isNaN(resultValue) || resultValue === 0) {
      return undefined;
    }

    return resultValue > 0 ? "text-[#86efac]" : "text-[#fca5a5]";
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

      <BacktestingToolbar
        canStepForward={workspace.canStepForward}
        initialAccount={initialAccount}
        initialCatalog={workspace.initialCatalog}
        isLoading={workspace.isLoading}
        loadButtonLabel={loadButtonLabel}
        onRandomizeWindow={workspace.randomizeWindow}
        onReplaySpeedChange={(speedId) =>
          workspace.setReplay((current) => ({
            ...current,
            speedId,
            isPlaying: false,
          }))
        }
        onSelectionFieldChange={workspace.updateSelectionField}
        onStepReplayForward={workspace.stepReplayForward}
        onTogglePlayback={workspace.togglePlayback}
        replay={workspace.replay}
        selectionDraft={workspace.selectionDraft}
        userId={userId}
      />

      <div className="grid min-h-0 flex-1 grid-cols-1 gap-0.5 px-1 pt-1 pb-0.5 lg:grid-cols-[minmax(0,1fr)_18rem]">
        <section className="grid min-h-0 min-w-0 grid-rows-[minmax(0,1fr)_auto] gap-0.5">
          <div className="min-h-0">
            <BacktestChart
              activeDrawingTool={activeDrawingTool}
              candles={workspace.revealedCandles}
              drawingStorageKey={`backtest-drawings:${userId ?? "local"}:${workspace.windowKey}`}
              direction={workspace.tradeDraft.direction}
              editableFields={{
                entry:
                  activeDrawingTool === "cursor" &&
                  workspace.canConfigureDraft &&
                  workspace.orderType !== "market",
                stop:
                  activeDrawingTool === "cursor" &&
                  (workspace.canConfigureDraft || workspace.canAdjustActiveExitLines),
                target:
                  activeDrawingTool === "cursor" &&
                  (workspace.canConfigureDraft || workspace.canAdjustActiveExitLines),
              }}
              execution={workspace.execution}
              instrument={workspace.currentInstrument}
              isLoading={workspace.isLoading}
              lineValues={workspace.lineValues}
              onLineChange={workspace.setLineValue}
              onToolChange={setActiveDrawingTool}
              canEditLines={workspace.canManageTradeLines}
              hasStopLine={workspace.hasStop}
              hasTargetLine={workspace.hasTarget}
              onAddOptionalLine={workspace.addDraftLine}
              onRemoveOptionalLine={workspace.removeDraftLine}
              windowKey={workspace.windowKey}
            />
          </div>
          <p className="px-0.5 text-[11px] text-slate-500">
            Charts by{" "}
            <Link
              className="text-slate-300 underline decoration-white/20 underline-offset-2 transition hover:text-white"
              href="https://www.tradingview.com/"
              rel="noopener noreferrer"
              target="_blank"
            >
              TradingView
            </Link>
          </p>
        </section>

        <aside className="flex min-h-0 flex-col gap-1.5 overflow-y-auto overflow-x-hidden rounded-[0.6rem] bg-[#090d12] p-0.5">
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
            <CompactStat
              accentClassName={resultAccentClassName}
              label="Result"
              value={resultBadge}
            />
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
              disabled={!workspace.canConfigureDraft}
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

          <div className="grid grid-cols-1 gap-1.5 rounded-[0.55rem] border border-white/5 bg-[#0c1117] p-1.5">
            <InlineField
              disabled={!workspace.canConfigureDraft || workspace.orderType === "market"}
              fieldId="backtest-entry"
              label="Entry"
              name="backtest_entry"
              onChange={(value) => workspace.updateDraftField("entry", value)}
              readOnly={workspace.orderType === "market"}
              value={priceInputValues.entry}
            />
            {workspace.hasStop ? (
              <InlineField
                disabled={!workspace.canConfigureDraft}
                fieldId="backtest-stop-loss"
                label="Stop Loss"
                name="backtest_stop_loss"
                onChange={(value) => workspace.updateDraftField("stop", value)}
                value={priceInputValues.stop}
              />
            ) : null}
            {workspace.hasTarget ? (
              <InlineField
                disabled={!workspace.canConfigureDraft}
                fieldId="backtest-take-profit"
                label="Take Profit"
                name="backtest_take_profit"
                onChange={(value) => workspace.updateDraftField("target", value)}
                value={priceInputValues.target}
              />
            ) : null}
            {!workspace.hasStop && !workspace.hasTarget ? (
              <p className="px-1 py-1 text-[10px] text-slate-500">
                Add TP or SL from the chart pills.
              </p>
            ) : null}
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
              disabled={!workspace.canConfigureDraft}
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
              disabled={!workspace.canConfigureDraft}
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

          <BacktestingHistoryPanel
            onDeleteSession={(sessionId) => void workspace.deleteSession(sessionId)}
            onShareSession={(session) => void handleShareSession(session)}
            pendingSessionActionId={workspace.pendingSessionActionId}
            sessions={workspace.sessions}
            sessionsOpen={sessionsOpen}
            sharingSessionId={sharingSessionId}
            toggleOpen={() => setSessionsOpen((current) => !current)}
          />

        </aside>
      </div>
    </div>
  );
}
