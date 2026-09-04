# 깨남.COM ImageGen Prompts

생성 방식: Codex 내장 ImageGen

## 1. 카테고리 선택 화면

```text
Use case: ui-mockup
Asset type: high-fidelity desktop website design blueprint, 16:9 landscape, full viewport, implementation-ready visual direction
Primary request: Design the champion category selection page for the Korean League of Legends strategy community "깨남.COM". The concept is "GLOWING MATCHUP ZINE", an idiosyncratic Korean editorial game-guide zine, not a generic AI dashboard.
Input images: Image 1 is the exact Zed art for the assassin category poster; Image 2 is the exact Zoe art for the mage category poster; Image 3 is the exact Yone art for the bruiser/marksman category poster. Preserve the recognizable supplied artwork and crop it boldly inside the poster panels.
Composition: a black 72px editorial header with the exact visible labels "깨남.COM", "상대법", "전적", "통계", "티어표", "강의" and small "SOON" stickers on "전적", "통계", "티어표"; large off-center Korean display headline "누굴 상대해?"; directly below it, a paper-index position selector labeled "탑", "정글", "미드", "원딜", "서폿" with "미드" visibly active in Acid; asymmetric 12-column layout with three hard-edged poster panels: Zed 5 columns labeled "암살자", Zoe 4 columns labeled "메이지", Yone 3 columns labeled "브루저/원딜". Let labels overlap panel edges like printed stickers. Show the start of a square champion contact sheet below, suggesting the selected category expands in place.
Style/medium: polished high-fidelity web UI mockup, neo-brutalist editorial magazine, Korean PC-bang sticker board, risograph halftone, sharp 2px borders, clipped paper corners, 6px hard offset shadows, asymmetric but readable grid.
Color palette: Ink #101014, Paper #F4EBDD, Acid #D8FF3E, Gum #FF5E9C, Cobalt #3A4CFF, Smoke #A59BAD. Flat spot colors, no mesh gradients.
Typography: oversized quirky rounded Korean display type reminiscent of Bagel Fat One for the headline and category labels; clean Korean sans for navigation; monospaced metadata such as "MID / PATCH / CATEGORY".
Lighting/mood: energetic night-market print shop, playful and competitive, tactile paper and fluorescent ink.
Text (verbatim): "깨남.COM", "상대법", "전적", "통계", "티어표", "강의", "누굴 상대해?", "탑", "정글", "미드", "원딜", "서폿", "암살자", "메이지", "브루저/원딜", "SOON"
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
Primary request: Design the champion matchup detail page for the Korean League of Legends strategy community "깨남.COM". The selected enemy champion is Ahri. The concept is "GLOWING MATCHUP ZINE", a distinctive Korean editorial game-guide zine, not a generic AI dashboard.
Composition: black 72px header with exact labels "깨남.COM", "상대법", "전적", "통계", "티어표", "강의" and small "SOON" stickers on "전적", "통계", "티어표". Below, use a strict asymmetric 12-column layout: a sticky 5-column Aside on the left and a 7-column Main on the right.
Aside: Ink-black background with subtle paper registration grid; an elegant static 2D fox mage champion illustration representing Ahri, composed like a cut-out editorial poster and offset slightly to the right; place enormous Gum-pink Korean text "아리" partially behind the illustration, with a smaller readable label. At the bottom show exactly four square ability icons labeled Q, W, E, R with small monospaced cooldown numbers and one Paper-colored skill-detail note popping from a hovered icon.
Main: Paper background. At the top use paper-index tabs "게시판" and "영상", with "게시판" visibly selected. Directly below show a bold search combobox labeled exactly "ME / 내 챔피언 선택" with selected value "트위스티드 페이트", and a compact sort control "좋아요순".
Tip board: several sharp-edged horizontal editorial article rows, not rounded cards. Each has a large monospaced ranking number at left, title and advice in the center, author and like metadata at right. Use a Cobalt label "GENERAL" for universal advice. In at least two rows, reveal a Gum-pink fluorescent marker strip labeled "ME / 트위스티드 페이트" with champion-specific advice nested under General. Use a few readable Korean fragments such as "매혹이 빠진 12초가 핵심", "라인을 짧게 유지해요", and "골드 카드로 진입을 끊기".
Style/medium: polished high-fidelity web UI mockup, neo-brutalist editorial magazine, Korean PC-bang sticker board, risograph halftone, tactile paper, 2px borders, clipped corners, 6px hard offset shadows, controlled asymmetry.
Color palette: Ink #101014, Paper #F4EBDD, Acid #D8FF3E, Gum #FF5E9C, Cobalt #3A4CFF, Smoke #A59BAD. Flat spot colors, no mesh gradients.
Typography: quirky rounded Korean display type reminiscent of Bagel Fat One only for "아리"; clean Korean sans for advice; IBM Plex Mono-like numbers and metadata.
Lighting/mood: energetic, playful, competitive, night-market print studio; the content remains easy to scan.
Text (verbatim, prioritize accuracy): "깨남.COM", "상대법", "전적", "통계", "티어표", "강의", "SOON", "아리", "게시판", "영상", "ME / 내 챔피언 선택", "트위스티드 페이트", "좋아요순", "GENERAL", "ME / 트위스티드 페이트", "Q", "W", "E", "R"
Constraints: no browser chrome; no watermark; a feasible HTML/CSS layout; clear General versus Me distinction using labels and color; the static 2D illustration is isolated to Aside and never covers Main content; preserve generous reading space; no 3D model, WebGL, rotation, or drag interaction.
Avoid: glassmorphism, purple-blue gradient, generic SaaS dashboard, repeated rounded cards, excessive pills, stock 3D blobs, meaningless sparkles, soft shadows, centered-safe layout, illegible body copy, full-screen 3D.
```

## 3. 위키 목차 화면

```text
Use case: ui-mockup
Asset type: high-fidelity desktop website design blueprint, 16:9 landscape, full viewport, implementation-ready visual direction
Primary request: Redraw the latest /wiki index page for the Korean League of Legends strategy community "깨남.COM". It is a magazine-like table of contents for one living wiki combining matchup documents and general articles. Follow "GLOWING MATCHUP ZINE — 야광 상대법 잡지". This must feel like the next spread of the existing neo-brutalist Korean editorial game-guide zine, but unlike a dashboard or a repeat of the champion-selection page.
Scene/backdrop: full-width web page under a black 72px editorial header; warm tactile Paper surface, strong black ink rules, clipped paper corners, registration marks, restrained risograph grain, meaningful taped and highlighted notes.
Composition/framing: strict asymmetric 12-column desktop grid. Top row has huge off-center headline "뭘 찾아?" and compact mono ticket "DOCS 128 / 7D 24". Below it, an 8-column left printed feature area and a 4-column right live-notes rail separated by a strong vertical rule. A full-width text category tree anchors the bottom.
Header: exact navigation "깨남.COM", "상대법", "위키", "전적", "통계", "티어표", "강의", "마이페이지". "위키" is the active Acid rectangular tab. Tiny "SOON" stickers appear only on "전적", "통계", "티어표", "강의".
Left feature area: title the section exactly "01 ─ 이번 호 표지". Show exactly three hard-edged asymmetric cover posters in a 5/4/3 rhythm, never equal rounded cards and never a carousel.
Cover 1, largest: exact label "라인전", small mono "문서 31". Original generic editorial tactical print of a diagonal lane, minion-wave silhouettes, CS marks, trade-range lines and gank-warning arrows.
Cover 2: exact label "운영", small mono "문서 24". Original generic top-down macro map print with objective timers, ward sight cones, roaming paths and split arrows.
Cover 3, narrowest: exact label "사전", small mono "문서 18". Original printed field-guide plate with abstract rune diagrams, item silhouettes, stat notation and index tabs.
Use no recognizable game characters and no copied game logos. Make every cover visibly part of one time-and-learning-axis taxonomy: lane phase, macro play, reference knowledge. Labels overlap cover edges like pasted print stickers. Under the covers place the handwritten Acid note "↓ 고르면 이 아래로 목록이 펼쳐진다" and small mono path "/wiki?분류=라인전". Do not add carousel dots, chevrons or swipe controls.
Right live-notes rail: first element above the fold is a large practical search field with magnifier and exact placeholder "문서 이름". Below, exact section heading "02 ─ 최근 바뀐 문서" and five thin ruled editorial rows, not cards: "3시간  정글 동선 › 갱킹", "5시간  룬 › 정밀", "어제  미드/아리", "어제  시야 장악", "2일  오브젝트 타이밍", then "전부 →". Times are mono, titles dominant black, section suffix Smoke.
Below a torn Gum memo edge, exact section heading "03 ─ 손이 필요한 곳". Show two huge mono counters as the main content: "43" with label "미분류 문서", and "17" with label "아직 없는 문서". These are counters, never illustrated cover cards.
Full-width bottom: exact heading "04 ─ 분류 전부". Draw a text-only expanded printed contents tree with no cover images and no cards. Include:
"상대법 › 탑 · 정글 · 미드 · 원딜 · 서폿"
"일반 문서"
"라인전 › 웨이브 · 갱 대비 · 정글"
"운영 › 시야 · 오브젝트 · 정글"
"사전 › 룬 · 아이템 · 용어"
"기타 · 분류 없음"
The word "정글" must visibly appear under both "라인전" and "운영" to communicate that one open subcategory can cross multiple top-level portals. Use branching rules and thin divider lines like a printed magazine index. No horizontal portal carousel anywhere.
Style/medium: polished, high-fidelity, shippable web UI mockup; neo-brutalist editorial magazine; Korean PC-bang sticker board; risograph print; sharp 2px borders; clipped corners; 6px hard offset shadows; controlled asymmetry; realistic CSS Grid implementation.
Color palette: Ink #101014, Paper #F4EBDD, Acid #D8FF3E as the primary accent, Gum #FF5E9C only for the live-note/work-needed accents, Cobalt #3A4CFF sparingly for links, Smoke #A59BAD for secondary metadata. Flat spot colors, no gradients.
Typography: oversized heavy angular Korean display type reminiscent of SB 어그로체 B for "뭘 찾아?"; clean highly readable Korean sans for navigation and titles; IBM Plex Mono-like numerals and metadata.
Mood: energetic, alive, communal late-night print studio; fast to scan with generous reading space.
Text (verbatim, prioritize exact Korean rendering): "깨남.COM", "상대법", "위키", "전적", "통계", "티어표", "강의", "마이페이지", "SOON", "뭘 찾아?", "DOCS 128 / 7D 24", "01 ─ 이번 호 표지", "라인전", "운영", "사전", "문서 31", "문서 24", "문서 18", "문서 이름", "02 ─ 최근 바뀐 문서", "03 ─ 손이 필요한 곳", "43", "미분류 문서", "17", "아직 없는 문서", "04 ─ 분류 전부", "일반 문서".
Constraints: no browser chrome, no watermark; desktop full viewport; accessible contrast; practical implementation-ready hierarchy; search is the primary entrance and replaces right-rail content when active instead of floating over it; recent changes visible above the fold; only the selected top three portals receive covers while all categories remain visible as text in the bottom tree; no carousel or rotation UI.
Avoid: old portal set "운영 / 라인전 / 정글"; a standalone "정글" cover poster; glassmorphism; purple-blue mesh gradients; generic SaaS or analytics dashboard; KPI card grids; repeated rounded cards; excessive pills; stock 3D blobs; fantasy character art; meaningless sparkles; soft shadows; centered-safe layout; illegible copy; giant empty hero area.
```

생성 결과는 [`wiki-index-v2.png`](./wiki-index-v2.png)다. 문서가 충분히 쌓여 `라인전 / 운영 / 사전`이 이번 호 표지로 편성된 상태를 표현하며, 숫자와 최근 변경 내용은 조판 확인용 예시다.

## 4. 위키 관문 커버

공통 참조 이미지는 [`wiki-index-v2.png`](./wiki-index-v2.png)다. 세 장 모두 내장 ImageGen으로 각각 생성한 뒤 WebP 품질 92로 변환했다. 제목과 문서 수는 이미지에 포함하지 않고 실제 UI 텍스트로 겹친다.

### 라인전

```text
Use case: style-transfer
Asset type: production website portal cover image, standalone landscape raster artwork, target 1536×1024 (3:2), both dimensions at least 960px
Input images: Image 1 is the approved /wiki blueprint and the only visual style reference. Recreate and expand the LINE-PHASE cover artwork seen in the large left portal; do not crop or merely upscale the small panel.
Primary request: Create a new full-resolution standalone editorial tactical cover for the "라인전" portal. Preserve the blueprint's rough black-ink printmaking, aged warm paper, acid-yellow route marks and gum-pink warning marks, while adding details that the small mockup could not show.
Scene/backdrop: a generic diagonal three-lane battle corridor printed like an annotated coaching notebook; no exact copyrighted game map.
Subject: two opposing waves of tiny black and gum-pink minion-like tactical silhouettes meeting near center; CS tick marks, last-hit timing dots, freeze/slow-push/crash wave-state diagrams, a trade-range wedge, brush silhouettes, a gank-warning triangle and retreat path. Keep one strong diagonal reading direction.
Style/medium: neo-brutalist Korean gaming zine cover, risograph and photocopy collage, distressed black ink, screenprint misregistration, faint pencil construction lines, tactical notebook annotations, hard graphic shapes. Match Image 1's portal cover closely.
Composition/framing: full-bleed 3:2 landscape cover; dense but legible; main wave clash and warning triangle stay inside the central 60% so the asset survives wide and narrow CSS crops; quieter textured edges for overlaid HTML labels; no baked frame or UI.
Color palette: Ink #101014 and Paper #F4EBDD dominant; Acid #D8FF3E for range/timing paths; Gum #FF5E9C for opposing wave and danger marks; tiny Cobalt #3A4CFF registration accents only.
Materials/textures: fibrous aged paper, imperfect toner, scratched ink, slightly offset fluorescent screenprint.
Text: no readable words, no Korean title, no document count, no logo. Abstract ticks and tiny nonlinguistic marks are allowed.
Constraints: this must be original tactical illustration inspired only by Image 1; no characters; no trademarks; no recognizable game logo; no watermark; no UI controls; no rounded card; crop-safe; visually finished enough for public/images/portal.
Avoid: photorealism, polished digital concept art, 3D, fantasy characters, exact League of Legends map reproduction, readable English labels, gradients, soft shadows, empty center, excessive tiny clutter.
```

결과: [`lane-phase.webp`](../../../public/images/portal/lane-phase.webp)

### 운영

```text
Use case: style-transfer
Asset type: production website portal cover image, standalone landscape raster artwork, target 1536×1024 (3:2), both dimensions at least 960px
Input images: Image 1 is the approved /wiki blueprint and the only visual style reference. Recreate and expand the MACRO-PLAY cover artwork seen in the middle portal; do not crop or merely upscale the small panel.
Primary request: Create a new full-resolution standalone editorial tactical cover for the "운영" portal. Preserve the blueprint's dark top-down planning map, acid-yellow movements and gum-pink danger/vision marks, while adding precise visual layers missing from the mockup.
Scene/backdrop: an original generic top-down battlefield schematic on blackened paper, with three abstract routes, a winding river seam, jungle blocks and objective basins; it must not reproduce any exact copyrighted game map.
Subject: objective timing dials, ward vision cones, rotating sweep arcs, roam paths, split-push arrows, cross-map trade routes, danger triangles and regroup nodes. Make the route network the hero. Include one large circular objective clock near lower left and a second near upper right, expressed graphically without readable labels.
Style/medium: neo-brutalist Korean gaming zine cover, risograph tactical map, photocopied atlas, distressed ink, luminous screenprint annotations, hand-drawn arrows. Match Image 1's middle portal cover closely.
Composition/framing: full-bleed 3:2 landscape; map mass fills the frame; primary route loop and vision cones inside central 60% for wide/narrow CSS crops; dark Ink-dominant cover clearly distinct from the lighter line-phase and reference covers; quieter corners for HTML labels; no baked frame or UI.
Color palette: Ink #101014 dominant, Paper #F4EBDD map contours, Acid #D8FF3E paths and timing rings, Gum #FF5E9C threats and wards, rare Cobalt #3A4CFF registration ticks.
Materials/textures: rough map paper, toner grain, torn photocopy seams, hand-inked contour lines, slight fluorescent misregistration.
Text: no readable words, no Korean title, no document count, no logo. Simple numerals used as clock ticks are allowed but not required.
Constraints: original abstract tactical map; no characters; no trademarks; no recognizable game logo; no watermark; no UI controls; no rounded card; crop-safe; production-ready for public/images/portal.
Avoid: exact League of Legends or Summoner's Rift reproduction, satellite realism, glossy fantasy map, 3D, gradients, soft shadows, readable labels, excessive icons, empty center.
```

결과: [`macro-play.webp`](../../../public/images/portal/macro-play.webp)

### 사전

```text
Use case: style-transfer
Asset type: production website portal cover image, standalone landscape raster artwork, target 1536×1024 (3:2), both dimensions at least 960px
Input images: Image 1 is the approved /wiki blueprint and the only visual style reference. Recreate and expand the REFERENCE-GUIDE cover artwork seen in the narrow right portal; do not crop or merely upscale the small panel.
Primary request: Create a new full-resolution standalone editorial field-guide cover for the "사전" portal. Preserve the blueprint's stacked reference sheets, index tabs, abstract rune diagrams, item silhouettes and stat bars, while enriching it into a complete cover.
Scene/backdrop: layered warm-paper manual pages and clipped archival sheets on an Ink backing, like a well-used strategy encyclopedia pulled from a PC-bang binder.
Subject: a central catalog plate of original geometric rune-like glyphs, a second row of original item/tool silhouettes, damage/defense/speed bar diagrams, coordinate ticks, margin crosshairs, alphabetical-style index tabs rendered only as shapes, clipped page corners and one small fluorescent bookmark strip. No copied game icons.
Style/medium: neo-brutalist Korean gaming zine cover, risograph field manual, photocopied technical catalog, distressed ink, precise editorial grid, tactile layered paper. Match Image 1's narrow portal cover closely.
Composition/framing: full-bleed 3:2 landscape; layered pages fan slightly but remain flat and 2D; primary glyph matrix and item silhouettes inside central 60% for wide/narrow CSS crops; more negative paper space than the other covers; no baked frame or UI.
Color palette: Paper #F4EBDD dominant, Ink #101014 diagrams, Acid #D8FF3E index highlights, Gum #FF5E9C bookmark and correction marks, very small Cobalt #3A4CFF registration accents.
Materials/textures: fibrous archival paper, stamped ink, toner speckle, dog-eared corners, taped repair, offset screenprint.
Text: no readable words, no Korean title, no document count, no logo, no alphabet letters. Use only abstract symbols, bars, ticks and nonlinguistic notation.
Constraints: every glyph and item silhouette must be original and generic; no characters; no trademarks; no recognizable game logo or icon; no watermark; no UI controls; no rounded card; crop-safe; production-ready for public/images/portal.
Avoid: copied rune or item icons, fantasy book cover, photoreal objects, 3D, gradients, soft shadows, readable labels, overly empty layout, modern SaaS infographic.
```

결과: [`reference-guide.webp`](../../../public/images/portal/reference-guide.webp)

### 밴픽

```text
Use case: style-transfer
Asset type: production website portal cover image, standalone landscape raster artwork, target 1536×1024 (3:2), both dimensions at least 960px
Input images: Image 1 is the lane-phase portal cover, Image 2 is the macro-play portal cover, Image 3 is the reference-guide portal cover. They are equal style references defining one approved visual family; create a new subject rather than combining or copying their layouts.
Primary request: Create a new full-resolution standalone editorial tactical cover for the Korean "밴픽" portal, meaning pre-game champion draft, bans, team composition, counter-picks and pick order. Match the references' GLOWING MATCHUP ZINE look exactly while introducing a distinct draft-board visual language.
Scene/backdrop: a battered warm-paper tournament draft sheet pinned over a black photocopied strategy board, viewed straight-on and completely flat, like a coach's annotated selection board in a late-night PC-bang.
Subject: two opposing columns of five original abstract role tokens, ten total, arranged as a draft face-off; a clear alternating snake-order route connecting the slots; a top strip of crossed-out ban stamps; synergy threads joining compatible roles; counter arrows crossing the center seam; priority rings, swap marks and one torn fluorescent bookmark. Use generic symbols such as shield, blade, burst star, ranged reticle and utility knot, but invent every glyph and do not copy game icons.
Style/medium: neo-brutalist Korean gaming zine cover, risograph draft board, photocopy collage, distressed black ink, fluorescent screenprint annotations, clipped paper corners, stamped X marks, hand-drawn tactical arrows. The print grain, line weight and imperfect registration must match all three references.
Composition/framing: full-bleed 3:2 landscape; strong left-versus-right composition with a central vertical confrontation seam; primary ten-slot draft board inside the central 60% for wide and narrow CSS crops; quieter textured corners for overlaid HTML labels; no baked frame or UI.
Color palette: Paper #F4EBDD dominant with Ink #101014; Acid #D8FF3E identifies one side and pick order; Gum #FF5E9C identifies the opposing side and bans; tiny Cobalt #3A4CFF registration accents only.
Materials/textures: fibrous aged paper, rough toner, rubber-stamp ink, torn masking tape, scratched pencil, slight fluorescent misregistration.
Text: no readable words, no Korean title, no document count, no logo, no alphabet letters. Use only abstract symbols, crosses, arrows, dots, slot numbers as nonverbal notation.
Constraints: original generic tactical draft system; exactly two teams of five role slots; no recognizable characters; no portraits; no trademarks; no recognizable game logo or game icon; no watermark; no UI controls; no rounded card; crop-safe; production-ready for public/images/portal.
Avoid: character selection screen, rows of champion portraits, copied MOBA draft UI, modern SaaS kanban board, fantasy illustration, photorealism, 3D, gradients, soft shadows, readable labels, empty center, layout too similar to the reference-guide catalog.
```

결과: [`draft-board.webp`](../../../public/images/portal/draft-board.webp)

### 한타

```text
Use case: style-transfer
Asset type: production website portal cover image, standalone landscape raster artwork, target 1536×1024 (3:2), both dimensions at least 960px
Input images: Image 1 is the lane-phase portal cover, Image 2 is the macro-play portal cover, Image 3 is the reference-guide portal cover. They are equal style references defining one approved visual family; create a new subject rather than combining or copying their layouts.
Primary request: Create a new full-resolution standalone editorial tactical cover for the Korean "한타" portal, meaning a coordinated five-versus-five team fight: engage timing, frontline and backline spacing, focus fire, peel, ultimate sequence and retreat. Match the references' GLOWING MATCHUP ZINE look exactly while making this the most kinetic cover in the set.
Scene/backdrop: an abstract top-down combat rehearsal diagram printed on heavily blackened paper, with a pale torn-paper collision arena through the middle; it is a coaching diagram, not a game screenshot or exact map.
Subject: two opposing formations of five original abstract role tokens, ten total. Acid formation advances from lower left, Gum formation presses from upper right. Frontline shields form arcs; backline reticles sit behind; a single engage arrow pierces the center; concentric impact rings mark the clash; focus-fire rays converge on one circled target; peel cones protect the rear; numbered-looking timing ticks sequence abilities without readable text; two narrow retreat corridors remain visible. Make the central collision the unmistakable focal point.
Style/medium: neo-brutalist Korean gaming zine cover, high-energy risograph battle diagram, photocopied coaching notebook, distressed ink, fluorescent screenprint arrows, torn paper, hard graphic silhouettes. Match the three references' grain, line weight and imperfect color registration.
Composition/framing: full-bleed 3:2 landscape; diagonal lower-left versus upper-right movement; central impact and both formation cores inside the central 60% for wide/narrow CSS crops; Ink-dominant but visibly different from the macro map because there is no terrain network, only formations and a single clash; quieter edges for overlaid HTML labels; no baked frame or UI.
Color palette: Ink #101014 dominant, Paper #F4EBDD collision tear and tactical arcs, Acid #D8FF3E for one formation and engage/follow-up paths, Gum #FF5E9C for the opposing formation and threat rays, small Cobalt #3A4CFF timing/registration marks.
Materials/textures: charred-looking toner fields, fibrous torn paper, dry-brush ink, scratched grease-pencil arrows, offset fluorescent screenprint, registration crosshairs.
Text: no readable words, no Korean title, no document count, no logo, no alphabet letters. Use only original role glyphs, bars, rings, arrows, dots and nonlinguistic timing marks.
Constraints: exactly two abstract five-token formations; original symbols only; no recognizable characters; no portraits; no trademarks; no recognizable game logo or game icon; no watermark; no UI controls; no rounded card; crop-safe; production-ready for public/images/portal.
Avoid: exact League of Legends fight, Summoner's Rift terrain, game screenshot, fantasy battle scene, individual heroes, explosion concept art, 3D, gradients, soft shadows, readable labels, excessive chaos that hides the two formations, layout too similar to the macro-play route map.
```

결과: [`teamfight-clash.webp`](../../../public/images/portal/teamfight-clash.webp)
