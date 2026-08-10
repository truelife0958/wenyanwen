# 初三向 UI 动效重构 + 依赖激进升级 — 问题与改动清单 (2026-08)

> 状态: 全部完成并验证 (check / page-scan 137/0 / browser-test 44/0)

## A. 依赖激进升级 (React 19 / Vite 8 / RR 7)

| 包 | 旧 → 新 | 适配 |
|---|---|---|
| react / react-dom | 18.3.1 → 19.2.8 | 零代码改动 (createRoot 已用) |
| react-router-dom | 6.30.4 → 7.18.2 | 零改动 (HashRouter/Routes/NavLink 兼容) |
| vite | 5.4.21 → 8.2.1 | manualChunks 对象语法废弃 → advancedChunks |
| @vitejs/plugin-react | 4.7.0 → 6.0.5 | — |
| @types/react / dom | 18 → 19.2 | 零类型破坏 |
| playwright-core | (丢失) → 重装 devDep | npm install 清掉了孤儿包 |

升级中发现并修复:
- A1 Vite 8 (rolldown) 不再接受 manualChunks 对象 → 改 advancedChunks groups
- A2 lightningcss 严格报错: global.css 残留孤立 CSS 片段 (早前替换残留) → 删除
- A3 npm install 移除 playwright-core (不在 package.json) → 重新加入 devDependencies
- A4 升级后 npm audit 0 漏洞 (之前 2 个)

## B. 动效系统 v2 (丝滑、低占用、可降级)

- B1 global.css 新增动效区块: .stagger 子元素依次入场 (≤240ms 延迟) / fadeInUp / 进度条过渡 / 判分反馈 pop / :focus-visible 统一 outline
- B2 按钮按压 scale(0.95) (已有, 保留), 卡片 hover-lift transform-only (已有, 保留)
- B3 prefers-reduced-motion 全局降级: 动画/过渡时长归零, 禁用位移, stagger 直接显示
- B4 页面挂载: Home article-grid / ReviewTab / Collections collection-list / PracticeSession q-item 加动效类
- B5 验证: reduced-motion 下 animation-duration = 1e-05s, 正常 0.3s

## C. 加载速度

- C1 Flashcards 懒加载 (独立 chunk 9.56KB, 首屏 index 284→257KB / gzip 90→83KB)
- C2 vite build.target es2022
- C3 产物对比: 升级前 gzip 757.9KB → 升级后 779.7KB (+2.9%, React19+RR7 开销; 数据大 chunk 691KB 属 PWA 离线缓存策略保留)

## D. 可复用组件重构

| 组件 | 内容 | 消费方 |
|---|---|---|
| ui/PageHeader.tsx | breadcrumb+标题+徽章+元信息+操作区 | ArticlePage、CollectionsPage |
| ui/EmptyState.tsx | 图标+标题+说明+操作 | ReviewTab |
| ui/TagChip.tsx | pill 标签 5 色调 | PracticeSession |
| QuestionCard.tsx | 题干+答案折叠+标记错题 | ReviewTab (自内嵌抽取) |

- D1 ReviewTab 内嵌 QuestionCard/ansText → 抽为共享组件
- D2 ac-badge 样式移至 global.css (PageHeader 内使用), 补 must/core 变体色

## E. 页面细节 (初三向)

- E1 **练习选项判分反馈缺失 (重大缺口)**: q-option/q-right/q-wrong 类无任何 CSS → 补全选项基础/选中/正确(绿 pop)/错误(红 shake)样式 + 判分徽记色
- E2 学习页段落 hover 微背景提示 + reading-para 高亮
- E3 首页搜索框聚焦 ring
- E4 全局 :focus-visible outline (键盘可达性)
- E5 browser-test 选择器适配 PageHeader (.workspace-head h2 → .page-header .page-title)

## F. 验证结果

```
npm run check            → data:build + validate(0错) + typecheck + vite8 build + SSR ✅
node scripts/page-scan.mjs   → 137 通过 / 0 问题
node scripts/browser-test.mjs → 44 通过 / 0 失败
prefers-reduced-motion   → 动画禁用生效 (1e-05s vs 0.3s)
产物 gzip                → 757.9 → 779.7 KB (+2.9%)
npm audit                → 0 漏洞
```

## G. 回滚

- 完整备份: /tmp/wyw-backup-pre-upgrade/project.tar.gz
- 依赖降级: npm install 旧版本 (react@18.3.1 vite@5.4.21 react-router-dom@6.30.4)
