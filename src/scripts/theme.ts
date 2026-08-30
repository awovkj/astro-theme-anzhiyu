// AnZhiYu Astro — lightweight client runtime.
// Provides the `anzhiyu` global referenced by inline handlers in the theme,
// plus the core interactions (dark mode, scroll progress, aside/sidebar
// toggles). This replaces the original pjax-dependent main.js with a
// static, dependency-free equivalent.

// Keep this side-effect script a module so TypeScript does not merge its
// globals with the post-page runtime during project-wide type checking.
export {};

const G = (window as any).GLOBAL_CONFIG || {};
const anzhiyu: any = {};

function legacyCopy(): boolean {
  const command = Reflect.get(document, "execCommand");
  return typeof command === "function" && command.call(document, "copy");
}

function scrollToDest(target: number, time = 500) {
  const current = window.scrollY || document.documentElement.scrollTop;
  const diff = target - current;
  if (!diff) return;
  const step = Math.max(1, Math.abs(diff) / (time / 16));
  let acc = 0;
  const tick = () => {
    acc += step;
    window.scrollTo(0, current + (diff > 0 ? Math.min(acc, diff) : -Math.min(acc, -diff)));
    if (Math.abs(acc) < Math.abs(diff)) requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
}
anzhiyu.scrollToDest = scrollToDest;

anzhiyu.toRandomPost = function () {
  const links = Array.from(document.querySelectorAll<HTMLAnchorElement>(".recent-post-item a.article-title, .post-title, #home_top a.article-title"));
  if (!links.length) return;
  const pick = links[Math.floor(Math.random() * links.length)];
  if (pick) window.location.href = pick.href;
};

anzhiyu.musicToggle = function () {
  const bg = document.getElementById("nav-music");
  if (bg) bg.classList.toggle("on");
};

anzhiyu.switchConsole = function () {
  document.getElementById("console")?.classList.toggle("show");
};

anzhiyu.hideConsole = function () {
  document.getElementById("console")?.classList.remove("show");
  const cb = document.getElementById("center-console") as HTMLInputElement | null;
  if (cb) cb.checked = false;
};

anzhiyu.hideAsideBtn = function () {
  const ci = document.getElementById("content-inner");
  if (ci) ci.classList.toggle("hide-aside");
};

anzhiyu.scrollCategoryBarToRight = function () {
  const list = document.getElementById("catalog-list");
  if (!list) return;
  list.scrollLeft = list.scrollWidth;
};

anzhiyu.hideTodayCard = function () {
  const card = document.getElementById("todayCard");
  if (card) card.style.display = "none";
};

anzhiyu.changeSayHelloText = function () {
  const el = document.getElementById("author-info__sayhi");
  if (el) el.textContent = el.textContent ? "" : "你好呀";
};

// ---- footer runtime badge（运行时间徽章, mirrors the original runtime.js） ----
function initFooterRuntime() {
  const cfg = G.footerRuntime;
  const el = document.getElementById("runtimeTextTip");
  if (!cfg || !cfg.launchTime || !el) return;
  // 支持 "YYYY/MM/DD HH:mm:ss" / "MM/DD/YYYY HH:mm:ss" / ISO 等格式
  const raw = String(cfg.launchTime).replace(/-/g, "/");
  const parts = raw.split(/[ /]/).map(Number);
  const launch =
    parts.length >= 3 && parts.slice(0, 3).every((n) => Number.isFinite(n))
      ? parts[0] > 31 // YYYY/MM/DD
        ? new Date(parts[0], parts[1] - 1, parts[2], parts[3] || 0, parts[4] || 0, parts[5] || 0)
        : new Date(parts[2], parts[0] - 1, parts[1], parts[3] || 0, parts[4] || 0, parts[5] || 0) // MM/DD/YYYY
      : new Date(raw);
  if (Number.isNaN(+launch)) return;
  const render = () => {
    const diff = Math.max(0, Date.now() - +launch);
    const days = Math.floor(diff / 864e5);
    const hours = Math.floor((diff % 864e5) / 36e5);
    const minutes = Math.floor((diff % 36e5) / 6e4);
    const seconds = Math.floor((diff % 6e4) / 1e3);
    el.textContent = `本站居然运行了 ${days} 天 ${hours} 小时 ${minutes} 分 ${seconds} 秒`;
  };
  render();
  window.setInterval(render, 1000);
}

// ---- dark mode ----
function applyDark(dark: boolean) {
  document.documentElement.setAttribute("data-theme", dark ? "dark" : "light");
  try { localStorage.setItem("theme", dark ? "dark" : "light"); } catch {}
}
function initDark() {
  const saved = (() => { try { return localStorage.getItem("theme"); } catch { return null; } })();
  if (saved) applyDark(saved === "dark");
  else if (G.autoDarkmode) applyDark(window.matchMedia("(prefers-color-scheme: dark)").matches);

  document.querySelectorAll<HTMLElement>(".darkmode_switchbutton, #darkmode").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      e.preventDefault();
      const cur = document.documentElement.getAttribute("data-theme") === "dark";
      applyDark(!cur);
    });
  });
}

// ---- scroll progress + nav-fixed adaptation (mirrors scrollFn in main.js) ----
let lastScrollTop = 0;
let firstScrollRun = true;

function updateScroll() {
  const st = window.scrollY || document.documentElement.scrollTop;
  const docH = document.documentElement.scrollHeight - window.innerHeight;
  const pct = docH > 0 ? Math.min(100, Math.round((st / docH) * 100)) : 0;
  const percent = document.getElementById("percent");
  if (percent) percent.textContent = String(pct === 0 ? 1 : pct);
  const goUp = document.getElementById("go-up");
  if (goUp) goUp.classList.toggle("show", st > 200);

  // nav-fixed / nav-visible — same thresholds as the original theme
  const header = document.getElementById("page-header");
  if (header) {
    if (st > 26) {
      const isDown = st > lastScrollTop;
      if (firstScrollRun || !isDown) {
        // page loaded while scrolled, or scrolling up → show nav
        header.classList.add("nav-visible");
      } else if (isDown && header.classList.contains("nav-visible")) {
        header.classList.remove("nav-visible");
      }
      header.classList.add("nav-fixed");
    } else if (st <= 5) {
      header.classList.remove("nav-fixed");
      header.classList.remove("nav-visible");
    }
  }
  firstScrollRun = false;
  lastScrollTop = st;
}

// ---- menu / sidebar / aside toggles ----
function initToggles() {
  const toggleMenu = document.getElementById("toggle-menu");
  const sidebar = document.getElementById("sidebar");
  const mask = document.getElementById("menu-mask");
  const openSidebar = () => { sidebar?.classList.add("open"); mask?.classList.add("show"); };
  const closeSidebar = () => { sidebar?.classList.remove("open"); mask?.classList.remove("show"); };
  toggleMenu?.addEventListener("click", openSidebar);
  mask?.addEventListener("click", closeSidebar);

  document.getElementById("hide-aside-btn")?.addEventListener("click", () => {
    document.getElementById("content-inner")?.classList.toggle("hide-aside");
  });

  const rightsideConfig = document.getElementById("rightside-config");
  const hideBox = document.getElementById("rightside-config-hide");
  rightsideConfig?.addEventListener("click", () => hideBox?.classList.toggle("show"));
}

function initDiytitle() {
  const diy = G.diytitle;
  if (!diy || !diy.enable) return;
  const originTitle = document.title;
  let away = false;
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) {
      away = true;
      document.title = diy.leaveTitle;
    } else if (away) {
      away = false;
      document.title = diy.backTitle;
      setTimeout(() => {
        document.title = originTitle;
      }, 2000);
    }
  });
}

// ---- subtitle typewriter (打字机效果, mirrors the original subtitleType) ----
function loadScript(src: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const s = document.createElement("script");
    s.src = src;
    s.onload = () => resolve();
    s.onerror = () => reject(new Error("load fail: " + src));
    document.head.appendChild(s);
  });
}

// 本地 vendor 路径（public/js/vendor，同源加载，替代第三方 CDN）
const vendor = (file: string) => `${import.meta.env.BASE_URL}js/vendor/${file}`;

function initSubtitleType() {
  const cfg = G.subtitle;
  const el = document.getElementById("subtitle");
  if (!cfg || !el) return;
  const subtitleEl = el;
  const sub: string[] = Array.isArray(cfg.sub) ? cfg.sub : [];
  const strings = sub.length ? sub : [""];
  if (!cfg.effect) {
    subtitleEl.textContent = strings[0];
    return;
  }
  const start = () => {
    const TypedCtor = (window as any).Typed;
    if (typeof TypedCtor !== "function") {
      subtitleEl.textContent = strings[0];
      return;
    }
    new TypedCtor("#subtitle", {
      strings,
      startDelay: cfg.startDelay ?? 300,
      typeSpeed: cfg.typeSpeed ?? 150,
      backSpeed: cfg.backSpeed ?? 50,
      loop: cfg.loop !== false,
    });
  };
  if (typeof (window as any).Typed === "function") start();
  else
    loadScript(vendor("typed.umd.min.js"))
      .then(start)
      .catch(() => { subtitleEl.textContent = strings[0]; });
}

// ---- progressive header background (首页一图流渐进加载, mirrors imgloaded.js) ----
function initProgressiveHeader() {
  const img = G.indexImg;
  const header = document.getElementById("page-header");
  if (!img || !header || !header.classList.contains("full_page")) return;

  const mount = () => {
    document.querySelector(".pl-container")?.remove();
    if (!header || !header.classList.contains("full_page")) return;
    const container = document.createElement("div");
    container.className = "pl-container";
    const blurStage = document.createElement("div");
    blurStage.className = "pl-img pl-blur";
    const clearStage = document.createElement("div");
    clearStage.className = "pl-img";
    container.appendChild(blurStage);
    container.appendChild(clearStage);
    container.addEventListener(
      "animationend",
      () => {
        blurStage.style.display = "none";
      },
      { once: true }
    );
    header.insertBefore(container, header.firstChild);

    const small = new Image();
    const large = new Image();
    small.onload = () => {
      blurStage.classList.add("pl-visible");
      blurStage.style.backgroundImage = `url('${img}')`;
    };
    large.onload = () => {
      clearStage.classList.add("pl-visible");
      clearStage.style.backgroundImage = `url('${img}')`;
    };
    small.src = img;
    large.src = img;
  };

  mount();

  // re-apply when the dark/light theme switches (mirrors the MutationObserver)
  const observer = new MutationObserver((mutations) => {
    if (mutations.some((m) => m.attributeName === "data-theme") && location.pathname === "/") mount();
  });
  observer.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
}

// ---- lazyload (only images explicitly using data-lazy-src) ----
function initLazyload() {
  if (!G.islazyload) return;
  const init = () => {
    const LL = (window as any).LazyLoad;
    if (typeof LL !== "function") return;
    (window as any).lazyLoadInstance = new LL({
      // Regular Astro images already have a usable `src`. Selecting every
      // image lets Vanilla LazyLoad treat covers without data-lazy-src as
      // lazy candidates, which can leave otherwise valid remote covers in an
      // inconsistent state.
      elements_selector: "img[data-lazy-src]",
      threshold: 0,
      data_src: "lazy-src",
    });
  };
  if (typeof (window as any).LazyLoad === "function") {
    init();
    return;
  }
  loadScript(vendor("lazyload.iife.min.js")).then(init).catch(() => {});
}

// ---- code block tools (代码块工具栏: 展开/折叠 + 语言 + 复制, mirrors addHighlightTool) ----
function initHighlightTools() {
  const hl = G.highlight;
  if (!hl) return;
  const { highlightCopy, highlightLang, highlightHeightLimit } = hl;
  const isHighlightShrink = (window as any).GLOBAL_CONFIG_SITE?.isHighlightShrink;
  const isShowTool = highlightCopy || highlightLang || isHighlightShrink !== undefined;
  const blocks = Array.from(document.querySelectorAll<HTMLElement>("pre.astro-code"));
  if (!((isShowTool || highlightHeightLimit) && blocks.length)) return;

  const highlightShrinkClass = isHighlightShrink === true ? "closed" : "";
  const highlightShrinkEle =
    isHighlightShrink !== undefined
      ? `<i class="anzhiyufont anzhiyu-icon-angle-down expand ${highlightShrinkClass}"></i>`
      : "";
  const highlightCopyEle = highlightCopy
    ? `<div class="copy-notice"></div><i class="anzhiyufont anzhiyu-icon-paste copy-button"></i>`
    : "";

  const alertInfo = (tools: HTMLElement, text: string) => {
    const notice = tools.querySelector(".copy-notice");
    if (notice) {
      notice.textContent = text;
      (notice as HTMLElement).style.opacity = "1";
      setTimeout(() => ((notice as HTMLElement).style.opacity = "0"), 800);
    }
  };

  const copyCode = async (tools: HTMLElement, code: HTMLElement) => {
    try {
      await navigator.clipboard.writeText(code.textContent || "");
      alertInfo(tools, G.copy?.success || "复制成功");
    } catch {
      const selection = window.getSelection();
      const range = document.createRange();
      range.selectNodeContents(code);
      selection?.removeAllRanges();
      selection?.addRange(range);
      try {
        if (!legacyCopy()) throw new Error("Legacy copy command is unavailable");
        alertInfo(tools, G.copy?.success || "复制成功");
      } catch {
        alertInfo(tools, G.copy?.noSupport || "浏览器不支持");
      }
      selection?.removeAllRanges();
    }
  };

  const onToolsClick = function (this: HTMLElement, e: Event) {
    const target = e.target as HTMLElement;
    if (target.classList.contains("expand")) this.classList.toggle("closed");
    else if (target.classList.contains("copy-button")) {
      const code = this.parentElement?.querySelector("pre code");
      if (code) copyCode(this, code as HTMLElement);
    }
  };

  const onExpandBtnClick = function (this: HTMLElement) {
    this.classList.toggle("expand-done");
  };

  blocks.forEach((pre) => {
    if (pre.closest("figure.highlight")) return;
    const figure = document.createElement("figure");
    figure.className = "highlight";
    pre.parentNode?.insertBefore(figure, pre);
    figure.appendChild(pre);

    if (isShowTool) {
      const tools = document.createElement("div");
      tools.className = `highlight-tools ${highlightShrinkClass}`.trim();
      const langName = pre.getAttribute("data-language") || "Code";
      const langEle = highlightLang ? `<div class="code-lang">${langName}</div>` : "";
      tools.innerHTML = highlightShrinkEle + langEle + highlightCopyEle;
      tools.addEventListener("click", onToolsClick);
      figure.insertBefore(tools, figure.firstChild);
    }

    if (highlightHeightLimit && pre.offsetHeight > highlightHeightLimit + 30) {
      const btn = document.createElement("div");
      btn.className = "code-expand-btn";
      btn.innerHTML = '<i class="anzhiyufont anzhiyu-icon-angle-double-down"></i>';
      btn.addEventListener("click", onExpandBtnClick);
      figure.appendChild(btn);
    }
  });
}

function init() {
  // preloader
  const pre = document.getElementById("loading-box");
  if (pre) {
    window.addEventListener("load", () => pre.classList.add("loaded"));
    setTimeout(() => pre.classList.add("loaded"), 10000);
  }
  initDark();
  initToggles();
  initDiytitle();
  initSubtitleType();
  initProgressiveHeader();
  initLazyload();
  initHighlightTools();
  initFooterRuntime();
  updateScroll();
  window.addEventListener("scroll", updateScroll, { passive: true });

  // #page-name shows current section title
  const pageName = document.getElementById("page-name");
  if (pageName) {
    const title = document.title.split(" | ")[0];
    pageName.textContent = title;
  }
}

if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
else init();

(window as any).anzhiyu = anzhiyu;
