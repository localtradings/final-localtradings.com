import type { Metadata } from "next";
import { Analytics } from "@vercel/analytics/next";

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

const shouldRenderAnalytics =
  process.env.VERCEL === "1" ||
  process.env.VERCEL === "true" ||
  Boolean(process.env.VERCEL_ENV);

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
        {shouldRenderAnalytics ? <Analytics /> : null}
      </body>
    </html>
  );
}
