import type { Metadata } from "next";

import { ComingSoon } from "@/components/ComingSoon";

export const metadata: Metadata = { title: "통계" };

export default function StatsPage() {
  return (
    <ComingSoon
      name="통계"
      index="04"
      description="승률과 픽률 같은 실시간 게임 통계는 아직 준비 중입니다. 근거와 표본 수를 함께 공개할 수 있을 때 열겠습니다."
    />
  );
}
