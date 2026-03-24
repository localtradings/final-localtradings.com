import type { Metadata } from "next";

import { LearnHub } from "@/features/learn/learn-hub";

export const metadata: Metadata = {
  title: "Learn Hub",
};

export default function LearnHubRoute() {
  return <LearnHub />;
}
