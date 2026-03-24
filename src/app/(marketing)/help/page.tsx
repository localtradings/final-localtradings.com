import type { Metadata } from "next";

import { MarketingHelpPage } from "@/features/marketing/help-page";

export const metadata: Metadata = {
  title: "Help",
};

export default function HelpRoute() {
  return <MarketingHelpPage />;
}
