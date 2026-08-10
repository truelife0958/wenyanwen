# CSS 精修报告 — 书卷纸墨风格统一与动效补齐

日期: 2026-08-10 · 任务: 08-10-data-css-polish
方法: 令牌审计 → 精确替换 → 动效补齐 → VLM 视觉审查两轮迭代 → 全链路回归

## 1. 设计令牌统一

### 1.1 新增令牌
- `--bronze: #8a6d3b` — 高频古铜棕(此前 15 处硬编码分散在各 CSS)

### 1.2 硬编码 → 令牌替换(零视觉变化,精确匹配)
将 13 个与令牌等值的硬编码色替换为 `var(--...)`:

| 硬编码 | 令牌 | 说明 |
|---|---|---|
| #fff / #ffffff | var(--card-bg) | 卡片底/白字 |
| #c4453c | var(--primary) | 主红 |
| #a8352e | var(--primary-dark) | 深红 |
| #fbeae7 | var(--primary-soft) | 浅红底 |
| #d4a855 | var(--accent) | 古铜金 |
| #faf0dc | var(--accent-soft) | 浅金底 |
| #8a6d3b | var(--bronze) | 古铜棕 |
| #7a7162 | var(--ink-light) | 浅墨 |
| #a39a88 | var(--muted) | 灰 |
| #3a8a5f | var(--success) | 绿 |
| #c05252 | var(--error) | 红 |
| #e5ddd0 | var(--border) | 边框 |
| #f2ece0 | var(--bg-soft) | 浅底 |

共替换 8 个 CSS 文件约 80 处。
⚠ 过程中发现并修复一次批量替换事故: `#fff` 前缀误伤 6 位色值(`#fffdf6` → `var(--card-bg)df6`),20 处全部还原为 `#fffXXX`。

### 1.3 JSX 侧
- Home.tsx 进度环 SVG 硬编码 `#f0e9dd`/`#c4453c` → `var(--border)`/`var(--primary)`

## 2. 死样式清理
- home.css: 删除 `.cat-nav`/`.cat-chip`/`.cat-icon`/`.cat-count`(首页已改用 grade-tabs,0 JSX 引用)
- home.css: `.gt-count` 3 段重复定义合并为 1 条(此前最后一规则覆盖前面的样式冲突)

## 3. 动效补齐(全部 <300ms,尊重 prefers-reduced-motion 已有兜底)

| 位置 | 动效 | 时长 |
|---|---|---|
| practice.css | `.q-result` 判分徽记 pop-in(resultIn: scale 0.6→1.08→1) | 250ms spring |
| flashcard.css | `.fc-done` 完成页 pop + emoji 弹跳(doneBounce) | 400ms / 800ms |
| flashcard.css | `.fc-prog-bar` 进度条统一为渐变+圆角+缓动(与练习进度条一致) | 400ms |
| home.css | `.article-grid` 卡片间距 10→12px(垂直/水平节奏统一) | — |

已有且保留: 选项对错动画(optionRight/optionWrong)、注释浮层 glossIn、卡片悬浮 hover-lift、stagger 入场、骨架 spin、reduced-motion 全降级。

## 4. 对比度与对齐修复(VLM 审查驱动)

| 问题 | 严重度 | 修复 |
|---|---|---|
| "核心重点"标签黄底浅字几乎不可读 | 高 | 统一为实心 `accent-brown` 底白字(与"中考必考"红底白字一致) |
| 底部导航未选中项对比度不足 | 高 | `#5a4a3a` → `var(--ink-2)` 加深 |
| 年级筛选 tab 未选中对比度低 | 中 | `var(--ink-light)` → `var(--ink-2)` 加深 |
| 长标题卡片徽章与作者信息重叠 | 高 | exam-must/core 卡片 `.ac-title` 预留 46px 右侧空间 |
| 错题本 "0 条错题" 数字/文字对齐 | 中 | 新增 `.entry-count` flex baseline 对齐 |
| 篇目网格垂直间距过挤 | 中 | gap 10→12px |

## 5. VLM 审查迭代记录

- 第一轮(修改前): 长标题重叠(高)、标签不统一(中)、错题本计数孤立(中)、tab 对比度(低)
- 第二轮(令牌+对齐后): 核心标签对比度(高)、导航对比度(高)、网格间距(中)
- 第三轮(修复后): 遗留仅"中考必考红底红字"误判(playwright 实测白字红底,对比正常)、0% 进度圈可读性(低,ring-text 为 primary 色可读)

## 6. 验证结果

| 验证 | 结果 |
|---|---|
| `npm run check`(data:build+validate+typecheck+build+SSR) | ✅ 0 错误 |
| `npm run test:flow` | ✅ 46/46 |
| `node scripts/page-scan.mjs` | ✅ 77/77(桌面+移动无溢出) |
| playwright 抽查选择题渲染 | ✅ 提取选项正常显示 |

## 7. 改动文件清单

- `src/shared/styles/tokens.ts` — 新增 --bronze
- `src/shared/styles/global.css` — 令牌替换、tab 对比度、标签统一、标题防重叠
- `src/features/home/home.css` — 死样式清理、gt-count 合并、grid 间距、entry-count 对齐、令牌替换
- `src/features/home/Home.tsx` — 进度环 SVG 令牌化、entry-count 结构
- `src/features/learning/article.css` / `article-page.css` — 令牌替换
- `src/features/practice/practice.css` — 判分 pop 动效、令牌替换
- `src/features/cards/flashcard.css` — 完成庆祝、进度条统一、令牌替换
- `src/features/errorbook/errorbook.css` / `src/features/map/exam-map.css` — 令牌替换
