import { site } from "./site";
import { theme } from "./theme";
import { _p } from "./i18n";
import type { PostItem, TagInfo, CategoryInfo, ArchiveItem } from "./collections";

/* ------------------------------------------------------------------ *
 *  URL helpers (mirror Hexo's url_for / is_current)
 * ------------------------------------------------------------------ */
export function url_for(p?: string | null): string {
  if (!p) return site.root;
  // Leave absolute/protocol URLs and document-local anchors untouched.  The
  // generic URI-scheme branch is deliberately restricted so a configured or
  // content-provided `javascript:` URL cannot become an executable href.
  if (/^\/\//.test(p) || /^(?:https?:|mailto:|tel:|ftp:)/i.test(p) || /^data:image\//i.test(p) || p.startsWith("#")) return p;
  if (/^[a-z][a-z\d+.-]*:/i.test(p)) return "#";
  if (p.startsWith("/")) return (site.root.replace(/\/$/, "") + p).replace(/\/\//g, "/");
  return (site.root.replace(/\/$/, "") + "/" + p.replace(/^\//, "")).replace(/\/\//g, "/");
}

/** Escape text interpolated into helper-generated HTML fragments. */
export function escape_html(value: unknown): string {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export function is_current(path: string, currentPath: string, strict = false): boolean {
  if (!path) return false;
  const a = path.replace(/\/index\.html$/, "/").replace(/\.html$/, "");
  const b = currentPath.replace(/\/index\.html$/, "/").replace(/\.html$/, "");
  if (strict) return a === b;
  return b === a || b.startsWith(a.replace(/\/$/, "") + "/");
}

/* ------------------------------------------------------------------ *
 *  Date helpers (mirror Hexo's date / date_xml / full_date)
 * ------------------------------------------------------------------ */
const MONTHS_ZH = ["一月", "二月", "三月", "四月", "五月", "六月", "七月", "八月", "九月", "十月", "十一月", "十二月"];
const MONTHS_EN = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

function pad(n: number, len = 2): string {
  return String(n).padStart(len, "0");
}

export function formatDate(d: Date, fmt: string): string {
  const isZh = (site.language || "zh-CN").startsWith("zh");
  const MMMM = isZh ? MONTHS_ZH[d.getMonth()] : MONTHS_EN[d.getMonth()];
  const M = d.getMonth() + 1;
  const map: Record<string, string> = {
    YYYY: String(d.getFullYear()),
    MM: pad(M),
    M: String(M),
    DD: pad(d.getDate()),
    D: String(d.getDate()),
    HH: pad(d.getHours()),
    H: String(d.getHours()),
    mm: pad(d.getMinutes()),
    ss: pad(d.getSeconds()),
    MMMM,
  };
  return fmt.replace(/YYYY|MMMM|MM|M|DD|D|HH|H|mm|ss/g, (t) => map[t] ?? t);
}

export function date(d: Date | undefined, fmt: string): string {
  return d ? formatDate(d, fmt) : "";
}
export function date_xml(d: Date | undefined): string {
  return d ? d.toISOString() : "";
}
export function fullDate(d: Date | undefined): string {
  return d ? formatDate(d, "MMMM D, YYYY") : "";
}

/* ------------------------------------------------------------------ *
 *  Content helpers
 * ------------------------------------------------------------------ */
export function strip_html(html: string): string {
  return (html || "").replace(/<[^>]*>/g, "").replace(/\s+/g, " ").trim();
}

export function wordcount(html: string): number {
  const text = strip_html(html || "");
  const cjk = (text.match(/[一-龥]/g) || []).length;
  const words = (text.replace(/[一-龥]/g, " ").match(/[A-Za-z0-9]+/g) || []).length;
  return cjk + words;
}

export function min2read(html: string, opts: { cn?: number; en?: number } = {}): number {
  const text = strip_html(html || "");
  const cjk = (text.match(/[一-龥]/g) || []).length;
  const words = (text.replace(/[一-龥]/g, " ").match(/[A-Za-z0-9]+/g) || []).length;
  const cn = opts.cn || 350;
  const en = opts.en || 160;
  return Math.max(1, Math.ceil(cjk / cn + words / en));
}

/* ------------------------------------------------------------------ *
 *  cloudTags (mirror hexo tag cloud used by the aside tag card)
 * ------------------------------------------------------------------ */
export function cloudTags(opts: {
  source: TagInfo[];
  minfontsize?: number;
  maxfontsize?: number;
  limit?: number;
  unit?: string;
  color?: boolean;
  highlightTags?: string[];
}): string {
  const { source, minfontsize = 1.05, maxfontsize = 1.05, limit = 0, unit = "rem", color = false, highlightTags = [] } = opts;
  const list = limit > 0 ? source.slice(0, limit) : source;
  const counts = list.map((t) => t.length);
  const minC = Math.min(...counts, 0);
  const maxC = Math.max(...counts, 0);
  const palette = ["#49b1f5", "#1abc9c", "#f0ad4e", "#ff7d33", "#fc6421", "#ff69b4", "#ba68c8"];
  return list
    .map((t, i) => {
      const ratio = maxC === minC ? 1 : (t.length - minC) / (maxC - minC);
      const size = (minfontsize + ratio * (maxfontsize - minfontsize)).toFixed(2);
      const c = color ? palette[i % palette.length] : "";
      const style = `font-size: ${size}${unit};` + (c ? ` color: ${c};` : "");
      const hl = highlightTags.includes(t.name) ? " highlight" : "";
      return `<a href="${escape_html(url_for("/" + t.path))}" style="${style}" class="article-tag${hl}">${escape_html(t.name)}</a>`;
    })
    .join("");
}

/* ------------------------------------------------------------------ *
 *  aside_categories (mirror scripts/helpers/aside_categories.js)
 * ------------------------------------------------------------------ */
export function aside_categories(categories: CategoryInfo[], opts: { limit?: number } = {}): string {
  if (!categories.length) return "";
  const limit = opts.limit === 0 ? categories.length : opts.limit || 8;
  const moreBtn =
    categories.length > limit
      ? `<a class="card-more-btn" href="${url_for(site.category_dir)}/" title="${_p("aside.more_button")}"><i class="anzhiyufont anzhiyu-icon-angle-right"></i></a>`
      : "";
  const items = categories
    .slice(0, limit)
    .map(
      (c) =>
        `<li class="card-category-list-item"><a class="card-category-list-link" href="${escape_html(url_for(c.path))}"><span class="card-category-list-name">${escape_html(c.name)}</span><span class="card-category-list-count">${c.length}</span></a></li>`
    )
    .join("");
  return `<div class="item-headline"><i class="anzhiyufont anzhiyu-icon-folder-open"></i><span>${_p(
    "aside.card_categories"
  )}</span>${moreBtn}</div><ul class="card-category-list" id="aside-cat-list">${items}</ul>`;
}

/* ------------------------------------------------------------------ *
 *  aside_archives (mirror scripts/helpers/aside_archives.js)
 * ------------------------------------------------------------------ */
export function aside_archives(
  posts: PostItem[],
  opts: { type?: string; format?: string; order?: number; limit?: number; transform?: (name: string) => string } = {}
): string {
  if (!posts.length) return "";
  const type = opts.type || "monthly";
  const format = opts.format || (type === "monthly" ? "MMMM YYYY" : "YYYY");
  const order = opts.order || -1;
  const limit = opts.limit === 0 ? 9999 : opts.limit || 8;

  const sorted = [...posts].sort((a, b) => (order === -1 ? +b.date - +a.date : +a.date - +b.date));
  const data: ArchiveItem[] = [];
  for (const p of sorted) {
    const y = p.date.getFullYear();
    const m = p.date.getMonth() + 1;
    const name = type === "monthly" ? `${y}-${pad(m)}` : `${y}`;
    const last = data[data.length - 1];
    if (!last || last.name !== name) data.push({ name, year: y, month: m, count: 1 });
    else last.count++;
  }
  const judge = Math.min(data.length, limit);
  const items = data
    .slice(0, judge)
    .map((it) => {
      let url = `${site.archive_dir}/${it.year}/`;
      if (type === "monthly") url += `${pad(it.month)}/`;
      const archiveDate = new Date(it.year, type === "monthly" ? it.month - 1 : 0, 1);
      const label = opts.transform ? opts.transform(it.name) : formatDate(archiveDate, format);
      return `<li class="card-archive-list-item"><a class="card-archive-list-link" href="${escape_html(url_for(url))}"><span class="card-archive-list-date">${escape_html(label)}</span><div class="card-archive-list-count-group"><span class="card-archive-list-count">${it.count}</span><span>篇</span></div></a></li>`;
    })
    .join("");
  const moreBtn =
    data.length > judge
      ? `<a class="card-more-btn" href="${url_for(site.archive_dir)}/" title="${_p("aside.more_button")}"><i class="anzhiyufont anzhiyu-icon-angle-right"></i></a>`
      : "";
  return `<div class="item-headline"><i class="anzhiyufont anzhiyu-icon-archive"></i><span>${_p(
    "aside.card_archives"
  )}</span>${moreBtn}</div><ul class="card-archive-list">${items}</ul>`;
}

/* ------------------------------------------------------------------ *
 *  tags_page_list / catalog_list (mirror scripts/helpers)
 * ------------------------------------------------------------------ */
export function tags_page_list(tags: TagInfo[]): string {
  const sorted = [...tags].sort((a, b) => a.name.length - b.name.length);
  return sorted
    .map(
      (t) =>
        `<a href="${escape_html(url_for(t.path))}" id="${escape_html(url_for(t.path))}"><span class="tags-punctuation">#</span>${escape_html(t.name)}<span class="tagsPageCount">${t.length}</span></a>`
    )
    .join("");
}

export function catalog_list(categories: CategoryInfo[]): string {
  return categories
    .map((c) => `<div class="catalog-list-item" id="${escape_html(url_for(c.path))}"><a href="${escape_html(url_for(c.path))}">${escape_html(c.name)}</a></div>`)
    .join("");
}

/* ------------------------------------------------------------------ *
 *  getArchiveLength / sort_attr_post / related_posts
 * ------------------------------------------------------------------ */
export function getArchiveLength(posts: PostItem[]): number {
  return posts.length;
}

export function sort_attr_post(type: "swiper_list" | "top_group_list", posts: PostItem[]): PostItem[] {
  const swiperEnable = !!(theme.home_top && (theme.home_top as any).swiper && (theme.home_top as any).swiper.enable);
  const targetLength = swiperEnable ? 4 : 6;
  const swiper_list: PostItem[] = [];
  const top_group_list: PostItem[] = [];
  for (const item of posts) {
    if ((item as any).swiper_index != null) swiper_list.push(item);
    if ((item as any).top_group_index != null) top_group_list.push(item);
  }
  const bySwiper = (a: any, b: any) => a.swiper_index - b.swiper_index;
  const byGroup = (a: any, b: any) => a.top_group_index - b.top_group_index;
  swiper_list.sort(bySwiper).reverse();
  top_group_list.sort(byGroup).reverse();
  const pad = (arr: PostItem[]) => {
    if (arr.length < targetLength) {
      const extra = posts.filter((p) => !arr.includes(p)).slice(0, targetLength - arr.length);
      return [...arr, ...extra];
    }
    if (arr.length > targetLength) {
      return arr.slice(0, targetLength);
    }
    return arr;
  };
  swiper_list.splice(0, swiper_list.length, ...pad(swiper_list));
  top_group_list.splice(0, top_group_list.length, ...pad(top_group_list));
  return type === "swiper_list" ? swiper_list : top_group_list;
}

export function related_posts(current: PostItem, all: PostItem[], limit = 6): string {
  const tags = new Set(current.tags);
  const map = new Map<string, { post: PostItem; weight: number }>();
  for (const post of all) {
    if (post.path === current.path) continue;
    const shared = post.tags.filter((t) => tags.has(t));
    if (!shared.length) continue;
    const prev = map.get(post.path);
    if (prev) prev.weight += shared.length;
    else map.set(post.path, { post, weight: shared.length });
  }
  const list = [...map.values()].sort((a, b) => b.weight - a.weight).slice(0, limit);
  if (!list.length) return "";
  const items = list
    .map(({ post }) => {
      const cover = post.cover === false ? (post as any).randomcover : post.cover;
      const src = cover ? url_for(String(cover)) : "";
      const title = post.title;
      return `<div><a href="${escape_html(url_for(post.path))}" title="${escape_html(title)}"><img class="cover" src="${escape_html(src)}" alt="cover"${
        cover ? "" : ' onerror="this.style.opacity=0.2"'
      }></a></div>`;
    })
    .join("");
  return `<div class="relatedPosts-list">${items}</div>`;
}
