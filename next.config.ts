import path from "node:path";
import type { NextConfig } from "next";

function getAppOrigin() {
  const configuredOrigin = process.env.NEXT_PUBLIC_APP_URL?.trim();
  if (configuredOrigin) {
    return configuredOrigin;
  }

  if (process.env.VERCEL_ENV === "production") {
    return "https://www.localtradings.com";
  }

  return "http://localhost:3000";
}

function getOrigin(value?: string) {
  if (!value) {
    return null;
  }

  try {
    return new URL(value).origin;
  } catch {
    return null;
  }
}

function getSocketOrigin(value?: string) {
  if (!value) {
    return null;
  }

  try {
    const url = new URL(value);
    url.protocol = url.protocol === "https:" ? "wss:" : "ws:";
    return url.origin;
  } catch {
    return null;
  }
}

const appOrigin = getAppOrigin();
const isProduction =
  process.env.NODE_ENV === "production" &&
  process.env.VERCEL === "1" &&
  process.env.VERCEL_ENV === "production";
const supabaseOrigin = getOrigin(process.env.NEXT_PUBLIC_SUPABASE_URL);
const supabaseSocketOrigin = getSocketOrigin(process.env.NEXT_PUBLIC_SUPABASE_URL);
const battleWorkerOrigin = getOrigin(process.env.CLOUDFLARE_BATTLE_WORKER_URL);
const battleWorkerSocketOrigin = getSocketOrigin(process.env.CLOUDFLARE_BATTLE_WORKER_URL);

const connectSources = [
  "'self'",
  supabaseOrigin,
  supabaseSocketOrigin,
  battleWorkerOrigin,
  battleWorkerSocketOrigin,
  "https://vitals.vercel-insights.com",
]
  .filter((value, index, values): value is string => Boolean(value) && values.indexOf(value) === index)
  .join(" ");

const contentSecurityPolicy = [
  "default-src 'self'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
  "frame-src 'none'",
  "object-src 'none'",
  `script-src 'self' 'unsafe-inline'${isProduction ? "" : " 'unsafe-eval'"}`,
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  "font-src 'self' data: https://fonts.gstatic.com",
  "img-src 'self' data: blob: https://lh3.googleusercontent.com https://images.unsplash.com",
  `connect-src ${connectSources}`,
  "worker-src 'self' blob:",
  "manifest-src 'self'",
  "media-src 'self'",
  "upgrade-insecure-requests",
].join("; ");

const nextConfig: NextConfig = {
  reactCompiler: true,
  allowedDevOrigins: ["127.0.0.1", "localhost"],
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
          {
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin",
          },
          {
            key: "X-Frame-Options",
            value: "DENY",
          },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=(), browsing-topics=()",
          },
          {
            key: "Cross-Origin-Resource-Policy",
            value: "same-site",
          },
          {
            key: "Content-Security-Policy",
            value: contentSecurityPolicy,
          },
          {
            key: "Access-Control-Allow-Origin",
            value: appOrigin,
          },
        ],
      },
    ];
  },
  pageExtensions: ["ts", "tsx", "md", "mdx"],
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "lh3.googleusercontent.com",
      },
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
    ],
  },
  turbopack: {
    root: path.resolve(__dirname),
  },
};

export default nextConfig;
