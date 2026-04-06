import { describe, expect, it } from "vitest";

import {
  calculatePositionSizeFromNotional,
  deriveRiskSettings,
} from "@/features/trading-shared/execution-engine";

describe("execution-engine notional sizing", () => {
  it("derives notional risk amount from exposure percent", () => {
    const risk = deriveRiskSettings(
      {
        startingBalance: 100000,
        currentBalance: 100000,
        defaultRiskPercent: 1,
      },
      { riskPercent: 2.5 },
    );

    expect(risk.riskPercent).toBe(2.5);
    expect(risk.riskAmount).toBe(2500);
  });

  it("calculates size from notional and entry price", () => {
    expect(calculatePositionSizeFromNotional(2500, 1000)).toBeCloseTo(0.4, 8);
    expect(calculatePositionSizeFromNotional(1.25, 1000)).toBeCloseTo(800, 8);
  });

  it("returns null for invalid notional sizing inputs", () => {
    expect(calculatePositionSizeFromNotional(null, 1000)).toBeNull();
    expect(calculatePositionSizeFromNotional(0, 1000)).toBeNull();
    expect(calculatePositionSizeFromNotional(2500, 0)).toBeNull();
  });
});
