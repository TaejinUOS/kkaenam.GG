import type { Metadata } from "next";

import { ComingSoon } from "@/components/ComingSoon";

export const metadata: Metadata = { title: "전적" };

export default function RecordsPage() {
  return (
    <ComingSoon
      name="전적"
      index="03"
      description="소환사 전적 검색과 경기 분석은 아직 준비 중입니다. 지금은 상대법 게시판에서 포지션별 챔피언 공략을 확인해 주세요."
    />
  );
}
