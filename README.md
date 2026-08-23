# Astro Theme · 安知鱼 (AnZhiYu)

将 Hexo 主题 **anzhiyu** 重构为 [Astro](https://astro.build) 主题的版本。**样式（CSS）完整保留**，HTML 结构与 class 名与原主题一致，仅把 Pug 模板与 Hexo 运行时替换为 Astro 组件与内容集合。

> 样式优先：所有视觉风格来自原始主题 `source/css` 中的 Stylus，经 `scripts/compile-css.js` 编译为 `src/styles/theme.css`，逐字保留，未做改写。

## 目录结构

```
astro-theme-anzhiyu/
├─ astro.config.mjs            # Astro 配置
├─ package.json
├─ tsconfig.json
├─ scripts/
│  └─ compile-css.js           # 把原主题 Stylus 编译为 theme.css（带 hexo-config 求值）
├─ src/
│  ├─ config/
│  │  ├─ _config.yml           # 原样复制的主题配置（编辑它即可改主题行为）
│  │  └─ languages/            # 原样复制的 i18n（default / zh-CN / zh-TW / en）
│  ├─ styles/
│  │  └─ theme.css             # 编译后的样式（与原始 CSS 一致）
│  ├─ lib/                     # 主题逻辑（无 Hexo 依赖）
│  │  ├─ theme.ts              # 解析 _config.yml
│  │  ├─ site.ts               # 站点信息（标题/作者/语言…）
│  │  ├─ i18n.ts               # _p() 翻译
│  │  ├─ helpers.ts            # url_for / 日期 / cloudTags / aside_* 等
│  │  ├─ collections.ts        # 内容集合数据层（posts/tags/categories）
│  │  └─ globalConfig.ts       # GLOBAL_CONFIG / GLOBAL_CONFIG_SITE
│  ├─ components/              # 与原 include 一一对应的组件
│  │  ├─ Head / Header / Footer / Sidebar / Aside / Rightside
│  │  ├─ Music / Loading / Popup / TopHome / PostCard
│  ├─ layouts/
│  │  └─ Base.astro            # 对应原 layout.pug
│  ├─ pages/                   # 路由
│  │  ├─ index.astro           # 首页文章列表
│  │  ├─ posts/[...slug].astro # 文章页（含 TOC）
│  │  ├─ [...slug].astro       # 独立页面（about 等）
│  │  ├─ archives/index.astro
│  │  ├─ tags/index.astro + tags/[tag].astro
│  │  ├─ categories/index.astro + categories/[category].astro
│  │  └─ 404.astro
│  ├─ content/
│  │  ├─ posts/*.md            # 文章（示例 3 篇）
│  │  └─ pages/*.md            # 页面（示例 about）
│  └─ scripts/
│     └─ theme.ts              # 客户端运行时（暗色切换/滚动/抽屉等）
└─ public/                     # 静态资源（可选）
```

## 快速开始

```bash
npm install
npm run dev        # 本地预览 http://localhost:4321
npm run build      # 产物输出到 dist/
npm run preview    # 预览构建产物
```

## 配置

- **主题外观**：编辑 `src/config/_config.yml`（与原 Hexo 主题 `_config.yml` 完全一致，已整体复制）。
- **站点信息**：编辑 `src/lib/site.ts`（标题、作者、语言、头像、favicon、目录名等）。
- **图标字体**：默认从 `cdn.cbd.int` 加载安知鱼图标字体；也可在 `src/config/_config.yml` 的 `theme.asset.ali_iconfont_css` 指定自己的链接。
- **写文章**：在 `src/content/posts/` 新建 `.md`，front-matter 支持 `title / date / updated / tags / categories / cover / description / top_group_index / swiper_index` 等。

## 与原主题的对应关系

| 原 Hexo 文件 | 新 Astro 文件 |
| --- | --- |
| `layout/includes/layout.pug` | `src/layouts/Base.astro` |
| `layout/includes/head.pug` | `src/components/Head.astro` |
| `layout/includes/header/*` | `src/components/Header.astro` |
| `layout/includes/sidebar.pug` | `src/components/Sidebar.astro` |
| `layout/includes/widget/*` | `src/components/Aside.astro` |
| `layout/includes/rightside.pug` | `src/components/Rightside.astro` |
| `layout/includes/mixins/post-ui.pug` | `src/components/PostCard.astro` |
| `scripts/helpers/*.js` | `src/lib/helpers.ts` |
| `source/css/*.styl` | `src/styles/theme.css`（编译产物） |

## 已保留 / 已简化

**保留**：完整 CSS 与视觉风格；文章列表、侧边栏小部件（作者/公告/微信/最近文章/分类/标签/归档/站点信息/目录）、首页顶栏、暗色主题、404 页、归档/标签/分类/页面路由。

**简化（与原 Hexo 运行时耦合，未 1:1 移植）**：

- 原主题依赖 pjax 做无刷新跳转，本静态版改为原生链接；客户端交互统一收敛到 `src/scripts/theme.ts`（暗色切换、滚动进度、返回顶部、侧栏/抽屉开关等）。
- 第三方功能（Algolia / 本地搜索、评论系统 Valine/Waline/Twikoo、音乐播放器 Meting、统计 busuanzi 等）保留了对应 DOM 与配置位，但需自行接入对应前端脚本/后端服务才会真正工作。
- 文章字数/阅读时长、TOC 由 `src/lib/helpers.ts` 在构建期计算，逻辑与原 helper 一致。

## 重新编译样式

若修改了原主题 `source/css`（本仓库未自带，需从原 Hexo 主题复制），可执行：

```bash
npm run compile:css
```

会自动读取 `src/config/_config.yml` 作为 `hexo-config` 数据源，输出 `src/styles/theme.css`。

## 许可

遵循原主题许可（GPL-3.0）。
