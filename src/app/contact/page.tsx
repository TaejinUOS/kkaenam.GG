import type { Metadata } from "next";

import { LegalPage } from "@/components/legal/LegalPage";

export const metadata: Metadata = { title: "문의" };

export default function ContactPage() {
  return (
    <LegalPage index="문의" title="문의 및 고객지원">
      <p>
        깨남.COM은 개인 개발자 한 명이 운영합니다. 서비스 이용 중 궁금한 점, 오류 제보, 신고,
        계정·개인정보 관련 요청은 아래 이메일로 보내 주세요.
      </p>

      <h2>이메일</h2>
      <p>
        <a href="mailto:taejin1472@gmail.com">taejin1472@gmail.com</a>
      </p>

      <h2>답변 시간</h2>
      <p>
        영업일 기준 며칠 내로 답변드리려 하지만, 개인이 운영하는 서비스라 즉시 응대가 어려울 수
        있습니다.
      </p>

      <h2>계정·개인정보 관련 요청</h2>
      <p>
        회원 탈퇴, 소셜 계정 연결 해제, 보유 중인 개인정보 열람·정정·삭제 요청도 이 이메일로
        받습니다. 로그인 기능이 열리기 전까지는 이메일로 요청을 접수해 처리하며, 자세한 처리
        방침은 <a href="/privacy">개인정보처리방침</a>에 있습니다.
      </p>
    </LegalPage>
  );
}
