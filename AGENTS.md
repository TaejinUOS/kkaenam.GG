# 깨남.GG 프로젝트 지침

리그 오브 레전드 상대법 위키. 포지션별로 상대 챔피언을 고르고, 보편 상대법 `공통`과 내 챔피언 전용 상대법 `Me`를 함께 보여 준다. 상대법은 매치업당 문서 하나로 모이며 여러 사람이 이어서 고친다.

## 제품 및 디자인 기준

- 기능 범위와 사용자 흐름의 기준 문서는 `docs/PRD.md`다.
- UI를 구현하거나 수정하기 전에 `docs/DESIGN_BLUEPRINT.md`를 읽는다.
- 남은 작업과 임시 구현의 목록은 `docs/HANDOFF.md`에 있다. 작업을 시작하기 전에 확인한다.
- `docs/DESIGN_BLUEPRINT.md`와 아래 생성 목업을 깨남.GG의 승인된 시각 기준으로 취급한다.
  - `docs/design/blueprints/category-selection-v1.png`
  - `docs/design/blueprints/ahri-matchup-v1.png`
- 핵심 방향은 **GLOWING MATCHUP ZINE — 야광 상대법 잡지**다. 비대칭 에디토리얼 그리드, STATIC BLOOM 팔레트, 강한 한글 타이포그래피, 포스터·스티커·형광펜 메모 문법을 일관되게 확장한다.
- 상대법 탐색은 `탑 / 정글 / 미드 / 원딜 / 서폿` 포지션과 포지션별 카테고리의 2단계 구조를 사용하며, 카테고리명과 커버 이미지는 `docs/PRD.md` 5.1의 매핑을 기준으로 한다.
- `전적`, `통계`, `티어표`는 MVP에서 메뉴와 `추후 개발` 안내 화면만 제공한다. 실제 API 호출, 가짜 통계와 임시 티어 결과를 구현하지 않는다.
- 챔피언 상대법 페이지의 Aside 비주얼은 목업 구도를 따른 정적 2D 일러스트로 통일한다. 3D 모델, WebGL, 자동 회전과 드래그 회전은 구현하지 않는다.
- 새 화면은 같은 잡지의 다음 페이지처럼 설계한다. 범용 SaaS 대시보드, 반복되는 둥근 카드, glassmorphism, 보라색·파란색 mesh gradient로 회귀하지 않는다.
- 목업은 픽셀 단위 명세나 완성 콘텐츠가 아니라 구도, 정보 위계, 질감과 인상의 기준이다. 이미지 속 임시 문구·캐릭터·플레이스홀더를 그대로 제품 데이터로 사용하지 않는다.
- 반응형 사용성, 접근성, 성능, 실제 데이터 정확성, 에셋 사용 권리가 목업 재현보다 우선한다. 필요한 조정에서도 시각적 의도를 최대한 유지하고, 방향을 바꾸는 결정은 `docs/DESIGN_BLUEPRINT.md`에 기록한다.

## 명령어

```bash
npm run dev          # 개발 서버 (localhost:3000)
npm run build        # 프로덕션 빌드 — ESLint와 타입 검사를 함께 수행
npm run typecheck    # tsc --noEmit
npm run lint         # eslint

npm run data:sync                         # Data Dragon 챔피언·스킬 재동기화
DDRAGON_PATCH=16.18.1 npm run data:sync   # 패치 지정
npx tsx scripts/check-taxonomy.ts         # 분류 점검 (이름 불일치·중복·커버 이미지 누락)
npm run shots                             # 주요 화면 캡처 (dev 서버가 떠 있어야 함)
```

**테스트 프레임워크가 없다.** 검증은 `typecheck` + `lint` + `build`와 `check-taxonomy.ts`, 그리고 실행 중인 서버에 대한 수동 확인으로 한다.

> **`dev`와 `build`를 동시에 돌리지 말 것.** 같은 `.next`를 공유해서, dev 서버를 켠 채 build를 돌리면 dev 서버가 빈 페이지나 500을 반환하기 시작한다. 코드 문제가 아니다. `rm -rf .next && npm run dev`로 복구한다. 이 증상으로 디버깅에 시간을 쓰지 말 것.

## 아키텍처

### 데이터: 손으로 관리하는 분류 + 자동 동기화 카탈로그

두 개의 출처가 `src/data/champions.ts`에서 합쳐진다.

| 파일 | 성격 |
| --- | --- |
| `src/data/taxonomy.ts` | **손으로 관리.** 포지션 5종, 카테고리 12종, 챔피언 명단(한글 이름) |
| `src/data/generated/champions.json` | **스크립트가 생성.** Data Dragon 173명 + Q/W/E/R 스킬 |
| `src/data/champions.ts` | 둘을 조인하고 이미지 URL·초점 위치·운영 상태를 덧붙인다 |

`champions.ts`는 **모듈 로드 시점에 분류의 챔피언 이름을 카탈로그와 대조하고, 하나라도 일치하지 않으면 throw한다.** 이름 오타가 조용히 빈 목록으로 이어지는 것을 막기 위해서다. 앱이 뜨지 않으면 먼저 이 오류를 의심할 것. `리 신`, `트위스티드 페이트`, `아우렐리온 솔`, `문도 박사`처럼 띄어쓰기가 있는 이름이 흔한 원인이다.

화면 코드에 챔피언을 개별로 고정하지 않는다. 명단 변경은 `taxonomy.ts`에서만 한다. 한 챔피언은 여러 포지션에 속할 수 있지만 **같은 포지션 안에서는 카테고리 하나뿐**이다.

> **이 구조는 곧 바뀐다.** PRD v0.8이 관리자 챔피언 분류(5.6, FR-34~43)를 범위에 되돌렸다.
> 분류는 D1로 옮겨가고 `taxonomy.ts`는 초기 이관 자료로만 남으며, 모듈 로드 시점 검증은
> 쓰기 시점 검증으로 옮겨간다. 배경과 남은 작업은 `docs/HANDOFF.md` 4장에 있다.
> 분류 관련 구조를 크게 손대기 전에 그 문서를 먼저 읽을 것.

### 라우트 유효성이 분류에서 파생된다

`/matchup/[position]/[champion]`은 `getClassificationFor()`로 조합을 검증하고, 분류에 없으면 `notFound()`를 호출한다. `/matchup/mid/leesin`이 404인 것은 버그가 아니다 — 리 신은 미드 분류에 없다.

### URL이 화면 상태의 단일 출처

포지션·카테고리·탭·Me 선택이 전부 질의 문자열에 있다. `?me=`는 서버가 어느 섹션을 읽을지도 정하므로, 바꾸면 서버 렌더가 다시 돈다. 컴포넌트는 `useSearchParams`로 읽고 `router.replace(..., { scroll: false })`로 쓴다. 로컬 `useState`는 입력 즉시 반영 + 디바운스된 URL 반영이 필요한 검색창에만 쓴다.

`useSearchParams`를 쓰는 화면은 **`<Suspense>` 경계가 필요하다.** 각 `page.tsx`가 이미 감싸고 있으니, 새 클라이언트 화면을 추가할 때도 같은 형태를 유지한다.

`src/data/selection.ts`는 분류 전체(약 23KB, 배정 185건)를 직렬화해 첫 응답에 실어 보낸다. 포지션·카테고리 전환마다 서버를 왕복하면 블루프린트가 규정한 220ms 전환을 지킬 수 없기 때문이다.

분류를 D1로 옮길 때 **이 요구가 가장 먼저 깨진다.** 매 요청 조회로 바꾸면 첫 응답이 느려지므로, 이전 전후로 전환 시간을 실측하고 필요하면 조회 결과를 캐시한다 (`docs/HANDOFF.md` 4.3).

### 공통과 Me — 제품의 핵심 불변식

이 규칙을 깨뜨리는 변경은 하지 않는다.

- Me 미선택 → `공통` 섹션만 보인다. Me 섹션은 DOM에 렌더링되지 않는다.
- Me 선택 → **그 챔피언의 Me 섹션만** `공통`과 함께 추가로 드러난다.
- Me 섹션이 비어 있으면 빈 영역을 예약하지 않는다.
- 구분은 색만으로 하지 않는다. 배경 + 레이블 두 가지 이상의 단서를 쓴다.

어느 섹션을 읽을지는 서버가 `?me=`를 보고 정한다. `src/lib/wikiStore.ts`의 `getWikiView()` 하나가 그 판정을 갖는다.

### 위키 저장소 — D1

상대법은 Cloudflare D1에 있다. 스키마는 `migrations/`, 설계는 `docs/WIKI_MODEL.md`.

- `wiki_docs` — 매치업당 하나. `(position_slug, champion_slug)`가 유일하다
- `wiki_sections` — 내 챔피언별 섹션. 화면이 늘 "공통 + 섹션 하나"만 필요로 해서 문서 안 JSON이 아니라 별도 표다
- `wiki_edits` — 편집 제안이자 문서의 역사. 승인된 행이 곧 리비전이다

`src/lib/wikiStore.ts`가 유일한 D1 접근 지점이고 `server-only`를 import한다. 클라이언트 번들에 섞이면 빌드가 실패한다.

**편집 판정은 반드시 서버에서 한다.** 빈 섹션은 즉시 반영되고 이미 쓰인 섹션은 검토를 거치는데, 이 판정을 클라이언트가 주장하게 두면 검토를 우회할 수 있다. 섹션을 비우는 편집도 언제나 검토 대기다. `src/data/wiki.ts`의 `isEmptyBody()` 주석에 이유가 적혀 있다.

### 한국어 조사

챔피언·포지션 이름이 데이터에서 오므로 조사를 문구에 고정하지 않는다. `탈론로`, `탈론를`이 나온다. `src/lib/josa.ts`의 `eulReul`, `eunNeun`, `ro`를 쓴다. `ro`는 ㄹ 받침이 예외라 `정글로`, `탈론으로`가 된다.

### 스타일

Tailwind를 쓰지 않는다. `src/app/globals.css`의 STATIC BLOOM 토큰과 공용 문법(`.sticker`, `.btn`, `.display`, `.mono`, `.section-index`, `--art-punch`) + 컴포넌트별 CSS Module 조합이다. 새 컴포넌트도 이 구조를 따르고, 색·간격을 임의 값으로 넣지 않는다.

**전역 클래스와 모듈 클래스를 한 요소에 함께 쓸 때는 특이도를 확인한다.** 둘 다 `(0,1,0)`이라 소스 순서로 전역이 이기는 일이 있다. 모바일에서 `SOON` 스티커가 숨겨지지 않던 것이 이 경우였고, 부모 선택자를 덧붙여(`.navLink .soon`) 해결했다.

### 이미지 출처

- 카테고리 대표 이미지 12장: `public/images/` — 경로는 `docs/PRD.md` 5.1이 지정한 값이라 바꾸지 않는다.
- 챔피언 아이콘·일러스트·스킬 아이콘: Data Dragon CDN (런타임 외부 요청).
- Aside 일러스트는 세로 구도의 `loading` 아트를 쓴다. 얼굴이 잘리면 `src/data/champions.ts`의 `FOCUS_OVERRIDES`에 챔피언을 추가한다.
