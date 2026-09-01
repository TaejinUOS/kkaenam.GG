import type { Metadata } from "next";

import { ComingSoon } from "@/components/ComingSoon";

export const metadata: Metadata = { title: "마이페이지" };

export default function MyPage() {
  return (
    <ComingSoon
      name="마이페이지"
      index="07"
      description="회원가입 방식이 정해지면 프로필과 내가 쓴 Tip 관리를 여기에서 제공합니다. 지금은 브라우저에 저장되는 로컬 데모 계정으로 작성 흐름만 확인할 수 있습니다."
    />
  );
}
