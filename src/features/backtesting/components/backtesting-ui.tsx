"use client";

import { History, Share2, ChevronDown, ChevronUp } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { BacktestBalancePill } from "@/components/layout/backtest-balance-pill";
import { BACKTEST_STATUS_LABELS, getBacktestInstrument, REPLAY_SPEEDS } from "@/features/backtesting/constants";
import type {
  BacktestAccountRecord,
  BacktestSessionRecord,
  BacktestSessionStatus,
} from "@/features/backtesting/types";

export const SELECT_CLASS =
  "h-8 min-h-8 rounded-sm border border-white/10 bg-[#0a0f14] px-2.5 py-1 text-xs font-medium text-slate-100 transition hover:border-white/16 focus:border-white/25 focus:ring-2 focus:ring-white/8";

export const INPUT_CLASS =
  "h-8 min-h-8 rounded-sm border border-white/10 bg-[#0a0f14] px-2.5 py-1 text-xs font-medium text-slate-100 transition hover:border-white/16 focus:border-white/25 focus:ring-2 focus:ring-white/8";

const TOOLBAR_ACTION_BUTTON_CLASS =
  "h-8 min-h-8 rounded-sm border border-white/10 bg-[#0a0f14] px-3 text-xs font-semibold text-slate-100 transition hover:border-white/16 hover:bg-[#0d1319] disabled:opacity-45";

export function ToolbarLabel({ children }: { children: string }) {
  return (
    <span className="text-[9px] font-semibold uppercase tracking-[0.18em] text-slate-500">
      {children}
    </span>
  );
}

export function formatMoney(value: number | null) {
  if (typeof value !== "number" || Number.isNaN(value)) {
    return "N/A";
  }

  const sign = value > 0 ? "+" : value < 0 ? "-" : "";
  return `${sign}$${Math.abs(value).toFixed(2)}`;
}

export function formatEditableNumber(value: number | null, digits = 2) {
  if (typeof value !== "number" || Number.isNaN(value)) {
    return "";
  }

  return Number(value.toFixed(digits)).toString();
}

export function CompactStat({
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

export function InlineField({
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

export function getSessionTone(status: BacktestSessionStatus) {
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

export function formatSessionMoment(value: string) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(value));
}

export function canShareSession(status: BacktestSessionStatus) {
  return (
    status === "target_hit" ||
    status === "stop_hit" ||
    status === "manual_close" ||
    status === "breakeven"
  );
}

export function formatHistoryPrice(value: number | null | undefined, symbol: string) {
  if (typeof value !== "number" || Number.isNaN(value)) {
    return "N/A";
  }

  return value.toFixed(getBacktestInstrument(symbol).pricePrecision);
}

export function formatPercent(value: number | null) {
  if (typeof value !== "number" || Number.isNaN(value)) {
    return "N/A";
  }

  const sign = value > 0 ? "+" : value < 0 ? "-" : "";
  return `${sign}${Math.abs(value).toFixed(2)}%`;
}

export function getHistoryPositionReturn(session: BacktestSessionRecord) {
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

type BacktestingToolbarProps = {
  initialAccount?: BacktestAccountRecord | null;
  initialCatalog: {
    instruments: Array<{ symbol: string; label: string }>;
    timeframes: string[];
  };
  isLoading: boolean;
  loadButtonLabel: string;
  replay: { isPlaying: boolean; speedId: string };
  selectionDraft: { symbol: string; timeframe: string };
  canStepForward: boolean;
  onRandomizeWindow: () => void;
  onSelectionFieldChange: (field: "symbol" | "timeframe", value: string) => void;
  onReplaySpeedChange: (speedId: string) => void;
  onStepReplayForward: () => void;
  onTogglePlayback: () => void;
  userId?: string | null;
};

export function BacktestingToolbar({
  canStepForward,
  initialAccount,
  initialCatalog,
  isLoading,
  loadButtonLabel,
  onRandomizeWindow,
  onReplaySpeedChange,
  onSelectionFieldChange,
  onStepReplayForward,
  onTogglePlayback,
  replay,
  selectionDraft,
  userId,
}: BacktestingToolbarProps) {
  return (
    <div className="shrink-0 border-b border-white/8 px-3 py-2">
      <div className="grid gap-2 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
        <div className="flex flex-wrap items-end gap-2">
            <label className="grid w-[8.5rem] min-w-0 gap-1">
              <ToolbarLabel>Symbol</ToolbarLabel>
              <Select
                className={SELECT_CLASS}
                id="backtest-symbol"
                name="backtest_symbol"
                onChange={(event) => onSelectionFieldChange("symbol", event.target.value)}
                value={selectionDraft.symbol}
              >
                {initialCatalog.instruments.map((item) => (
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
                onChange={(event) => onSelectionFieldChange("timeframe", event.target.value)}
                value={selectionDraft.timeframe}
              >
                {initialCatalog.timeframes.map((item) => (
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
                onChange={(event) => onReplaySpeedChange(event.target.value)}
                value={replay.speedId}
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
            className="col-span-3 h-8 rounded-sm border-white/10 bg-[#0a0f14] px-2.5 text-[11px] text-slate-200 sm:col-auto"
            initialBalance={initialAccount?.currentBalance}
            userId={userId}
          />
          <Button
            className={TOOLBAR_ACTION_BUTTON_CLASS}
            disabled={isLoading}
            onClick={onRandomizeWindow}
            type="button"
            variant="ghost"
          >
            {loadButtonLabel}
          </Button>
          <Button
            className={TOOLBAR_ACTION_BUTTON_CLASS}
            disabled={!canStepForward || isLoading}
            onClick={onTogglePlayback}
            type="button"
            variant="ghost"
          >
            {replay.isPlaying ? "Pause" : "Play"}
          </Button>
          <Button
            className={TOOLBAR_ACTION_BUTTON_CLASS}
            disabled={!canStepForward || isLoading}
            onClick={onStepReplayForward}
            type="button"
            variant="ghost"
          >
            Next Candle
          </Button>
        </div>
      </div>
    </div>
  );
}

type BacktestingHistoryPanelProps = {
  onDeleteSession: (sessionId: string) => void;
  onShareSession: (session: BacktestSessionRecord) => void;
  pendingSessionActionId: string | null;
  sessions: BacktestSessionRecord[];
  sessionsOpen: boolean;
  sharingSessionId: string | null;
  toggleOpen: () => void;
};

export function BacktestingHistoryPanel({
  onDeleteSession,
  onShareSession,
  pendingSessionActionId,
  sessions,
  sessionsOpen,
  sharingSessionId,
  toggleOpen,
}: BacktestingHistoryPanelProps) {
  return (
    <div className="rounded-[0.55rem] border border-white/5 bg-[#0c1117]">
      <button
        className="flex w-full items-center justify-between gap-3 px-2.5 py-2 text-left text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-400"
        onClick={toggleOpen}
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
              {sessions.length}
            </span>
            <ChevronDown className="h-3.5 w-3.5" />
          </span>
        )}
      </button>

      {sessionsOpen ? (
        <div className="max-h-56 space-y-1.5 overflow-y-auto px-2.5 pb-2.5">
          {sessions.length > 0 ? (
            sessions.map((item) => (
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
                      onClick={() => onShareSession(item)}
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
                      pendingSessionActionId === item.id || sharingSessionId === item.id
                    }
                    onClick={() => onDeleteSession(item.id)}
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
  );
}
