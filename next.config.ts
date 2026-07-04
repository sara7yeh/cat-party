import type { NextConfig } from "next";

const isGitHubPages = process.env.GITHUB_ACTIONS === "true";

const nextConfig: NextConfig = {
  // Keep local preview files separate from production builds so running a
  // deployment build cannot leave the open dev page with mismatched chunks.
  distDir: process.env.NODE_ENV === "development" ? ".next-dev" : ".next",
  output: isGitHubPages ? "export" : undefined,
  basePath: isGitHubPages ? "/cat-party" : "",
  assetPrefix: isGitHubPages ? "/cat-party/" : undefined,
  env: {
    NEXT_PUBLIC_BASE_PATH: isGitHubPages ? "/cat-party" : "",
  },
};

export default nextConfig;
