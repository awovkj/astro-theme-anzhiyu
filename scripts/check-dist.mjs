/** Validate generated local resources and SEO metadata without external network calls. */
import assert from "node:assert/strict";
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { resolve, relative, sep } from "node:path";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("../dist/", import.meta.url));
assert.ok(existsSync(root), "Run npm run build before check:dist");
const htmlFiles = [];
const cssFiles = [];
function walk(dir) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const path = resolve(dir, entry.name);
    if (entry.isDirectory()) walk(path);
    else if (entry.name.endsWith(".html")) htmlFiles.push(path);
    else if (entry.name.endsWith(".css")) cssFiles.push(path);
  }
}
walk(root);
assert.ok(htmlFiles.length, "No generated pages found");
const failures = [];
const home = readFileSync(resolve(root, "index.html"), "utf8");
const canonical = home.match(/<link\b[^>]*rel="canonical"[^>]*href="([^"]+)"/);
assert.ok(canonical, "Homepage canonical missing");
const homeUrl = new URL(canonical[1]);
const origin = homeUrl.origin;
const base = homeUrl.pathname.endsWith("/") ? homeUrl.pathname : `${homeUrl.pathname}/`;
function checkAsset(value, file) {
  if (!value || /^(?:[a-z][a-z\d+.-]*:|\/\/|#)/i.test(value)) return;
  const url = new URL(value.replaceAll("&amp;", "&"), origin + base + relative(root, file).split(sep).join("/"));
  if (!url.pathname.startsWith(base)) { failures.push(`${relative(root, file)}: outside base: ${value}`); return; }
  const local = resolve(root, decodeURIComponent(url.pathname.slice(base.length)));
  if (!local.startsWith(root) || !existsSync(local)) failures.push(`${relative(root, file)}: missing asset ${value}`);
}
for (const file of htmlFiles) {
  const html = readFileSync(file, "utf8");
  if (!/<meta\b[^>]*name="description"/.test(html)) failures.push(`${relative(root, file)}: description missing`);
  if (!/<link\b[^>]*rel="canonical"/.test(html)) failures.push(`${relative(root, file)}: canonical missing`);
  for (const match of html.matchAll(/<(?:script|img)\b[^>]*\bsrc="([^"]*)"/g)) checkAsset(match[1], file);
  for (const match of html.matchAll(/<link\b[^>]*>/g)) {
    if (/rel="(?:icon|stylesheet|preload)"/.test(match[0])) {
      const href = match[0].match(/href="([^"]+)"/);
      if (href) checkAsset(href[1], file);
    }
  }
}
for (const file of cssFiles) {
  for (const match of readFileSync(file, "utf8").matchAll(/url\(\s*["']?([^\s)"']+)["']?\s*\)/g)) checkAsset(match[1], file);
}
const notFound = readFileSync(resolve(root, "404.html"), "utf8");
assert.match(notFound, /name="robots" content="noindex, follow"/);
const sitemap = readFileSync(resolve(root, "sitemap-0.xml"), "utf8");
assert.ok(!/<loc>[^<]*\/404(?:\.html)?\/?<\/loc>/.test(sitemap), "404 leaked into sitemap");
const robots = readFileSync(resolve(root, "robots.txt"), "utf8");
assert.ok(robots.includes(`Sitemap: ${origin}${base}sitemap-index.xml`), "robots sitemap ignores deployment URL/base");
const searchPath = resolve(root, "search.json");
if (existsSync(searchPath)) {
  const text = readFileSync(searchPath, "utf8");
  // Static 404 responses may be emitted when local search is disabled.
  if (text.startsWith("{")) for (const post of JSON.parse(text).posts) {
    assert.ok(post.url.startsWith(base), `Search URL outside base: ${post.url}`);
    assert.ok(existsSync(resolve(root, decodeURIComponent(post.url.slice(base.length)), "index.html")), `Search points to missing post: ${post.url}`);
  }
}
assert.equal(failures.length, 0, failures.join("\n"));
console.log(`[dist] OK — ${htmlFiles.length} pages, local resources, search routes and SEO metadata verified (base ${base}).`);
