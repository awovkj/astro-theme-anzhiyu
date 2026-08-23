import { defineCollection, z } from "astro:content";
import { glob } from "astro/loaders";

/**
 * Content collections for the AnZhiYu Astro theme.
 * The front-matter schema mirrors the fields the original Hexo theme read
 * from each post/page (title, date, tags, categories, cover, ...).
 */
const posts = defineCollection({
  loader: glob({ pattern: "**/*.{md,mdx}", base: "./src/content/posts" }),
  schema: z.object({
    title: z.string(),
    date: z.coerce.date(),
    updated: z.coerce.date().optional(),
    tags: z.array(z.string()).default([]),
    categories: z.array(z.string()).default([]),
    // cover can be a URL/path, false (no cover), or omitted (random cover).
    cover: z.union([z.string(), z.boolean()]).optional(),
    description: z.string().optional(),
    keywords: z.array(z.string()).optional(),
    comments: z.boolean().default(true),
    // Optional ordering hints used by the home page top/swiper sections.
    top_group_index: z.number().optional(),
    swiper_index: z.number().optional(),
    // asteor: hide from listing
    hide: z.boolean().default(false),
  }),
});

const pages = defineCollection({
  loader: glob({ pattern: "**/*.{md,mdx}", base: "./src/content/pages" }),
  schema: z.object({
    title: z.string(),
    date: z.coerce.date().optional(),
    cover: z.union([z.string(), z.boolean()]).optional(),
    description: z.string().optional(),
    comment: z.boolean().default(true),
    type: z.string().optional(),
  }),
});

export const collections = { posts, pages };
