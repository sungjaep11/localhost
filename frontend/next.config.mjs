/** @type {import('next').NextConfig} */
const nextConfig = {
    output: 'standalone',
    reactStrictMode: false, // 개발 중 2번 렌더링 방지 (소켓 중복 연결 방지)
  };
  
  export default nextConfig;