# 깨남.GG

상대법부터 기본기까지, 롤을 깨우치다.

포지션별로 상대 챔피언을 고르고, 보편 상대법 `General`과 내 챔피언 전용 상대법 `Me`를 함께 보는
리그 오브 레전드 상대법 커뮤니티입니다.

## 기준 문서

| 문서 | 역할 |
| --- | --- |
| [`docs/PRD.md`](./docs/PRD.md) | 기능 범위와 사용자 흐름의 기준 (v0.7) |
| [`docs/DESIGN_BLUEPRINT.md`](./docs/DESIGN_BLUEPRINT.md) | 시각 기준 — GLOWING MATCHUP ZINE (v0.6) |
| [`docs/HANDOFF.md`](./docs/HANDOFF.md) | **남은 작업, 임시 구현, 알아 두어야 할 것** |
| [`AGENTS.md`](./AGENTS.md) | 제품·디자인 규칙, 명령어, 아키텍처 — 코딩 에이전트가 읽는 지침 |

## 실행

```bash
npm install
npm run dev          # http://localhost:3000
```

| 명령 | 설명 |
| --- | --- |
| `npm run dev` | 개발 서버 |
| `npm run build` | 프로덕션 빌드 |
| `npm run typecheck` | 타입 검사 |
| `npm run lint` | 린트 |
| `npm run data:sync` | Data Dragon 챔피언·스킬 동기화 |
| `npx tsx scripts/check-taxonomy.ts` | 포지션·카테고리 분류 점검 |
| `npm run shots` | 주요 화면을 모바일·태블릿·데스크톱 뷰포트로 캡처 |

> `npm run build`와 `npm run dev`는 같은 `.next` 디렉터리를 사용합니다. dev 서버를 켠 채로
> build를 돌리면 dev 서버 응답이 깨지니 한 번에 하나만 실행하세요.

## 화면

| 경로 | 화면 |
| --- | --- |
| `/?position=&category=&q=` | 포지션·카테고리 선택과 챔피언 Contact Sheet |
| `/matchup/[position]/[champion]?tab=&me=&sort=&q=&page=` | 챔피언 상대법 (Aside + 게시판·영상) |
| `/matchup/[position]/[champion]/tips/[tipId]` | Tip 상세 |
| `/matchup/[position]/[champion]/write` | Tip 작성·수정 |
| `/records` `/stats` `/tier-list` `/lessons` `/my` | `추후 개발` 안내 화면 |

화면 상태는 모두 URL 질의 문자열에 반영되어 새로고침과 뒤로 가기 후에도 복원됩니다.
포지션이 없으면 `미드`가 기본 선택됩니다.

## 구조

```
docs/                      기획 · 디자인 문서
  PRD.md                   제품 요구사항 (v0.7)
  DESIGN_BLUEPRINT.md      시각 기준 (v0.6)
  HANDOFF.md               남은 작업과 임시 구현
  design/blueprints/       승인된 목업과 생성 프롬프트
  archive/plan1.txt        최초 기획 메모 (PRD로 대체됨)

src/
  app/                     라우트 (App Router)
  components/
    selection/             포지션·카테고리 선택 화면
    matchup/               상대법 화면, 게시판, Tip 상세·작성
  data/
    generated/             Data Dragon 동기화 결과 (스크립트가 생성)
    taxonomy.ts            포지션 · 카테고리 · 챔피언 분류 (단일 원본)
    champions.ts           Data Dragon과 분류를 합치는 조인 계층
    tips.ts                시드 Tip
  lib/                     URL·모션·Tip 저장소 유틸

public/images/             PRD 5.1이 지정한 카테고리 대표 이미지
scripts/
  sync-ddragon.ts          챔피언·스킬 동기화
  check-taxonomy.ts        분류 점검
```

### 챔피언 분류 갱신

포지션·카테고리와 챔피언 명단은 [`src/data/taxonomy.ts`](./src/data/taxonomy.ts) 한 곳에서만
관리합니다. 화면 코드에 챔피언을 개별로 고정하지 않습니다. 이름은 Data Dragon `ko_KR` 표기와
정확히 일치해야 하며, 틀리면 `check-taxonomy.ts`가 잡아 줍니다.

### 패치 갱신

```bash
DDRAGON_PATCH=16.17.1 npm run data:sync
```

패치 버전과 갱신 시각은 `src/data/generated/champions.json`에 저장되고 사이트 하단에 표시됩니다.

## 현재 상태

구현 완료 (PRD 7장 P0 기준):

- FR-01~07 포지션·카테고리·챔피언 선택, 검색, 선택 애니메이션, URL 상태
- FR-08~09 정적 2D 일러스트와 로딩 실패 대체 UI, Q/W/E/R 스킬과 공략 쪽지
- FR-10~13 게시판·영상 탭, 좋아요순 정렬, Me 콤보박스, General/Me 노출 규칙
- FR-14~17 Tip 작성·수정·삭제, 좋아요·싫어요, 검색과 페이지네이션
- FR-18~20 반응형, 상태·오류 안내, 추후 개발 메뉴

아직 남은 것은 **[`docs/HANDOFF.md`](./docs/HANDOFF.md)** 에 정리했습니다. 서버·인증, 영상 탭,
입력 길이 제한이 임시 구현이며 각각 PRD 15의 미결정 사항에 걸려 있습니다.

## 데이터 출처

챔피언 이미지와 스킬 정보는 Riot Games의 Data Dragon(`16.17.1`, `ko_KR`)을 사용합니다.
깨남.GG는 Riot Games가 승인하거나 후원하지 않은 비공식 프로젝트입니다.
