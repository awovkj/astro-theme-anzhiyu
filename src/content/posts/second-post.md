---
title: 重构过程中的一些思考
date: 2024-07-12
tags: [前端, Astro]
categories: [技术]
cover: https://picsum.photos/800/400?random=2
description: 记录把 Hexo Pug 主题迁移到 Astro 组件时的一些取舍。
---

## 为什么选 Astro

Astro 的 **群岛架构（Islands Architecture）** 让我们只在需要交互的地方加载 JS，其余页面保持静态，速度快、可维护。

## 样式如何保持不变

原始主题使用 Stylus 编写样式，并大量调用 `hexo-config()` 注入配置。重构时我们写了一个编译脚本，在 Node 端提供了一个 `hexo-config` 求值函数，把 `_config.yml` 作为数据源，编译出与原来完全一致的 `theme.css`。

这样 HTML 结构（class 名）不变、CSS 不变，视觉风格也就原样保留。
