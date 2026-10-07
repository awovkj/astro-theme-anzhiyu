import { defineConfig } from "astro/config";
import sitemap from "@astrojs/sitemap";
import remarkHexoTags from "./src/lib/remark-hexo-tags.mjs";
import { blogLightTheme, blogDarkTheme } from "./src/lib/shiki-themes.mjs";
import { unified } from "@astrojs/markdown-remark";

// AnZhiYu Astro theme — core configuration.
// The visual styling lives in src/styles/theme.css (compiled 1:1 from the original
// Hexo theme's Stylus sources via `npm run compile:css`), so the look is unchanged.
export default defineConfig({
  // Deployment URL: edit here, or set SITE_URL in the build environment.
  site: process.env.SITE_URL || "https://example.com",
  base: process.env.BASE_PATH || "/",
  trailingSlash: "ignore",
  build: {
    format: "directory",
  },
  integrations: [
    // 产物：sitemap-index.xml + sitemap-0.xml（由 src/pages/robots.txt.ts 指向 index）。
    // 404 页不该被收录，过滤掉。
    sitemap({
      filter: (page) => !/(?:^|\/)404(?:\.html)?\/?$/.test(new URL(page).pathname),
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
  },
});
