import type { ReactNode } from "react";

export default function ProductBacktestingLayout({
  children,
}: {
  children: ReactNode;
}) {
  return <div className="h-full min-h-0 overflow-hidden">{children}</div>;
}
