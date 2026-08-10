# 执行计划：统一布局与模块整合

## 顺序

1. WS1 共享原子（global.css）→ 2. WS2 页面样式收敛 → 3. WS3 交互精简 → 4. WS4 全页面扫描 → 5. WS5 文档与验证

## 步骤

### Step 1: global.css 共享原子
- [ ] 新增 `.page-title`：1.35rem/700 印章红，左边框古铜金，与现有 h2 风格一致但独立类名
- [ ] 新增 `.section-title`：1.05rem/600 墨色
- [ ] 新增 `.card` 基类：白底、r10、var(--border) 边、轻阴影；`.rq-card` 对齐
- [ ] chip 圆角统一 pill（.pf-chips .chip 由 r20 → r999）
- [ ] 复查 global.css h2 通用规则是否影响页面私有标题（避免双边框）

### Step 2: 页面样式收敛
- [ ] practice.css：`var(--primary,#2f6f4e)`→`var(--primary)`、`var(--bg-soft,#f5f7fa)`→`var(--bg)` 等陈旧 fallback 全部清理；删除与 global 重复定义
- [ ] collections.css：从 practice.css 迁入 .collections-page/.split-layout/.collection-row/.split-nav/.split-content/.collection-session-head/.split-placeholder/.empty-note/.list-search-bar
- [ ] practice.css 保留练习会话专有（.practice-page/.q-item/.result-*/.back-btn 等）
- [ ] home.css：标题/卡片/chip 对齐规范（.article-card 增加白底卡片语言或保持网格卡片）
- [ ] article-page.css / article.css / flashcard.css：标题改用 .page-title/.section-title
- [ ] CollectionsPage/Flashcards/ArticlePage/Home.tsx：标题与卡片类名替换（DOM 小改）

### Step 3: 字词/复习整合精简
- [ ] ReviewTab：标记错题按钮在查看答案后内联（或仅保留 查看答案 + 标记错题 两按钮，收起答案由 toggle 处理）→ 每卡可见按钮 ≤2
- [ ] Home「复习中心 ›」横幅：与导航「复习」重复 → 改文案为更明确动作或移除
- [ ] CollectionsPage 内错题入口核对（无则跳过）
- [ ] ReviewTab「我的错题」chip 保留（篇内错题过滤，非冗余）

### Step 4: 全页面扫描 scripts/page-scan.mjs
- [ ] 路由清单：/、/cards、/collections、16 个题集详情、篇目 3 篇 × (learn/practice/review)、移动端(/, learn, practice, collections, cards)
- [ ] 每页断言：无 console error / 无 pageerror / 无横向溢出 / app-main 非空 / 页面标题存在
- [ ] 输出 scan-findings.md 问题清单；修复发现的问题
- [ ] 0 错误目标

### Step 5: 验证与收尾
- [ ] `npm run check` 全链路
- [ ] browser-test.mjs 更新断言（共享类生效、ReviewTab 按钮数、page-title 存在）并跑通
- [ ] scan-findings.md 落盘
- [ ] journal + 任务归档

## 验证命令

```bash
npm run check
node scripts/page-scan.mjs       # 0 JS 错误 / 0 溢出
node scripts/browser-test.mjs    # 全通过
```

## 回滚点

- 样式改动可逐文件 undo（replace 工具）
- 类名替换前 grep 确认引用面；DOM 改动小步提交
