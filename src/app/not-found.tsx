import Link from "next/link";

export default function NotFound() {
  return (
    <div
      className="shell"
      style={{
        display: "grid",
        justifyItems: "start",
        gap: 16,
        paddingBlock: "clamp(48px, 10vw, 120px)",
      }}
    >
      <p className="section-index">404 / 없는 페이지</p>
      <h1
        className="display"
        style={{ fontSize: "clamp(52px, 12vw, 160px)", textShadow: "6px 6px 0 var(--cobalt)" }}
      >
        길을 잃었네
      </h1>
      <p style={{ maxWidth: "48ch", color: "var(--smoke)", lineHeight: 1.75 }}>
        주소가 잘못되었거나, 해당 포지션에 그 챔피언이 분류되어 있지 않습니다. 포지션과 카테고리를
        다시 골라 주세요.
      </p>
      <Link className="btn btn--acid" href="/">
        상대법으로 돌아가기
      </Link>
    </div>
  );
}
