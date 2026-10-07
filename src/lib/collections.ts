import { getCollection, type CollectionEntry } from "astro:content";
import { buildThemeData, type PostItem, type ThemeData } from "./post-data";
export { sortedPosts, chronologicalPosts, groupByYear } from "./post-data";
export type { PostItem, TagInfo, CategoryInfo, ArchiveItem, ThemeData } from "./post-data";

let cache: Promise<ThemeData> | undefined;

function entryToPost(e: CollectionEntry<"posts">): PostItem {
  const d = e.data;
  return {
    title: d.title,
    // canonical url path of the post（必须与 src/pages/posts/[...slug].astro 一致）。
    // 用 e.id 即可：Astro 的 glob loader **原生支持** frontmatter 的 `slug`，有 slug
    // 时 id 就是 slug 的值，没有才回落到文件名（此时括号等标点会被吃掉、拉丁字母
    // 会被小写化）。所以不需要单独读 d.slug。
    path: `posts/${e.id}/`,
    date: d.date,
    updated: d.updated,
    tags: d.tags,
    categories: d.categories,
    cover: d.cover,
    description: d.description,
    // raw markdown body — consumed by index excerpt / swiper text
    content: e.body || "",
    top: d.top,
    top_group_index: d.top_group_index,
    swiper_index: d.swiper_index,
  };
}

/** Share concurrent build reads, but never retain stale content in the dev server. */
export function loadData(): Promise<ThemeData> {
  const load = async () => buildThemeData(
    (await getCollection("posts", (entry: CollectionEntry<"posts">) => !entry.data.hide && entry.data.public !== false)).map(entryToPost)
  );
  if (import.meta.env.DEV) return load();
  return cache ??= load().catch((error) => {
    cache = undefined;
    throw error;
  });
}
