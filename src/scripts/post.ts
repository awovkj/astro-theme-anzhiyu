// Keep this side-effect script a module so its local `anzhiyu` binding does not
// collide with the site-wide runtime when TypeScript checks all source files.
export {};

const anzhiyu: any = (window as any).anzhiyu || {};

function legacyCopy(): boolean {
  const command = Reflect.get(document, "execCommand");
  return typeof command === "function" && command.call(document, "copy");
}

function getEleTop(ele: HTMLElement): number {
  let actualTop = ele.offsetTop;
  let current = ele.offsetParent as HTMLElement | null;
  while (current !== null) {
    actualTop += current.offsetTop;
    current = current.offsetParent as HTMLElement | null;
  }
  return actualTop;
}

function throttle<T extends (...args: any[]) => void>(func: T, wait: number): (...args: Parameters<T>) => void {
  let timeout: ReturnType<typeof setTimeout> | null = null;
  let previous = 0;
  return (...args: Parameters<T>) => {
    const now = Date.now();
    const remaining = wait - (now - previous);
    if (remaining <= 0 || remaining > wait) {
      if (timeout) {
        clearTimeout(timeout);
        timeout = null;
      }
      previous = now;
      func(...args);
    } else if (!timeout) {
      timeout = setTimeout(() => {
        previous = Date.now();
        timeout = null;
        func(...args);
      }, remaining);
    }
  };
}

anzhiyu.addRewardMask = function () {
  const main = document.querySelector(".reward-main") as HTMLElement | null;
  if (!main) return;
  main.style.display = "flex";
  main.style.zIndex = "102";
  const quit = document.getElementById("quit-box");
  if (quit) quit.style.display = "flex";
};

anzhiyu.removeRewardMask = function () {
  const main = document.querySelector(".reward-main") as HTMLElement | null;
  if (!main) return;
  main.style.display = "none";
  const quit = document.getElementById("quit-box");
  if (quit) quit.style.display = "none";
};

anzhiyu.addRandomCommentInfo = function () {};

anzhiyu.loadLightbox = function (_eles: NodeListOf<Element> | Element[] | null) {};

// ---- 版权模块分享工具：复制链接 + 二维码（对齐原主题 post-tools） ----
function initPostTools() {
  const qrcodeEl = document.getElementById("qrcode");
  const url = qrcodeEl?.getAttribute("title") || location.href;

  // 复制链接（标题/按钮共用），成功后按钮短暂高亮提示
  (window as any).copyPageUrl = async (target?: string) => {
    const link = target || location.href;
    let ok = false;
    try {
      await navigator.clipboard.writeText(link);
      ok = true;
    } catch {
      const input = document.createElement("textarea");
      input.value = link;
      document.body.appendChild(input);
      input.select();
      try {
        ok = legacyCopy();
      } catch {}
      input.remove();
    }
    if (ok) {
      const btn = document.getElementById("post-share-url");
      if (btn) {
        btn.style.background = "var(--anzhiyu-main)";
        btn.style.color = "var(--anzhiyu-white)";
        setTimeout(() => {
          btn.style.background = "";
          btn.style.color = "";
        }, 800);
      }
    }
  };

  // 二维码：本地 vendor 加载 qrcodejs（同源，替代第三方 CDN）
  if (!qrcodeEl) return;
  const render = () => {
    const QR = (window as any).QRCode;
    if (typeof QR !== "function") return;
    new QR(qrcodeEl, { text: url, width: 150, height: 150, correctLevel: 2 });
  };
  if (typeof (window as any).QRCode === "function") {
    render();
    return;
  }
  const load = (src: string) =>
    new Promise<void>((resolve, reject) => {
      const s = document.createElement("script");
      s.src = src;
      s.onload = () => resolve();
      s.onerror = () => reject(new Error("qrcode load fail"));
      document.head.appendChild(s);
    });
  load(`${import.meta.env.BASE_URL}js/vendor/qrcode.min.js`).then(render).catch(() => {});
}

function initTocScrollspy() {
  const article = document.getElementById("article-container");
  const cardTocLayout = document.getElementById("card-toc");
  if (!article || !cardTocLayout) return;

  const cardToc = cardTocLayout.querySelector(".toc-content") as HTMLElement | null;
  if (!cardToc) return;

  const tocLinks = Array.from(cardToc.querySelectorAll<HTMLAnchorElement>(".toc-link"));
  if (!tocLinks.length) return;

  const isExpand = cardToc.classList.contains("is-expand");

  const allHeadings = Array.from(article.querySelectorAll<HTMLElement>("h1,h2,h3,h4,h5,h6"));
  const headings = allHeadings.filter((h) => h.id !== "CrawlerTitle");

  let detectIndex = "";

  const autoScrollToc = (item: HTMLElement) => {
    const activePosition = item.getBoundingClientRect().top;
    const sidebarScrollTop = cardToc.scrollTop;
    if (activePosition > document.documentElement.clientHeight - 100) {
      cardToc.scrollTop = sidebarScrollTop + 150;
    }
    if (activePosition < 100) {
      cardToc.scrollTop = sidebarScrollTop - 150;
    }
  };

  const findHeadPosition = (top: number) => {
    if (top === 0) return;

    let currentIndex = "";
    for (let i = 0; i < headings.length; i++) {
      if (top > getEleTop(headings[i]) - 80) {
        currentIndex = String(i);
      }
    }

    if (detectIndex === currentIndex) return;
    detectIndex = currentIndex;

    cardToc.querySelectorAll(".active").forEach((el) => el.classList.remove("active"));

    if (currentIndex === "") return;

    const idx = parseInt(currentIndex, 10);
    const currentActive = tocLinks[idx];
    if (!currentActive) return;

    currentActive.classList.add("active");

    setTimeout(() => autoScrollToc(currentActive), 0);

    if (isExpand) return;

    let parent: HTMLElement | null = currentActive.parentElement;
    while (parent && !parent.matches(".toc")) {
      if (parent.matches("li")) parent.classList.add("active");
      parent = parent.parentElement;
    }
  };

  const tocScrollFn = throttle(() => {
    const currentTop = window.scrollY || document.documentElement.scrollTop;
    findHeadPosition(currentTop);
  }, 100);

  window.addEventListener("scroll", tocScrollFn, { passive: true });

  findHeadPosition(window.scrollY || document.documentElement.scrollTop);
}

function init() {
  initTocScrollspy();
  initPostTools();
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", init);
} else {
  init();
}

(window as any).anzhiyu = anzhiyu;
