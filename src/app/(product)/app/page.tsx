import type { Metadata } from "next";

import { DashboardHome } from "@/features/learn/dashboard-home";

export const metadata: Metadata = {
  title: "Dashboard",
};

export default function AppHomeRoute() {
  return <DashboardHome />;
}
