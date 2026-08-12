/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ["@thuong-ielts/db"],
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "**" },
    ],
  },
};

export default nextConfig;
