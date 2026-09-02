# 배포

깨남.GG는 **Cloudflare Workers**에 올라간다.

- 운영 주소: <https://kkaenam-gg.taejin1472.workers.dev>
- Worker 이름: `kkaenam-gg`

## 왜 Workers인가

Next.js 앱을 정적 파일로만 내보내는 방법(`output: "export"`)도 있지만 쓰지 않았다.
상대법 팁의 상세 경로 `/matchup/[position]/[champion]/tips/[tipId]`가 사용자가 쓴 팁의
id를 받는데, 이 값은 빌드 시점에 알 수 없다. 정적 배포였다면 그 URL이 전부 404가 된다.

그래서 `@opennextjs/cloudflare` 어댑터로 Next.js 서버를 Worker로 변환해 올린다.
Cloudflare가 현재 Next.js에 공식 권장하는 방식이다 (Pages의 Next.js 지원은 레거시).

## 구성 파일

| 파일 | 역할 |
| --- | --- |
| `wrangler.jsonc` | Worker 이름·진입점·정적 에셋 경로. `main`과 `assets.directory`는 변환 산출물의 경로라 바꾸지 않는다. |
| `open-next.config.ts` | Next.js → Worker 변환 설정. 서버에 저장할 상태가 없어 지금은 기본값이다. |
| `next.config.ts` 하단 | `initOpenNextCloudflareForDev()` — `next dev`에서도 Cloudflare 바인딩을 쓰기 위한 훅. |
| `.node-version` | Cloudflare CI가 쓸 Node 버전 고정. |

`compatibility_flags`의 두 값은 필수에 가깝다.

- `nodejs_compat` — Next 런타임이 쓰는 Node API를 Workers에서 쓰기 위해 필요하다.
- `global_fetch_strictly_public` — 앱이 자기 도메인으로 보내는 `fetch`를 공개 인터넷 경로로 돌린다.

## 자동 배포 (Workers Builds)

`main`에 push하면 Cloudflare가 알아서 빌드·배포한다. 최초 1회 연결만 대시보드에서 한다.

1. <https://dash.cloudflare.com> → **Compute (Workers)** → `kkaenam-gg` 선택
2. **Settings** 탭 → **Build** 섹션 → **Connect** 클릭
3. GitHub 계정을 연결하고 `TaejinUOS/kkaenam.GG` 저장소를 고른다
4. 빌드 설정을 아래로 채운다

   | 항목 | 값 |
   | --- | --- |
   | Git branch | `main` |
   | Build command | `npm run cf:build` |
   | Deploy command | `npx wrangler deploy` |
   | Root directory | *(비워둔다)* |

5. 저장하면 이후 `git push`마다 자동 배포된다

> 저장소가 public이면 Cloudflare가 GitHub App 권한을 요구한다. 이 저장소에만
> 권한을 주는 편이 낫다 (Only select repositories).

## 수동 배포

자동 배포를 붙이기 전이거나, 급하게 올려야 할 때.

```bash
npm run cf:deploy
```

처음 한 번은 Cloudflare 로그인이 필요하다.

```bash
npx wrangler login
```

## 배포 전 로컬 확인

Workers 런타임은 Node와 다르다. `next dev`에서 되던 게 배포 후 깨질 수 있으므로,
런타임에 관계된 코드를 건드렸다면 실제 Worker로 띄워 확인한다.

```bash
npm run cf:preview   # http://127.0.0.1:8788
```

## 롤백

배포가 잘못됐을 때 이전 버전으로 되돌린다.

```bash
npx wrangler deployments list
npx wrangler rollback <version-id>
```

## 알아둘 것

**팁은 아직 서버에 저장되지 않는다.** `src/lib/tipStore.ts`가 `localStorage`를 쓰기
때문에, 배포된 사이트에서 쓴 팁도 그 브라우저에만 남는다. 다른 사람에게 보이지 않고
브라우저 데이터를 지우면 사라진다. 공유되는 게시판이 되려면 D1(Cloudflare의 무료 DB)을
붙이고 `tipStore`를 서버 저장으로 옮겨야 한다. `docs/PRD.md` 15장 미결정 1번(회원가입
방식)과 함께 결정할 사안이다.

**무료 요금제 한도**는 하루 10만 요청이다. 현재 트래픽 규모에서는 여유가 있다.

**`next/image`를 쓰는 곳이 없다.** 쓰게 되면 Workers에서 이미지 최적화가 동작하지 않아
별도 설정이 필요하니, 도입 전에 확인한다.
