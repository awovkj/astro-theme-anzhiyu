import { defineConfig } from "astro/config";
import remarkHexoTags from "./src/lib/remark-hexo-tags.mjs";

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
    remarkPlugins: [remarkHexoTags],
    shikiConfig: {
      // 双主题：浅色 catppuccin-latte / 深色 catppuccin-mocha（运行时按 data-theme 切换）
      themes: {
        light: "catppuccin-latte",
        dark: "catppuccin-mocha",
      },
    },
  },
  vite: {
    css: {
      preprocessorOptions: {
        // We ship pre-compiled CSS; this is only a safety net.
      },
    },
  },
});
