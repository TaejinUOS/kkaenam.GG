/**
 * OpenNext의 Cloudflare 어댑터 설정.
 *
 * 지금은 서버에 저장할 상태가 없어(팁은 브라우저 localStorage) 기본값이면 충분하다.
 * 나중에 ISR 캐시나 KV·D1 바인딩이 필요해지면 여기에 붙인다.
 */
import { defineCloudflareConfig } from "@opennextjs/cloudflare";

export default defineCloudflareConfig();
