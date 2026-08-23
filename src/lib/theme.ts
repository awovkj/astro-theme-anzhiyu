import yaml from "js-yaml";
// Vite loads the YAML as a raw string; we parse it once at build time.
import themeYaml from "../config/_config.yml?raw";

/**
 * The full theme configuration, parsed 1:1 from the original Hexo theme's
 * `_config.yml` (copied to src/config/_config.yml). Edit that file to change
 * the theme behaviour, exactly like the original.
 */
export const theme: Record<string, any> = (yaml.load(themeYaml) as Record<string, any>) || {};

/** Serialise the theme config to JSON for the client-side runtime (window.__ANZHIYU_CONFIG__). */
export function themeConfigJSON(): string {
  return JSON.stringify(theme);
}
