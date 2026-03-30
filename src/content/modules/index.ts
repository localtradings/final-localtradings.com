import type { ModuleSummary } from "@/types/content";

export const moduleCatalog: ModuleSummary[] = [
  {
    slug: "trading-basics",
    title: "Trading Basics",
    description:
      "Build a beginner-first map of markets, sessions, and the language traders use every day.",
    level: "Beginner",
    duration: "3 lessons",
    featured: true,
    releaseOrder: 1,
    topic: "Foundations",
    imageSrc:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuAZidk0bWKSwKeLpwDTPpu3bw2FUzaJBsFdkDUpDq3Hy0or9oaDmqf8jVUTuD69rOoBDoUNWnIC0jY8di4iIMZ336e5aw-8G1VR5yu_3YGOdzkzLvd0UIZ_OQ5fHmIxei1hmNZbqhviu6rdvcepkgkv9v-AunPB3fwAxo-y7fphZmKtkHLwSoglTSf7snwpdud7O1qoevcOG-hrHv1nc6Y_z0vhPdJbMEePeSJ2jGVvUwRf4hPYXcGjptWZzXJVEGixBOPAxk2V6lfZ",
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
    releaseOrder: 3,
    topic: "Price Action",
    imageSrc:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuCAnrWrXj7PU6j7RxZgaDBWsyvXvBGsGNUL1RgrqsERcJehdsDSdQp8w1k-BRweH0zSOnWZHRmWZYW87sdBCzSWy-ZhCcemfEQqQVPInH8_tMGN83HqP8r9lwp8kdqicfsbI-Vrvq_qApftXmKQezEp950Mi-DyE33NnDgiN0L4DMIIDKZP2MuRLPOdTBxt9VVI98vZMA9TTKUIrc9tUY69LkxKmb7E6lAW3xB0Wve8etXIEkfcuJONji-j7FRHpjcrmVUm1Zk9rCT4",
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
    slug: "market-structure",
    title: "Market Structure",
    description:
      "Learn how swings, ranges, and breaks help you describe trend direction without forcing a trade.",
    level: "Beginner",
    duration: "2 lessons",
    releaseOrder: 2,
    topic: "Structure",
    imageSrc:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuBxL8YO3Y0sCRSDPrWglpmkxRs9ouHkfY-jXPbWx8Dcdf2gFsEcRQSb2HrmZVaeVtX1RJOiPweK1V3JJDfwnJIFw55qewbyMnjCkJVhVLplPpN58z7fj4lGBico_yHC9fQqPXqnFcsw-l1qpRMsfauMomoQ8hbQPKUolvt-wNbhaPTacS4AZqoL9L6l-1CmIju8cU6DkxTc5QOjJKVj2LDfPrwP95ZlmkJFCuaWl_aYbxifjwYgXjpZ86Isajb88S6UrpT7Xek1IqsW",
    outcomes: [
      "Describe trend direction with clearer language",
      "Separate consolidation from expansion",
      "Use structure to frame where a setup matters",
    ],
    lessonSlugs: ["trend-and-range-basics", "support-resistance-and-breaks"],
  },
  {
    slug: "risk-management",
    title: "Risk Management",
    description:
      "Learn position sizing, stop placement, and the discipline required to protect capital first.",
    level: "Beginner",
    duration: "2 lessons",
    releaseOrder: 4,
    topic: "Risk",
    imageSrc:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuDA5DiYLJh-6sx2yNlGaXkI6sP4pnTo9rwnqbDYTCM5Tkp4G8NvaXv6wVtzMez-n1uM7CTa_s-lZMUKcgTkLYJ_1Yv2uYhqYzhU4MIOL52pK64xYHxQ-NkJgon_Los2jamcgJFy4dDnFB9z30JpwkiAxBzKLXu8dKGRoU37GOQ8ePy3sbVj3IeP_Rj5UkOsKqOF7801OFv2BkzaXEt4KUtUKoFcEWlhcCt55QEmA8MMYrUb4BDMiV5zYWinqFpR-C05nokWIbKxyL0F",
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
    releaseOrder: 5,
    topic: "Planning",
    imageSrc:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuCvhiA2Up5Z2STR0rlQqLTfRdr1Gm4i3TsBLmz5RoeptXWeg5HDTCMPBvNF_Koe28E4MdN88akbhveKPyk8FEfr_pG8q8MVS6pZcEL5aYp3Vy-aC8iITVTNYgNDtsppYM3XjzgIhTxC7ZTrN5e_QeDpbupTLubJOzwZ5dRok-6recxOrca_s_sZ7DPxA9xZHoKS21Hvi3G3obxUtWU8Li2mx8eyX7ZyN4YV7n6go96zlTk1Hvh_JkEW7VKdPzOSC5nD3D8wgFjzUfes",
    outcomes: [
      "Write a trade thesis before entering",
      "Define invalidation and targets in advance",
      "Use backtesting to review process quality",
    ],
    lessonSlugs: ["trade-thesis-checklist", "reviewing-a-trade-plan"],
  },
  {
    slug: "advanced-indicators",
    title: "Advanced Indicators",
    description:
      "Move beyond basic overlays and learn how to use indicators as supporting tools instead of trade triggers.",
    level: "Intermediate",
    duration: "2 lessons",
    releaseOrder: 6,
    topic: "Indicators",
    imageSrc:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuAZidk0bWKSwKeLpwDTPpu3bw2FUzaJBsFdkDUpDq3Hy0or9oaDmqf8jVUTuD69rOoBDoUNWnIC0jY8di4iIMZ336e5aw-8G1VR5yu_3YGOdzkzLvd0UIZ_OQ5fHmIxei1hmNZbqhviu6rdvcepkgkv9v-AunPB3fwAxo-y7fphZmKtkHLwSoglTSf7snwpdud7O1qoevcOG-hrHv1nc6Y_z0vhPdJbMEePeSJ2jGVvUwRf4hPYXcGjptWZzXJVEGixBOPAxk2V6lfZ",
    outcomes: [
      "Use RSI and MACD with context",
      "Know when an indicator adds clarity",
      "Avoid stacking tools that say the same thing",
    ],
    lessonSlugs: ["using-rsi-with-context", "reading-macd-with-price"],
  },
  {
    slug: "trading-psychology",
    title: "Trading Psychology",
    description:
      "Understand the habits, emotions, and thought errors that quietly damage otherwise decent trade ideas.",
    level: "Beginner",
    duration: "2 lessons",
    releaseOrder: 7,
    topic: "Psychology",
    imageSrc:
      "https://images.unsplash.com/photo-1515378791036-0648a3ef77b2?auto=format&fit=crop&w=1200&q=80",
    outcomes: [
      "Recognize emotional reactions before they control execution",
      "Identify common decision traps",
      "Build review habits that reduce impulsive trading",
    ],
    lessonSlugs: ["fear-greed-and-revenge-trading", "building-discipline-through-routines"],
  },
];

export function getModuleBySlug(slug: string) {
  return moduleCatalog.find((module) => module.slug === slug) ?? null;
}
