import yaml from "js-yaml";
// Vite loads the YAML as a raw string; we parse it once at build time,
// mirroring the pattern used by src/lib/theme.ts for the theme config.
import essayYaml from "../data/essay.yml?raw";
import linksYaml from "../data/links.yml?raw";

/* ------------------------------------------------------------------ *
 *  即刻短文 (essay)  — mirrors site.data.essay consumed by
 *  layout/includes/page/essay.pug in the original Hexo theme.
 * ------------------------------------------------------------------ */

export interface EssayItem {
  content: string;
  date: string;
  image?: string[];
  video?: string[];
  aplayer?: { id: string; server: string };
  link?: string;
  from?: string;
  address?: string;
}

export interface EssayGroup {
  top_background?: string;
  title: string;
  subTitle: string;
  tips: string;
  buttonLink: string;
  buttonText: string;
  limit: number;
  essay_list: EssayItem[];
}

/* ------------------------------------------------------------------ *
 *  友情链接 (flink) — mirrors site.data.link consumed by
 *  layout/includes/page/flink.pug and scripts/tag/flink.js.
 * ------------------------------------------------------------------ */

export interface LinkItem {
  name: string;
  link: string;
  avatar: string;
  descr: string;
  siteshot?: string;
  tag?: string;
  color?: string;
  recommend?: boolean;
}

export interface LinkGroup {
  class_name?: string;
  class_desc?: string;
  flink_style?: string;
  lost_contact?: boolean;
  hundredSuffix?: string;
  link_list: LinkItem[];
}

const essayData = (yaml.load(essayYaml) as EssayGroup[] | null) || [];
const linkData = (yaml.load(linksYaml) as LinkGroup[] | null) || [];

/** Return the full essay dataset (array of groups, each with a header card + essay_list). */
export function getEssayList(): EssayGroup[] {
  return essayData;
}

/** Return the full friend-link dataset (array of grouped card walls). */
export function getLinkList(): LinkGroup[] {
  return linkData;
}
