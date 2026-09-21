"use strict";
/**
 * 字体覆盖守卫：检查「页面实际会渲染的字符」是否都被 hhh 子集字体收录。
 *
 * 为什么需要它：subset-font.cjs 扫的是源码 + dist 产物，新增文章/文案后忘了重跑，
 * 缺的字会静默回退到系统字体 —— 页面上看不出来，只有对比才发现。所以做成可重复执行的检查。
 *
 * 依赖 fontTools（与 npm run subset:font 相同）：
 *   python -m pip install fonttools brotli
 * 也可以设 PYTHON 环境变量指定解释器路径。
 *
 * 用法：
 *   npm run build && npm run check:font      # dist 存在时以 dist 为准（最准确）
 *   node scripts/check-font-coverage.cjs --strict   # fontTools 缺失时也判定失败（给 CI 用）
 *
 * 注意：本脚本只读不写，不会改动 public/font/ 下的字体文件。
 */
const fs = require("fs");
const path = require("path");
const { spawnSync } = require("child_process");

const ROOT = path.resolve(__dirname, "..");
const FONT = path.join(ROOT, "public", "font", "hhh-subset.woff2");
const DIST = path.join(ROOT, "dist");
const STRICT = process.argv.includes("--strict");

// dist 存在时只扫 dist：它是最终展示文本的完整真源，能兜住源码扫描覆盖不到的
// 动态拼接与 HTML 实体解码。dist 不存在时回退扫源码。
const DIST_EXTS = new Set([".html", ".htm", ".json"]);
const SRC_EXTS = new Set([".md", ".yml", ".yaml", ".astro", ".ts", ".mjs", ".js"]);
const SRC_DIRS = ["src", "stylus"].map((d) => path.join(ROOT, d));

function collect(dir, exts, into) {
  if (!fs.existsSync(dir)) return;
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) collect(p, exts, into);
    else if (exts.has(path.extname(e.name))) {
      for (const c of fs.readFileSync(p, "utf8")) into.add(c);
    }
  }
}

if (!fs.existsSync(FONT)) {
  console.error(`[font-coverage] 找不到字体产物 ${FONT}，先跑 npm run subset:font`);
  process.exit(1);
}

const usingDist = fs.existsSync(DIST);
const chars = new Set();
if (usingDist) collect(DIST, DIST_EXTS, chars);
else for (const d of SRC_DIRS) collect(d, SRC_EXTS, chars);

if (!chars.size) {
  console.error(`[font-coverage] 没扫到任何文本（来源：${usingDist ? "dist/" : "src/ + stylus/"}）`);
  process.exit(1);
}

// ---- 读取字体 cmap（需要 fontTools） ----
const py = process.env.PYTHON || "python";
const probe = spawnSync(py, ["-c", "import fontTools"], { encoding: "utf8" });
if (probe.status !== 0) {
  console.warn("[font-coverage] 未检测到 fontTools，跳过检查。");
  console.warn("               安装：python -m pip install fonttools brotli");
  console.warn("               或用 PYTHON=<解释器路径> 指定一个已装好 fontTools 的 python。");
  process.exit(STRICT ? 1 : 0);
}

const script = [
  "from fontTools.ttLib import TTFont",
  `f = TTFont(r"${FONT}")`,
  "for cp in sorted(f.getBestCmap().keys()):",
  "    print(cp)",
].join("\n");

const cmap = spawnSync(py, ["-c", script], { encoding: "utf8", maxBuffer: 32 * 1024 * 1024 });
if (cmap.status !== 0) {
  console.error("[font-coverage] 读取字体 cmap 失败：");
  console.error(String(cmap.stderr || "").trim());
  process.exit(1);
}

const covered = new Set(
  cmap.stdout.split(/\s+/).filter(Boolean).map((n) => Number(n)).filter((n) => Number.isFinite(n))
);

const BOM = 0xfeff;
const missing = [...chars]
  .map((c) => c.codePointAt(0))
  .filter((cp) => cp >= 0x20 && cp !== 0x7f && cp !== BOM && !covered.has(cp));

// 私用区（图标字体残留等）不算可读文本，单独归类，不参与失败判定。
const isPrivate = (cp) => (cp >= 0xe000 && cp <= 0xf8ff) || (cp >= 0xf0000 && cp <= 0x10fffd);
const visible = missing.filter((cp) => !isPrivate(cp));
const privateUse = missing.length - visible.length;

console.log(
  `[font-coverage] 来源 ${usingDist ? "dist/" : "src/ + stylus/"} · 字符 ${chars.size} · 字体收录 ${covered.size}`
);

if (privateUse > 0) {
  console.log(`[font-coverage] 私用区字符 ${privateUse} 个（已忽略，不参与判定）`);
}

if (!visible.length) {
  console.log("[font-coverage] OK — 无缺字。");
  process.exit(0);
}

console.error(`[font-coverage] 缺失可读字符 ${visible.length} 个，这些字会回退到系统字体：`);
console.error(
  "  " +
    visible
      .map((cp) => `${String.fromCodePoint(cp)}(U+${cp.toString(16).toUpperCase()})`)
      .join(" ")
);
console.error("\n修复：npm run build && npm run subset:font && npm run build");
process.exit(1);
