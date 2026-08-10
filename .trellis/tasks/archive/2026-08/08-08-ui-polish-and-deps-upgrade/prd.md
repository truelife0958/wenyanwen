# 初三向 UI 动效重构 + 依赖激进升级

## 背景

用户要求：整个项目面向初三中考备考学生精简整合、美观、动效丰富且丝滑（优化动画占用）、重构 UI 与可复用组件、激进升级依赖、优化加载速度、打磨页面细节。

已确认决策：
- **激进升级**：React 19.2 + Vite 8 + react-router-dom 7 + @types 19
- **丰富动效**：按钮按压/卡片悬浮/路由过渡/列表 stagger/进度条动画，但保持备考专注感
- 项目无 git → 升级前已完整备份（/tmp/wyw-backup-pre-upgrade/project.tar.gz）

## 现状（侦察）

| 项 | 现状 |
|---|---|
| 依赖 | react 18.3.1 / react-router-dom 6.30.4 / vite 5.4.21 / plugin-react 4.7.0 / ts 5.9.3 |
| 动画 | global.css 已有 fadeIn/pop/slideUp/popIn/float + view-enter；页面级零散 animation |
| 性能 | 数据 manualChunks 已分（questions 633KB / words 465KB）；ArticlePage/CollectionsPage 已 lazy；Home/Flashcards 静态 |
| 组件 | ErrorBoundary/StemView 可复用；QuestionCard/NoteList/AnnotText 内嵌于组件；空状态/徽章样式分散 |
| 可访问性 | 无 prefers-reduced-motion；无 focus-visible 统一样式 |

## 目标

1. **依赖激进升级**：React 19.2.8 / Vite 8.2.1 / @vitejs/plugin-react 6.0.5 / react-router-dom 7.18.2 / @types/react 19；全量回归通过
2. **动效丰富且丝滑**：统一动画令牌；按钮/卡片/路由/列表/进度条动效；只动画 transform/opacity（GPU 友好）；prefers-reduced-motion 降级
3. **加载速度**：Flashcards 懒加载；build.target 提升；构建产物体积对比下降
4. **可复用组件重构**：PageHeader / EmptyState / TagChip / QuestionCard 抽取
5. **页面细节（初三向）**：学习字号与重点句、练习判分反馈、搜索聚焦、焦点可见性

## 验收标准

1. `npm run check` 全链路通过（升级后 typecheck/build/SSR 无破坏性改动）
2. `node scripts/page-scan.mjs` 137 项全过；`browser-test.mjs` 44 项全过（含新增动效断言）
3. 构建产物 gzip 总大小不高于升级前（或说明差异）
4. prefers-reduced-motion 生效（reduced 时无位移动效）
5. 新增共享组件被 ≥2 处使用（PageHeader/EmptyState/TagChip）
6. 问题/改动清单落盘

## 范围外

- 数据层/业务逻辑（判分、SM-2、错题存储）
- 新增页面/新功能
- 图标库/UI 框架引入（保持轻量无新依赖）

## 风险

- React 19 / RR7 / Vite 8 破坏性 API：全量回归兜底，备份可回滚
- Vite 8 若遇兼容问题回退 Vite 7（记录在案）
- 动效过度干扰备考：所有动效 ≤300ms 且可降级
