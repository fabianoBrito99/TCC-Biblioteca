/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: ['img.helenaramazzotte.online'],
    remotePatterns: [{ protocol: 'https', hostname: 'img.helenaramazzotte.online', pathname: '/**' }],
  },
};
export default nextConfig;
