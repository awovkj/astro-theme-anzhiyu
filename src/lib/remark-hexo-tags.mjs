/**
 * Remark plugin: convert Hexo tag-plugin syntax ({% note %}...{% endnote %},
 * {% tabs %}, <!-- tab --> ...) into raw HTML whose class names mirror the
 * original anzhiyu scripts/tag/*.js output, so theme.css applies unchanged.
 * Markers embedded mid-paragraph (no blank lines) are linearized into tokens;
 * markdown between block markers stays in the tree and keeps rendering.
 */

const NOTE_STYLES = ["flat", "modern", "simple", "disabled"];
const DEFAULT_NOTE_STYLE = "flat";

const WRAP_TAGS = new Set([
  "note",
  "subnote",
  "tip",
  "folding",
  "btns",
  "hideBlock",
  "hideToggle",
  "tabs",
  "subtabs",
  "subsubtabs",
  "timeline",
]);

const CLOSER_ALIASES = { endsubtabs: "tabs", endsubsubtabs: "tabs" };

const TAG_RE = /\{%\s*(end)?([A-Za-z]+)(?:\s+([^%{}]*?))?\s*%\}/;
const SEG_OPEN_RE = /<!--\s*(tab|timeline)\s+([\s\S]*?)\s*-->/;
const SEG_CLOSE_RE = /<!--\s*end(?:tab|timeline)\s*-->/;

function esc(s) {
  return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function buttonStyle(bg, color) {
  let group = 'style="';
  if (bg) group += `background-color: ${bg};`;
  if (color) group += `color: ${color}`;
  group += '"';
  return group;
}

const INLINE_HANDLERS = {
  label(argStr) {
    const parts = argStr.trim().split(/\s+/);
    return `<mark class="hl-label ${parts[1] || "default"}">${parts[0] || ""}</mark>`;
  },
  span(argStr) {
    const p = argStr.split(",").map((s) => s.trim());
    return `<span class='p ${p[0] || ""}'>${p[1] || ""}</span>`;
  },
  checkbox(argStr) {
    return checkboxHtml(argStr, "checkbox");
  },
  radio(argStr) {
    return checkboxHtml(argStr, "radio");
  },
  cell(argStr) {
    const p = argStr.split(",").map((s) => s.trim());
    const text = p[0] || "";
    let url = p[1] || "";
    url = url ? `href='${url}'` : "";
    let img = "https://npm.elemecdn.com/hexo-butterfly-tag-plugins-plus/lib/assets/default.svg";
    let icon = "";
    if (p.length > 2 && p[2]) {
      if (p[2].includes("anzhiyufont") || p[2].includes("fa")) icon = p[2];
      else img = p[2];
    }
    if (icon) return `<a class="button no-text-decoration" ${url} title='${text}'><i class='${icon}'></i>${text}</a>`;
    return `<a class="button no-text-decoration" ${url} title='${text}'><img src='${img}'>${text}</a>`;
  },
  hideInline(argStr) {
    const p = argStr.split(",").map((s) => s.trim());
    return `<span class="hide-inline"><button type="button" class="hide-button" ${buttonStyle(p[2], p[3])}>${p[1] || "Click"}</button><span class="hide-content">${p[0] || ""}</span></span>`;
  },
  link(argStr) {
    const p = argStr.split(",").map((s) => s.trim());
    const title = p[0] || "";
    const sitename = p[1] || "";
    const link = p[2] || "";
    const imgUrl = p[3] || "";
    const inside = (link.startsWith("/") && !link.startsWith("//")) || imgUrl === "true";
    let iconUrl = "";
    if (imgUrl && imgUrl !== "true") iconUrl = imgUrl;
    else if (inside) iconUrl = "/favicon.ico";
    else {
      try {
        iconUrl = `${new URL(link).origin}/favicon.ico`;
      } catch {
        iconUrl = "";
      }
    }
    const hasIcon = !!iconUrl;
    const target = inside ? "" : 'target="_blank" rel="noopener external nofollow noreferrer"';
    return `<div class='anzhiyu-tag-link'><a class="tag-Link" ${target} href="${link}"><div class="tag-link-tips">${inside ? "站内地址" : "引用站外地址"}</div><div class="tag-link-bottom"><div class="tag-link-left"${hasIcon ? ` data-icon="${iconUrl}"` : ""}><img class="tag-link-favicon" src="${iconUrl}" onerror="this.style.display='none';this.nextElementSibling.style.display='flex';" style="${hasIcon ? "" : "display:none"}" alt="favicon"/><i class="anzhiyufont anzhiyu-icon-link" style="${hasIcon ? "display:none" : "display:flex"}"></i></div><div class="tag-link-right"><div class="tag-link-title">${title}</div><div class="tag-link-sitename">${sitename}</div></div><i class="anzhiyufont anzhiyu-icon-angle-right"></i></div></a></div>`;
  },
};

const BLOCK_KIND = new Set(["checkbox", "radio", "link", "p"]);

function checkboxHtml(argStr, kind) {
  const p = argStr.split(",").map((s) => s.trim());
  let cls = "";
  let text = "";
  let checked = false;
  if (p.length > 1) {
    cls = p[0] || "";
    checked = cls.includes("checked");
    cls = cls ? ` ${cls}` : "";
    text = p[1] || "";
  } else if (p.length === 1) {
    text = p[0] || "";
  }
  if (!text) return "";
  return `<div class='checkbox${cls}'><input type="${kind}" ${checked ? 'checked="checked"' : ""}/> ${esc(text)}</div>`;
}

function classifyTag(raw, name, args) {
  if (raw) {
    const base = CLOSER_ALIASES["end" + name] || name;
    if (WRAP_TAGS.has(base)) return { k: "close", name: base };
    return { k: "text", v: `{% end${name}${args ? " " + args : ""} %}` };
  }
  if (WRAP_TAGS.has(name)) return { k: "open", name, args: (args || "").trim() };
  if (INLINE_HANDLERS[name]) {
    const v = INLINE_HANDLERS[name](args || "");
    return v ? { k: BLOCK_KIND.has(name) ? "htmlBlock" : "html", v } : { k: "text", v: "" };
  }
  return { k: "text", v: `{% ${name}${args ? " " + args : ""} %}` };
}

function nextToken(value, from) {
  let best = null;
  for (const re of [TAG_RE, SEG_OPEN_RE, SEG_CLOSE_RE]) {
    re.lastIndex = 0;
    const m = re.exec(value.slice(from));
    if (m && (!best || m.index < best.index)) {
      best = { index: m.index, len: m[0].length, m, re };
    }
  }
  if (!best) return null;
  const { m, re } = best;
  let item;
  if (re === TAG_RE) item = classifyTag(m[1], m[2], m[3]);
  else if (re === SEG_OPEN_RE) item = { k: "segOpen", type: m[1], meta: m[2] };
  else item = { k: "segClose" };
  return { index: best.index, len: best.len, item };
}

function decomposeText(value, items) {
  let pos = 0;
  for (;;) {
    const t = nextToken(value, pos);
    if (!t) break;
    if (t.index > pos) items.push({ k: "text", v: value.slice(pos, t.index) });
    items.push(t.item);
    pos += t.index + t.len;
  }
  if (pos < value.length) items.push({ k: "text", v: value.slice(pos) });
}

const SENTINEL_RE = /\x00(\d+)\x00/g;

function plainText(node) {
  if (node.type === "text") return node.value;
  return (node.children || []).map(plainText).join("");
}

function inlineToHtml(node) {
  const map = { inlineCode: "code", emphasis: "em", strong: "strong", delete: "del", link: "a" };
  const tag = map[node.type];
  const inner = esc(plainText(node));
  if (node.type === "link") return `<a href="${node.url}">${inner}</a>`;
  if (tag) return `<${tag}>${inner}</${tag}>`;
  return inner;
}

function expandSentinels(str, inlines) {
  return str.replace(SENTINEL_RE, (_, n) => {
    const node = inlines[Number(n)];
    return node ? inlineToHtml(node) : "";
  });
}

function pushTextWithSentinels(value, inlines, para) {
  let last = 0;
  SENTINEL_RE.lastIndex = 0;
  let m;
  while ((m = SENTINEL_RE.exec(value)) !== null) {
    if (m.index > last) para.push({ type: "text", value: value.slice(last, m.index) });
    const node = inlines[Number(m[1])];
    if (node) para.push(node);
    last = m.index + m[0].length;
  }
  if (last < value.length) para.push({ type: "text", value: value.slice(last) });
}

function decomposeNode(node, items) {
  if (node.type === "html") {
    const v = node.value.trim();
    const segOpen = SEG_OPEN_RE.exec(v);
    if (segOpen && segOpen[0] === v) {
      items.push({ k: "segOpen", type: segOpen[1], meta: segOpen[2] });
      return;
    }
    if (SEG_CLOSE_RE.test(v)) {
      items.push({ k: "segClose" });
      return;
    }
  }
  if (node.type !== "paragraph") {
    items.push({ k: "node", node });
    return;
  }

  const inlines = [];
  let combined = "";
  for (const child of node.children) {
    if (child.type === "text") combined += child.value;
    else {
      combined += "\x00" + inlines.length + "\x00";
      inlines.push(child);
    }
  }

  const rawItems = [];
  decomposeText(combined, rawItems);
  for (const it of rawItems) {
    if (it.k === "text") {
      if (!it.v) continue;
      if (it.v.includes("\x00")) {
        const buf = [];
        pushTextWithSentinels(it.v, inlines, buf);
        for (const piece of buf) {
          if (piece.type === "text") items.push({ k: "text", v: piece.value });
          else items.push({ k: "inline", node: piece });
        }
      } else items.push(it);
    } else if (it.k === "html" || it.k === "htmlBlock") {
      items.push({ k: it.k, v: expandSentinels(it.v, inlines) });
    } else {
      items.push(it);
    }
  }
}

function findMatchingClose(items, start, name) {
  let depth = 1;
  for (let j = start + 1; j < items.length; j++) {
    const it = items[j];
    if (it.k === "open" && it.name === name) depth++;
    else if (it.k === "close" && it.name === name) {
      depth--;
      if (depth === 0) return j;
    }
  }
  return -1;
}

function noteOpenHtml(argsRaw) {
  const args = argsRaw ? argsRaw.split(/\s+/) : [];
  if (!(args.length && NOTE_STYLES.includes(args[args.length - 1]))) args.push(DEFAULT_NOTE_STYLE);
  let icon = "";
  const iconIdx = args.length - 2;
  if (iconIdx >= 0 && args[iconIdx] && args[iconIdx].startsWith("fa")) {
    icon = `<i class="note-icon ${args[iconIdx]}"></i>`;
    args[iconIdx] = "icon-padding";
  }
  return `<div class="note ${args.join(" ")}">${icon}`;
}

function emitWrap(name, args, inner) {
  switch (name) {
    case "note":
    case "subnote":
      return [{ type: "html", value: noteOpenHtml(args) }, ...inner, { type: "html", value: "</div>" }];
    case "tip":
      return [{ type: "html", value: `<div class="tip ${args || "info"}">` }, ...inner, { type: "html", value: "</div>" }];
    case "folding": {
      const parts = args ? args.split(",").map((s) => s.trim()) : [];
      const style = parts.length > 1 ? parts[0] : "";
      const title = parts.length > 1 ? parts[1] : parts[0] || "";
      const attr = style ? ` ${style}` : "";
      return [
        { type: "html", value: `<details class="folding-tag"${attr}><summary> ${esc(title)} </summary><div class='content'>` },
        ...inner,
        { type: "html", value: "</div></details>" },
      ];
    }
    case "btns":
      return [{ type: "html", value: `<div class="btns ${args}">` }, ...inner, { type: "html", value: "</div>" }];
    case "hideBlock": {
      const p = args.split(",").map((s) => s.trim());
      return [
        { type: "html", value: `<div class="hide-block"><button type="button" class="hide-button" ${buttonStyle(p[1], p[2])}>${p[0] || "Click"}</button><div class="hide-content">` },
        ...inner,
        { type: "html", value: "</div></div>" },
      ];
    }
    case "hideToggle": {
      const p = args.split(",").map((s) => s.trim());
      const border = p[1] ? ` style="border: 1px solid ${p[1]}"` : "";
      return [
        { type: "html", value: `<details class="toggle"${border}><summary class="toggle-button" ${buttonStyle(p[1], p[2])}>${p[0] || "Click"}</summary><div class="toggle-content">` },
        ...inner,
        { type: "html", value: "</div></details>" },
      ];
    }
    default:
      return [];
  }
}

function collectSegments(items, type) {
  const segments = [];
  let current = null;
  for (const it of items) {
    if (it.k === "segOpen" && it.type === type) {
      current = { meta: it.meta, items: [] };
      segments.push(current);
      continue;
    }
    if (it.k === "segClose" && current) {
      current = null;
      continue;
    }
    if (current) current.items.push(it);
  }
  return segments;
}

function emitTabs(argsRaw, items) {
  const parts = (argsRaw || "").split(",").map((s) => s.trim());
  const tabName = parts[0] || "tabs";
  const tabActive = Number(parts[1]) || 0;
  const slug = tabName.toLowerCase().split(" ").join("-");
  const segments = collectSegments(items, "tab");

  const out = [];
  let noDefault = true;
  const buttons = segments.map((seg, idx) => {
    const id = idx + 1;
    const isActive = (tabActive > 0 && tabActive === id) || (tabActive === 0 && id === 1);
    if (isActive) noDefault = false;
    const capParams = seg.meta.split("@");
    const caption = (capParams[0] || "").trim();
    const icon = (capParams[1] || "").trim();
    let iconHtml = "";
    if (icon) iconHtml = `<i class="${icon}"${caption ? "" : ' style="text-align: center;"'}></i>`;
    return `<button type="button" class="tab${isActive ? " active" : ""}" data-href="${slug}-${id}">${iconHtml}${esc(caption)}</button>`;
  });

  out.push({ type: "html", value: `<div class="tabs" id="${slug}"><ul class="nav-tabs${noDefault ? " no-default" : ""}">${buttons.join("")}</ul><div class="tab-contents">` });
  segments.forEach((seg, idx) => {
    const id = idx + 1;
    const isActive = (tabActive > 0 && tabActive === id) || (tabActive === 0 && id === 1);
    out.push({ type: "html", value: `<div class="tab-item-content${isActive ? " active" : ""}" id="${slug}-${id}">` });
    out.push(...processItems(seg.items));
    out.push({ type: "html", value: "</div>" });
  });
  out.push({ type: "html", value: `</div><div class="tab-to-top"><button type="button" aria-label="scroll to top"><i class="anzhiyufont anzhiyu-icon-arrow-up"></i></button></div></div>` });
  return out;
}

function emitTimeline(argsRaw, items) {
  const parts = argsRaw ? argsRaw.split(",").map((s) => s.trim()) : [];
  const title = parts[0] || "";
  const color = parts[1] || "";
  const out = [{ type: "html", value: `<div class="timeline ${color}">` }];
  if (title) {
    out.push({ type: "html", value: `<div class='timeline-item headline'><div class='timeline-item-title'><div class='item-circle'>${esc(title)}</div></div></div>` });
  }
  for (const seg of collectSegments(items, "timeline")) {
    out.push({ type: "html", value: `<div class='timeline-item'><div class='timeline-item-title'><div class='item-circle'>${esc(seg.meta)}</div></div><div class='timeline-item-content'>` });
    out.push(...processItems(seg.items));
    out.push({ type: "html", value: "</div></div>" });
  }
  out.push({ type: "html", value: "</div>" });
  return out;
}

function flushPara(para, out) {
  if (!para.length) return;
  out.push({ type: "paragraph", children: [...para] });
  para.length = 0;
}

function processItems(items) {
  const out = [];
  const para = [];
  let i = 0;
  while (i < items.length) {
    const it = items[i];
    if (it.k === "open") {
      const closerIdx = findMatchingClose(items, i, it.name);
      flushPara(para, out);
      if (closerIdx > i) {
        const innerItems = items.slice(i + 1, closerIdx);
        if (it.name === "tabs" || it.name === "subtabs" || it.name === "subsubtabs") out.push(...emitTabs(it.args, innerItems));
        else if (it.name === "timeline") out.push(...emitTimeline(it.args, innerItems));
        else out.push(...emitWrap(it.name, it.args, processItems(innerItems)));
        i = closerIdx + 1;
        continue;
      }
      para.push({ type: "text", value: `{% ${it.name}${it.args ? " " + it.args : ""} %}` });
      i++;
      continue;
    }
    if (it.k === "close" || it.k === "segClose" || it.k === "segOpen") {
      i++;
      continue;
    }
    if (it.k === "paraBreak") {
      flushPara(para, out);
      i++;
      continue;
    }
    if (it.k === "text") {
      if (it.v) para.push({ type: "text", value: it.v });
      i++;
      continue;
    }
    if (it.k === "html") {
      para.push({ type: "html", value: it.v });
      i++;
      continue;
    }
    if (it.k === "htmlBlock") {
      flushPara(para, out);
      out.push({ type: "html", value: it.v });
      i++;
      continue;
    }
    if (it.k === "inline") {
      para.push(it.node);
      i++;
      continue;
    }
    if (it.k === "node") {
      const n = it.node;
      // 先冲刷待输出段落，保持段落与标题/列表等块级节点的文档顺序
      flushPara(para, out);
      if (n.children && (n.type === "blockquote" || n.type === "listItem")) {
        out.push({ ...n, children: processNodes(n.children) });
      } else {
        out.push(n);
      }
      i++;
      continue;
    }
    i++;
  }
  flushPara(para, out);
  return out;
}

function processNodes(nodes) {
  const items = [];
  for (const n of nodes) {
    // 段落边界标记：防止相邻段落被 processItems 合并进同一个 <p>
    if (n.type === "paragraph") items.push({ k: "paraBreak" });
    decomposeNode(n, items);
  }
  return processItems(items);
}

export default function remarkHexoTags() {
  return (tree) => {
    if (tree.children) tree.children = processNodes(tree.children);
  };
}
