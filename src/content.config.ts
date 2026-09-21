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
 *
 * 注：这里用 `z.ZodTypeAny`，astro check 会提示它已弃用（1 条 hint）。
 * 换成文档建议的 `z.ZodType` 反而更糟 —— 在当前 zod 4.5 里它同样是 deprecated
 * 别名，会让每个调用点都报一次弃用告警（17 条）。等 zod 给出真正可用的基类
 * 再迁移，现在保持原样。
 */
const blank = <T extends z.ZodTypeAny>(schema: T) =>
  z.preprocess((v) => (v === null || v === "" ? undefined : v), schema);

const posts = defineCollection({
  loader: glob({ pattern: "**/*.{md,mdx}", base: "./src/content/posts" }),
  schema: z.object({
    title: z.string(),
    // 可选 URL slug —— **由 Astro 的 glob loader 原生消费**：有值时 loader 直接拿它
    // 当条目 id（entry.id），没有才回落到文件名（括号等标点会被吃掉、拉丁字母会被
    // 小写化）。见 astro/dist/content/loaders/glob.js 的 generateIdDefault。
    // 因此路由/列表一律用 entry.id 即可，不需要另外读 data.slug。
    //
    // 这里声明它有两个作用：① 让该 frontmatter 字段被校验、不被 zod 剥掉；
    // ② `.default("")` 保证这个键**永远存在** —— Astro 的 getEntry() 只在
    // `!("slug" in data)` 时才会给 data 装一个「一读就告警」的废弃 slug getter，
    // 键存在就绕开了这个坑（否则任何读 data.slug 的代码都会刷
    // "no longer automatically added to entries"）。
    slug: blank(z.string().optional().default("")),
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
    // astro: hide from listing
    // 必须包 blank()：Hexo 风格的 `hide:`（空值）解析为 YAML null，
    // 不归一的话 zod 会直接报错、构建失败。
    hide: blank(z.boolean().default(false)),
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
