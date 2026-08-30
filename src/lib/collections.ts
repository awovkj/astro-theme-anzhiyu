import { getCollection, type CollectionEntry } from "astro:content";

/** A normalized post record the theme components/helpers consume. */
export interface PostItem {
  title: string;
  path: string;
  date: Date;
  updated?: Date;
  tags: string[];
  categories: string[];
  cover?: string | boolean;
  description?: string;
  /** raw HTML body (rendered by Astro via render()) */
  body?: string;
  // optional ordering hints
  /** pinned priority: bigger = higher, undefined/0 = normal date order */
  top?: number;
  top_group_index?: number;
  swiper_index?: number;
  [key: string]: any;
}

export interface TagInfo {
  name: string;
  length: number;
  path: string;
}

export interface CategoryInfo {
  name: string;
  length: number;
  path: string;
}

export interface ArchiveItem {
  name: string;
  year: number;
  month: number;
  count: number;
}

export interface ThemeData {
  posts: PostItem[];
  tags: TagInfo[];
  categories: CategoryInfo[];
}

let _cache: ThemeData | null = null;

function entryToPost(e: CollectionEntry<"posts">): PostItem {
  const d = e.data;
  return {
    title: d.title,
    // canonical url path of the post (matches src/pages/posts/[...slug].astro)
    path: `posts/${e.id}/`,
    date: d.date,
    updated: d.updated,
    tags: d.tags,
    categories: d.categories,
    cover: d.cover,
    description: d.description,
    // raw markdown body — consumed by index excerpt / swiper text
    content: (e as any).body || "",
    top: d.top,
    top_group_index: (d as any).top_group_index,
    swiper_index: (d as any).swiper_index,
    _entry: e,
  };
}

/** Load + normalize all posts and derive tags/categories (memoized per build). */
export async function loadData(): Promise<ThemeData> {
  if (_cache) return _cache;
  const entries = await getCollection("posts", (entry: CollectionEntry<"posts">) => !entry.data.hide && entry.data.public !== false);
  const posts: PostItem[] = entries.map(entryToPost);

  // tags
  const tagMap = new Map<string, number>();
  for (const p of posts) for (const t of p.tags) tagMap.set(t, (tagMap.get(t) || 0) + 1);
  const tags: TagInfo[] = [...tagMap.entries()]
    .map(([name, length]) => ({ name, length, path: `tags/${encodeURIComponent(name)}/` }))
    .sort((a, b) => b.length - a.length);

  // categories (flat list, like the original aside card)
  const catMap = new Map<string, number>();
  for (const p of posts) for (const c of p.categories) catMap.set(c, (catMap.get(c) || 0) + 1);
  const categories: CategoryInfo[] = [...catMap.entries()]
    .map(([name, length]) => ({ name, length, path: `categories/${encodeURIComponent(name)}/` }))
    .sort((a, b) => a.name.localeCompare(b.name, "zh"));

  _cache = { posts, tags, categories };
  return _cache;
}

/** Posts sorted pinned-first (top desc), then newest-first. */
export function sortedPosts(posts: PostItem[]): PostItem[] {
  return [...posts].sort(
    (a, b) => (b.top ?? 0) - (a.top ?? 0) || +b.date - +a.date
  );
}

/** Group posts by year (desc) then by month — used by the archives page. */
export function groupByYear(posts: PostItem[]): { year: number; posts: PostItem[] }[] {
  const map = new Map<number, PostItem[]>();
  for (const p of posts) {
    const y = p.date.getFullYear();
    if (!map.has(y)) map.set(y, []);
    map.get(y)!.push(p);
  }
  return [...map.entries()]
    .sort((a, b) => b[0] - a[0])
    .map(([year, ps]) => ({ year, posts: ps.sort((x, y) => +y.date - +x.date) }));
}
