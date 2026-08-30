/**
 * 自定义 Shiki 双主题配色（亮/暗）
 *
 * 配色思路：
 * - 沿用站点 catppuccin 的底色/前景（latte / mocha），与整站风格一致
 * - token 颜色弃用 catppuccin 原版（字符串为绿色，SQL/PHP payload 大段连续绿色）
 *   改为 latte/mocha 的多彩点缀：字符串蓝、关键字红、函数紫、数字橙、注释灰斜体
 * - 亮/暗两套一一对应，保证暗色模式观感一致
 */

const lightSettings = [
  { scope: ["comment", "punctuation.definition.comment"], settings: { foreground: "#7c7f93", fontStyle: "italic" } },
  { scope: ["string", "punctuation.definition.string", "string.quoted", "string.regexp"], settings: { foreground: "#1e66f5" } },
  { scope: ["keyword", "keyword.control", "keyword.operator.expression", "storage", "storage.type", "storage.modifier"], settings: { foreground: "#d20f39" } },
  { scope: ["entity.name.function", "support.function", "meta.function-call", "variable.function"], settings: { foreground: "#8839ef" } },
  { scope: ["entity.name.type", "entity.name.class", "support.class", "support.type", "entity.name.namespace"], settings: { foreground: "#8839ef" } },
  { scope: ["constant.numeric", "constant.language", "constant.character.escape", "constant.other.color"], settings: { foreground: "#fe640b" } },
  { scope: ["entity.name.tag", "meta.tag"], settings: { foreground: "#179299" } },
  { scope: ["entity.other.attribute-name"], settings: { foreground: "#df8e1d" } },
  { scope: ["variable.language", "variable.other"], settings: { foreground: "#4c4f69" } },
  { scope: ["support.constant", "support.variable"], settings: { foreground: "#04a5e5" } },
  { scope: ["invalid"], settings: { foreground: "#d20f39", fontStyle: "italic" } },
];

const darkSettings = [
  { scope: ["comment", "punctuation.definition.comment"], settings: { foreground: "#6c7086", fontStyle: "italic" } },
  { scope: ["string", "punctuation.definition.string", "string.quoted", "string.regexp"], settings: { foreground: "#89b4fa" } },
  { scope: ["keyword", "keyword.control", "keyword.operator.expression", "storage", "storage.type", "storage.modifier"], settings: { foreground: "#f38ba8" } },
  { scope: ["entity.name.function", "support.function", "meta.function-call", "variable.function"], settings: { foreground: "#cba6f7" } },
  { scope: ["entity.name.type", "entity.name.class", "support.class", "support.type", "entity.name.namespace"], settings: { foreground: "#cba6f7" } },
  { scope: ["constant.numeric", "constant.language", "constant.character.escape", "constant.other.color"], settings: { foreground: "#fab387" } },
  { scope: ["entity.name.tag", "meta.tag"], settings: { foreground: "#94e2d5" } },
  { scope: ["entity.other.attribute-name"], settings: { foreground: "#f9e2af" } },
  { scope: ["variable.language", "variable.other"], settings: { foreground: "#cdd6f4" } },
  { scope: ["support.constant", "support.variable"], settings: { foreground: "#89dceb" } },
  { scope: ["invalid"], settings: { foreground: "#f38ba8", fontStyle: "italic" } },
];

export const blogLightTheme = {
  name: "blog-light",
  type: "light",
  colors: {
    "editor.background": "#eff1f5",
    "editor.foreground": "#4c4f69",
  },
  settings: lightSettings,
};

export const blogDarkTheme = {
  name: "blog-dark",
  type: "dark",
  colors: {
    "editor.background": "#1e1e2e",
    "editor.foreground": "#cdd6f4",
  },
  settings: darkSettings,
};
