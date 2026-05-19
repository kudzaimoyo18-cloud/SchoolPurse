import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      // Bump the default 1 MB cap so the school logo (≤2 MB) and student
      // photos (≤4 MB) can be uploaded via server actions. Vercel's platform
      // limit on serverless function bodies is 4.5 MB, so 4 MB stays safely
      // under that ceiling while matching the photo-actions max.
      bodySizeLimit: "4mb",
    },
  },
};

export default nextConfig;
