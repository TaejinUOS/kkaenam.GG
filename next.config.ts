import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "ddragon.leagueoflegends.com",
        pathname: "/cdn/**",
      },
    ],
  },
};

export default nextConfig;

/**
 * `next dev`에서도 Cloudflare 바인딩을 쓸 수 있게 하는 개발용 훅 (@opennextjs/cloudflare).
 * 아직 바인딩이 없어 하는 일은 없지만, 나중에 KV·D1을 붙였을 때 로컬과 배포가 어긋나지 않는다.
 */
import { initOpenNextCloudflareForDev } from "@opennextjs/cloudflare";

void initOpenNextCloudflareForDev();
