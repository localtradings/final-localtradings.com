import type { Metadata } from "next";
import { Inter, Manrope } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";

import { env } from "@/lib/env";

import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const manrope = Manrope({
  variable: "--font-manrope",
  subsets: ["latin"],
});

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
    "Learn trading before risking money with structured lessons, quizzes, and backtesting practice.",
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
      className={`${inter.variable} ${manrope.variable} h-full antialiased`}
    >
      <body className="min-h-full bg-background text-foreground font-sans">
        {children}
        {shouldRenderAnalytics ? <Analytics /> : null}
      </body>
    </html>
  );
}
