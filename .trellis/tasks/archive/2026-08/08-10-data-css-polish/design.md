# 数据审核与 CSS 精修 — 技术设计

## 总体方法

```
数据审核: 一次性审核脚本(只读) → 缺陷清单 → 可修则修 → 复跑验证
CSS 精修: tokens 审计 → 页面逐文件审查 → 动效补齐 → 视觉回归(page-scan + vision)
```

两条线独立推进,最后统一跑完整验证链。

## D1 数据审核设计

### 1.1 审核脚本 `research/data-audit.mjs`(只读,不修改数据)

输入: `src/data/runtime/*.json`。输出: 逐类检查 + 缺陷清单(带 articleId/questionId 定位)。

| 检查项 | 规则 | 级别 |
|---|---|---|
| A1 标点异常 | 原文连续 2+ 相同标点(如 `,,`、`。。`)、半角逗号混入、无句读长段(>80字无标点) | ERROR/WARN |
| A2 段落对齐 | paragraphs 数 vs translation 段数差 > 容忍;每段 translation 为空比例 | WARN |
| A3 译文残留 | 译文段落与原文字符重叠率 > 60%(整段未翻译照抄) | WARN |
| A4 背诵句定位 | stars[].sentence 经标点归一后能否在原文中找到(允许 95% 匹配) | ERROR |
| A5 义项质量 | 释义 <2 字(排除单字训诂词如"和""同")、>120 字、含"……"截断 | WARN |
| A6 category 枚举 | 非合法集合(课文注释/重点实词/实词/文言虚词/一词多义/虚词/词类活用/通假字/古今异义/炼字/重点虚词) | ERROR |
| A7 example 定位 | 抽样 50 条 example 在对应文章原文中可找到(去标点) | WARN |
| A8 题干泄漏 | 题干文本包含完整答案串(选择题答案字符、翻译答案原文) | ERROR |
| A9 选择题选项 | options 长度 2-6;answer 单字母在 options 字母范围内(多选 ABD 允许 2-6 字母) | ERROR |
| A10 type 一致性 | 有 options → choice/blank 类;answer 为长文本 → 非 choice | WARN |
| A11 年份/省份 | zhenti origin 题目 year 格式 4 位数字或空 | WARN |
| A12 空白残留 | 全角空格、连续空白、\u00a0、制表符 | WARN |

修复策略: ERROR 级且数据层可修(管道或 raw JSON)→ 修复;WARN 记录定性;OCR 级不可修 → 记录。

### 1.2 人工抽审 6 篇

| 篇目 | 关注点 |
|---|---|
| 论语十二章 (jc-ly) | 12 章分段、译文准确、注释序号 |
| 岳阳楼记 (jc-yueyanglouji) | 长文段落、背诵句、赏析 |
| 出师表 (jc-chushibiao) | 长文、文言注释密度 |
| 桃花源记 (jc-thyj) | 名篇、译文信达雅 |
| 三峡 (jc-sanxia) | 译文对照 |
| 陈涉世家 (jc-chensheshejia) | 最长篇、OCR 风险 |

抽审方法: 读 runtime 数据渲染的完整文本,对照教材常识逐段核读;记录发现到 `data-audit-report.md`。

## D2 CSS 精修设计

### 2.1 现状盘点(先做)
- `src/shared/styles/tokens.ts` — 令牌清单(色/字体/间距/圆角/阴影/动效)。
- 全部 CSS 文件硬编码扫描: `rg "#[0-9a-fA-F]{3,8}|rgba?\(|#[0-9a-fA-F]{3}\b" src/ -g '*.css'` 排除 tokens 文件。
- 动效现状: `transition|animation|@keyframes` 扫描,整理已有动效清单与缺失项。

### 2.2 设计令牌统一
- 硬编码色值 → 语义令牌(var(--primary)/--ink/--card-bg 等);新语义不足时补充 tokens.ts。
- 统一圆角/阴影/间距节奏(4px 基准)。
- 字体系统: 中文栈(系统 + 楷体回退?)保持现有。

### 2.3 动效补齐(全部尊重 prefers-reduced-motion)
在 tokens.ts 或 global.css 定义统一节奏:

```css
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after { animation-duration: 0.01ms !important; transition-duration: 0.01ms !important; }
}
```

| 动效 | 实现 |
|---|---|
| 页面切换 | .view-enter 统一 fade+up 8px, 240ms ease-out |
| 卡片悬浮 | article-card/entry-card: translateY(-2px) + shadow 加深, 180ms |
| 按钮 press | :active scale(0.97) |
| 进度条 | .ps-progress-bar i / .rec-progress: width 过渡 400ms ease |
| 判分反馈 | .q-right/.q-wrong: 徽标 pop-in (scale 0.6→1, 200ms) |
| 弹窗/浮层 | GlossPop/fc-modal: fade+scale-in 160ms |
| 背诵完成 | fc-done: 简单庆祝 pop |
| 骨架屏 | shimmer 已有,统一 keyframes |

### 2.4 页面级审查清单(逐文件)
- home.css: 卡片网格节奏、hero/进度环、grade-tabs 状态
- article.css: 原文排版(行距/字距)、注释角标、key-sent 高亮、对照模式
- practice.css: 选项按钮态、自评按钮、结果页
- flashcard.css: 卡片翻转、评分按钮
- errorbook.css / exam-map.css: 列表/图谱密度
- global.css: 共享类、按钮体系、表单

每文件审查产出: 具体修改点(硬编码→令牌、间距统一、动效补缺)。

## D3 验证链

```bash
npm run check          # data:build + validate + typecheck + build + ssr-check
npm run test:flow      # 46 项浏览器全流程
node scripts/page-scan.mjs  # 77 项全路由扫描(dev server)
npm run vision -- http://localhost:8765/ --all  # 视觉审查(如有 VISION 配置)
```

## 风险

| 风险 | 对策 |
|---|---|
| CSS 改动影响布局 | 每次改动后 page-scan 溢出检查;test:flow 回归 |
| 数据修复波及管道 | 只改 raw JSON 或明确标注的清洗函数,复跑 data:build + validate |
| 动效过度影响学习专注 | 全部动效 <300ms 且 reduced-motion 兜底 |
