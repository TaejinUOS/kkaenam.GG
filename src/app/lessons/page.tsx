import type { Metadata } from "next";

import { ComingSoon } from "@/components/ComingSoon";

export const metadata: Metadata = { title: "강의" };

export default function LessonsPage() {
  return (
    <ComingSoon
      name="강의"
      index="06"
      description="라인 관리, 라인전, 한타 같은 주제별 강의를 준비하고 있습니다. '롤깨남' 강의를 시작으로 다른 선생님의 강의까지 넓힐 예정입니다."
    />
  );
}
