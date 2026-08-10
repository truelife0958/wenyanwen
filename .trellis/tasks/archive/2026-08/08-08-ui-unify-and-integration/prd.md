# 统一布局与模块整合:全页面体检

## 背景

React 重构版（Vite+TS）已具备基础布局（.app-shell + .app-main 1024px），但各页面视觉语言存在不一致，字词/复习模块交互有冗余。用户要求：
1. 整个项目统一布局与 CSS
2. 字词、复习模块入口整合精简
3. 用浏览器自动化全页面扫描，逐页排查问题

## 现状侦察结论

### 已有统一基础
- `.app-shell` flex 列布局 + `.app-main` max-width 1024px + 统一 padding
- 全局 CSS 变量体系（--primary 印章红 #9c2a2a / --accent 古铜金 / --radius 等）
- ArticlePage 工作区（breadcrumb + head + tabs + content）与 Flashcards/Collections 的 split-layout 双栏模式
- 全页面无横向溢出（scrollW==innerW，桌面 1280）

### 已发现的不一致问题

**A. 视觉语言不统一**
- A1. 页面标题字号层级各异：workspace-head h2=25.6px、collection-session-head h2=20.8px、flashcard h3=19.2px、collections split-title=15.2px
- A2. 卡片语言不统一：.article-card（无底色 r12 红边）、.rq-card（白底 r10 米色边）、.collection-row（无底无框 r8 hover 才亮）
- A3. chip 圆角不一致：.cat-chip r999（pill）vs .pf-chips .chip r20
- A4. Home 无页标题（其他页有 workspace-head / split-title）
- A5. practice.css 大量 fallback 色值为陈旧蓝绿色系（`var(--primary,#2f6f4e)` 绿、`var(--bg-soft,#f5f7fa)` 蓝灰）——与全局印章红/纸色系不符，易造成视觉漂移

**B. CSS 组织问题**
- B1. collections.css 仅 1 行注释，全部样式散落在 practice.css
- B2. 各页 css 与 global.css 存在重复定义（btn/card/chip 语义应统一收敛）

**C. 字词/复习交互冗余**
- C1. ReviewTab 每张题卡 3 个按钮（查看答案/收起答案/标记错题），61 题 → 63 个按钮，交互繁复
- C2. 错题入口重复：Home 分类"错题本"、ReviewTab "错题本"链接、Collection 页内
- C3. Home"复习中心 ›"链接与导航"复习"重复

**D. 其他待扫描确认**
- D1. collections 页 12.48px 为主字号（偏小），无卡片感
- D2. collections-detail H2+H3 双标题重复（《礼记》二则 ×2）
- D3. Flashcards/Collections 移动端布局（双栏 → 单栏）是否可用
- D4. 逐页 JS 错误 / 横向溢出 / 交互可用性（browser-test 已覆盖主流程，未覆盖全部页面）

## 目标

1. **统一布局规范落地**：页面标题/卡片/按钮/chip 视觉语言统一，应用到全部页面
2. **CSS 整合**：收敛重复定义、清理陈旧 fallback、合理组织文件
3. **字词/复习整合精简**：ReviewTab 交互精简、错题/复习入口去重
4. **全页面自动扫描**：playwright 扫描所有路由（桌面+移动），输出并修复问题

## 验收标准

1. 全部页面标题字号/卡片/按钮/chip 使用统一规范（抽取共享类名）
2. ReviewTab 题卡交互精简（每卡 ≤2 个可见按钮或合并动作）
3. 重复入口清除（错题本/复习中心链接去重）
4. 全页面扫描脚本（scripts/page-scan.mjs）：覆盖全部路由 × 桌面/移动，0 JS 错误、0 横向溢出
5. `npm run check` + 更新后的 browser-test 全通过
6. 扫描问题清单落盘（audit-findings 补充或独立文档）

## 范围外

- 不改数据层（raw/runtime）
- 不做新功能（新页面/新模块）
- 不动业务逻辑（判分/错题存储/SM-2）
