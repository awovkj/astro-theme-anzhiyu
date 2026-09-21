"use strict";
/**
 * 防漂移校验：src/styles/theme.css 是从 stylus/ + src/config/_config.yml 编译出来的
 * 产物，但两者都在 git 里。改了 stylus 却忘记 `npm run compile:css` 时，线上会静默
 * 沿用旧样式，没有任何机制会发现 —— 这个脚本负责发现。
 *
 * 做法：重新编译一次，与仓库里的版本逐字节比对。
 * CI 里由 `npm run validate` 触发（withastro/action 的 build-cmd）。
 *
 * 用法：node scripts/check-css-drift.cjs
 */
const fs = require("fs");
const path = require("path");
const { spawnSync } = require("child_process");

const ROOT = path.resolve(__dirname, "..");
const OUT = path.join(ROOT, "src", "styles", "theme.css");

if (!fs.existsSync(OUT)) {
  console.error(`[css-drift] 找不到 ${OUT}，先跑一次 npm run compile:css`);
  process.exit(1);
}

const before = fs.readFileSync(OUT, "utf8");

const res = spawnSync(process.execPath, [path.join(__dirname, "compile-css.cjs")], {
  cwd: ROOT,
  stdio: ["ignore", "pipe", "pipe"],
  encoding: "utf8",
});

if (res.status !== 0) {
  console.error("[css-drift] 重新编译 theme.css 失败：");
  console.error(String(res.stderr || res.stdout || "").trim());
  process.exit(1);
}

const after = fs.readFileSync(OUT, "utf8");

if (before !== after) {
  // 刻意保留重新编译后的文件，方便直接 git add 提交，而不是让人再跑一遍。
  console.error(
    "[css-drift] src/styles/theme.css 与 stylus/ 源不一致。\n" +
      "           你已经改过 stylus/ 或 src/config/_config.yml，但没有重新编译。\n" +
      "           已就地重新编译，请检查后提交：git add src/styles/theme.css\n"
  );
  process.exit(1);
}

console.log(`[css-drift] OK — theme.css 与 stylus/ 源一致（${(before.length / 1024).toFixed(1)} KB）`);
