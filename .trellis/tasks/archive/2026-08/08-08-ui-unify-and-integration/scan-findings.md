# 统一布局与全页面扫描问题清单 (2026-08)

> 任务: 08-08-ui-unify-and-integration
> 状态: 全部修复, 验证通过 (check / browser-test 44/44 / page-scan 137 项 0 问题)

## A. 视觉语言统一 (已修复)

| 问题 | 修复 |
|---|---|
| A1 页面标题字号各异 (25.6/20.8/19.2/15.2px) | 新增共享 `.page-title` (1.35rem) 与 `.section-title` (1.05rem)；CollectionsPage 题集标题→page-title、左栏→section-title、Flashcards→section-title |
| A2 卡片语言不统一 | 全局已有 `.card` 基类 (白底 r10 米边)；`.collection-row` hover/active 改为米色系 (#faf5ec + accent 边) |
| A3 chip 圆角不一致 (r20 vs r999) | 共享 `.chip` pill 类加入 global.css；`.pf-chips .chip` 对齐 999px |
| A4 首页无标题 | Home 顶部加 `.page-title 篇目中心` |
| A5 practice.css 陈旧 fallback 色值 | 全部清理: `var(--primary,#2f6f4e)`→`var(--primary)`、`var(--bg-soft,#f5f7fa)`→`var(--bg)` 等 7 处; `#2f6f4e`→`var(--success)`、蓝灰标签→米色系 |
| A6 practice.css 重复定义 .btn | 删除重复块, 统一走 global.css 按钮语言 (pill/阴影) |
| A7 home-strip 数字粘连 | `.hs-label em` 加间距 |

## B. CSS 组织 (已修复)

| 问题 | 修复 |
|---|---|
| B1 collections.css 空壳 | 重写为承载综合题集双栏样式 (自 practice.css 迁入并清理 fallback) |
| B2 页面标题 CSS 重复定义 | fc-head h3 重定义删除; collections.css 引用共享类 |

## C. 字词/复习整合精简 (已修复)

| 问题 | 修复 |
|---|---|
| C1 ReviewTab 每卡 3 按钮 (61 卡 → 63 btn) | 「标记错题」仅在查看答案后内联出现 (展开后 ≤2 按钮); 已标记状态 disabled |
| C2 错题本入口悬空 | Home 分类/ReviewTab 链接指向 /collections 但页内无错题; SessionResult errorHref="/errorbook" 路由不存在 → 点击落回首页 |
| C3 错题无处可看 | CollectionsPage 左栏新增「我的错题」区块: 按篇目分组、可移除/清空、空态引导 |
| C4 errorHref 失效 | CollectionsPage/PracticePage errorHref → /collections (页内含错题区块) |

## D. 全页面扫描 (scripts/page-scan.mjs)

覆盖: 桌面核心页 (首页/字词卡/复习中心) + 全部 16 个综合题集 + 3 篇 × 3 tab + 移动端 6 关键页 + 共享类抽查。

**结果: 137 项通过 / 0 问题**

扫描发现并修复:
- D1 首页无标题 → Home 加 page-title
- D2 扫描样本 id 错误 (jc-chibi-106 → article-chibi-106, 赤壁) — 数据侧实际正常
- D3 扫描断言只查 h1/h2/h3 标签 → 补 .page-title/.section-title 类

## E. 验证

```
npm run check          → data:build + validate(0错误) + typecheck + vite build + SSR 全部通过
node scripts/page-scan.mjs  → 137 通过 / 0 问题
node scripts/browser-test.mjs → 44 通过 / 0 失败 (新增: 首页标题/chip pill/标记错题流程)
```

## F. 文件变更

- `src/styles/global.css` — 新增 .page-title/.section-title/.chip 共享原子
- `src/pages/collections.css` — 从空壳重写为综合题集双栏样式 + 错题区块样式
- `src/pages/practice.css` — 清理 fallback/重复 btn/迁移 collections 样式
- `src/pages/home.css` — article-card 对齐全局变量; hs-label 间距
- `src/pages/flashcard.css` — fc-head h3 重定义删除
- `src/pages/article-page.css` — pf-chips chip 圆角 pill; fallback 清理
- `src/pages/Home.tsx` — 页面标题
- `src/pages/CollectionsPage.tsx` — section-title/page-title; 错题本区块; errorHref 修复
- `src/pages/Flashcards.tsx` — h3 section-title
- `src/components/ReviewTab.tsx` — 标记错题交互精简
- `src/pages/PracticePage.tsx` — errorHref 修复
- `scripts/page-scan.mjs` — 新增全页面扫描脚本
- `scripts/browser-test.mjs` — 断言更新 (44 项)
- `scripts/ssr-check.mjs` — CollectionsPage SSR 渲染补 ErrorBookProvider
