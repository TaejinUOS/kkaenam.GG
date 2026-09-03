import type { Metadata } from "next";

import { LegalPage } from "@/components/legal/LegalPage";

export const metadata: Metadata = { title: "소개" };

export default function AboutPage() {
  return (
    <LegalPage index="소개" title="깨남.COM은 무엇인가요">
      <p>
        깨남.COM은 리그 오브 레전드 상대법 커뮤니티입니다. 포지션을 고르고 상대할 챔피언을
        선택하면, 누구에게나 통하는 <strong>공통 상대법</strong>과 내가 하는 챔피언에 맞춘{" "}
        <strong>Me 상대법</strong>을 함께 볼 수 있습니다.
      </p>

      <h2>지금 할 수 있는 것</h2>
      <p>
        포지션·카테고리별로 챔피언을 찾아보고, 각 챔피언의 상대법 문서를 열람할 수 있습니다.
        문서는 이용자들이 함께 채워 가는 위키 형태이며, 현재는 열람만 가능합니다.
      </p>

      <h2>준비 중인 것</h2>
      <p>
        구글·카카오 소셜 로그인을 통한 회원가입과, 로그인한 이용자가 직접 상대법을 편집·제안하는
        기능을 준비하고 있습니다. 로그인이 열리면 이 페이지와 아래 문의처를 통해 계정 관리(탈퇴,
        소셜 계정 연결 해제 포함) 방법도 함께 안내합니다.
      </p>

      <h2>운영자</h2>
      <p>
        깨남.COM은 회사가 아닌 개인 개발자가 만들고 운영하는 비공식 프로젝트입니다. 리그 오브
        레전드 및 관련 자산은 Riot Games, Inc.의 소유이며, 깨남.COM은 Riot Games가 승인하거나
        후원하지 않습니다.
      </p>

      <h2>문의</h2>
      <p>
        서비스 관련 문의나 신고는{" "}
        <a href="mailto:taejin1472@gmail.com">taejin1472@gmail.com</a>으로 보내 주세요. 자세한
        내용은 <a href="/contact">문의 안내</a> 페이지를 참고하세요.
      </p>
    </LegalPage>
  );
}
