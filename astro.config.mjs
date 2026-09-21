import { defineConfig } from "astro/config";
import sitemap from "@astrojs/sitemap";
import remarkHexoTags from "./src/lib/remark-hexo-tags.mjs";
import { blogLightTheme, blogDarkTheme } from "./src/lib/shiki-themes.mjs";
import { unified } from "@astrojs/markdown-remark";

// AnZhiYu Astro theme — core configuration.
// The visual styling lives in src/styles/theme.css (compiled 1:1 from the original
// Hexo theme's Stylus sources via `npm run compile:css`), so the look is unchanged.
export default defineConfig({
  // ⚠️ 部署前必须改成你自己的域名（含协议，结尾不要带 /）。
  // 它决定 sitemap、RSS、robots.txt 以及文章内绝对链接（版权模块/分享）里用的地址。
  // 同时记得同步 src/lib/site.ts 的 url 回退值。
  site: "https://example.com",
  trailingSlash: "ignore",
  build: {
    format: "directory",
  },
  integrations: [
    // 产物：sitemap-index.xml + sitemap-0.xml（由 src/pages/robots.txt.ts 指向 index）。
    // 404 页不该被收录，过滤掉。
    sitemap({
      filter: (page) => !page.includes("/404"),
    }),
  ],
  markdown: {
    processor: unified({ remarkPlugins: [remarkHexoTags] }),
    shikiConfig: {
      // 双主题：自定义 blog-light / blog-dark（运行时按 data-theme 切换）
      // 配色见 src/lib/shiki-themes.mjs —— 沿用 catppuccin 底色/前景，
      // token 重新着色：字符串蓝/关键字红/函数紫/数字橙，避免大段连续绿色
      themes: {
        light: blogLightTheme,
        dark: blogDarkTheme,
      },
    },
  },
  vite: {
    build: {
      // The legacy theme CSS uses syntax that lightningcss rejects.
      cssMinify: "esbuild",
    },
    css: {
      preprocessorOptions: {
        // We ship pre-compiled CSS; this is only a safety net.
      },
    },
  },
});
