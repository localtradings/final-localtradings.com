import type { Metadata } from "next";

import { MarketingAboutPage } from "@/features/marketing/about-page";

export const metadata: Metadata = {
  title: "About",
};

export default function AboutRoute() {
  return <MarketingAboutPage />;
}
