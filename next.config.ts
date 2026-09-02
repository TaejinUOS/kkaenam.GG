import type { NextConfig } from "next";

const SITE_HOST = "kkaenam.com";

const nextConfig: NextConfig = {
  /**
   * www를 apex로 넘긴다. 주소가 둘로 갈리면 검색 엔진이 같은 문서를 둘로 세고,
   * 공유된 링크도 제각각이 된다. 정식 주소는 www 없는 쪽 하나다.
   *
   * 미들웨어 파일 대신 Next의 라우팅 계층에서 처리해 매 요청에 부담을 더하지 않는다.
   */
  async redirects() {
    return [
      {
        source: "/:path*",
        has: [{ type: "host", value: `www.${SITE_HOST}` }],
        destination: `https://${SITE_HOST}/:path*`,
        permanent: true,
      },
    ];
  },
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
