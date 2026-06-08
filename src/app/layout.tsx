import type { Metadata } from "next";

import { VercelAnalytics } from "@/components/analytics/vercel-analytics";
import { env } from "@/lib/env";

import "./globals.css";

function getMetadataBase() {
  const appUrl = env.appUrl.trim();
  if (URL.canParse(appUrl)) {
    return new URL(appUrl);
  }

  return new URL("https://www.localtradings.com");
}

export const metadata: Metadata = {
  metadataBase: getMetadataBase(),
  title: {
    default: "localtradings.com",
    template: "%s | localtradings.com",
  },
  description:
    "Battle other traders on replayed markets, practice solo in backtesting, sharpen with quizzes, and track your progress in one trading workspace.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      data-scroll-behavior="smooth"
      className="h-full antialiased"
    >
      <body className="min-h-full bg-background text-foreground font-sans">
        {children}
        <VercelAnalytics />
      </body>
    </html>
  );
}
