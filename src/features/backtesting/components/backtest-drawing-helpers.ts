import type {
  BacktestDrawing,
  BacktestDrawingHandle,
  BacktestDrawingPoint,
  BacktestDrawingSelectionState,
  BacktestDrawingStyle,
  BacktestHorizontalLineDrawing,
  BacktestRectangleDrawing,
  BacktestTrendLineDrawing,
} from "@/features/backtesting/types";

export const DRAWING_HANDLE_RADIUS = 10;
export const DRAWING_LINE_HIT_THICKNESS = 8;

export type ProjectedPoint = {
  x: number;
  y: number;
};

export type ProjectedHorizontalLineDrawing = {
  id: string;
  type: "horizontalLine";
  y: number;
  handle: ProjectedPoint;
  source: BacktestHorizontalLineDrawing;
};

export type ProjectedTrendLineDrawing = {
  id: string;
  type: "trendLine";
  start: ProjectedPoint;
  end: ProjectedPoint;
  source: BacktestTrendLineDrawing;
};

export type ProjectedRectangleDrawing = {
  id: string;
  type: "rectangle";
  topLeft: ProjectedPoint;
  topRight: ProjectedPoint;
  bottomLeft: ProjectedPoint;
  bottomRight: ProjectedPoint;
  source: BacktestRectangleDrawing;
};

export type ProjectedDrawing =
  | ProjectedHorizontalLineDrawing
  | ProjectedTrendLineDrawing
  | ProjectedRectangleDrawing;

function createDrawingStyle(
  stroke: string,
  fill: string | null = null,
  strokeWidth = 2,
): BacktestDrawingStyle {
  return {
    stroke,
    fill,
    strokeWidth,
  };
}

export function createHorizontalLineDrawing(
  id: string,
  price: number,
): BacktestHorizontalLineDrawing {
  return {
    id,
    type: "horizontalLine",
    price,
    style: createDrawingStyle("#4f8cff"),
  };
}

export function createTrendLineDrawing(
  id: string,
  start: BacktestDrawingPoint,
  end: BacktestDrawingPoint,
): BacktestTrendLineDrawing {
  return {
    id,
    type: "trendLine",
    start,
    end,
    style: createDrawingStyle("#44c7c7"),
  };
}

export function createRectangleDrawing(
  id: string,
  start: BacktestDrawingPoint,
  end: BacktestDrawingPoint,
): BacktestRectangleDrawing {
  return {
    id,
    type: "rectangle",
    start,
    end,
    style: createDrawingStyle("#f59e0b", "rgba(245,158,11,0.14)"),
  };
}

export function getDrawingStyle(
  drawing: BacktestDrawing,
  selected: boolean,
): BacktestDrawingStyle {
  if (!selected) {
    return drawing.style;
  }

  return {
    ...drawing.style,
    strokeWidth: Math.max(drawing.style.strokeWidth + 0.5, 2.5),
    stroke:
      drawing.type === "horizontalLine"
        ? "#8bb7ff"
        : drawing.type === "trendLine"
          ? "#74ecec"
          : "#ffd075",
    fill:
      drawing.type === "rectangle" ? "rgba(245,158,11,0.2)" : drawing.style.fill,
  };
}

export function moveDrawing(
  drawing: BacktestDrawing,
  deltaLogical: number,
  deltaPrice: number,
): BacktestDrawing {
  if (drawing.type === "horizontalLine") {
    return {
      ...drawing,
      price: drawing.price + deltaPrice,
    };
  }

  return {
    ...drawing,
    start: {
      logical: drawing.start.logical + deltaLogical,
      price: drawing.start.price + deltaPrice,
    },
    end: {
      logical: drawing.end.logical + deltaLogical,
      price: drawing.end.price + deltaPrice,
    },
  };
}

export function moveDrawingHandle(
  drawing: BacktestDrawing,
  handle: BacktestDrawingHandle,
  nextPoint: BacktestDrawingPoint,
): BacktestDrawing {
  if (drawing.type === "horizontalLine") {
    return {
      ...drawing,
      price: nextPoint.price,
    };
  }

  if (drawing.type === "trendLine") {
    if (handle === "start") {
      return {
        ...drawing,
        start: nextPoint,
      };
    }

    if (handle === "end") {
      return {
        ...drawing,
        end: nextPoint,
      };
    }

    return drawing;
  }

  if (handle === "topLeft") {
    return {
      ...drawing,
      start: nextPoint,
    };
  }

  if (handle === "bottomRight") {
    return {
      ...drawing,
      end: nextPoint,
    };
  }

  if (handle === "topRight") {
    return {
      ...drawing,
      start: {
        logical: drawing.start.logical,
        price: nextPoint.price,
      },
      end: {
        logical: nextPoint.logical,
        price: drawing.end.price,
      },
    };
  }

  if (handle === "bottomLeft") {
    return {
      ...drawing,
      start: {
        logical: nextPoint.logical,
        price: drawing.start.price,
      },
      end: {
        logical: drawing.end.logical,
        price: nextPoint.price,
      },
    };
  }

  return drawing;
}

export function projectDrawing(
  drawing: BacktestDrawing,
  projectPoint: (point: BacktestDrawingPoint) => ProjectedPoint | null,
  projectPrice: (price: number) => number | null,
  chartWidth: number,
): ProjectedDrawing | null {
  if (drawing.type === "horizontalLine") {
    const y = projectPrice(drawing.price);
    if (typeof y !== "number") {
      return null;
    }

    return {
      id: drawing.id,
      type: "horizontalLine",
      y,
      handle: { x: Math.max(chartWidth - 18, 18), y },
      source: drawing,
    };
  }

  const start = projectPoint(drawing.start);
  const end = projectPoint(drawing.end);
  if (!start || !end) {
    return null;
  }

  if (drawing.type === "trendLine") {
    return {
      id: drawing.id,
      type: "trendLine",
      start,
      end,
      source: drawing,
    };
  }

  const left = Math.min(start.x, end.x);
  const right = Math.max(start.x, end.x);
  const top = Math.min(start.y, end.y);
  const bottom = Math.max(start.y, end.y);

  return {
    id: drawing.id,
    type: "rectangle",
    topLeft: { x: left, y: top },
    topRight: { x: right, y: top },
    bottomLeft: { x: left, y: bottom },
    bottomRight: { x: right, y: bottom },
    source: drawing,
  };
}

function getDistance(left: ProjectedPoint, right: ProjectedPoint) {
  return Math.hypot(left.x - right.x, left.y - right.y);
}

function distanceToSegment(point: ProjectedPoint, start: ProjectedPoint, end: ProjectedPoint) {
  const dx = end.x - start.x;
  const dy = end.y - start.y;
  if (dx === 0 && dy === 0) {
    return getDistance(point, start);
  }

  const t = Math.max(
    0,
    Math.min(1, ((point.x - start.x) * dx + (point.y - start.y) * dy) / (dx * dx + dy * dy)),
  );

  return getDistance(point, {
    x: start.x + t * dx,
    y: start.y + t * dy,
  });
}

export function hitTestProjectedDrawings(
  drawings: ProjectedDrawing[],
  point: ProjectedPoint,
): BacktestDrawingSelectionState {
  for (let index = drawings.length - 1; index >= 0; index -= 1) {
    const drawing = drawings[index];
    if (!drawing) {
      continue;
    }

    if (drawing.type === "horizontalLine") {
      if (Math.abs(point.y - drawing.handle.y) <= DRAWING_HANDLE_RADIUS) {
        return { drawingId: drawing.id, handle: "line" };
      }
      continue;
    }

    if (drawing.type === "trendLine") {
      if (getDistance(point, drawing.start) <= DRAWING_HANDLE_RADIUS) {
        return { drawingId: drawing.id, handle: "start" };
      }
      if (getDistance(point, drawing.end) <= DRAWING_HANDLE_RADIUS) {
        return { drawingId: drawing.id, handle: "end" };
      }
      if (
        distanceToSegment(point, drawing.start, drawing.end) <= DRAWING_LINE_HIT_THICKNESS
      ) {
        return { drawingId: drawing.id, handle: "line" };
      }
      continue;
    }

    const corners: Array<[BacktestDrawingHandle, ProjectedPoint]> = [
      ["topLeft", drawing.topLeft],
      ["topRight", drawing.topRight],
      ["bottomLeft", drawing.bottomLeft],
      ["bottomRight", drawing.bottomRight],
    ];

    for (const [handle, corner] of corners) {
      if (getDistance(point, corner) <= DRAWING_HANDLE_RADIUS) {
        return { drawingId: drawing.id, handle };
      }
    }

    if (
      point.x >= drawing.topLeft.x &&
      point.x <= drawing.topRight.x &&
      point.y >= drawing.topLeft.y &&
      point.y <= drawing.bottomLeft.y
    ) {
      return { drawingId: drawing.id, handle: "line" };
    }
  }

  return {
    drawingId: null,
    handle: null,
  };
}
