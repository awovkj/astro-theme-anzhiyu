import { theme } from "./theme";
import { site } from "./site";
import { _p } from "./i18n";

function rootPath(path: string): string {
  if (/^(?:https?:)?\/\//i.test(path)) return path;
  const root = site.root.replace(/\/$/, "");
  return `${root}/${path.replace(/^\//, "")}`.replace(/\/\//g, "/");
}

/**
 * launch_time 在 YAML 中可能是字符串（"04/01/2021"）或 Date（2025-10-10 11:08:06）。
 * Date 会被 JSON 序列化为 UTC ISO 串导致客户端时区偏移，这里统一还原为
 * 本地时区的 "YYYY/MM/DD HH:mm:ss" 文本。
 */
function normalizeLaunchTime(v: unknown): string {
  if (v instanceof Date) {
    const p = (n: number) => String(n).padStart(2, "0");
    return `${v.getFullYear()}/${p(v.getMonth() + 1)}/${p(v.getDate())} ${p(v.getHours())}:${p(v.getMinutes())}:${p(v.getSeconds())}`;
  }
  return v == null ? "" : String(v);
}

/**
 * Mirrors the original `GLOBAL_CONFIG` injected into <head> by
 * includes/head/config.pug. Only the fields the ported client runtime reads
 * are kept (the original also wired pjax/algolia/friends which are not part of
 * this static Astro port).
 */
export function globalConfig(): Record<string, any> {
  const t = theme as any;
  return {
    root: site.root,
    navMusic: !!(t.nav_music && t.nav_music.enable),
    diytitle: t.diytitle && t.diytitle.enable ? t.diytitle : undefined,
    preloader: t.preloader && t.preloader.enable ? { source: t.preloader.source } : undefined,
    subtitle: t.subtitle && t.subtitle.enable ? t.subtitle : undefined,
    indexImg: t.index_img && t.index_img !== false ? t.index_img : undefined,
    highlight: {
      plugin: "highlight.js",
      highlightCopy: t.highlight_copy !== false,
      highlightLang: t.highlight_lang !== false,
      highlightHeightLimit: t.highlight_height_limit || 0,
    },
    mainTone: t.mainTone && t.mainTone.enable ? t.mainTone : undefined,
    authorStatus: t.author_status && t.author_status.enable ? { skills: t.author_status.skills } : undefined,
    localSearch: t.local_search && t.local_search.enable
      ? { path: rootPath(t.local_search.CDN || t.local_search.path || "search.json"), preload: !!t.local_search.preload }
      : undefined,
    translate: t.translate && t.translate.enable ? t.translate : undefined,
    peoplecanvas: t.peoplecanvas && t.peoplecanvas.enable ? { enable: true, img: t.peoplecanvas.img } : undefined,
    noticeOutdate: t.noticeOutdate && t.noticeOutdate.enable ? t.noticeOutdate : undefined,
    copy: {
      success: _p("copy.success"),
      error: _p("copy.error"),
      noSupport: _p("copy.noSupport"),
    },
    relativeDate: {
      homepage: t.post_meta?.page?.date_format === "relative",
      simplehomepage: t.post_meta?.page?.date_format === "simple",
      post: t.post_meta?.post?.date_format === "relative",
    },
    runtime: t.runtimeshow && t.runtimeshow.enable ? _p("aside.card_webinfo.runtime.unit") : "",
    footerRuntime: t.footer?.runtime?.enable ? { launchTime: normalizeLaunchTime(t.footer.runtime.launch_time) } : undefined,
    date_suffix: {
      just: _p("date_suffix.just"),
      min: _p("date_suffix.min"),
      hour: _p("date_suffix.hour"),
      day: _p("date_suffix.day"),
      month: _p("date_suffix.month"),
    },
    copyright:
      t.copy && t.copy.enable
        ? {
            copy: true,
            copyrightEbable: !!(t.copy.copyright && t.copy.copyright.enable),
            limitCount: t.copy.copyright?.limit_count || 150,
            languages: {
              author: _p("copy_copyright.author") + ": " + site.author,
              link: _p("copy_copyright.link") + ": ",
              source: _p("copy_copyright.source") + ": " + site.title,
              info: _p("copy_copyright.info"),
              copySuccess: _p("copy_copyright.copySuccess"),
            },
          }
        : undefined,
    lightbox: t.medium_zoom ? "mediumZoom" : t.fancybox ? "fancybox" : "null",
    Snackbar: t.snackbar && t.snackbar.enable ? t.snackbar : undefined,
    islazyload: !!(t.lazyload && t.lazyload.enable),
    isAnchor: !!t.anchor,
    autoDarkmode: !!(t.darkmode && t.darkmode.enable && t.darkmode.autoChangeMode === 1),
  };
}

export function globalConfigSite(opts: {
  title: string;
  pageTitle: string;
  isPost: boolean;
  isHome: boolean;
  showToc: boolean;
  postUpdate?: string;
}): Record<string, any> {
  const t = theme as any;
  return {
    configTitle: opts.title,
    title: opts.pageTitle,
    isPost: opts.isPost,
    isHome: opts.isHome,
    isHighlightShrink: t.highlight_shrink ?? "undefined",
    isToc: opts.showToc,
    postUpdate: opts.postUpdate || "",
    postMainColor: "",
  };
}
