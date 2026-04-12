import "server-only";

import { env } from "@/lib/env";

const LOOPBACK_HOSTNAMES = new Set(["localhost", "127.0.0.1", "[::1]", "::1"]);

function tryParseUrl(value: string) {
  try {
    return new URL(value);
  } catch {
    return null;
  }
}

export function isLoopbackHostname(hostname: string) {
  return LOOPBACK_HOSTNAMES.has(hostname);
}

export function getCanonicalAppOrigin() {
  const parsed = tryParseUrl(env.appUrl);
  return parsed?.origin ?? "http://localhost:3000";
}

export function getTrustedAppOrigin(candidate?: string | URL | null) {
  if (candidate) {
    const parsed =
      typeof candidate === "string" ? tryParseUrl(candidate) : candidate;
    if (parsed && isLoopbackHostname(parsed.hostname)) {
      return parsed.origin;
    }
  }

  return getCanonicalAppOrigin();
}

export function isTrustedBrowserOrigin(originHeader: string | null) {
  if (!originHeader) {
    return true;
  }

  const parsed = tryParseUrl(originHeader);
  if (!parsed) {
    return false;
  }

  const trustedOrigin = getCanonicalAppOrigin();
  if (parsed.origin === trustedOrigin) {
    return true;
  }

  return isLoopbackHostname(parsed.hostname);
}
