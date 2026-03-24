"use client";

import { useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

export function BacktestingWorkspace() {
  const [symbol, setSymbol] = useState("EURUSD");
  const [timeframe, setTimeframe] = useState("H1");
  const [direction, setDirection] = useState("Long");
  const [entry, setEntry] = useState("1.0854");
  const [stop, setStop] = useState("1.0832");
  const [target, setTarget] = useState("1.0916");
  const [notes, setNotes] = useState(
    "Context: trend continuation after a pullback into structure.",
  );

  const rr = useMemo(() => {
    const entryValue = Number(entry);
    const stopValue = Number(stop);
    const targetValue = Number(target);

    if ([entryValue, stopValue, targetValue].some(Number.isNaN)) {
      return "N/A";
    }

    const risk = Math.abs(entryValue - stopValue);
    const reward = Math.abs(targetValue - entryValue);

    if (risk === 0) {
      return "N/A";
    }

    return `${(reward / risk).toFixed(2)}R`;
  }, [entry, stop, target]);

  return (
    <div className="grid gap-8 xl:grid-cols-[1.1fr,0.9fr]">
      <section className="space-y-6">
        <div className="card-surface rounded-[var(--radius-xl)] p-6 sm:p-8 lg:p-10">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-primary">
                Backtesting workstation
              </p>
              <h1 className="mt-2 font-heading text-4xl font-extrabold tracking-tight sm:text-5xl">
                Replay, plan, and review.
              </h1>
            </div>
            <div className="rounded-full border border-outline/15 bg-surface-low px-4 py-2 text-sm text-muted">
              {symbol} · {timeframe}
            </div>
          </div>
          <div className="mt-8 rounded-[var(--radius-xl)] border border-outline/15 bg-surface-low p-5">
            <div className="flex h-72 items-end gap-2">
              {[28, 64, 52, 86, 70, 126, 102, 140, 118, 156, 132, 174].map((height) => (
                <span
                  className="flex-1 rounded-t-full bg-[linear-gradient(180deg,var(--primary),var(--primary-dim))]"
                  key={height}
                  style={{ height }}
                />
              ))}
            </div>
            <div className="mt-6 grid gap-4 md:grid-cols-4">
              {[
                { label: "Direction", value: direction },
                { label: "Entry", value: entry },
                { label: "Stop", value: stop },
                { label: "Target", value: target },
              ].map((item) => (
                <div key={item.label}>
                  <p className="text-xs font-semibold uppercase tracking-[0.22em] text-muted">
                    {item.label}
                  </p>
                  <p className="mt-2 font-heading text-2xl font-extrabold tracking-tight">
                    {item.value}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
        <Card className="p-6">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-primary">
            Review panel
          </p>
          <div className="mt-5 grid gap-4 sm:grid-cols-3">
            <div className="rounded-[var(--radius-xl)] border border-outline/15 bg-surface-low p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-muted">
                Risk / reward
              </p>
              <p className="mt-2 font-heading text-3xl font-extrabold tracking-tight">
                {rr}
              </p>
            </div>
            <div className="rounded-[var(--radius-xl)] border border-outline/15 bg-surface-low p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-muted">
                Thesis
              </p>
              <p className="mt-2 text-sm text-muted">
                Structure pullback into continuation bias
              </p>
            </div>
            <div className="rounded-[var(--radius-xl)] border border-outline/15 bg-surface-low p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-muted">
                Session note
              </p>
              <p className="mt-2 text-sm text-muted">
                Keep execution rules small and repeatable.
              </p>
            </div>
          </div>
        </Card>
      </section>
      <Card className="h-fit p-8">
        <div className="space-y-5">
          <h2 className="font-heading text-2xl font-extrabold tracking-tight">
            Plan the trade
          </h2>
          <div className="grid gap-4 md:grid-cols-2">
            <Select onChange={(event) => setSymbol(event.target.value)} value={symbol}>
              <option>EURUSD</option>
              <option>GBPUSD</option>
              <option>XAUUSD</option>
            </Select>
            <Select onChange={(event) => setTimeframe(event.target.value)} value={timeframe}>
              <option>M15</option>
              <option>H1</option>
              <option>H4</option>
            </Select>
            <Select onChange={(event) => setDirection(event.target.value)} value={direction}>
              <option>Long</option>
              <option>Short</option>
            </Select>
            <Input
              onChange={(event) => setEntry(event.target.value)}
              placeholder="Entry"
              value={entry}
            />
            <Input
              onChange={(event) => setStop(event.target.value)}
              placeholder="Stop"
              value={stop}
            />
            <Input
              onChange={(event) => setTarget(event.target.value)}
              placeholder="Target"
              value={target}
            />
          </div>
          <Textarea
            onChange={(event) => setNotes(event.target.value)}
            value={notes}
          />
          <div className="grid gap-3 sm:grid-cols-2">
            <Button type="button">Save Session Notes</Button>
            <Button type="button" variant="secondary">
              Reset Plan
            </Button>
          </div>
          <p className="text-sm leading-7 text-muted">
            v1 intentionally stays focused: replay controls, trade plan inputs,
            session stats, and a review panel without extra alerts or exports.
          </p>
        </div>
      </Card>
    </div>
  );
}
