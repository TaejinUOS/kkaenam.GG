import styles from "./ZineFilters.module.css";

/**
 * 종이 스티커의 지글거리는 가장자리를 만드는 SVG 필터 모음.
 *
 * 블루프린트 5장 "경계선 일부는 스티커가 뜯긴 것처럼" 을 구현한다. `feTurbulence`로 만든
 * 노이즈를 `feDisplacementMap`으로 가장자리에 밀어 넣어, 자로 그은 듯한 직사각형이 아니라
 * 손으로 뜯어 붙인 종이처럼 보이게 한다.
 *
 * 글자에 직접 걸면 한글 획이 뭉개지므로 배경 레이어(`::before`)에만 적용한다.
 * 같은 화면에 여러 스티커가 놓이므로 seed를 다르게 둔 변형을 두어 복제 티가 나지 않게 한다.
 *
 * 문서 전체에서 한 번만 렌더링한다 (`layout.tsx`).
 */

/** seed만 다른 변형. 라벨 순서대로 돌려 쓴다. */
const VARIANTS = [
  { id: "zine-torn-1", seed: 7 },
  { id: "zine-torn-2", seed: 24 },
  { id: "zine-torn-3", seed: 61 },
];

export function ZineFilters() {
  return (
    <svg className={styles.defs} aria-hidden="true" focusable="false">
      <defs>
        {VARIANTS.map(({ id, seed }) => (
          <filter
            key={id}
            id={id}
            /* 밀려난 가장자리가 잘리지 않도록 필터 영역을 요소보다 넓게 잡는다. */
            x="-12%"
            y="-25%"
            width="124%"
            height="150%"
            colorInterpolationFilters="sRGB"
          >
            {/*
              가로로는 완만하고 세로로는 잘게 흔들리는 노이즈. 위아래 가장자리가
              찢어진 종이처럼, 좌우는 가위로 자른 것처럼 보인다.
            */}
            <feTurbulence
              type="fractalNoise"
              baseFrequency="0.028 0.07"
              numOctaves={3}
              seed={seed}
              result="noise"
            />
            <feDisplacementMap
              in="SourceGraphic"
              in2="noise"
              scale={6}
              xChannelSelector="R"
              yChannelSelector="G"
            />
          </filter>
        ))}
      </defs>
    </svg>
  );
}
