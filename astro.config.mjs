import { defineConfig } from "astro/config";
import remarkHexoTags from "./src/lib/remark-hexo-tags.mjs";
import { blogLightTheme, blogDarkTheme } from "./src/lib/shiki-themes.mjs";
import { unified } from "@astrojs/markdown-remark";

// AnZhiYu Astro theme — core configuration.
// The visual styling lives in src/styles/theme.css (compiled 1:1 from the original
// Hexo theme's Stylus sources via `npm run compile:css`), so the look is unchanged.
export default defineConfig({
  site: "https://example.com",
  trailingSlash: "ignore",
  build: {
    format: "directory",
  },
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
