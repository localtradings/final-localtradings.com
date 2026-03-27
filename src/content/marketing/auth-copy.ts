export const authShellCopy = {
  "sign-in": {
    eyebrow: "Secure account access",
    title: "Return to your learning workspace.",
    description:
      "Pick up where you left off with your lessons, quiz results, and backtesting review flow in one focused account area.",
    panelTitle: "Welcome back",
    panelDescription:
      "Use your email and password to access the signed-in routes. If your project requires email confirmation, verify first and then sign in.",
    highlights: [
      "Resume lesson progress",
      "Review quiz history",
      "Return to backtesting sessions",
    ],
    supportCards: [
      {
        label: "Protected routes",
        value: "/app/*",
      },
      {
        label: "Account model",
        value: "Email + password",
      },
    ],
    slides: [
      "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1518186233392-c232efbf2373?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1516321497487-e288fb19713f?auto=format&fit=crop&w=1200&q=80",
    ],
  },
  "sign-up": {
    eyebrow: "Start your account",
    title: "Move from preview to practice.",
    description:
      "Create an account to unlock the signed-in learning dashboard, interactive quiz routes, and the focused v1 backtesting workspace.",
    panelTitle: "Create your account",
    panelDescription:
      "The launch scope stays simple and practical: structured learning, quiz tracking, and practice tools without hype or fake premium gating.",
    highlights: [
      "Unlock signed-in lessons",
      "Save quiz attempts",
      "Use the practice workspace",
    ],
    supportCards: [
      {
        label: "Launch scope",
        value: "Learn, Quiz, Backtesting",
      },
      {
        label: "Set up time",
        value: "A few fields only",
      },
    ],
    slides: [
      "https://images.unsplash.com/photo-1516321165247-4aa89a48be28?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1515378791036-0648a3ef77b2?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&w=1200&q=80",
    ],
  },
} as const;

export type AuthShellMode = keyof typeof authShellCopy;
