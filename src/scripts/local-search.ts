/**
 * Local search client runtime — vanilla JS, no dependencies.
 * Mirrors hexo-theme-anzhiyu source/js/search/local-search.js.
 * Reads window.GLOBAL_CONFIG.localSearch (path, preload, root) injected by
 * Head.astro + globalConfig.ts. i18n hits_empty is passed via a data attribute
 * on #local-search-results (set in LocalSearch.astro).
 */

interface SearchPost {
  title: string;
  url: string;
  content: string;
  tags: string[];
}

interface SearchConfig {
  path: string;
  preload: boolean;
  root: string;
  hitsEmpty: string;
}

function initLocalSearch(): void {
  const G = (window as any).GLOBAL_CONFIG || {};
  const ls = G.localSearch;
  if (!ls) return;

  const $search = document.getElementById("local-search");
  if (!$search) return;

  const $mask = document.getElementById("search-mask");
  const $dialog = $search.querySelector<HTMLElement>(".search-dialog");
  const $input = document.querySelector<HTMLInputElement>("#local-search-input input");
  const $results = document.getElementById("local-search-results");
  const $loadingStatus = document.getElementById("loading-status");
  const $loadingDb = document.getElementById("loading-database");
  if (!$mask || !$dialog || !$input || !$results) return;

  const config: SearchConfig = {
    path: ls.path || "/search.json",
    preload: !!ls.preload,
    root: G.root || "/",
    hitsEmpty: $results.getAttribute("data-empty") || "找不到您查询的内容：${query}",
  };

  let loadFlag = false;
  let dataPromise: Promise<SearchPost[]> | null = null;

  function animateIn(el: HTMLElement, anim: string): void {
    el.style.display = "block";
    el.style.animation = anim;
  }

  function animateOut(el: HTMLElement, anim: string): void {
    el.style.animation = anim;
    const done = () => {
      el.style.display = "none";
      el.removeEventListener("animationend", done);
    };
    el.addEventListener("animationend", done);
  }

  function openSearch(): void {
    document.body.style.width = "100%";
    document.body.style.overflow = "hidden";
    animateIn($mask, "to_show 0.5s");
    animateIn($dialog, "titleScale 0.5s");
    setTimeout(() => $input.focus(), 100);
    if (!loadFlag) {
      attachInputListener();
      loadFlag = true;
    }
    document.addEventListener("keydown", function onEsc(e: KeyboardEvent) {
      if (e.code === "Escape") {
        closeSearch();
        document.removeEventListener("keydown", onEsc);
      }
    });
  }

  function closeSearch(): void {
    document.body.style.width = "";
    document.body.style.overflow = "";
    animateOut($dialog, "search_close .5s");
    animateOut($mask, "to_hide .5s");
  }

  async function fetchData(): Promise<SearchPost[]> {
    const response = await fetch(config.path);
    const json = await response.json();
    const posts: SearchPost[] = (json.posts || []).map((p: any) => ({
      title: p.title || "",
      url: p.url || "",
      content: (p.content || "").replace(/<[^>]+>/g, ""),
      tags: Array.isArray(p.tags) ? p.tags : [],
    }));
    if (response.ok && $loadingDb) {
      const wrap = $loadingDb.nextElementSibling as HTMLElement | null;
      if (wrap) wrap.style.display = "block";
      $loadingDb.remove();
    }
    return posts;
  }

  function attachInputListener(): void {
    if (!config.preload && !dataPromise) {
      dataPromise = fetchData();
    }
    let timer: number | undefined;
    $input.addEventListener("input", function () {
      const value = this.value;
      if (timer) clearTimeout(timer);
      timer = window.setTimeout(() => runSearch(value), 200);
    });
  }

  async function runSearch(value: string): Promise<void> {
    const keywords = value.trim().toLowerCase().split(/[\s]+/);
    if (keywords[0] !== "" && $loadingStatus) {
      $loadingStatus.innerHTML = '<i class="anzhiyufont anzhiyu-icon-spinner anzhiyu-pulse-icon"></i>';
    }
    $results.innerHTML = "";
    let str = '<div class="search-result-list">';
    if (keywords.length <= 0 || keywords[0] === "") {
      $results.innerHTML = str + "</div>";
      if (keywords[0] !== "" && $loadingStatus) $loadingStatus.innerHTML = "";
      return;
    }

    let count = 0;
    const data = await (dataPromise || Promise.resolve([]));
    for (const d of data) {
      let isMatch = true;
      let dataTitle = d.title ? d.title.trim().toLowerCase() : "";
      const dataTags = d.tags;
      const dataContent = d.content ? d.content.trim().toLowerCase() : "";
      const dataUrl = d.url.startsWith("/") ? d.url : config.root + d.url;
      let indexTitle = -1;
      let indexContent = -1;
      let firstOccur = -1;

      if (dataTitle !== "" || dataContent !== "") {
        keywords.forEach((keyword, i) => {
          indexTitle = dataTitle.indexOf(keyword);
          indexContent = dataContent.indexOf(keyword);
          if (indexTitle < 0 && indexContent < 0) {
            isMatch = false;
          } else {
            if (indexContent < 0) indexContent = 0;
            if (i === 0) firstOccur = indexContent;
          }
        });
      } else {
        isMatch = false;
      }

      if (!isMatch || firstOccur < 0) continue;

      let start = firstOccur - 30;
      let end = firstOccur + 100;
      let pre = "";
      let post = "";

      if (start < 0) start = 0;
      if (start === 0) {
        end = 100;
      } else {
        pre = "...";
      }
      if (end > dataContent.length) {
        end = dataContent.length;
      } else {
        post = "...";
      }

      let matchContent = dataContent.substring(start, end);
      let titleHtml = dataTitle;

      keywords.forEach((keyword) => {
        const regS = new RegExp(escapeRegex(keyword), "gi");
        matchContent = matchContent.replace(regS, '<span class="search-keyword">' + keyword + "</span>");
        titleHtml = titleHtml.replace(regS, '<span class="search-keyword">' + keyword + "</span>");
      });

      str += '<div class="local-search__hit-item">';
      str += '<div class="search-left" style="width:0"></div>';
      str += '<div class="search-right" style="width: 100%"><a href="' + dataUrl + '" class="search-result-title">' + titleHtml + "</a>";
      count += 1;

      if (dataContent !== "") {
        str += '<p class="search-result">' + pre + matchContent + post + "</p>";
      }
      if (dataTags.length) {
        str += '<div class="search-result-tags">';
        for (const tag of dataTags) {
          const el = tag.trim();
          str += '<a class="tag-list" href="' + config.root + "tags/" + encodeURIComponent(el) + '/">#' + el + "</a>";
        }
        str += "</div>";
      }
      str += "</div></div>";
    }

    if (count === 0) {
      str += '<div id="local-search__hits-empty">' + config.hitsEmpty.replace(/\$\{query}/, value.trim()) + "</div>";
    }
    str += "</div>";
    $results.innerHTML = str;
    if (keywords[0] !== "" && $loadingStatus) $loadingStatus.innerHTML = "";
  }

  const searchBtn = document.querySelector<HTMLElement>("#search-button > .search");
  if (searchBtn) searchBtn.addEventListener("click", openSearch);

  const closeBtn = $search.querySelector<HTMLElement>(".search-close-button");
  if (closeBtn) closeBtn.addEventListener("click", closeSearch);

  $mask.addEventListener("click", closeSearch);

  if (config.preload) {
    dataPromise = fetchData();
  }
}

function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initLocalSearch);
} else {
  initLocalSearch();
}
