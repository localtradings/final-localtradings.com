import type { SVGProps } from "react";
import {
  ArrowUpRight,
  CandlestickChart,
  Circle,
  Eraser,
  Minus,
  MousePointer2,
  MoveDiagonal2,
  Paintbrush,
  Ratio,
  Rows3,
  RulerDimensionLine,
  Square,
  Trash2,
  TrendingUp,
  Triangle,
  Type,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

export type BacktestToolIcon = (props: SVGProps<SVGSVGElement>) => React.JSX.Element;

function iconFactory(Icon: LucideIcon) {
  return function BacktestIcon(props: SVGProps<SVGSVGElement>) {
    return <Icon {...props} />;
  };
}

export const ToolCursorIcon = iconFactory(MousePointer2);
export const ToolHorizontalLineIcon = iconFactory(Minus);
export const ToolTrendLineIcon = iconFactory(TrendingUp);
export const ToolRayIcon = iconFactory(ArrowUpRight);
export const ToolExtendedLineIcon = iconFactory(MoveDiagonal2);
export const ToolRectangleIcon = iconFactory(Square);
export const ToolBrushIcon = iconFactory(Paintbrush);
export const ToolCircleIcon = iconFactory(Circle);
export const ToolFibIcon = iconFactory(Ratio);
export const ToolTextIcon = iconFactory(Type);
export const ToolTriangleIcon = iconFactory(Triangle);
export const ToolParallelChannelIcon = iconFactory(Rows3);
export const ToolPriceRangeIcon = iconFactory(RulerDimensionLine);
export const ToolLongShortIcon = iconFactory(CandlestickChart);
export const ToolDeleteIcon = iconFactory(Trash2);
export const ToolClearIcon = iconFactory(Eraser);
