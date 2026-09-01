import type { Metadata } from "next";

import { ComingSoon } from "@/components/ComingSoon";

export const metadata: Metadata = { title: "티어표" };

export default function TierListPage() {
  return (
    <ComingSoon
      name="티어표"
      index="05"
      description="티어표는 근거 없는 순위가 되지 않도록 표본과 산출 기준을 함께 공개할 준비가 끝난 뒤 열겠습니다."
    />
  );
}
