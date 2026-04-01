import { describe, expect, it } from "vitest";

import {
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
});
