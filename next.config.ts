import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  serverExternalPackages: ["mongoose", "bullmq", "ioredis", "bcryptjs"],
};

export default nextConfig;
