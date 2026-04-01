import type { ReactNode } from "react";

export default function ProductBacktestingLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden lg:-mt-2 lg:-mb-4">
      {children}
    </div>
  );
}
