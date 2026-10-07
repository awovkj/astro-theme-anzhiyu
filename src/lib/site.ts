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
  // Domain is configured only in astro.config.mjs (or SITE_URL at build time).
  url: import.meta.env.SITE.replace(/\/$/, ""),
  root: import.meta.env.BASE_URL,
  index_per_page: 10,
  date_format: "YYYY-MM-DD",
  keywords: [] as string[],
  copyright: "",
  language: "zh-CN",
  description: "一款基于 Hexo 修改的安知鱼主题，已重构为 Astro。",
  // Directory names (kept identical to Hexo defaults so URLs match).
  archive_dir: "archives",
  tag_dir: "tags",
  category_dir: "categories",
  // Author avatar / favicon (mirrors theme.avatar / theme.favicon).
  // 使用者换成自己的图片即可 —— 建议放到 public/img/ 下用本地路径，避免依赖第三方 CDN。
  avatar: "https://bu.dusays.com/2023/04/27/64496e511b09c.jpg",
  favicon: "/img/favicon.ico",
};

export type SiteConfig = typeof site;
