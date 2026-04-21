export const homeCopy = {
  hero: {
    eyebrow: "Trading practice platform",
    title: "Battle other traders on replayed markets.",
    description:
      "Create private rooms, join open battles, practice solo in backtesting, sharpen with quizzes, and keep your progress moving inside one trading workspace.",
    primaryCta: { href: "/sign-up", label: "Start A Battle" },
    secondaryCta: { href: "/backtesting", label: "Explore Backtesting" },
    quickModes: [
      { label: "Battle", detail: "Compete in timed replay matches" },
      { label: "Backtesting", detail: "Practice solo before queueing" },
      { label: "Learn", detail: "Build trading context and process" },
      { label: "Quiz", detail: "Check what you actually know" },
      { label: "Progress", detail: "Track modules, scores, and sessions" },
    ],
  },
  featureGrid: [
    {
      eyebrow: "Main mode",
      title: "Battle",
      description:
        "Trade the same replayed market as everyone else, manage risk under the same rules, and fight for the top balance before the timer ends.",
      href: "/sign-up",
      ctaLabel: "Open Battle",
      points: ["Private codes", "Open rooms", "Live leaderboard"],
    },
    {
      eyebrow: "Solo mode",
      title: "Backtesting",
      description:
        "Replay candles, plan entries, set stops and targets, and review sessions before you take your ideas into battle.",
      href: "/backtesting",
      ctaLabel: "Try Backtesting",
      points: ["Replay controls", "Trade planner", "Saved sessions"],
    },
    {
      eyebrow: "Study mode",
      title: "Learn",
      description:
        "Use focused modules and short lessons to build structure, not noise, before you start making trading decisions.",
      href: "/learn",
      ctaLabel: "Browse Learn",
      points: ["Modules", "Lesson library", "Bookmarks"],
    },
    {
      eyebrow: "Check mode",
      title: "Quiz",
      description:
        "Run topic-based quiz checks so you know whether you understand the concepts before you trust them inside a trade.",
      href: "/sign-up",
      ctaLabel: "Take A Quiz",
      points: ["Setup", "Take", "Results"],
    },
    {
      eyebrow: "Workspace",
      title: "Progress",
      description:
        "See active modules, quiz status, backtesting balance, and your next move from one dashboard instead of scattering the flow.",
      href: "/sign-up",
      ctaLabel: "View Workspace",
      points: ["Dashboard", "Status", "Next actions"],
    },
  ],
  battleSpotlight: {
    eyebrow: "Battle spotlight",
    title: "Timed replay battles with real room flow.",
    description:
      "Battle is the centerpiece: lobby up, ready before the countdown ends, trade the replay under shared rules, and finish with a results board that shows who managed the session best.",
    roomModes: [
      {
        title: "Private rooms",
        description:
          "Create a room, share the code, and run a controlled match with your own group.",
      },
      {
        title: "Open rooms",
        description:
          "Join listed rooms when you want a faster queue and more opponents in the same replay.",
      },
      {
        title: "Results and penalties",
        description:
          "Battles track rank, balance, closed trades, and enforce consequences for no-trade, forfeit, and early exit behavior.",
      },
    ],
    rules: [
      "Shared replay, shared timer, shared risk rules",
      "Live room state with lobby, match, and results flow",
      "Competitive ranking driven by trade execution and final balance",
    ],
  },
  supportModes: {
    eyebrow: "Support modes",
    title: "Everything around battle still matters.",
    description:
      "Battle is the hook, but the rest of the platform makes it stick: learn the concepts, check yourself with quizzes, practice solo in backtesting, and return to battle better prepared.",
    items: [
      {
        title: "Learn",
        description:
          "Use the lesson library to build structure in market basics, candlesticks, risk, planning, and psychology.",
      },
      {
        title: "Quiz",
        description:
          "Run quick checks after studying so you know whether the idea is clear enough to apply under pressure.",
      },
      {
        title: "Backtesting",
        description:
          "Test your process alone before you bring it into a competitive battle room.",
      },
      {
        title: "Dashboard",
        description:
          "Keep your active module, recent scores, and trading workspace status visible in one place.",
      },
    ],
  },
  cta: {
    eyebrow: "Ready to queue",
    title: "Train, practice, and compete in one place.",
    description:
      "Start with battle if you want the pressure. Use the rest of the platform when you want better preparation, cleaner review, and a stronger process.",
    primaryCta: { href: "/sign-up", label: "Create Free Account" },
    secondaryCta: { href: "/learn", label: "See All Features" },
  },
  pillars: [
    {
      title: "Learn",
      description:
        "Start with fundamentals, market structure, candlesticks, and trade planning in a clear order.",
      icon: "school",
      href: "/learn",
      stat: "4 launch modules",
    },
    {
      title: "Quiz",
      description:
        "Use quick topic checks and full quiz packs to see what you actually understand before moving on.",
      icon: "quiz",
      href: "/sign-up",
      stat: "Topic-based checks",
    },
    {
      title: "Backtesting",
      description:
        "Replay historical charts, plan entries, and review outcomes in a practice-first workspace.",
      icon: "query_stats",
      href: "/backtesting",
      stat: "Replay, plan, review",
    },
  ],
  whyItWorks: [
    "Mobile-first lessons that stay readable on larger screens",
    "No fake community metrics, alerts, or broker-style pressure",
    "A clear connection between study, testing, and practice",
  ],
  stats: [
    { label: "Core pillars", value: "3" },
    { label: "Launch routes", value: "18" },
    { label: "Docs-driven scope", value: "Exact" },
    { label: "Visual source", value: "Stitch" },
  ],
};

export const learnCopy = {
  heroPoints: [
    "Simple, beginner-first explanations",
    "Module pages that stay easy to scan on mobile",
    "Built-in quiz and backtesting progression",
  ],
  previewBenefits: [
    {
      title: "Bite-sized modules",
      description:
        "Short lessons that teach one idea cleanly instead of overwhelming you.",
      icon: "auto_stories",
    },
    {
      title: "Quick checks",
      description:
        "Topic quizzes help confirm understanding while concepts are still fresh.",
      icon: "quiz",
    },
    {
      title: "Practice bridge",
      description:
        "Backtesting keeps your learning connected to decision-making.",
      icon: "query_stats",
    },
    {
      title: "Honest scope",
      description:
        "No fake status levels, no inflated counts, and no pressure-heavy copy.",
      icon: "fact_check",
    },
  ],
  faq: [
    {
      question: "Do I need trading experience before starting?",
      answer:
        "No. The v1 curriculum is written for beginners and keeps jargon controlled.",
    },
    {
      question: "Can I access quizzes and backtesting without an account?",
      answer:
        "Public pages explain the system, but interactive product routes are signed-in experiences.",
    },
    {
      question: "Does the Learn area promise trading results?",
      answer:
        "No. The platform is positioned around education, review, and practice rather than outcomes guarantees.",
    },
  ],
};

export const backtestingCopy = {
  tags: ["Replay candles", "Long and short", "Entry / SL / TP", "Result tracking"],
  capabilities: [
    {
      title: "Replay",
      description:
        "Step through historical price action one candle at a time and keep your attention on process.",
      icon: "restart_alt",
    },
    {
      title: "Plan",
      description:
        "Define entry, stop loss, target, and risk before the move plays out.",
      icon: "architecture",
    },
    {
      title: "Review",
      description:
        "Measure outcome quality, not just whether a single trade won or lost.",
      icon: "fact_check",
    },
  ],
  featureGrid: [
    "Chart replay",
    "Autoplay",
    "Long / short",
    "Timeframe switch",
    "Trade planner",
    "Saved sessions",
    "Result tracking",
  ],
  reasons: [
    {
      title: "Remove emotional bias",
      description:
        "A plan that survives review is easier to trust when markets get noisy.",
      icon: "psychology",
    },
    {
      title: "Optimize your process",
      description:
        "Use historical review to see when your rules are clear and when they need work.",
      icon: "monitoring",
    },
    {
      title: "Protect capital first",
      description:
        "Study risk before real-money pressure enters the picture.",
      icon: "history_edu",
    },
  ],
};

export const aboutCopy = {
  introCards: [
    "Simple lessons over noisy dashboards",
    "Study and review before live execution",
    "A beginner-friendly path that still respects discipline",
  ],
  values: [
    {
      title: "Clarity",
      description:
        "Explanations should reduce confusion, not decorate it.",
      icon: "visibility",
    },
    {
      title: "Honesty",
      description:
        "No fake testimonials, no luxury-trader posturing, and no guaranteed profit language.",
      icon: "verified",
    },
    {
      title: "Practice",
      description:
        "Learning sticks better when lessons, quizzes, and backtesting reinforce each other.",
      icon: "tactic",
    },
  ],
  mission:
    "localtradings.com exists to help new traders learn structure before they risk money. The product is meant to feel calm, usable, and grounded in process.",
  vision:
    "Build a learning platform where lessons are readable, quizzes are useful, and practice tools support decision quality rather than hype.",
};

export const publicHelpCopy = {
  categories: [
    {
      title: "Getting Started",
      description:
        "Understand the route map, account flow, and how public previews differ from signed-in tools.",
      icon: "rocket_launch",
    },
    {
      title: "Learning",
      description:
        "Find module guidance, lesson structure, and curriculum expectations.",
      icon: "school",
    },
    {
      title: "Quiz",
      description:
        "Review quiz types, score summaries, and how topic checks fit into the learning flow.",
      icon: "quiz",
    },
    {
      title: "Backtesting",
      description:
        "Get help with replay controls, planning inputs, and lightweight saved session history.",
      icon: "query_stats",
    },
    {
      title: "Account",
      description:
        "Ask about sign-in, sign-up, and profile basics.",
      icon: "person",
    },
    {
      title: "Contact",
      description:
        "Send platform feedback, report a bug, or ask a product question.",
      icon: "mail",
    },
  ],
  faq: [
    {
      question: "Is localtradings.com a broker or signal service?",
      answer:
        "No. The product is explicitly positioned as a learning-first education platform.",
    },
    {
      question: "Why are some routes signed-in only?",
      answer:
        "Public pages explain and preview the product. Signed-in routes are where study, quizzes, and backtesting actually happen.",
    },
    {
      question: "Will Community launch in v1?",
      answer:
        "No. Community appears in archived Stitch references only and is excluded from launch scope.",
    },
  ],
};
