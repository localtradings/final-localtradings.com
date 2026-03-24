import type { Metadata } from "next";

import { MarketingHomePage } from "@/features/marketing/home-page";

export const metadata: Metadata = {
  title: "Home",
};

export default function HomeRoute() {
  return <MarketingHomePage />;
}
