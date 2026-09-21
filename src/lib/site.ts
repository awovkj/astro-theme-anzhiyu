/**
 * Site-wide metadata. In Hexo this came from the blog root `_config.yml`.
 * Here it is a single editable object (mirrors the original `config.*` globals).
 *
 * 使用本模板时，站点信息改这一个文件即可。
 */
export const site = {
  title: "awovkj",
  subtitle: "生活明朗，万物可爱",
  author: "awovkj",
  email: "",
  // Keep URL generation in sync with astro.config.mjs. This also makes all
  // url_for() callers work when Astro's `site` / `base` is changed for
  // subpath hosting.
  // ⚠️ 必须与 astro.config.mjs 的 `site` 保持一致，否则 sitemap / RSS /
  //    文章内绝对链接都会指向错误域名。
  url: (import.meta.env.SITE || "https://example.com").replace(/\/$/, ""),
  root: import.meta.env.BASE_URL || "/",
  language: "zh-CN",
  description: "一款基于 Hexo 修改的安知鱼主题，已重构为 Astro。",
  // Directory names (kept identical to Hexo defaults so URLs match).
  archive_dir: "archives",
  tag_dir: "tags",
  category_dir: "categories",
  // Author avatar / favicon (mirrors theme.avatar / theme.favicon).
  // 使用者换成自己的图片即可 —— 建议放到 public/img/ 下用本地路径，避免依赖第三方 CDN。
  avatar: "https://bu.dusays.com/2023/04/27/64496e511b09c.jpg",
  favicon: "/favicon.ico",
};

export type SiteConfig = typeof site;
