import { describe, expect, it } from "vitest";

import {
  buildChartMarkers,
  parseExportedLineTools,
  shiftExportedLineToolPoints,
  stringifyExportedLineTools,
} from "./backtest-chart-helpers";

describe("backtest-chart helpers", () => {
  it("parses and stringifies exported line tools safely", () => {
    const tools = [
      {
        id: "tool-1",
        toolType: "TrendLine",
        points: [
          { timestamp: 100, price: 4200 },
          { timestamp: 110, price: 4210 },
        ],
      },
    ];

    const json = stringifyExportedLineTools(tools);
    expect(parseExportedLineTools(json)).toEqual(tools);
    expect(parseExportedLineTools("not-json")).toEqual([]);
  });

  it("shifts exported line tool points without mutating the original", () => {
    const tools = [
      {
        id: "tool-1",
        toolType: "TrendLine",
        points: [
          { timestamp: 100, price: 4200 },
          { timestamp: 110, price: 4210 },
        ],
      },
    ];

    const shifted = shiftExportedLineToolPoints(tools, {
      timestampDelta: 5,
      priceDelta: 2.5,
    });

    expect(shifted[0]?.points).toEqual([
      { timestamp: 105, price: 4202.5 },
      { timestamp: 115, price: 4212.5 },
    ]);
    expect(tools[0]?.points).toEqual([
      { timestamp: 100, price: 4200 },
      { timestamp: 110, price: 4210 },
    ]);
  });

  it("renders a sell-filled marker for short executions", () => {
    const markers = buildChartMarkers({
      candles: [
        {
          time: 100 as never,
          open: 4200,
          high: 4210,
          low: 4190,
          close: 4205,
        },
      ],
      direction: "Short",
      execution: {
        status: "active",
        orderType: "market",
        entry: 4205,
        stop: null,
        target: null,
        riskPercent: 1,
        riskAmount: 100,
        volume: 1,
        balanceBeforeTrade: null,
        openedAtIndex: 0,
        openedAtTime: 100,
        closedAtIndex: null,
        closedAtTime: null,
        exitPrice: null,
        resultR: null,
        resultAmount: null,
        balanceAfterTrade: null,
        maxFavorableR: null,
        maxAdverseR: null,
        durationBars: null,
      },
    });

    expect(markers[0]?.text).toBe("Sell filled");
    expect(markers[0]?.shape).toBe("arrowDown");
  });
});
