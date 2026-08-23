---
title: Hexo 标签插件渲染测试
date: 2026-08-21 16:00:00
tags:
  - Astro
  - 测试
categories:
  - 博客
cover: https://picsum.photos/800/400?random=9
---

本页用于验证 Hexo 自定义标签语法在 Astro 构建期的转换效果。

## note 提示块

{% note info %}
这是一个 **info** 类型的提示块，支持内部 markdown 渲染。
{% endnote %}

{% note warning %}
这是 **warning** 类型的提示块。
{% endnote %}

## tip 提示

{% tip success %}
tip 成功状态的提示内容。
{% endtip %}

## tabs 标签页

{% tabs test-tab %}
<!-- tab 第一个 -->
第一个标签页的内容，包含 `行内代码`。

```js
console.log("hello from tab 1");
```
<!-- endtab -->
<!-- tab 第二个 -->
第二个标签页的内容。
<!-- endtab -->
{% endtabs %}

## timeline 时间线

{% timeline 时间轴标题,orange %}
<!-- timeline 2026-01-01 -->
第一个节点的内容。
<!-- endtimeline -->
<!-- timeline 2026-08-21 -->
第二个节点的内容，**支持加粗**。
<!-- endtimeline -->
<!-- timeline 未来 -->
第三个节点的内容。
<!-- endtimeline -->
{% endtimeline %}

## folding 折叠块

{% folding blue, 点击展开代码示例 %}
```bash
echo "hidden code block inside folding"
```
{% endfolding %}

## btns 按钮组

{% btns grid5 %}
{% cell 文档, /, anzhiyufont anzhiyu-icon-book %}
{% cell 源码, https://github.com, anzhiyufont anzhiyu-icon-github %}
{% endbtns %}

## 行内标签

一个 {% label 红色标签 red %} 与 {% label 默认标签 %} 的行内测试。

{% span cyan, 这是 span 彩色文字 %} 和普通文字混排。

## checkbox 复选框

{% checkbox checked, 已勾选的选项 %}
{% checkbox 未勾选的选项 %}
{% radio 单选选项 %}

## hideToggle 隐藏切换

{% hideToggle 点击查看隐藏内容 %}
隐藏的 **markdown** 内容。
{% endhideToggle %}

<!-- touch -->

<!-- touch2 -->
