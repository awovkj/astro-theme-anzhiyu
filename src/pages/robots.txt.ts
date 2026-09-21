import type { APIContext } from "astro";

/**
 * 构建期生成 /robots.txt。
 *
 * 为什么不用 public/robots.txt：模板要被不同的人部署到不同域名，写死的
 * Sitemap 地址必然是错的。这里从 astro.config.mjs 的 `site` 推导，
 * 改一处域名即可全站一致。
 */
export function GET({ site }: APIContext) {
  // site 来自 astro.config.mjs；结尾斜杠统一去掉，避免拼出 //sitemap-index.xml
  const base = (site?.href ?? "/").replace(/\/$/, "");

  const body = [
    "User-agent: *",
    "Allow: /",
    "",
    `Sitemap: ${base}/sitemap-index.xml`,
    "",
  ].join("\n");

  return new Response(body, {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}
