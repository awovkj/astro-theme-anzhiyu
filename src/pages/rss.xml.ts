import rss from "@astrojs/rss";
import type { APIContext } from "astro";
import { loadData, sortedPosts } from "../lib/collections";
import { site } from "../lib/site";
import { url_for } from "../lib/helpers";

/**
 * RSS 订阅源。本主题是纯静态输出，所以这是一条构建期路由，产物为 /rss.xml。
 *
 * loadData() 已经过滤掉 hide / public: false 的文章，所以未发布内容不会从
 * 订阅源泄漏出去 —— 和 search.json.ts 共用同一条数据层，保持一致。
 *
 * 输出地址由 astro.config.mjs 的 `site` 决定，模板默认 https://example.com，
 * 部署前记得改。
 */
export async function GET(context: APIContext) {
  const data = await loadData();
  const posts = sortedPosts(data.posts);

  return rss({
    title: site.title,
    description: site.description,
    site: context.site ?? site.url,
    items: posts.map((post) => ({
      title: post.title,
      // url_for 返回根相对路径，@astrojs/rss 会基于 site 解析成绝对地址。
      link: url_for(post.path),
      pubDate: post.date,
      description: post.description || "",
      categories: post.tags,
    })),
    customData: `<language>${site.language.toLowerCase()}</language>`,
  });
}
