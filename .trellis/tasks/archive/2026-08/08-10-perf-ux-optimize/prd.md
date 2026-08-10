# 动画/组件/加载/UI 综合优化

## Goal

四类优化: 动画更丝滑且占用低 · UI 重构出可复用组件 · 依赖评估 + 页面加载速度大幅优化 · 页面小细节与 UI 打磨。

## 现状(2026-08-10 侦察)

- **加载瓶颈**: src/data/index.ts 静态导入全部 runtime JSON → 首屏下载 questions 375KB + articles 228KB + words 100KB (gzip ≈ 700KB)。questions 只在练习/图谱/错题本用, words 只在字词卡用, articles 的 reading 只在学习页用
- 路由级 chunk 分割已有(ArticlePage/Flashcards/PracticePage/ExamMap/ErrorBookPage)
- 依赖较新: React 19.2.8 / Vite 8.2.1 / RR7 7.18.2 / TS 5.9.3 (TS 7.0.2 为预览版不升)
- 动画: 现有 transition/keyframes 但缺 GPU 合成优化

## Requirements

### R1 动画丝滑化
- 动画只用 transform/opacity(避免 layout 抖动), 关键动效补 will-change
- 过渡曲线统一(ease-out 为主), 时长体系 token 化
- prefers-reduced-motion 全面兜底
- 页面切换/列表项进出场动画

### R2 组件重构
- 抽取可复用组件: Card(卡片容器)、Tag/Chip(标签)、Modal(弹窗基座)、EmptyState(空态)、SectionHeader(模块标题)
- 替换各处重复 JSX/CSS(统计: 现有弹窗/空态/标签各 3+ 处重复)

### R3 依赖与加载速度
- 数据按需加载: 
  - 新增 article-meta.json(126 篇元数据 ~30KB) → 首页只用 meta
  - questions/words/articles 全量改动态加载(练习页/字词卡/学习页进入时)
  - 首屏 gzip 从 ~700KB 降至 ~150KB 以内
- 依赖评估: 能升的升(npm outdated 无重大可升项则记录)
- 构建产物确认无回归

### R4 页面细节
- 首页/学习/练习/字词卡/图谱/错题本 六页小细节打磨(对齐/间距/悬停/焦点态/文案)

## Acceptance Criteria

- [ ] 首屏数据 gzip ≤ 150KB(从 ~700KB)
- [ ] 全功能回归: check ✓ / test:flow 46/46 ✓ / page-scan 77/77 ✓
- [ ] 动画符合 reduced-motion 规范
- [ ] 至少 5 个组件被抽取复用, 无死代码残留
- [ ] 页面细节修复 ≥ 10 处
