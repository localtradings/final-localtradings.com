import { describe, expect, it } from "vitest";

import type { BacktestDrawingPoint } from "@/features/backtesting/types";
import {
  createHorizontalLineDrawing,
  createRectangleDrawing,
  createTrendLineDrawing,
  hitTestProjectedDrawings,
  moveDrawing,
  moveDrawingHandle,
  projectDrawing,
  type ProjectedDrawing,
} from "@/features/backtesting/components/backtest-drawing-helpers";

const start: BacktestDrawingPoint = { logical: 10, price: 2358 };
const end: BacktestDrawingPoint = { logical: 20, price: 2368 };

describe("backtest-drawing-helpers", () => {
  it("creates the three drawing types with stable shapes", () => {
    expect(createHorizontalLineDrawing("line-1", 2358)).toMatchObject({
      id: "line-1",
      type: "horizontalLine",
      price: 2358,
    });
    expect(createTrendLineDrawing("trend-1", start, end)).toMatchObject({
      id: "trend-1",
      type: "trendLine",
      start,
      end,
    });
    expect(createRectangleDrawing("rect-1", start, end)).toMatchObject({
      id: "rect-1",
      type: "rectangle",
      start,
      end,
    });
  });

  it("moves whole drawings without changing their shape", () => {
    const trend = createTrendLineDrawing("trend-1", start, end);
    const movedTrend = moveDrawing(trend, 5, -3);

    expect(movedTrend).toMatchObject({
      start: { logical: 15, price: 2355 },
      end: { logical: 25, price: 2365 },
    });

    const horizontal = createHorizontalLineDrawing("line-1", 2358);
    expect(moveDrawing(horizontal, 5, -2)).toMatchObject({
      price: 2356,
    });
  });

  it("moves the active handle for trend lines and rectangles", () => {
    const trend = createTrendLineDrawing("trend-1", start, end);
    expect(
      moveDrawingHandle(trend, "start", { logical: 12, price: 2360 }),
    ).toMatchObject({
      start: { logical: 12, price: 2360 },
      end,
    });

    const rectangle = createRectangleDrawing("rect-1", start, end);
    expect(
      moveDrawingHandle(rectangle, "topRight", { logical: 24, price: 2350 }),
    ).toMatchObject({
      start: { logical: 10, price: 2350 },
      end: { logical: 24, price: 2368 },
    });
  });

  it("projects drawings into screen space and hit-tests them", () => {
    const projectPoint = (point: BacktestDrawingPoint) => ({
      x: point.logical * 10,
      y: point.price,
    });
    const projectPrice = (price: number) => price;

    const projected = [
      projectDrawing(createHorizontalLineDrawing("line-1", 220), projectPoint, projectPrice, 500),
      projectDrawing(
        createTrendLineDrawing("trend-1", { logical: 5, price: 50 }, { logical: 15, price: 150 }),
        projectPoint,
        projectPrice,
        500,
      ),
      projectDrawing(
        createRectangleDrawing("rect-1", { logical: 20, price: 120 }, { logical: 30, price: 220 }),
        projectPoint,
        projectPrice,
        500,
      ),
    ].filter((value): value is ProjectedDrawing => value !== null);

    expect(hitTestProjectedDrawings(projected, { x: 120, y: 220 })).toEqual({
      drawingId: "line-1",
      handle: "line",
    });
    expect(hitTestProjectedDrawings(projected, { x: 50, y: 50 })).toEqual({
      drawingId: "trend-1",
      handle: "start",
    });
    expect(hitTestProjectedDrawings(projected, { x: 250, y: 170 })).toEqual({
      drawingId: "rect-1",
      handle: "line",
    });
  });
});
