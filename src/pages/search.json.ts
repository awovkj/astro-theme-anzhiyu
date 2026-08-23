import type { APIRoute } from "astro";
import { loadData } from "../lib/collections";
import { url_for } from "../lib/helpers";

/**
 * Build-time JSON search index — the Astro equivalent of hexo-generator-search's
 * search.xml. Consumed by the client-side local search runtime
 * (src/scripts/local-search.ts).
 *
 * Output shape: { posts: [{ title, url, content, tags }] }
 *   - url:   {post.path} (already "posts/{slug}/", root-prefixed via url_for)
 *   - content: plain-text excerpt of the raw markdown body, truncated to ~5000 chars
 */
export const GET: APIRoute = async () => {
  const data = await loadData();
  const posts = data.posts.map((p) => {
    const entry: any = (p as any)._entry;
    const rawBody: string = (entry && typeof entry.body === "string" ? entry.body : "") || "";
    return {
      title: p.title,
      url: url_for(p.path),
      content: stripMarkdown(rawBody).slice(0, 5000),
      tags: p.tags || [],
    };
  });

  return new Response(JSON.stringify({ posts }), {
    headers: { "Content-Type": "application/json; charset=utf-8" },
  });
};

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
