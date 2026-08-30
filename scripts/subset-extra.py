# -*- coding: utf-8 -*-
"""
hhh-extra 补充字体生成器（由 scripts/subset-font.cjs 在主字体子集化后调用）。

职责：主字体 hhh-subset.woff2 不含的字符（源字体 hhh.ttf 本身就没有的字形），
从本机系统字体提取生成补充 woff2，并通过 unicode-range 让浏览器按码位分流：
  font-family: hhh, hhh-extra, ...系统回退栈
浏览器渲染时：hhh 有该字形 → 用 hhh；没有 → hhh-extra 对应分片接管；再没有 → 系统 emoji/字体。

排除项（有意不收录，交由系统渲染）：
  - U+00A0 等空白控制字符（无需字形）
  - >= U+1F000 的 emoji 区（系统彩色 emoji 渲染效果最佳，黑白化反而降级）
  - U+1D400–U+1D7FF 花体/数学字母区（如 𝓢𝓪𝓷𝔂𝓮，系统默认渲染即可）
  - 颜文字组件字符（∇ ∼ ♪ へ ノ ﾟ º 等，系统字体都有，样式无所谓）

候选系统字体（按优先级，第一个含该字形的字体胜出）：
  - seguisym.ttf  Segoe UI Symbol：数学/杂项符号、花体数学字母
  - msyh.ttc      微软雅黑：日文假名、全角符号兜底

输出：
  - public/font/hhh-extra-{key}.woff2
  - src/styles/font-extra.css（@font-face + unicode-range，Base.astro 引入）
"""
import sys
import os
import glob

sys.stdout.reconfigure(encoding="utf-8")
from fontTools.subset import Subsetter, Options
from fontTools.ttLib import TTFont, TTCollection

ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..")
SUBSET_FONT = os.path.join(ROOT, "public", "font", "hhh-subset.woff2")
DIST = os.path.join(ROOT, "dist")
OUT_FONT_DIR = os.path.join(ROOT, "public", "font")
OUT_CSS = os.path.join(ROOT, "src", "styles", "font-extra.css")

# 候选系统字体：key（用于文件名）→ 字体路径
CANDIDATES = [
    ("sym", r"C:/Windows/Fonts/seguisym.ttf"),
    ("kana", r"C:/Windows/Fonts/msyh.ttc"),
]

DIST_EXTS = (".html", ".htm", ".json")

# 颜文字组件字符（kaomoji parts）：w(ﾟДﾟ)w、♪(^∇^*) 等，
# 系统字体全部覆盖，样式随系统即可，无需打包
KAOMOJI_CHARS = frozenset(
    "\u00ba\u2207\u223c\u266a\u3078\u30ce\uff9f"  # º ∇ ∼ ♪ へ ノ ﾟ
)


def load_cmap(path, font_number=0):
    """读取字体（支持 ttc）的全部 Unicode cmap 码位。"""
    if path.lower().endswith(".ttc"):
        font = TTCollection(path).fonts[font_number]
    else:
        font = TTFont(path, fontNumber=0)
    cmap = set()
    for table in font["cmap"].tables:
        if table.isUnicode():
            cmap.update(table.cmap.keys())
    return font, cmap


def collect_dist_chars():
    chars = set()
    for ext in DIST_EXTS:
        for p in glob.glob(os.path.join(DIST, "**", "*" + ext), recursive=True):
            with open(p, encoding="utf-8", errors="ignore") as f:
                chars.update(f.read())
    return chars


def excluded(ch):
    """有意排除：空白控制字符、PUA（iconfont）、emoji 区、花体字区、颜文字组件。"""
    cp = ord(ch)
    if cp <= 0x20 or cp == 0xA0:
        return True
    if 0xE000 <= cp <= 0xF8FF:  # PUA，iconfont 图标
        return True
    if cp >= 0x1F000:  # emoji 及补充区，交由系统彩色 emoji 渲染
        return True
    if 0x1D400 <= cp <= 0x1D7FF:  # 花体/数学字母区（𝓢𝓪𝓷𝔂𝓮 等），系统渲染即可
        return True
    if ch in KAOMOJI_CHARS:  # 颜文字组件，系统字体全覆盖
        return True
    return False


def main():
    if not os.path.exists(SUBSET_FONT):
        print("[subset-extra] 未找到 hhh-subset.woff2，跳过")
        return

    # 1) 主字体 cmap
    _, main_cmap = load_cmap(SUBSET_FONT)

    # 2) dist 全量字符 → 缺失清单
    chars = collect_dist_chars()
    missing = sorted(
        c for c in chars
        if not excluded(c) and ord(c) not in main_cmap
    )
    if not missing:
        print("[subset-extra] 无缺失字符，无需补充字体")
        write_css([])  # 写空占位，保证 import 不失败
        return

    # 3) 候选字体逐个加载，按优先级分配字符
    groups = {}  # key -> [chars]
    uncovered = []
    loaded = []  # (key, path, font, cmap)
    for key, path in CANDIDATES:
        if not os.path.exists(path):
            print(f"[subset-extra] 警告: 候选字体不存在，跳过 {path}")
            continue
        try:
            font, cmap = load_cmap(path)
            loaded.append((key, path, font, cmap))
        except Exception as e:
            print(f"[subset-extra] 警告: 读取失败 {path}: {e}")

    for ch in missing:
        for key, path, font, cmap in loaded:
            if ord(ch) in cmap:
                groups.setdefault(key, []).append(ch)
                break
        else:
            uncovered.append(ch)

    # 4) 每组子集化输出 woff2
    faces = []
    for key, path, font, cmap in loaded:
        chars_in = groups.get(key)
        if not chars_in:
            continue
        out = os.path.join(OUT_FONT_DIR, f"hhh-extra-{key}.woff2")
        opts = Options()
        opts.flavor = "woff2"
        opts.layout_features = ["*"]
        opts.name_IDs = ["*"]
        opts.notdef_glyph = True
        opts.notdef_outline = True
        opts.recommended_glyphs = True
        ss = Subsetter(options=opts)
        ss.populate(text="".join(chars_in))
        ss.subset(font)
        font.save(out)
        size_kb = os.path.getsize(out) / 1024
        ranges = ", ".join("U+%04X" % ord(c) for c in chars_in)
        faces.append((out, ranges, size_kb, chars_in))
        print(f"[subset-extra] hhh-extra-{key}.woff2 {size_kb:.1f} KB ({len(chars_in)} 字: {''.join(chars_in)})")

    write_css(faces)

    if uncovered:
        print(f"[subset-extra] 警告: {len(uncovered)} 个字符无系统字体可提取: {''.join(uncovered)}")


def write_css(faces):
    """生成 font-extra.css：同 family 多个 @font-face，按 unicode-range 分流。"""
    lines = [
        "/* !!! 自动生成（scripts/subset-font.cjs → subset-extra.py），勿手改 !!!",
        " * hhh-extra：补充 hhh 源字体缺失的字形（符号/花体/假名），",
        " * 通过 unicode-range 按码位分流，仅在页面用到对应字符时才下载。 */",
    ]
    for out, ranges, size_kb, chars_in in faces:
        url = "/font/" + os.path.basename(out)
        lines += [
            "@font-face {",
            '  font-family: "hhh-extra";',
            "  font-display: swap;",
            f'  src: url("{url}") format("woff2");',
            f"  unicode-range: {ranges};",
            "}",
        ]
    with open(OUT_CSS, "w", encoding="utf-8", newline="\n") as f:
        f.write("\n".join(lines) + "\n")
    print(f"[subset-extra] 写入 {os.path.relpath(OUT_CSS, ROOT)}（{len(faces)} 个 @font-face）")


if __name__ == "__main__":
    main()
