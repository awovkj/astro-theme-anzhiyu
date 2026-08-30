"use strict";
/**
 * 字体子集化：从全站内容（文章/配置/组件/语言包）收集字符集，
 * 将 scripts/fonts/hhh.ttf（子集化源，不进构建产物）裁剪为 woff2 单格式。
 *
 * 前置：python -m pip install fonttools brotli
 * 运行：node scripts/subset-font.cjs
 *
 * 新增文章/文案后需重跑，否则未收录字符回退系统字体。
 */
const { execSync } = require("child_process");
const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
// 源字体放 scripts/fonts/（不参与 Astro 构建的 public 拷贝，避免 5.7MB 死重进 dist）
const SRC = path.join(__dirname, "fonts", "hhh.ttf");
const OUT_DIR = path.join(ROOT, "public", "font");

// 参与字符集收集的目录（全站文案来源，含页面路由与客户端脚本中的可见文案）
const SCAN_DIRS = [
  path.join(ROOT, "src", "content"),
  path.join(ROOT, "src", "config"),
  path.join(ROOT, "src", "data"),
  path.join(ROOT, "src", "components"),
  path.join(ROOT, "src", "layouts"),
  path.join(ROOT, "src", "pages"),
  path.join(ROOT, "src", "scripts"),
];
const EXTS = new Set([".md", ".yml", ".astro", ".ts", ".mjs", ".js"]);
// dist 渲染产物（若存在）也并入：构建后的 HTML/JSON 是最终展示文本的完整真源
// （能兜住源码扫描覆盖不到的动态拼接、HTML 实体解码等情况）。
// 完整流程：npm run build && npm run subset:font && npm run build
const DIST = path.join(ROOT, "dist");
const DIST_EXTS = new Set([".html", ".htm", ".json"]);

if (!fs.existsSync(SRC)) {
  console.error(`[subset-font] 源字体不存在: ${SRC}`);
  process.exit(1);
}

// 1) 收集字符集
const chars = new Set();
function walk(d, exts) {
  if (!fs.existsSync(d)) return;
  for (const e of fs.readdirSync(d, { withFileTypes: true })) {
    const p = path.join(d, e.name);
    if (e.isDirectory()) walk(p, exts);
    else if (exts.has(path.extname(e.name))) {
      for (const c of fs.readFileSync(p, "utf8")) chars.add(c);
    }
  }
}
for (const d of SCAN_DIRS) walk(d, EXTS);
walk(DIST, DIST_EXTS);

const text = [...chars].sort().join("");
const tmp = path.join(OUT_DIR, ".subset-chars.txt");
fs.writeFileSync(tmp, text, "utf8");
console.log(`字符集: ${chars.size} 字`);

// 2) woff2 单格式子集化（woff2 覆盖 98%+ 现代浏览器，无需 woff/ttf 回退）
const formats = [
  ["woff2", "--flavor=woff2", "--layout-features=*", "--glyph-names", "--symbol-cmap", "--legacy-cmap", "--notdef-glyph", "--notdef-outline", "--recommended-glyphs", "--name-IDs=*", "--name-legacy", "--name-languages=*"],
];
const sizes = [];
for (const [ext, ...extra] of formats) {
  const out = path.join(OUT_DIR, `hhh-subset.${ext}`);
  execSync(
    `python -m fontTools.subset "${SRC}" --text-file="${tmp}" --output-file="${out}" ${extra.join(" ")}`,
    { stdio: "pipe" }
  );
  sizes.push(`${ext}: ${(fs.statSync(out).size / 1024).toFixed(1)} KB`);
}
fs.unlinkSync(tmp);

const srcKB = (fs.statSync(SRC).size / 1024 / 1024).toFixed(2);
console.log(`hhh.ttf ${srcKB} MB → ${sizes.join(" | ")}`);

// 3) 补充字体：源字体本身缺失的字形（符号/花体/假名）从系统字体提取，
//    生成 hhh-extra-*.woff2 + src/styles/font-extra.css（unicode-range 分流）
execSync(`python "${path.join(__dirname, "subset-extra.py")}"`, { stdio: "inherit" });
