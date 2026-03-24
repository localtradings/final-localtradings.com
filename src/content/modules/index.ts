import type { ModuleSummary } from "@/types/content";

export const moduleCatalog: ModuleSummary[] = [
  {
    slug: "trading-basics",
    title: "Trading Basics",
    description:
      "Build a beginner-first map of markets, sessions, and the language traders use every day.",
    level: "Beginner",
    duration: "3 lessons",
    outcomes: [
      "Understand what moves price",
      "Read common trading terms with confidence",
      "Create a study routine before placing trades",
    ],
    lessonSlugs: [
      "market-map-and-sessions",
      "how-orders-and-price-work",
      "building-a-simple-study-routine",
    ],
  },
  {
    slug: "candlesticks",
    title: "Candlesticks",
    description:
      "Read price behavior with calm, structured observation instead of chasing random patterns.",
    level: "Beginner",
    duration: "3 lessons",
    outcomes: [
      "Identify bullish and bearish candle behavior",
      "Recognize rejection, continuation, and indecision",
      "Turn chart observations into repeatable notes",
    ],
    lessonSlugs: [
      "candle-anatomy",
      "rejection-and-continuation",
      "context-before-patterns",
    ],
  },
  {
    slug: "risk-management",
    title: "Risk Management",
    description:
      "Learn position sizing, stop placement, and the discipline required to protect capital first.",
    level: "Beginner",
    duration: "2 lessons",
    outcomes: [
      "Calculate simple risk per trade",
      "Place stops with a reason instead of hope",
      "Review losses without emotional spirals",
    ],
    lessonSlugs: ["risk-per-trade-basics", "stop-loss-and-expectancy"],
  },
  {
    slug: "trade-planning",
    title: "Trade Planning",
    description:
      "Combine context, bias, and execution rules into a clear plan you can test and refine.",
    level: "Intermediate",
    duration: "2 lessons",
    outcomes: [
      "Write a trade thesis before entering",
      "Define invalidation and targets in advance",
      "Use backtesting to review process quality",
    ],
    lessonSlugs: ["trade-thesis-checklist", "reviewing-a-trade-plan"],
  },
];

export function getModuleBySlug(slug: string) {
  return moduleCatalog.find((module) => module.slug === slug) ?? null;
}
