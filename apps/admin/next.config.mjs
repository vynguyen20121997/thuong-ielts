/** @type {import('next').NextConfig} */
const nextConfig = {
  // Persona ảo chạy ở 127.0.0.1 để có kho cookie riêng, không đè phiên đăng
  // nhập thật ở localhost (scripts/sim-lop.ts). Chỉ ảnh hưởng chế độ dev.
  allowedDevOrigins: ["127.0.0.1"],
  transpilePackages: ["@thuong-ielts/db", "@thuong-ielts/diagnostic"],
};

export default nextConfig;
