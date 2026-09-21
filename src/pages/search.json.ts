import type { APIRoute } from "astro";
import { theme } from "../lib/theme";
import { loadData } from "../lib/collections";
import { url_for } from "../lib/helpers";

/**
 * Build-time JSON search index — the Astro equivalent of hexo-generator-search's
 * search.xml. Consumed by the client-side local search runtime, which is the
 * inline `<script is:inline>` at the bottom of src/components/LocalSearch.astro
 * (not a separate module).
 *
 * Output shape: { posts: [{ title, url, content, tags, cover }] }
 *   - url:   {post.path} (already "posts/{slug}/", root-prefixed via url_for)
 *   - content: plain-text excerpt of the raw markdown body, truncated to ~5000 chars
 *   - cover: first image of the post (frontmatter cover, else first image in body),
 *            used by the search dialog as the hit-item thumbnail (mirrors the
 *            original anzhiyu theme's `oneImage` behavior)
 *
 * local_search 关闭时返回 404，不生成搜索索引（死产物不进部署）。
 */
export const GET: APIRoute = async () => {
  const t = theme as any;
  if (!(t.local_search && t.local_search.enable)) {
    return new Response("Not Found", { status: 404 });
  }
  const data = await loadData();
  const posts = data.posts.map((p) => {
    const entry: any = (p as any)._entry;
    const rawBody: string = (entry && typeof entry.body === "string" ? entry.body : "") || "";
    const coverSrc = firstImage(p, rawBody);
    return {
      title: p.title,
      url: url_for(p.path),
      content: stripMarkdown(rawBody).slice(0, 5000),
      tags: p.tags || [],
      cover: coverSrc ? url_for(coverSrc) : "",
    };
  });

  return new Response(JSON.stringify({ posts }), {
    headers: { "Content-Type": "application/json; charset=utf-8" },
  });
};

/**
 * Resolve the thumbnail shown next to a search hit — frontmatter cover first,
 * then the first image referenced in the raw markdown body (either markdown
 * image syntax `![alt](src)` or an inline HTML `<img src>`). Returns "" when
 * the post has no image at all.
 */
function firstImage(post: { cover?: string | boolean }, rawBody: string): string {
  if (typeof post.cover === "string" && post.cover.trim()) return post.cover.trim();
  if (!rawBody) return "";
  const md = rawBody.match(/!\[[^\]]*\]\(\s*([^)\s]+)[^)]*\)/);
  if (md && md[1]) return md[1];
  const html = rawBody.match(/<img[^>]+src=["']([^"']+)["']/i);
  if (html && html[1]) return html[1];
  return "";
}

/**
 * Reduce raw markdown to a flat plain-text string suitable for keyword matching.
 * Removes code blocks, inline code, images, links, HTML tags, headings, list
 * markers, blockquotes, and residual syntax characters, then collapses whitespace.
 */
function stripMarkdown(src: string): string {
  return src
    .replace(/```[\s\S]*?```/g, " ") // fenced code blocks
    .replace(/~~~[\s\S]*?~~~/g, " ") // fenced code blocks (~~~)
    .replace(/`[^`]*`/g, " ") // inline code
    .replace(/!\[[^\]]*\]\([^)]*\)/g, " ") // images
    .replace(/\[([^\]]*)\]\([^)]*\)/g, "$1") // links → keep text
    .replace(/<[^>]+>/g, " ") // HTML tags
    .replace(/^#{1,6}\s+/gm, " ") // ATX headings
    .replace(/^\s*[-*+]\s+/gm, " ") // bullet list items
    .replace(/^\s*\d+\.\s+/gm, " ") // numbered list items
    .replace(/^\s*>+\s?/gm, " ") // blockquote markers
    .replace(/^\s*:\s+/gm, " ") // definition list markers
    .replace(/\|\s*/g, " ") // table pipes
    .replace(/^[-=]{3,}\s*$/gm, " ") // setext headings / hr
    .replace(/[*_~`#>|]/g, " ") // remaining inline syntax chars
    .replace(/\s+/g, " ")
    .trim();
}
