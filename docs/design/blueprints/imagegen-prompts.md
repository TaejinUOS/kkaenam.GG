# 깨남.GG ImageGen Prompts

생성 방식: Codex 내장 ImageGen

## 1. 카테고리 선택 화면

```text
Use case: ui-mockup
Asset type: high-fidelity desktop website design blueprint, 16:9 landscape, full viewport, implementation-ready visual direction
Primary request: Design the champion category selection page for the Korean League of Legends strategy community "깨남.GG". The concept is "GLOWING MATCHUP ZINE", an idiosyncratic Korean editorial game-guide zine, not a generic AI dashboard.
Input images: Image 1 is the exact Zed art for the assassin category poster; Image 2 is the exact Zoe art for the mage category poster; Image 3 is the exact Yone art for the bruiser/marksman category poster. Preserve the recognizable supplied artwork and crop it boldly inside the poster panels.
Composition: a black 72px editorial header with the exact visible labels "깨남.GG", "상대법", "전적", "통계", "티어표", "강의" and small "SOON" stickers on "전적", "통계", "티어표"; large off-center Korean display headline "누굴 상대해?"; directly below it, a paper-index position selector labeled "탑", "정글", "미드", "원딜", "서폿" with "미드" visibly active in Acid; asymmetric 12-column layout with three hard-edged poster panels: Zed 5 columns labeled "암살자", Zoe 4 columns labeled "메이지", Yone 3 columns labeled "브루저/원딜". Let labels overlap panel edges like printed stickers. Show the start of a square champion contact sheet below, suggesting the selected category expands in place.
Style/medium: polished high-fidelity web UI mockup, neo-brutalist editorial magazine, Korean PC-bang sticker board, risograph halftone, sharp 2px borders, clipped paper corners, 6px hard offset shadows, asymmetric but readable grid.
Color palette: Ink #101014, Paper #F4EBDD, Acid #D8FF3E, Gum #FF5E9C, Cobalt #3A4CFF, Smoke #A59BAD. Flat spot colors, no mesh gradients.
Typography: oversized quirky rounded Korean display type reminiscent of Bagel Fat One for the headline and category labels; clean Korean sans for navigation; monospaced metadata such as "MID / PATCH / CATEGORY".
Lighting/mood: energetic night-market print shop, playful and competitive, tactile paper and fluorescent ink.
Text (verbatim): "깨남.GG", "상대법", "전적", "통계", "티어표", "강의", "누굴 상대해?", "탑", "정글", "미드", "원딜", "서폿", "암살자", "메이지", "브루저/원딜", "SOON"
Constraints: visible keyboard focus affordances; no browser chrome; no watermark; clean enough to implement in HTML/CSS; category panels must not be three equal rounded cards.
Avoid: glassmorphism, purple-blue gradient, generic SaaS dashboard, repeated rounded cards, stock 3D blobs, meaningless sparkles, soft shadows, centered-safe layout, excessive pills, illegible text.
```

참조 이미지:

- `images/Zed.jpg`: 암살자 카테고리 포스터
- `images/Zoe.jpg`: 메이지 카테고리 포스터
- `images/yone.jpg`: 브루저/원딜 카테고리 포스터

이 프롬프트는 미드 포지션이 선택된 상태를 재생성한다. 다른 포지션의 카테고리와 커버 매핑은 `docs/PRD.md` 5.1을 따른다.

## 2. 아리 상대법 화면

```text
Use case: ui-mockup
Asset type: high-fidelity desktop website design blueprint, 16:9 landscape, full viewport, implementation-ready visual direction
Primary request: Design the champion matchup detail page for the Korean League of Legends strategy community "깨남.GG". The selected enemy champion is Ahri. The concept is "GLOWING MATCHUP ZINE", a distinctive Korean editorial game-guide zine, not a generic AI dashboard.
Composition: black 72px header with exact labels "깨남.GG", "상대법", "전적", "통계", "티어표", "강의" and small "SOON" stickers on "전적", "통계", "티어표". Below, use a strict asymmetric 12-column layout: a sticky 5-column Aside on the left and a 7-column Main on the right.
Aside: Ink-black background with subtle paper registration grid; an elegant static 2D fox mage champion illustration representing Ahri, composed like a cut-out editorial poster and offset slightly to the right; place enormous Gum-pink Korean text "아리" partially behind the illustration, with a smaller readable label. At the bottom show exactly four square ability icons labeled Q, W, E, R with small monospaced cooldown numbers and one Paper-colored skill-detail note popping from a hovered icon.
Main: Paper background. At the top use paper-index tabs "게시판" and "영상", with "게시판" visibly selected. Directly below show a bold search combobox labeled exactly "ME / 내 챔피언 선택" with selected value "트위스티드 페이트", and a compact sort control "좋아요순".
Tip board: several sharp-edged horizontal editorial article rows, not rounded cards. Each has a large monospaced ranking number at left, title and advice in the center, author and like metadata at right. Use a Cobalt label "GENERAL" for universal advice. In at least two rows, reveal a Gum-pink fluorescent marker strip labeled "ME / 트위스티드 페이트" with champion-specific advice nested under General. Use a few readable Korean fragments such as "매혹이 빠진 12초가 핵심", "라인을 짧게 유지해요", and "골드 카드로 진입을 끊기".
Style/medium: polished high-fidelity web UI mockup, neo-brutalist editorial magazine, Korean PC-bang sticker board, risograph halftone, tactile paper, 2px borders, clipped corners, 6px hard offset shadows, controlled asymmetry.
Color palette: Ink #101014, Paper #F4EBDD, Acid #D8FF3E, Gum #FF5E9C, Cobalt #3A4CFF, Smoke #A59BAD. Flat spot colors, no mesh gradients.
Typography: quirky rounded Korean display type reminiscent of Bagel Fat One only for "아리"; clean Korean sans for advice; IBM Plex Mono-like numbers and metadata.
Lighting/mood: energetic, playful, competitive, night-market print studio; the content remains easy to scan.
Text (verbatim, prioritize accuracy): "깨남.GG", "상대법", "전적", "통계", "티어표", "강의", "SOON", "아리", "게시판", "영상", "ME / 내 챔피언 선택", "트위스티드 페이트", "좋아요순", "GENERAL", "ME / 트위스티드 페이트", "Q", "W", "E", "R"
Constraints: no browser chrome; no watermark; a feasible HTML/CSS layout; clear General versus Me distinction using labels and color; the static 2D illustration is isolated to Aside and never covers Main content; preserve generous reading space; no 3D model, WebGL, rotation, or drag interaction.
Avoid: glassmorphism, purple-blue gradient, generic SaaS dashboard, repeated rounded cards, excessive pills, stock 3D blobs, meaningless sparkles, soft shadows, centered-safe layout, illegible body copy, full-screen 3D.
```
