import type { Metadata } from "next";

import { MarketingLearnPage } from "@/features/marketing/learn-page";

export const metadata: Metadata = {
  title: "Learn",
};

export default function LearnRoute() {
  return <MarketingLearnPage />;
}
