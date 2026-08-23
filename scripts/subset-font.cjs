"use strict";
/**
 * 字体子集化：从全站内容（文章/配置/组件/语言包）收集字符集，
 * 将 public/font/hhh.ttf 裁剪为 woff2/woff/ttf 三格式子集。
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
const SRC = path.join(ROOT, "public", "font", "hhh.ttf");
const OUT_DIR = path.join(ROOT, "public", "font");

// 参与字符集收集的目录（全站文案来源）
const SCAN_DIRS = [
  path.join(ROOT, "src", "content"),
  path.join(ROOT, "src", "config"),
  path.join(ROOT, "src", "data"),
  path.join(ROOT, "src", "components"),
  path.join(ROOT, "src", "layouts"),
  path.join(ROOT, "src", "lib", "languages"),
];
const EXTS = new Set([".md", ".yml", ".astro", ".ts"]);

if (!fs.existsSync(SRC)) {
  console.error(`[subset-font] 源字体不存在: ${SRC}`);
  process.exit(1);
}

// 1) 收集字符集
const chars = new Set();
function walk(d) {
  if (!fs.existsSync(d)) return;
  for (const e of fs.readdirSync(d, { withFileTypes: true })) {
    const p = path.join(d, e.name);
    if (e.isDirectory()) walk(p);
    else if (EXTS.has(path.extname(e.name))) {
      for (const c of fs.readFileSync(p, "utf8")) chars.add(c);
    }
  }
}
for (const d of SCAN_DIRS) walk(d);

const text = [...chars].sort().join("");
const tmp = path.join(OUT_DIR, ".subset-chars.txt");
fs.writeFileSync(tmp, text, "utf8");
console.log(`字符集: ${chars.size} 字`);

// 2) 三格式子集化（fonttools）
const formats = [
  ["woff2", "--flavor=woff2", "--layout-features=*", "--glyph-names", "--symbol-cmap", "--legacy-cmap", "--notdef-glyph", "--notdef-outline", "--recommended-glyphs", "--name-IDs=*", "--name-legacy", "--name-languages=*"],
  ["woff", "--flavor=woff"],
  ["ttf"],
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
