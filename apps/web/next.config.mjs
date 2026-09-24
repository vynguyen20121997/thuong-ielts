/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ["@thuong-ielts/db"],
  async rewrites() {
    return [
      { source: "/phong-luyen-tap", destination: "/kiem-tra-kien-thuc" },
      { source: "/phong-luyen-tap/:path*", destination: "/kiem-tra-kien-thuc/:path*" },
    ];
  },
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "**" },
    ],
  },
};

export default nextConfig;
