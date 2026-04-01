import type { SVGProps } from "react";

export type BacktestToolIcon = (props: SVGProps<SVGSVGElement>) => React.JSX.Element;

function BaseIcon({
  children,
  strokeWidth = 1.95,
  ...props
}: SVGProps<SVGSVGElement>) {
  return (
    <svg
      fill="none"
      shapeRendering="geometricPrecision"
      viewBox="0 0 20 20"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <g
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={strokeWidth}
      >
        {children}
      </g>
    </svg>
  );
}

export function ToolCursorIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg fill="none" shapeRendering="geometricPrecision" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg" {...props}>
      <path
        d="M4 3.2 12.8 9.7l-4 1.05 1.65 4.6-1.95.72-1.62-4.55L4 14.1Z"
        fill="currentColor"
      />
    </svg>
  );
}

export function ToolHorizontalLineIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <BaseIcon {...props}>
      <path d="M3 10h14" />
      <path d="M5 7.8V12.2" />
      <path d="M15 7.8V12.2" />
    </BaseIcon>
  );
}

export function ToolTrendLineIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <BaseIcon {...props}>
      <path d="M4.2 14.4 14.8 5.6" />
      <circle cx="4.2" cy="14.4" r="1.25" />
      <circle cx="14.8" cy="5.6" r="1.25" />
    </BaseIcon>
  );
}

export function ToolRayIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <BaseIcon {...props}>
      <path d="M4.1 14.2 15.8 6.2" />
      <path d="m12.9 6.2 2.9-.1-.9 2.7" />
      <circle cx="4.1" cy="14.2" r="1.15" />
    </BaseIcon>
  );
}

export function ToolExtendedLineIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <BaseIcon {...props}>
      <path d="M3.1 14.1 16.9 5.9" />
      <path d="m5.2 5.8-2.1.1.7 1.9" />
      <path d="m14.8 14.2 2.1-.1-.7-1.9" />
    </BaseIcon>
  );
}

export function ToolRectangleIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <BaseIcon {...props}>
      <rect height="9.2" rx="0.5" width="10.6" x="4.7" y="5.4" />
    </BaseIcon>
  );
}

export function ToolBrushIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <BaseIcon {...props}>
      <path d="M3.9 13.4c1.1-.9 2-.9 2.9-.3 1.1.7 2 .5 2.8-.7 1-1.5 1.9-2.3 3-2.8 1.2-.5 2.2-.8 3.4-1.7" />
    </BaseIcon>
  );
}

export function ToolCircleIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <BaseIcon {...props}>
      <circle cx="10" cy="10" r="5.1" />
    </BaseIcon>
  );
}

export function ToolFibIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <BaseIcon {...props}>
      <path d="M5 4.7v10.6" />
      <path d="M15 4.7v10.6" />
      <path d="M5 6.4h10" />
      <path d="M5 9.1h10" />
      <path d="M5 11h10" />
      <path d="M5 13.3h10" />
    </BaseIcon>
  );
}

export function ToolTextIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <BaseIcon {...props}>
      <path d="M5 5.6h10" />
      <path d="M10 5.6v8.8" />
      <path d="M7.2 14.4h5.6" />
    </BaseIcon>
  );
}

export function ToolTriangleIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <BaseIcon {...props}>
      <path d="M10 4.8 15.4 14H4.6Z" />
    </BaseIcon>
  );
}

export function ToolParallelChannelIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <BaseIcon {...props}>
      <path d="M4.1 13.9 12.4 6.1" />
      <path d="M6.6 16 14.9 8.2" />
      <path d="M4.1 13.9 6.6 16" />
      <path d="M12.4 6.1 14.9 8.2" />
    </BaseIcon>
  );
}

export function ToolPriceRangeIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <BaseIcon {...props}>
      <path d="M6 5.4v9.2" />
      <path d="M14 5.4v9.2" />
      <path d="M8.1 6.9H12" />
      <path d="M8.1 13.1H12" />
      <path d="M10 6.9v6.2" />
    </BaseIcon>
  );
}

export function ToolLongShortIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <BaseIcon {...props}>
      <path d="M6 14.6V8.7" />
      <path d="M14 5.4v5.9" />
      <path d="M6 8.7h8" />
      <path d="M6 14.6h8" />
      <path d="m11.8 11.4 2.2 3 2.2-3" />
      <path d="m8.2 8.6-2.2-3-2.2 3" />
    </BaseIcon>
  );
}

export function ToolDeleteIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <BaseIcon {...props}>
      <path d="M6.2 6.4h7.6" />
      <path d="M8 4.9h4" />
      <path d="m7 6.4.6 8h4.8l.6-8" />
      <path d="M8.7 8.2v4.2" />
      <path d="M11.3 8.2v4.2" />
    </BaseIcon>
  );
}

export function ToolClearIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <BaseIcon {...props}>
      <path d="m6.1 12.8 4.8-5.8 3.1 3.1-4.8 5.9H6.1Z" />
      <path d="M10.2 14.6h5" />
      <path d="M9.8 8.3 13 11.5" />
    </BaseIcon>
  );
}
