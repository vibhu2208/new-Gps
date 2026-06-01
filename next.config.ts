import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactCompiler: true,
  // Keep MongoDB out of the traced serverless bundle where possible
  serverExternalPackages: ["mongodb"],
  // Prevent ~250MB routes.json + CSVs from being copied into API lambdas
  outputFileTracingExcludes: {
    "*": [
      "./public/data/routes.json",
      "./public/data/**",
      "./data/local-road/**",
      "./data/**/*.csv",
      "./scripts/**",
    ],
  },
};

export default nextConfig;
