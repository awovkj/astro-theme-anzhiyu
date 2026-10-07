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
  /** Raw Markdown used for excerpts and the local search index. */
  content?: string;
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

/** Newest-first order for feeds and archives; pinning only affects home lists. */
export function chronologicalPosts(posts: PostItem[]): PostItem[] {
  return [...posts].sort((a, b) => +b.date - +a.date || a.path.localeCompare(b.path));
}

/** Derive counts once; repeated frontmatter labels count only once per post. */
export function buildThemeData(posts: PostItem[]): ThemeData {
  const count = (key: "tags" | "categories") => {
    const counts = new Map<string, number>();
    for (const post of posts) for (const name of new Set(post[key])) {
      counts.set(name, (counts.get(name) ?? 0) + 1);
    }
    return [...counts].map(([name, length]) => ({ name, length, path: `${key}/${encodeURIComponent(name)}/` }));
  };
  return {
    posts,
    tags: count("tags").sort((a, b) => b.length - a.length || a.name.localeCompare(b.name, "zh")),
    categories: count("categories").sort((a, b) => a.name.localeCompare(b.name, "zh")),
  };
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
