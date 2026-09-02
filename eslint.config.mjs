import { FlatCompat } from "@eslint/eslintrc";

const compat = new FlatCompat({ baseDirectory: import.meta.dirname });

const config = [
  ...compat.extends("next/core-web-vitals", "next/typescript"),
  {
    ignores: [
      ".next/**",
      "node_modules/**",
      "out/**",
      // Next.js가 생성하는 파일들. 우리가 고칠 수 있는 대상이 아니다.
      "next-env.d.ts",
      "src/data/generated/**",
      // Cloudflare 배포 산출물. OpenNext와 wrangler가 만드는 번들이라 마찬가지다.
      ".open-next/**",
      ".wrangler/**",
    ],
  },
  {
    rules: {
      /*
       * 챔피언 아이콘·일러스트·스킬 아이콘은 Data Dragon CDN에서 오고 크기가 이미 정해져 있어
       * next/image의 최적화 이점이 거의 없다. width/height와 loading을 직접 지정한 <img>를 쓴다.
       */
      "@next/next/no-img-element": "off",
    },
  },
];

export default config;
