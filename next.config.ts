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
    const fromWww = [{ type: "host" as const, value: `www.${SITE_HOST}` }];
    return [
      /*
       * 루트를 따로 두는 이유: `:path*`가 0개 세그먼트에 매칭되면 치환이 일어나지 않고
       * 목적지에 `:path*`가 문자 그대로 남는다. www.kkaenam.com/ 하나만 깨지는데
       * 하필 가장 많이 입력되는 주소다. `:path+`로 한 개 이상만 받고 루트는 분리한다.
       */
      {
        source: "/",
        has: fromWww,
        destination: `https://${SITE_HOST}/`,
        permanent: true,
      },
      {
        source: "/:path+",
        has: fromWww,
        destination: `https://${SITE_HOST}/:path+`,
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
