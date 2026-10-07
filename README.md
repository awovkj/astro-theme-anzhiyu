# Astro Theme · 安知鱼 (AnZhiYu)

将 Hexo 主题 **anzhiyu** 重构为 [Astro](https://astro.build) 主题的版本。**样式（CSS）完整保留**，HTML 结构与 class 名与原主题一致，仅把 Pug 模板与 Hexo 运行时替换为 Astro 组件与内容集合。

> 样式优先：所有视觉风格来自原始主题 `source/css` 中的 Stylus，经 `scripts/compile-css.cjs` 编译为 `src/styles/theme.css`，逐字保留，未做改写。

## 目录结构

```
astro-theme-anzhiyu/
├─ astro.config.mjs            # Astro 配置
├─ package.json
├─ tsconfig.json
├─ scripts/
│  ├─ compile-css.cjs          # 把原主题 Stylus 编译为 theme.css（带 hexo-config 求值）
│  ├─ check-dist.mjs          # 验证产物中的资源、搜索路由和 SEO 元数据
│  ├─ check-font-coverage.cjs  # 字体覆盖：页面用到的字是否都被子集字体收录
│  ├─ subset-font.cjs          # 字体子集化（源字体放 scripts/fonts/，不入库）
│  └─ subset-extra.py          # 生成 unicode-range 分流的补字字体
├─ stylus/                     # 原主题 Stylus 源（已入库，编译的唯一数据源）
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
│  │  ├─ Head / Header / Footer / Sidebar / Aside
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
│  │  ├─ rss.xml.ts            # RSS 订阅源（构建期路由）
│  │  ├─ robots.txt.ts         # robots.txt（从 site 推导 Sitemap 地址）
│  │  ├─ search.json.ts        # 本地搜索索引
│  │  └─ 404.astro
│  ├─ content/
│  │  ├─ posts/*.md            # 文章
│  │  ├─ pages/*.md            # 页面（示例 about）
│  │  └─ templates/            # 新建文章/页面的 frontmatter 模板
│  └─ scripts/
│     └─ theme.ts              # 客户端运行时（暗色切换/滚动/抽屉等）
└─ public/                     # 静态资源（可选）
```

## 快速开始

需要 Node.js 22.12.0 或更高版本。

```bash
npm ci
npm run dev        # 本地预览 http://localhost:4321
npm run build      # 产物输出到 dist/
npm run check      # Astro / TypeScript 静态检查
npm run check:css  # 防漂移：theme.css 是否与 stylus/ 源一致
npm run check:font # 字体覆盖：页面用到的字是否都被子集字体收录（需 fontTools）
npm run test       # Node 内置测试：URL、内容排序、日期、只读 CSS 校验
npm run check:dist # 构建后检查本地资源、搜索路由、SEO
npm run validate   # test + check + check:css + build + check:dist
npm run preview    # 预览构建产物
```

## 部署前必改

**域名**统一在 `astro.config.mjs` 的 `site` 配置，不再需要同步修改第二个回退值。也可在构建进程中设置 `SITE_URL` 环境变量；子路径部署设置 `BASE_PATH`（例如 `/blog/`）。这些变量在构建时生效，更改后必须重新构建。

PowerShell 示例：

```powershell
$env:SITE_URL = "https://your-domain.com"
$env:BASE_PATH = "/blog/"  # 根目录部署时省略
npm run validate
```

Bash / CI 示例：

```bash
SITE_URL=https://your-domain.com BASE_PATH=/blog/ npm run validate
```

`src/lib/site.ts` 里的 `title` / `author` / `avatar` / `index_per_page` / `date_format` 可以按需替换（模板默认保留主题作者 `awovkj` 的信息与示例头像）。改完跑一次 `npm run validate` 确认产物正确。

## 配置

- **主题外观**：编辑 `src/config/_config.yml`（与原 Hexo 主题 `_config.yml` 完全一致，已整体复制）。
- **站点信息**：编辑 `src/lib/site.ts`（标题、作者、语言、头像、favicon、目录名等）。
- **图标字体**：已自托管在 `public/iconfont/`（安知鱼官方图标字体的本地副本，同源加载，无第三方 CDN）；如需替换为自己的图标字体地址，修改 `src/components/Head.astro` 中的 `iconfontCss`。
- **写文章**：在 `src/content/posts/` 新建 `.md`（可从 `src/content/templates/post.md` 复制模板），front-matter 支持 `title / slug / date / updated / tags / categories / keywords / cover / description / comments / top / top_group_index / swiper_index / hide / public` 等。
  - `slug`：**可选**，显式指定 URL 路径。不填时沿用 Astro 从文件名生成的 id —— 中文会被保留，但**括号等标点会被吃掉、拉丁字母会被小写化**（`学习日记-1(命令执行篇).md` → `/posts/学习日记-1命令执行篇/`）。需要干净 URL 就显式写。
  - `top`：置顶优先级，**数字越大越靠前**。
  - `swiper_index` / `top_group_index`：首页轮播图 / 右侧卡片组的顺序，**数字越小越靠前**。
  - `public: false`：视为未发布，不进入列表/搜索/归档/RSS，也不生成文章页面。
  - `hide: true`：仅在列表中隐藏，文章页仍然生成。

## 与原主题的对应关系

| 原 Hexo 文件 | 新 Astro 文件 |
| --- | --- |
| `layout/includes/layout.pug` | `src/layouts/Base.astro` |
| `layout/includes/head.pug` | `src/components/Head.astro` |
| `layout/includes/header/*` | `src/components/Header.astro` |
| `layout/includes/sidebar.pug` | `src/components/Sidebar.astro` |
| `layout/includes/widget/*` | `src/components/Aside.astro` |
| `layout/includes/rightside.pug` | 导航栏及 `src/scripts/theme.ts` |
| `layout/includes/mixins/post-ui.pug` | `src/components/PostCard.astro` |
| `scripts/helpers/*.js` | `src/lib/helpers.ts` |
| `source/css/*.styl` | `src/styles/theme.css`（编译产物） |

## 已保留 / 已简化

**保留**：完整 CSS 与视觉风格；文章列表、侧边栏小部件（作者/公告/微信/最近文章/分类/标签/归档/站点信息/目录）、首页顶栏、暗色主题、404 页、归档/标签/分类/页面路由。

**简化（与原 Hexo 运行时耦合，未 1:1 移植）**：

- 原主题依赖 pjax 做无刷新跳转，本静态版改为原生链接；客户端交互统一收敛到 `src/scripts/theme.ts`（暗色切换、滚动进度、返回顶部、侧栏/抽屉开关等）。
- 本地搜索已接入 `search.json`，支持失败重试与键盘操作；Twikoo/Waline 已保留初始化逻辑，但必须提供有效的服务配置。Algolia、Valine、播放器和其他原主题扩展并非全部完整移植，不能仅打开 YAML 开关就假定功能已接通。
- 文章字数/阅读时长、TOC 由 `src/lib/helpers.ts` 在构建期计算，逻辑与原 helper 一致。

## 重新编译样式

Stylus 源已入库（`stylus/` 目录）。若修改了 Stylus 源或 `src/config/_config.yml` 中影响样式的配置（`theme_color`、`aside`、`article_double_row`、`css_prefix` 等），执行：

```bash
npm run compile:css
```

会读取 `src/config/_config.yml` 作为 `hexo-config` 数据源（与运行时 `src/lib/theme.ts` 解析同一份文件），输出 `src/styles/theme.css`。

注：`css_prefix` 已置为 `false`——nib 不再注入 `-o-`/`-ms-`/`-moz-` 化石前缀（现代浏览器均不需要），如需恢复改为 `true` 再编译。

> **改了 stylus/ 或影响样式的配置，一定要重跑 `npm run compile:css`。** `theme.css` 是入库的编译产物，忘了重编译时页面会静默沿用旧样式 —— `npm run check:css` 就是拦这个的：它会重新编译一次并逐字节比对，不一致就报错；校验过程**只读，不会覆盖源码或产物**，需手动运行 `npm run compile:css` 后再提交。`npm run validate` 已经包含这一步。

## 许可

遵循原主题许可（GPL-3.0）。

## 质量检查与升级记录

- `npm run validate` 是本地及 CI 的统一质量入口；GitHub Actions 在 Node.js 22 / 24 下验证，并追加 `/blog/` 子路径构建检查。
- `npm run check:css` 只读检测样式漂移；修改 Stylus 后用 `npm run compile:css` 显式生成产物。
- `npm run check:dist` 会检查 HTML/CSS 的本地图片、字体、脚本和样式是否存在，并核对搜索链接与 SEO 元数据，不访问外部图床。
- `npm run check:font` 仍是可选项：需要 Python `fonttools` / `brotli`，以及重新子集化时使用的原始字体。缺少工具会提示跳过，不能视作字体覆盖验证通过。
- 本轮问题清单、优化取舍和后续建议见 [项目优化审查](docs/optimization-review.md)。
