import { describe, expect, it } from "vitest";

import { DEFAULT_BACKTEST_ACCOUNT, getBacktestInstrument } from "@/features/backtesting/constants";
import type { BacktestCandle } from "@/features/backtesting/types";
import {
  activateTradeExecution,
  advancePendingTradeExecution,
  advanceTradeExecution,
  buildTradeDraftFromPrice,
  calculatePositionSize,
  calculateRiskFromVolume,
  deriveRiskSettings,
  finalizeUnfinishedTrade,
  manuallyCloseTrade,
  validateTradeDraft,
} from "@/features/backtesting/utils/trade-engine";

const instrument = getBacktestInstrument("XAUUSD");

describe("trade-engine", () => {
  it("builds a sensible draft from a price reference", () => {
    const draft = buildTradeDraftFromPrice(instrument, "15min", 2358, "Long");

    expect(draft.direction).toBe("Long");
    expect(draft.orderType).toBe("market");
    expect(draft.hasStop).toBe(false);
    expect(draft.hasTarget).toBe(false);
    expect(Number(draft.stop)).toBeLessThan(Number(draft.entry));
    expect(Number(draft.target)).toBeGreaterThan(Number(draft.entry));
  });

  it("validates draft geometry and derives money settings", () => {
    const valid = validateTradeDraft({
      direction: "Long",
      orderType: "limit",
      entry: "2358",
      hasStop: true,
      stop: "2352",
      hasTarget: true,
      target: "2368.8",
      volume: "",
    });
    const invalid = validateTradeDraft({
      direction: "Long",
      orderType: "limit",
      entry: "2358",
      hasStop: true,
      stop: "2360",
      hasTarget: true,
      target: "2368.8",
      volume: "",
    });

    expect(valid.isValid).toBe(true);
    expect(valid.riskPerUnit).toBe(6);
    expect(invalid.isValid).toBe(false);

    expect(deriveRiskSettings(DEFAULT_BACKTEST_ACCOUNT, {})).toEqual({
      riskPercent: 1,
      riskAmount: 1000,
    });
    expect(deriveRiskSettings(DEFAULT_BACKTEST_ACCOUNT, { riskAmount: 250 })).toEqual({
      riskAmount: 250,
      riskPercent: 0.25,
    });
    expect(calculatePositionSize(valid, 1000)).toBeCloseTo(166.6666667, 5);
    expect(calculateRiskFromVolume(valid, 100, 100000)).toEqual({
      riskAmount: 600,
      riskPercent: 0.6,
    });
  });

  it("resolves an active long trade when target is hit", () => {
    const validation = validateTradeDraft({
      direction: "Long",
      orderType: "limit",
      entry: "2358",
      hasStop: true,
      stop: "2352",
      hasTarget: true,
      target: "2368.8",
      volume: "",
    });
    const execution = activateTradeExecution(validation, 250, 1735689600000, {
      orderType: "limit",
      riskPercent: 1,
      riskAmount: 1000,
      volume: 166.66,
      balanceBeforeTrade: 100000,
    });
    const candle: BacktestCandle = {
      time: 1735689900000,
      open: 2358,
      high: 2369,
      low: 2357,
      close: 2367,
      volume: 1000,
    };

    const resolved = advanceTradeExecution(execution, candle, 255, "Long");

    expect(resolved.status).toBe("target_hit");
    expect(resolved.exitPrice).toBe(2368.8);
    expect(resolved.resultAmount).toBeCloseTo(1799.928, 5);
    expect(resolved.balanceAfterTrade).toBeCloseTo(101799.928, 5);
  });

  it("activates a pending stop order and resolves it in one pass when touched", () => {
    const execution = {
      status: "armed" as const,
      orderType: "stop" as const,
      entry: 2360,
      stop: 2354,
      target: 2370.8,
      riskPercent: 1,
      riskAmount: 1000,
      volume: 166.66,
      balanceBeforeTrade: 100000,
      openedAtIndex: null,
      openedAtTime: null,
      closedAtIndex: null,
      closedAtTime: null,
      exitPrice: null,
      resultR: null,
      resultAmount: null,
      balanceAfterTrade: null,
      maxFavorableR: 0,
      maxAdverseR: 0,
      durationBars: null,
    };
    const candle: BacktestCandle = {
      time: 1735689900000,
      open: 2358,
      high: 2371,
      low: 2358,
      close: 2370,
      volume: 1000,
    };

    const resolved = advancePendingTradeExecution(execution, candle, 255, "Long");

    expect(resolved.status).toBe("target_hit");
    expect(resolved.openedAtIndex).toBe(255);
  });

  it("supports manual close and unfinished close flows", () => {
    const validation = validateTradeDraft({
      direction: "Long",
      orderType: "limit",
      entry: "2358",
      hasStop: true,
      stop: "2352",
      hasTarget: true,
      target: "2368.8",
      volume: "",
    });
    const execution = activateTradeExecution(validation, 250, 1735689600000, {
      orderType: "limit",
      riskPercent: 1,
      riskAmount: 1000,
      volume: 166.66,
      balanceBeforeTrade: 100000,
    });

    const breakevenCandle: BacktestCandle = {
      time: 1735689900000,
      open: 2358,
      high: 2359,
      low: 2357.8,
      close: 2358.2,
      volume: 1000,
    };
    const unfinishedCandle: BacktestCandle = {
      time: 1735690200000,
      open: 2358,
      high: 2360,
      low: 2355,
      close: 2356,
      volume: 1000,
    };

    const closed = manuallyCloseTrade(execution, breakevenCandle, 255, "Long");
    const unfinished = finalizeUnfinishedTrade(execution, unfinishedCandle, 260, "Long");

    expect(closed.status).toBe("breakeven");
    expect(unfinished.status).toBe("unfinished");
    expect(unfinished.resultAmount).toBeCloseTo(-333.32, 5);
  });

  it("can run and close a trade without a stop or target", () => {
    const validation = validateTradeDraft({
      direction: "Long",
      orderType: "market",
      entry: "2358",
      hasStop: false,
      stop: "",
      hasTarget: false,
      target: "",
      volume: "",
    });

    const execution = activateTradeExecution(validation, 250, 1735689600000, {
      orderType: "market",
      riskPercent: null,
      riskAmount: null,
      volume: 2,
      balanceBeforeTrade: 100000,
    });
    const candle: BacktestCandle = {
      time: 1735690200000,
      open: 2358,
      high: 2362,
      low: 2357,
      close: 2360,
      volume: 1000,
    };

    const closed = manuallyCloseTrade(execution, candle, 260, "Long");

    expect(closed.status).toBe("manual_close");
    expect(closed.resultR).toBeNull();
    expect(closed.resultAmount).toBe(4);
    expect(closed.balanceAfterTrade).toBe(100004);
  });
});
