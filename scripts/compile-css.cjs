"use strict";
/**
 * Compile the anzhiyu theme Stylus (source/css/index.styl) into a single CSS file,
 * reproducing Hexo's `hexo-config(...)` behaviour so the styling is byte-faithful.
 *
 * Run: npm run compile:css
 *
 * hexo-config 数据源为 src/config/_config.yml（与运行时 src/lib/theme.ts 同一份），
 * 修改 _config.yml 后重新编译即可生效。
 */
const fs = require("fs");
const path = require("path");
const yaml = require("js-yaml");
const stylus = require("stylus");
const nib = require("nib");
const csso = require("csso");

// Stylus 源已内置到仓库 stylus/ 目录（自包含，无外部仓库依赖）。
// 如需试验其他来源，可用环境变量 ANZHIYU_STYLUS_SRC 覆盖。
const SRC = process.env.ANZHIYU_STYLUS_SRC
  ? path.resolve(process.env.ANZHIYU_STYLUS_SRC)
  : path.resolve(__dirname, "..", "stylus", "index.styl");
const OUT = path.resolve(__dirname, "..", "src", "styles", "theme.css");

// hexo-config data source: the real theme config, kept in sync with the runtime
// (src/lib/theme.ts parses the same file).
const CONFIG_PATH = path.resolve(__dirname, "..", "src", "config", "_config.yml");
const cfg = yaml.load(fs.readFileSync(CONFIG_PATH, "utf8")) || {};

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

    // 单级压缩：csso restructure——结构级重组，合并分散的重复选择器（如 .content×14）。
    // 失败回退未压缩版本，保证编译链不中断。
    try {
      const out = csso.minify(css, { restructure: true }).css;
      fs.writeFileSync(OUT, out);
      console.log(
        `Compiled theme.css -> ${OUT} (${(css.length / 1024).toFixed(1)} KB -> ${(out.length / 1024).toFixed(1)} KB, -${(100 - (out.length / css.length) * 100).toFixed(1)}%)`
      );
    } catch (e) {
      fs.writeFileSync(OUT, css);
      console.warn("minify failed, wrote unminified css:", e.message);
    }
  });
