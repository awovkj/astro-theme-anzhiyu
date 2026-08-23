"use strict";
/**
 * Compile the anzhiyu theme Stylus (source/css/index.styl) into a single CSS file,
 * reproducing Hexo's `hexo-config(...)` behaviour so the styling is byte-faithful.
 *
 * Run: node scripts/compile-css.js
 */
const fs = require("fs");
const path = require("path");
const stylus = require("stylus");
const nib = require("nib");
const postcss = require("postcss");
const cssnano = require("cssnano");
const csso = require("csso");

// Stylus 源已内置到仓库 stylus/ 目录（自包含，无外部仓库依赖）。
// 如需试验其他来源，可用环境变量 ANZHIYU_STYLUS_SRC 覆盖。
const SRC = process.env.ANZHIYU_STYLUS_SRC
  ? path.resolve(process.env.ANZHIYU_STYLUS_SRC)
  : path.resolve(__dirname, "..", "stylus", "index.styl");
const OUT = path.resolve(__dirname, "..", "src", "styles", "theme.css");

// Mirror of the relevant _config.yml values that the Stylus layer reads.
const cfg = {
  css_prefix: true,
  algolia_search: { enable: false },
  local_search: false,
  theme_color: {
    enable: true,
    main: "#425AEF",
    dark_main: "#f2b94b",
    paginator: "#425AEF",
    text_selection: "#2128bd",
    link_color: "var(--anzhiyu-fontcolor)",
    meta_color: "var(--anzhiyu-fontcolor)",
    hr_color: "#4259ef23",
    code_foreground: "#fff",
    code_background: "var(--anzhiyu-code-stress)",
    toc_color: "#425AEF",
    scrollbar_color: "var(--anzhiyu-scrollbar)",
    blockquote_padding_color: undefined,
    blockquote_background_color: undefined,
    button_hover: undefined,
  },
  font: {
    "font-family": undefined,
    "code-font-family": "consolas, Menlo, \"PingFang SC\", \"Microsoft JhengHei\", \"Microsoft YaHei\", sans-serif",
    "global-font-size": "16px",
    "code-font-size": undefined,
  },
  blog_title_font: { "font-family": "PingFang SC, 'Hiragino Sans GB', 'Microsoft JhengHei', 'Microsoft YaHei', sans-serif" },
  hr_icon: { enable: true, icon: "\\f0c4", "icon-top": undefined },
  beautify: { enable: true, "title-prefix-icon": "\\f0c1", "title-prefix-icon-color": "#F47466", field: "post" },
  index_top_img_height: undefined,
  index_site_info_top: undefined,
  note: { light_bg_offset: 0, style: "flat", icons: true, border_radius: 3 },
  preloader: { enable: true },
  highlight_theme: "light",
  code_word_wrap: false,
  highlight_height_limit: 330,
  icons: { fontawesome: false },
  avatar: { effect: false },
  canvas_ribbon: { alpha: 0.6 },
  copy: { enable: true },
  table_interlaced_discoloration: false,
  lazyload: { enable: true, blur: true, progressive: true, placeholder: undefined },
  error_404: { enable: true },
  LA: { enable: false },
  aside: {
    position: "right",
    mobile: true,
    enable: true,
    card_categories: { expand: false, sort_order: undefined },
    card_recent_post: { sort_order: undefined },
    card_tags: { sort_order: undefined },
    card_archives: { sort_order: undefined },
    card_webinfo: { sort_order: undefined },
  },
  newest_comments: { sort_order: undefined },
  chat_btn: false,
  chatra: { enable: false },
  index_img: false,
  dynamicEffect: { postTopRollZoomInfo: false, postTopWave: true },
  mainTone: { enable: false },
  post_meta: {
    page: { date_type: "created", date_format: "simple", label: false },
    post: { label: true, date_format: "date" },
  },
  footer_bg: false,
  footer: { footerBar: { enable: true } },
  h2Divider: false,
  post_copyright: { avatarSinks: false },
  noticeOutdate: { style: "flat" },
  post_pagination: 2,
  ptool: { enable: true, mode: undefined, categories: false },
  valine: { bg: undefined },
  waline: { bg: undefined },
  katex: { hide_scrollbar: true },
  article_double_row: true,
  home_top: { swiper: { enable: false } },
  comments: { text: true },
  darkmode: { enable: true },
  display_mode: "light",
  readmode: true,
  nav_music: { enable: true, console_widescreen_music: false },
};

function get(obj, key) {
  // hexo-config supports dotted keys
  return key.split(".").reduce((o, k) => (o == null ? undefined : o[k]), obj);
}

// Stylus `convert()` chokes on CSS var() strings. hexo-renderer-stylus returns raw
// values; to stay faithful we expose var() strings as unquoted literals so convert()
// receives a bare token it can pass through.
function keyToString(node) {
  if (typeof node === "string") return node;
  if (node == null) return "";
  if (typeof node.val === "string") return node.val;
  if (typeof node.string === "string") return node.string;
  if (typeof node.name === "string") return node.name;
  return String(node);
}

function raw(v) {
  // Return raw JS values so Stylus auto-wraps them (mirrors hexo-renderer-stylus).
  // Objects are only ever used in `&&` boolean checks, so collapse to a truthy bool.
  if (v === null || v === undefined) return false;
  if (typeof v === "object") return true;
  return v;
}

function hexoConfig(keyNode) {
  return raw(get(cfg, keyToString(keyNode)));
}


const str = fs.readFileSync(SRC, "utf8");

stylus(str)
  .set("filename", SRC)
  .set("paths", [path.dirname(SRC)])
  .set("compress", false)
  .use(nib())
  .define("hexo-config", hexoConfig)
  .define("$highlight_enable", false)
  .define("$highlight_line_number", false)
  .define("$prismjs_enable", false)
  .define("$prismjs_line_number", false)
  .render((err, css) => {
    if (err) {
      console.error("Stylus compile error:\n", err.message);
      process.exit(1);
    }
    // Stylus passes plain-CSS imports through verbatim. Inline them here so the
    // output is a single self-contained file Vite can consume without resolvers.
    const cssDir = path.dirname(SRC);
    css = css.replace(/@import\s+'([^']+)';?\s*\n/g, (m, spec) => {
      if (spec.includes("*")) {
        const base = spec.split("*")[0];
        const dir = path.join(cssDir, base);
        const files = [];
        (function walk(d) {
          for (const e of fs.readdirSync(d, { withFileTypes: true })) {
            const p = path.join(d, e.name);
            if (e.isDirectory()) walk(p);
            else if (e.name.endsWith(".css")) files.push(p);
          }
        })(dir);
        return files.sort().map((f) => fs.readFileSync(f, "utf8")).join("\n") + "\n";
      }
      const f = path.join(cssDir, spec);
      if (fs.existsSync(f)) return fs.readFileSync(f, "utf8") + "\n";
      return m;
    });
    fs.mkdirSync(path.dirname(OUT), { recursive: true });

    // 两级压缩：
    // 1) cssnano — 合并相邻重复规则、压缩空白（关闭 calc/unicode/z-index 转换以保真）
    // 2) csso restructure — 结构级重组，合并分散的重复选择器（如 .content×14）
    // 任一步失败回退未压缩版本，保证编译链不中断。
    postcss([cssnano({ preset: ["default", { calc: false, normalizeUnicode: false, zindex: false }] })])
      .process(css, { from: undefined })
      .then((result) => csso.minify(result.css, { restructure: true }).css)
      .then((out) => {
        fs.writeFileSync(OUT, out);
        console.log(
          `Compiled theme.css -> ${OUT} (${(css.length / 1024).toFixed(1)} KB -> ${(out.length / 1024).toFixed(1)} KB, -${(100 - (out.length / css.length) * 100).toFixed(1)}%)`
        );
      })
      .catch((e) => {
        fs.writeFileSync(OUT, css);
        console.warn("minify failed, wrote unminified css:", e.message);
      });
  });
