import test from "node:test";
import assert from "node:assert/strict";
import { withBase } from "../src/lib/urls.ts";
import { parseLaunchTime } from "../src/lib/runtime-date.ts";
import { buildThemeData, sortedPosts, chronologicalPosts, groupByYear } from "../src/lib/post-data.ts";

for (const [input, base, expected] of [
  [undefined, "/", "/"], ["", "/blog/", "/blog/"],
  ["posts/hello/", "/", "/posts/hello/"],
  ["/img/favicon.ico", "/blog/", "/blog/img/favicon.ico"],
  ["/blog/posts/hello/", "/blog/", "/blog/posts/hello/"],
  ["/blog", "/blog/", "/blog"],
  ["tags/中文/", "blog", "/blog/tags/中文/"],
  ["search.json?q=https://example.com", "/blog/", "/blog/search.json?q=https://example.com"],
  ["#toc", "/blog/", "#toc"],
  [" https://example.org/a ", "/blog/", "https://example.org/a"],
  ["//cdn.example.org/a", "/blog/", "//cdn.example.org/a"],
  ["mailto:me@example.org", "/", "mailto:me@example.org"],
]) {
  test(`URL ${String(input)} under ${base}`, () => assert.equal(withBase(input, base), expected));
}
for (const input of ["javascript:alert(1)", " JavaScript:alert(1)", "java\tscript:alert(1)", "java\nscript:alert(1)", "data:text/html,x", "data:image/svg+xml,x", "vbscript:alert(1)", "\\evil.example/path"]) {
  test(`reject unsafe URL ${JSON.stringify(input)}`, () => assert.equal(withBase(input, "/blog/"), "#"));
}
test("allow base64 raster images", () => assert.equal(withBase("data:image/png;base64,YQ=="), "data:image/png;base64,YQ=="));

const post = (path, date, extra = {}) => ({ path, date: new Date(date), title: path, tags: [], categories: [], ...extra });
const posts = [post("old", "2024-01-01", { top: 10 }), post("new", "2026-01-01"), post("middle", "2025-01-01", { top: 1 })];
test("pinning applies to homepage but not chronological feeds", () => {
  assert.deepEqual(sortedPosts(posts).map(p => p.path), ["old", "middle", "new"]);
  assert.deepEqual(chronologicalPosts(posts).map(p => p.path), ["new", "middle", "old"]);
  assert.deepEqual(posts.map(p => p.path), ["old", "new", "middle"]);
});
test("archives are newest year first without mutating source", () => {
  assert.deepEqual(groupByYear(posts).map(g => g.year), [2026, 2025, 2024]);
  assert.deepEqual(groupByYear([]), []);
});
test("duplicate labels count only once per post and paths are encoded", () => {
  const data = buildThemeData([post("a", "2026-01-01", { tags: ["中文 & Astro", "中文 & Astro"], categories: ["A", "A"] })]);
  assert.deepEqual(data.tags, [{ name: "中文 & Astro", length: 1, path: "tags/" + encodeURIComponent("中文 & Astro") + "/" }]);
  assert.equal(data.categories[0].length, 1);
  assert.deepEqual(buildThemeData([]), { posts: [], tags: [], categories: [] });
});
for (const value of ["2021/04/01 11:08:06", "04/01/2021 11:08:06", "2021-04-01 11:08:06"]) {
  test(`runtime launch preserves clock for ${value}`, () => {
    const result = parseLaunchTime(value);
    assert.deepEqual([result.getFullYear(), result.getMonth(), result.getDate(), result.getHours(), result.getMinutes(), result.getSeconds()], [2021, 3, 1, 11, 8, 6]);
  });
}
test("runtime parser preserves ISO timezone and rejects invalid strings", () => {
  assert.equal(parseLaunchTime("2021-04-01T11:08:06+08:00").toISOString(), "2021-04-01T03:08:06.000Z");
  assert.ok(Number.isNaN(+parseLaunchTime("not a date")));
});
