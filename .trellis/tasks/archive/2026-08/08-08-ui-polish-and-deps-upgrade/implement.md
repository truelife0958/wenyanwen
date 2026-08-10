# 执行计划：初三向 UI 动效重构 + 依赖激进升级

## 顺序

WS1 依赖升级（先行回归）→ WS2 动效系统 → WS3 加载速度 → WS4 可复用组件 → WS5 页面细节 → 终验

## 步骤

### Step 1: 依赖激进升级（先行）
- [ ] 记录升级前 dist gzip 总量（基线）
- [ ] `npm install react@19.2.8 react-dom@19.2.8 react-router-dom@7.18.2`
- [ ] `npm install -D vite@8.2.1 @vitejs/plugin-react@6.0.5 @types/react@19 @types/react-dom@19`
- [ ] 适配编译错误（类型/API）：jsx 类型、children、RR7 签名
- [ ] `npm run typecheck` 通过
- [ ] `npm run check` 全链路通过
- [ ] `node scripts/page-scan.mjs` + `browser-test.mjs` 全过（升级回归）
- [ ] 记录升级后 dist gzip 总量

### Step 2: 动效系统（global.css）
- [ ] 动画令牌：--dur-press/--dur-move/--dur-enter
- [ ] `.btn:active scale(0.96)`、`.btn-primary:active` 等按压反馈（全局按钮）
- [ ] 卡片 hover 悬浮（.article-card/.rq-card/.collection-row 已有效果，统一 transform-only）
- [ ] `.view-enter` 增强 + `.stagger > *` nth-child 延迟入场
- [ ] 进度条 `.progress-anim`（home-strip）
- [ ] 翻卡/评分按钮反馈（flashcard）
- [ ] `@media (prefers-reduced-motion: reduce)` 全局降级
- [ ] 页面引用：Home/ArticlePage/Collections/Flashcards/ReviewTab 挂载动效类

### Step 3: 加载速度
- [ ] App.tsx Flashcards lazy（import lazy + Suspense 已有）
- [ ] vite.config.ts build.target 'es2022'
- [ ] 构建对比：升级后 vs 升级前 gzip 总量

### Step 4: 可复用组件
- [ ] `components/ui/PageHeader.tsx`（breadcrumb/标题/元信息/操作区）
- [ ] `components/ui/EmptyState.tsx`（标题/说明/操作）
- [ ] `components/ui/TagChip.tsx`（pill 标签：题型/徽章/状态）
- [ ] `components/QuestionCard.tsx`（题干+答案折叠+标记错题，从 ReviewTab 抽取）
- [ ] 接入消费方（ArticlePage/CollectionsPage/ReviewTab/PracticeSession/Home）
- [ ] 删除旧内嵌实现

### Step 5: 页面细节（初三向）
- [ ] 学习页：原文行高、重点词样式、段落 hover 微动
- [ ] 练习页：选项选中/判分反馈动效、提交按钮状态
- [ ] 首页：搜索聚焦 ring、卡片 hover、进度动画
- [ ] 字词卡：翻面过渡、评分按压
- [ ] 全局 :focus-visible outline

### Step 6: 终验与收尾
- [ ] `npm run check` 全链路
- [ ] `page-scan.mjs`（137+ 项）0 问题
- [ ] `browser-test.mjs`（44+ 项）全过（新增动效断言）
- [ ] scan-findings 更新（本轮改动清单）
- [ ] journal + 归档

## 验证命令

```bash
npm run check
node scripts/page-scan.mjs
node scripts/browser-test.mjs
# 产物对比
du -sh dist/assets/* | gzip 统计
```

## 回滚

- 备份: /tmp/wyw-backup-pre-upgrade/project.tar.gz
- 依赖: npm install 旧版本 或解包
- 代码: replace undo / 备份还原
