"use client";

import { Analytics } from "@vercel/analytics/next";
import { useSyncExternalStore } from "react";

const analyticsHosts = new Set([
  "localtradings.com",
  "www.localtradings.com",
]);

function isAnalyticsHost(hostname: string) {
  return analyticsHosts.has(hostname) || hostname.endsWith(".vercel.app");
}

export function VercelAnalytics() {
  const enabled = useSyncExternalStore(
    () => () => {},
    () => isAnalyticsHost(window.location.hostname),
    () => false,
  );

  return enabled ? <Analytics /> : null;
}
