/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Ensure long server timeout for analyze route if needed
  serverExternalPackages: []
};

export default nextConfig;
