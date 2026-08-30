/**
 * Site-wide metadata. In Hexo this came from the blog root `_config.yml`.
 * Here it is a single editable object (mirrors the original `config.*` globals).
 * Override any field to match your deployment.
 */
export const site = {
  title: "awovkj",
  subtitle: "生活明朗，万物可爱",
  author: "awovkj",
  email: "",
  // Keep URL generation in sync with astro.config.mjs. This also makes all
  // url_for() callers work when Astro's `site` / `base` is changed for
  // subpath hosting.
  url: (import.meta.env.SITE || "https://example.com").replace(/\/$/, ""),
  root: import.meta.env.BASE_URL || "/",
  language: "zh-CN",
  description: "一款基于 Hexo 修改的安知鱼主题，已重构为 Astro。",
  // Directory names (kept identical to Hexo defaults so URLs match).
  archive_dir: "archives",
  tag_dir: "tags",
  category_dir: "categories",
  // Author avatar / favicon (mirrors theme.avatar / theme.favicon).
  avatar: "https://bu.dusays.com/2023/04/27/64496e511b09c.jpg",
  favicon: "/favicon.ico",
};

export type SiteConfig = typeof site;
