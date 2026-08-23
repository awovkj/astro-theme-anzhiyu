import yaml from "js-yaml";
import defaultYaml from "../config/languages/default.yml?raw";
import zhCNYaml from "../config/languages/zh-CN.yml?raw";
import zhTWYaml from "../config/languages/zh-TW.yml?raw";
import enYaml from "../config/languages/en.yml?raw";
import { site } from "./site";

type Dict = Record<string, any>;

function flatten(obj: any, prefix = "", out: Dict = {}): Dict {
  for (const k of Object.keys(obj || {})) {
    const val = obj[k];
    const key = prefix ? `${prefix}.${k}` : k;
    if (val && typeof val === "object" && !Array.isArray(val)) {
      flatten(val, key, out);
    } else {
      out[key] = val;
    }
  }
  return out;
}

const dicts: Record<string, Dict> = {
  default: flatten(yaml.load(defaultYaml) || {}),
  "zh-CN": flatten(yaml.load(zhCNYaml) || {}),
  "zh-TW": flatten(yaml.load(zhTWYaml) || {}),
  en: flatten(yaml.load(enYaml) || {}),
};

const lang = site.language || "zh-CN";
const primary = dicts[lang] || dicts["zh-CN"];
const fallback = dicts.default;

/**
 * Translate a dotted key, e.g. _p('aside.articles').
 * Mirrors the original Hexo `_p()` — unknown keys return the key itself,
 * so literal strings like _p('回到主页') pass through unchanged.
 */
export function _p(key: string): string {
  if (key in primary) return String(primary[key]);
  if (key in fallback) return String(fallback[key]);
  return key;
}

export const i18n = { _p, dicts, lang };
