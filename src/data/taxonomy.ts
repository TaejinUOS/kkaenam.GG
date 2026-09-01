/**
 * 포지션 · 카테고리 · 포지션별 챔피언 분류.
 *
 * PRD 5.1의 표가 카테고리와 대표 이미지의 기준이다. 미드 세 카테고리의 챔피언 명단은
 * `docs/archive/plan1.txt`를 그대로 옮겼고, 나머지 포지션은 같은 문법으로 확장한 초기 운영 분류다.
 * PRD 3.1-6 "운영자가 배포 없이 분류를 갱신"하는 관리 화면이 붙기 전까지는 이 파일이
 * 단일 원본이며, 화면 코드에 챔피언을 개별로 고정하지 않는다 (PRD 5.1 마지막 항목).
 */

import type { Category, Classification, Position } from "./types";

export const DEFAULT_POSITION_SLUG = "mid";

export const positions: Position[] = [
  { id: "pos-top", slug: "top", name: "탑", code: "TOP", order: 1, active: true },
  { id: "pos-jungle", slug: "jungle", name: "정글", code: "JUNGLE", order: 2, active: true },
  { id: "pos-mid", slug: "mid", name: "미드", code: "MID", order: 3, active: true },
  { id: "pos-adc", slug: "adc", name: "원딜", code: "ADC", order: 4, active: true },
  { id: "pos-support", slug: "support", name: "서폿", code: "SUPPORT", order: 5, active: true },
];

/** PRD 5.1 표의 카테고리 · 대표 이미지 매핑. 경로를 임의로 바꾸지 않는다. */
export const categories: Category[] = [
  {
    id: "cat-top-tank",
    slug: "tank",
    positionSlug: "top",
    name: "탱커",
    coverImage: "/images/Moondo.jpg",
    coverAlt: "탱커형 탑 카테고리 대표 이미지",
    role: "탱커형 탑 챔피언",
    order: 1,
    active: true,
  },
  {
    id: "cat-top-bruiser",
    slug: "bruiser",
    positionSlug: "top",
    name: "딜탱",
    coverImage: "/images/Aatrox.jpg",
    coverAlt: "전사·브루저형 탑 카테고리 대표 이미지",
    role: "전사·브루저형 탑 챔피언",
    order: 2,
    active: true,
  },
  {
    id: "cat-top-damage",
    slug: "damage",
    positionSlug: "top",
    name: "딜러",
    coverImage: "/images/Teemo.jpg",
    coverAlt: "공격형 탑 카테고리 대표 이미지",
    role: "공격형 탑 챔피언",
    order: 3,
    active: true,
  },
  {
    id: "cat-jungle-ad",
    slug: "ad",
    positionSlug: "jungle",
    name: "AD",
    coverImage: "/images/Leesin.jpg",
    coverAlt: "물리 피해 중심 정글 카테고리 대표 이미지",
    role: "물리 피해 중심 정글 챔피언",
    order: 1,
    active: true,
  },
  {
    id: "cat-jungle-ap",
    slug: "ap",
    positionSlug: "jungle",
    name: "AP",
    coverImage: "/images/lillia.jpg",
    coverAlt: "마법 피해 중심 정글 카테고리 대표 이미지",
    role: "마법 피해 중심 정글 챔피언",
    order: 2,
    active: true,
  },
  {
    id: "cat-mid-assassin",
    slug: "assassin",
    positionSlug: "mid",
    name: "암살자",
    coverImage: "/images/Zed.jpg",
    coverAlt: "암살자형 미드 카테고리 대표 이미지",
    role: "암살자형 미드 챔피언",
    order: 1,
    active: true,
  },
  {
    id: "cat-mid-mage",
    slug: "mage",
    positionSlug: "mid",
    name: "메이지",
    coverImage: "/images/Zoe.jpg",
    coverAlt: "마법사형 미드 카테고리 대표 이미지",
    role: "마법사형 미드 챔피언",
    order: 2,
    active: true,
  },
  {
    id: "cat-mid-bruiser-adc",
    slug: "bruiser-adc",
    positionSlug: "mid",
    name: "브루저/원딜",
    coverImage: "/images/yone.jpg",
    coverAlt: "전사형 및 원거리 딜러형 미드 카테고리 대표 이미지",
    role: "전사형 · 원거리 딜러형 미드 챔피언",
    order: 3,
    active: true,
  },
  {
    id: "cat-adc-adc",
    slug: "adc",
    positionSlug: "adc",
    name: "원딜",
    coverImage: "/images/Caitlyn.jpg",
    coverAlt: "원딜 카테고리 대표 이미지",
    role: "원딜 챔피언 전체",
    order: 1,
    active: true,
  },
  {
    id: "cat-support-mom",
    slug: "mom",
    positionSlug: "support",
    name: "Mom",
    coverImage: "/images/lulu.jpg",
    coverAlt: "Mom 유형 서폿 카테고리 대표 이미지",
    role: "지켜 주고 살려 주는 서폿",
    order: 1,
    active: true,
  },
  {
    id: "cat-support-dad",
    slug: "dad",
    positionSlug: "support",
    name: "Dad",
    coverImage: "/images/Blitz.jpg",
    coverAlt: "Dad 유형 서폿 카테고리 대표 이미지",
    role: "먼저 들어가 열어 주는 서폿",
    order: 2,
    active: true,
  },
  {
    id: "cat-support-wtf",
    slug: "wtf",
    positionSlug: "support",
    name: "Wtf?!",
    coverImage: "/images/brand.jpeg",
    coverAlt: "Wtf?! 유형 서폿 카테고리 대표 이미지",
    role: "상식을 벗어나는 서폿",
    order: 3,
    active: true,
  },
];

/**
 * 포지션·카테고리별 챔피언 명단. 이름은 Data Dragon `ko_KR` 표기와 정확히 일치해야 하며,
 * 일치하지 않으면 `champions.ts`의 조인 단계에서 오류로 잡힌다.
 */
const roster: Record<string, Record<string, string[]>> = {
  top: {
    tank: [
      "오른", "말파이트", "쉔", "크산테", "사이온", "초가스",
      "뽀삐", "마오카이", "나서스", "자크", "탐 켄치", "문도 박사",
    ],
    bruiser: [
      "아트록스", "다리우스", "가렌", "레넥톤", "세트", "리븐",
      "이렐리아", "피오라", "잭스", "카밀", "갱플랭크", "우르곳",
      "요릭", "모데카이저", "클레드", "그웬", "볼리베어", "트린다미어",
      "암베사", "나르", "올라프", "일라오이",
    ],
    damage: [
      "티모", "퀸", "케넨", "블라디미르", "럼블", "케일",
      "아크샨", "하이머딩거", "신지드", "리산드라",
    ],
  },
  jungle: {
    ad: [
      "리 신", "비에고", "그레이브즈", "킨드레드", "렝가", "카직스",
      "헤카림", "자르반 4세", "바이", "신 짜오", "마스터 이", "트런들",
      "니달리", "벨베스", "브라이어", "렉사이", "샤코", "올라프",
      "녹턴", "우디르", "워윅", "세주아니",
    ],
    ap: [
      "릴리아", "엘리스", "이블린", "피들스틱", "카서스", "아무무",
      "자크", "그라가스", "니코", "아이번", "마오카이", "럼블",
      "다이애나", "에코", "스카너", "자헨",
    ],
  },
  // 미드 세 카테고리는 docs/archive/plan1.txt의 명단을 그대로 사용한다.
  mid: {
    assassin: [
      "카타리나", "제드", "아칼리", "피즈", "르블랑", "나피리", "탈론", "키아나",
    ],
    mage: [
      "아리", "말자하", "빅토르", "멜", "신드라", "라이즈", "제라스",
      "트위스티드 페이트", "럭스", "오로라", "오리아나", "애니비아", "조이",
      "베이가", "벡스", "카시오페아", "탈리야", "애니", "아우렐리온 솔",
      "흐웨이", "리산드라", "아지르",
    ],
    "bruiser-adc": [
      "사일러스", "요네", "야스오", "갈리오", "에코", "다이애나", "이렐리아",
      "사이온", "코르키", "제이스", "스몰더", "트리스타나", "아크샨", "로크",
    ],
  },
  adc: {
    adc: [
      "케이틀린", "징크스", "이즈리얼", "진", "자야", "미스 포츈",
      "애쉬", "바루스", "카이사", "아펠리오스", "시비르", "트리스타나",
      "루시안", "드레이븐", "코그모", "트위치", "베인", "사미라",
      "제리", "칼리스타", "닐라", "스몰더", "세나", "유나라", "코르키",
    ],
  },
  support: {
    mom: [
      "룰루", "소라카", "나미", "잔나", "유미", "밀리오",
      "세라핀", "카르마", "소나", "타릭",
    ],
    dad: [
      "블리츠크랭크", "쓰레쉬", "레오나", "알리스타", "노틸러스", "라칸",
      "브라움", "렐", "파이크", "탐 켄치", "뽀삐", "레나타 글라스크",
    ],
    wtf: [
      "브랜드", "자이라", "벨코즈", "럭스", "모르가나", "세나",
      "스웨인", "판테온", "애니", "질리언", "바드", "니코",
    ],
  },
};

export const classifications: Classification[] = Object.entries(roster).flatMap(
  ([positionSlug, byCategory]) =>
    Object.entries(byCategory).flatMap(([categorySlug, names]) =>
      names.map((championName, index) => ({
        positionSlug,
        categorySlug,
        championName,
        visible: true,
        order: index + 1,
      })),
    ),
);
