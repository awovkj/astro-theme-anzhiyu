import { defineCollection } from "astro:content";
import { z } from "astro/zod";
import { glob } from "astro/loaders";

/**
 * Content collections for the AnZhiYu Astro theme.
 * The front-matter schema mirrors the fields the original Hexo theme read
 * from each post/page (title, date, tags, categories, cover, ...).
 */

/**
 * Hexo 风格 frontmatter 允许字段留空（YAML 解析为 null）。
 * zod 默认对 null 报错，这里把 null / 空字符串归一为 undefined，
 * 让 optional / default 正常接管。
 */
const blank = <T extends z.ZodTypeAny>(schema: T) =>
  z.preprocess((v) => (v === null || v === "" ? undefined : v), schema);

const posts = defineCollection({
  loader: glob({ pattern: "**/*.{md,mdx}", base: "./src/content/posts" }),
  schema: z.object({
    title: z.string(),
    date: z.coerce.date(),
    updated: blank(z.coerce.date().optional()),
    tags: blank(z.array(z.string()).default([])),
    categories: blank(z.array(z.string()).default([])),
    // cover can be a URL/path, false (no cover), or omitted/blank (random cover).
    cover: blank(z.union([z.string(), z.boolean()]).optional()),
    description: blank(z.string().optional()),
    keywords: blank(z.array(z.string()).optional()),
    comments: blank(z.boolean().default(true)),
    // Optional ordering hints used by the home page top/swiper sections.
    // top: pinned posts (bigger = higher, undefined/0 = normal date order).
    top: blank(z.number().optional()),
    top_group_index: blank(z.number().optional()),
    swiper_index: blank(z.number().optional()),
    // asteor: hide from listing
    hide: z.boolean().default(false),
    // 是否发布：false 时不进入列表/搜索/归档，且不生成文章页面（默认 true）
    public: blank(z.boolean().default(true)),
  }),
});

const pages = defineCollection({
  loader: glob({ pattern: "**/*.{md,mdx}", base: "./src/content/pages" }),
  schema: z.object({
    title: z.string(),
    date: blank(z.coerce.date().optional()),
    cover: blank(z.union([z.string(), z.boolean()]).optional()),
    description: blank(z.string().optional()),
    comment: blank(z.boolean().default(true)),
    type: blank(z.string().optional()),
  }),
});

export const collections = { posts, pages };
