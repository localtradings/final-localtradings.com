import { Card } from "@/components/ui/card";

type StatsRowProps = {
  items: Array<{
    label: string;
    value: string;
  }>;
};

export function StatsRow({ items }: StatsRowProps) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {items.map((item) => (
        <Card className="rounded-[var(--radius-lg)] p-5" key={item.label}>
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-muted">
            {item.label}
          </p>
          <p className="mt-3 font-heading text-3xl font-extrabold tracking-tight">
            {item.value}
          </p>
        </Card>
      ))}
    </div>
  );
}
