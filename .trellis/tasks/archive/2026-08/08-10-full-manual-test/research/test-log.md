# 逐项功能测试日志 — wuhan-wenyanwen-app

日期: 2026-08-10 · 任务: 08-10-full-manual-test
方法: Playwright 浏览器实测(非仅自动化套件),分模块逐项记录。

## 测试统计

| 模块 | 通过/总数 | 脚本 |
|---|---|---|
| 首页 | 20/20 | research/test-home.mjs |
| 学习页 | 20/20 | research/test-learning.mjs |
| 练习页 | 15/15 | research/test-practice.mjs |
| 字词卡/图谱/错题本 | 19/19 | research/test-cards-map-errors.mjs |
| 移动端/边界/PWA | 16/16 | research/test-edge.mjs |
| 生产 PWA 离线+深链 | 全过 | 实测 |
| **合计** | **90/90** | |
| 基线 test:flow | 46/46 | |
| 基线 page-scan | 77/77 | |

## 发现并修复的缺陷(2 个真实缺陷)

### 1. 练习判分颜色从未生效 (PracticeSession.tsx)
- **症状**: `.q-result` 的 `ok`/`bad` 修饰类在 JSX 中从未输出,答对/答错的**红绿颜色样式从未生效**(文字始终默认色)。
- **证据**: 测试脚本 debug 发现 `<span class="q-result">✗ 答错</span>` 无 ok/bad 类,而 CSS 定义 `.q-result.ok { color: var(--success) }`。
- **修复**: 两处渲染改为模板字符串 `q-result ${right ? 'ok' : 'bad'}`(选择题 + 主观题自评)。

### 2. 词条弹窗无 Esc/遮罩关闭 (Flashcards.tsx VocabModal)
- **症状**: 字词卡词条弹窗只能点 ✕ 关闭;Esc 和点击遮罩均无效(与其他弹窗 GlossPop 行为不一致)。
- **证据**: VocabModal 无 keydown 监听,遮罩 onClick 是 stopPropagation 而非关闭。
- **修复**: 加 useEffect Esc 监听(带清理);遮罩 onClick=onClose;弹窗体 stopPropagation 防误关。

## 测试过程中的测试脚本修正(非应用缺陷)

1. 首页年级 tab 用长名("七年级上册19"),选择器短名修正。
2. 清空搜索后按年级视图显示(19 张=默认七上),断言修正。
3. 学习页: 原文带注释圈号(设计)、鉴赏页 class 为 .appr-para、朗读无独立设置面板(语速固定 0.92 设计)、无效 id 显示"未找到该篇目+返回链接"(设计)。
4. 练习页: 提交按钮需等待 enabled(React 状态更新);多选仅 practice:183 一道(数据正确,题序未覆盖)。
5. 错题本: 无单条移除(设计为组级移除+清空),选择器修正。

## 关键验证细节

### 首页
- 统计: 126 篇 · 2144 词义 · 2022 题 ✓
- 搜索: 篇名(岳阳楼记 1 张)/作者(陶渊明 2 篇、苏轼 5 篇)/无结果空态 ✓
- 年级 tab: 6 个,切换后篇目正确(九下 17 篇,首篇江城子·密州出猎)✓
- 必考徽章 10 个、核心徽章 3 个(九上视图)✓
- 今日任务 3 项、进度环 0%、错题本入口卡 ✓

### 学习页(岳阳楼记)
- 原文 9 段、注释标注词 43 处、注释浮层(点击弹出/内容正确/Esc 关闭/点击空白关闭)✓
- 译文展开、笔记清单、朗读按钮+提示 ✓
- 三 tab 切换 URL 正确;鉴赏 18 区块 ✓
- 无效 id 显示未找到页;旧链接 /learning/岳阳楼记 → /articles/jc-yueyanglouji/learn ✓

### 练习页(论语十二章 14 题)
- 单题流全程: 填空/选择混合作答 → 13/14 分 → 结果页 → 错题入本 ✓
- 提取题抽查(三峡): 选项 A-D 渲染、点击判分、答错样式 ✓(第 3 题即选择题)

### 字词卡
- 实词 80 条/虚词 6 条切换、词条弹窗(10 义/8 篇/例句)、Esc 关闭 ✓
- 背诵模式: 350 句、翻卡显示译文、记住后进度推进 ✓

### 图谱/错题本
- 图谱渲染、高频过滤、?p=词类活用 深链无错 ✓
- 错题本: 分组、组级移除(持久化)、清空、空态 ✓

### 移动端 375px
- 6 页全部无横向溢出;3 tab 切换;无 JS 错误 ✓

### 边界
- 损坏 localStorage(3 键非法 JSON)不崩溃、无 JSON 错误 ✓
- 连点注释词 10 次、连点 tab 5 轮不崩 ✓

### 生产 PWA(dist 静态服务器)
- SW 注册 ✓、离线 reload 19 张卡 ✓、深链恢复 /map ✓、无错误 ✓

## 修复后复测

- `npm run check`: data:build + validate(0 错) + typecheck + vite build + SSR 12 路由 ✓
- `npm run test:flow`: 46/46 ✓
- `node scripts/page-scan.mjs`: 77/77 ✓

## 结论

应用整体质量高,90 项逐项测试仅发现 2 个真实缺陷(均已修复):判分颜色失效(视觉)、弹窗关闭方式缺失(交互一致性)。无数据错误、无崩溃、无控制台错误。
