/** @type {import('next').NextConfig} */
const nextConfig = {
    reactStrictMode: false, // 개발 중 2번 렌더링 방지 (소켓 중복 연결 방지)
    async rewrites() {
      return [
        {
          source: "/api/:path*", // /api/로 시작하는 모든 요청을
          destination: "http://localhost:3000/api/:path*", // 3000번 포트로 토스
        },
      ];
    },
  };
  
  export default nextConfig;