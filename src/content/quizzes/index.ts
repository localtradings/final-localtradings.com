import type { QuizDefinition } from "@/types/content";

export const quizCatalog: QuizDefinition[] = [
  {
    slug: "trading-basics-check",
    title: "Trading Basics Quiz",
    summary:
      "A foundational check on market sessions, order flow basics, and beginner terminology.",
    category: "Foundations",
    difficulty: "Beginner",
    recommendedQuestionCount: 5,
    estimatedMinutes: 6,
    questions: [
      {
        id: "tb-1",
        prompt: "What is the main purpose of a beginner trading routine?",
        explanation:
          "A routine helps you review the same process consistently before making decisions.",
        answerId: "b",
        options: [
          { id: "a", label: "To guarantee more trades every day" },
          { id: "b", label: "To create repeatable review habits" },
          { id: "c", label: "To remove the need for a plan" },
          { id: "d", label: "To trade every market at once" },
        ],
      },
      {
        id: "tb-2",
        prompt: "What does a market session help you understand?",
        explanation:
          "Sessions help you map when participation and volatility can change.",
        answerId: "c",
        options: [
          { id: "a", label: "Guaranteed entries" },
          { id: "b", label: "Broker promotions" },
          { id: "c", label: "When different parts of the market are most active" },
          { id: "d", label: "How to avoid all risk" },
        ],
      },
      {
        id: "tb-3",
        prompt: "Why should public preview pages avoid pretending you already have saved progress?",
        explanation:
          "The docs require public routes to explain and preview, not fake signed-in state.",
        answerId: "a",
        options: [
          { id: "a", label: "Because saved progress belongs to signed-in product routes" },
          { id: "b", label: "Because progress is not useful" },
          { id: "c", label: "Because quizzes only work offline" },
          { id: "d", label: "Because dashboards should be public" },
        ],
      },
      {
        id: "tb-4",
        prompt: "What is the safest default for a beginner before placing live trades?",
        explanation:
          "Study and structured practice should come before risking real money.",
        answerId: "d",
        options: [
          { id: "a", label: "Join a signal room" },
          { id: "b", label: "Increase leverage" },
          { id: "c", label: "Copy random setups" },
          { id: "d", label: "Learn first, then practice with backtesting" },
        ],
      },
      {
        id: "tb-5",
        prompt: "Which product pillars define localtradings.com?",
        explanation:
          "The product pillars are Learn, Quiz, and Backtesting.",
        answerId: "c",
        options: [
          { id: "a", label: "Brokerage, News, Community" },
          { id: "b", label: "Signals, Alerts, Wallet" },
          { id: "c", label: "Learn, Quiz, Backtesting" },
          { id: "d", label: "Community, Settings, Notifications" },
        ],
      },
    ],
  },
  {
    slug: "candlesticks-quiz",
    title: "Candlesticks Quiz",
    summary:
      "Read candle anatomy, rejection, continuation, and context before you classify patterns.",
    category: "Price Action",
    difficulty: "Beginner",
    recommendedQuestionCount: 5,
    estimatedMinutes: 7,
    questions: [
      {
        id: "cs-1",
        prompt: "What does a long upper wick often suggest?",
        explanation:
          "A long upper wick can suggest rejection of higher prices, especially in context.",
        answerId: "b",
        options: [
          { id: "a", label: "Guaranteed continuation upward" },
          { id: "b", label: "Possible rejection of higher prices" },
          { id: "c", label: "No meaningful information at all" },
          { id: "d", label: "A required buy signal" },
        ],
      },
      {
        id: "cs-2",
        prompt: "Why is context important before labeling a candle pattern?",
        explanation:
          "A candle means more when you understand where it appears relative to structure.",
        answerId: "d",
        options: [
          { id: "a", label: "Because context removes all losses" },
          { id: "b", label: "Because one candle is enough on its own" },
          { id: "c", label: "Because context changes broker fees" },
          { id: "d", label: "Because structure changes what a candle implies" },
        ],
      },
      {
        id: "cs-3",
        prompt: "A strong body closing near its high is most often associated with:",
        explanation:
          "A strong close near the high often reflects directional conviction in that candle.",
        answerId: "a",
        options: [
          { id: "a", label: "Continuation pressure" },
          { id: "b", label: "Guaranteed reversal" },
          { id: "c", label: "No participation" },
          { id: "d", label: "Session closure" },
        ],
      },
      {
        id: "cs-4",
        prompt: "What should you do after spotting a candle pattern?",
        explanation:
          "Move from observation to structured notes, then confirm against broader context.",
        answerId: "c",
        options: [
          { id: "a", label: "Enter immediately with no plan" },
          { id: "b", label: "Ignore risk because the signal is obvious" },
          { id: "c", label: "Check context and write what the candle might mean" },
          { id: "d", label: "Switch markets instantly" },
        ],
      },
      {
        id: "cs-5",
        prompt: "Which habit is most useful when learning candlesticks?",
        explanation:
          "Consistent chart notes build pattern recognition more reliably than impulsive trading.",
        answerId: "b",
        options: [
          { id: "a", label: "Only focusing on social media screenshots" },
          { id: "b", label: "Keeping repeatable notes on candle behavior" },
          { id: "c", label: "Skipping lesson review" },
          { id: "d", label: "Avoiding quizzes entirely" },
        ],
      },
    ],
  },
  {
    slug: "risk-management-quiz",
    title: "Risk Management Quiz",
    summary:
      "Check your understanding of stop placement, risk per trade, and expectancy thinking.",
    category: "Risk",
    difficulty: "Beginner",
    recommendedQuestionCount: 5,
    estimatedMinutes: 6,
    questions: [
      {
        id: "rm-1",
        prompt: "What is risk per trade meant to control?",
        explanation:
          "It limits how much capital you expose on any single idea.",
        answerId: "c",
        options: [
          { id: "a", label: "How many indicators appear on a chart" },
          { id: "b", label: "How fast price moves" },
          { id: "c", label: "How much of your account you can lose on one trade" },
          { id: "d", label: "How often you should trade each session" },
        ],
      },
      {
        id: "rm-2",
        prompt: "Why should stop loss placement have a reason?",
        explanation:
          "Stops should reflect invalidation of the trade idea, not arbitrary distance.",
        answerId: "a",
        options: [
          { id: "a", label: "Because stops should match the trade thesis" },
          { id: "b", label: "Because tighter stops always win" },
          { id: "c", label: "Because stops are optional" },
          { id: "d", label: "Because stop loss guarantees profit" },
        ],
      },
      {
        id: "rm-3",
        prompt: "What does expectancy encourage you to review?",
        explanation:
          "Expectancy focuses on the quality of a system over many trades, not one outcome.",
        answerId: "d",
        options: [
          { id: "a", label: "Only your largest winner" },
          { id: "b", label: "One perfect setup" },
          { id: "c", label: "The fastest trade of the week" },
          { id: "d", label: "Process quality across multiple results" },
        ],
      },
      {
        id: "rm-4",
        prompt: "What is the first job of a trader according to the learning content?",
        explanation:
          "Protecting capital comes before maximizing returns.",
        answerId: "b",
        options: [
          { id: "a", label: "Finding the highest leverage" },
          { id: "b", label: "Preserving capital" },
          { id: "c", label: "Trading every day" },
          { id: "d", label: "Avoiding all stops" },
        ],
      },
      {
        id: "rm-5",
        prompt: "What is a healthier review question after a loss?",
        explanation:
          "Review should ask whether the plan was followed, not just whether the trade lost.",
        answerId: "a",
        options: [
          { id: "a", label: "Did I follow my plan and invalidation rules?" },
          { id: "b", label: "Can I double size on the next trade?" },
          { id: "c", label: "Should I remove stops completely?" },
          { id: "d", label: "Can I recover in one trade?" },
        ],
      },
    ],
  },
  {
    slug: "trade-planning-quiz",
    title: "Trade Planning Quiz",
    summary:
      "Test the logic behind bias, invalidation, and turning analysis into a written trade plan.",
    category: "Planning",
    difficulty: "Intermediate",
    recommendedQuestionCount: 5,
    estimatedMinutes: 8,
    questions: [
      {
        id: "tp-1",
        prompt: "What should a trade thesis describe first?",
        explanation:
          "A thesis starts with the market idea and why it makes sense before execution details.",
        answerId: "c",
        options: [
          { id: "a", label: "A guaranteed profit target" },
          { id: "b", label: "The number of social media likes" },
          { id: "c", label: "The reason the trade idea exists" },
          { id: "d", label: "A backup revenge trade" },
        ],
      },
      {
        id: "tp-2",
        prompt: "Invalidation tells you:",
        explanation:
          "Invalidation defines what would prove your idea wrong.",
        answerId: "b",
        options: [
          { id: "a", label: "When to add random size" },
          { id: "b", label: "What would break the trade idea" },
          { id: "c", label: "How to ignore risk" },
          { id: "d", label: "Why exits are unnecessary" },
        ],
      },
      {
        id: "tp-3",
        prompt: "Why pair trade planning with backtesting?",
        explanation:
          "Backtesting lets you review whether your plan rules hold up in practice.",
        answerId: "a",
        options: [
          { id: "a", label: "To test the plan against historical price action" },
          { id: "b", label: "To avoid writing any notes" },
          { id: "c", label: "To replace lessons entirely" },
          { id: "d", label: "To skip result review" },
        ],
      },
      {
        id: "tp-4",
        prompt: "Which element belongs in a written plan?",
        explanation:
          "A usable plan includes bias, entry logic, invalidation, and review criteria.",
        answerId: "d",
        options: [
          { id: "a", label: "Only the desired profit amount" },
          { id: "b", label: "A vague feeling about the market" },
          { id: "c", label: "A friend’s opinion" },
          { id: "d", label: "Bias, entry, invalidation, and review notes" },
        ],
      },
      {
        id: "tp-5",
        prompt: "What is the best way to improve a trade plan over time?",
        explanation:
          "Reviewing repeated outcomes and note quality helps refine the plan.",
        answerId: "c",
        options: [
          { id: "a", label: "Making the plan longer every day" },
          { id: "b", label: "Trading more markets at random" },
          { id: "c", label: "Reviewing results and adjusting weak rules" },
          { id: "d", label: "Removing stop rules when the market is fast" },
        ],
      },
    ],
  },
];

export function getQuizBySlug(slug: string) {
  return quizCatalog.find((quiz) => quiz.slug === slug) ?? null;
}
