import path from "node:path";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactCompiler: true,
  pageExtensions: ["ts", "tsx", "md", "mdx"],
  turbopack: {
    root: path.resolve(__dirname),
  },
};

export default nextConfig;
