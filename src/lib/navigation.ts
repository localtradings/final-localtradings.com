export const publicNav = [
  { href: "/", label: "Home" },
  { href: "/learn", label: "Learn" },
  { href: "/backtesting", label: "Backtesting" },
  { href: "/about", label: "About" },
] as const;

export const publicFooterLinks = [
  { href: "/help", label: "Help" },
  { href: "/sign-in", label: "Sign In" },
  { href: "/sign-up", label: "Sign Up" },
] as const;

export const productNav = [
  { href: "/app", label: "Home", icon: "dashboard" },
  { href: "/app/learn", label: "Learn", icon: "school" },
  { href: "/app/quiz", label: "Quiz", icon: "quiz" },
  { href: "/app/backtesting", label: "Backtesting", icon: "query_stats" },
  { href: "/app/battle", label: "Battle", icon: "battle" },
  { href: "/app/profile", label: "Profile", icon: "person" },
  { href: "/app/help", label: "Help", icon: "help" },
] as const;

export const productPrimaryNav = productNav.filter((item) =>
  ["/app", "/app/learn", "/app/quiz", "/app/backtesting", "/app/battle"].includes(item.href),
);

export const productAccountNav = productNav.filter((item) =>
  ["/app/profile", "/app/help"].includes(item.href),
);
