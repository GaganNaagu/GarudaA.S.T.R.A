import path from "path";
import { loadEnvConfig } from "@next/env";
import type { NextConfig } from "next";

// Load central monorepo root .env into Next.js process
const projectRoot = path.resolve(__dirname, "../../");
loadEnvConfig(projectRoot);

const nextConfig: NextConfig = {
  /* config options here */
};

export default nextConfig;
