# 执行计划: 动画讲解重构+视觉优化 (视觉审查驱动)

## 前置
```bash
npm run typecheck && npm run validate
```

## Step 1: 讲解模式技术重构 (LectureMode)
- 拆分为内部子模块：`useLectureData` hook（数据编排）+ `SentenceList`（句子+内联渲染）+ `LectureBar`（控制条）+ `PracticePanel`（练习卡）
- 视觉优化：当前句高亮加强（金色渐变+左竖条+过渡动画）、控制条加"第 n/N 句"+重播本句按钮、译文格式强化、内联字词点击朗读

## Step 2: 地图优化
- 节点标签长标题省略号防重叠（max-width + ellipsis + title）
- 已通关/可玩/锁定节点差异化（尺寸/描边/透明度）
- 世界进度可视化（进度条）+ 导航条
- 底部内容区与导航分隔（留白/分隔线）

## Step 3: 历练页优化
- 段落行高 1.8-2.0 + 段间距
- 查看译文/赏析按钮样式升级（小按钮）

## Step 4: 默诵页优化
- 填空下划线强化（加粗/底色）

## Step 5: 回归验证
```bash
npm run typecheck && npm run validate
node scripts/browser-test.mjs
node scripts/page-scan.mjs
node scripts/full-flow-test.mjs
npm run build
```
- 截图目检：讲解模式重构后效果

## Step 6: 部署
- commit + push + vercel --prod

## 回滚点
- 每步独立可验证；全完成一次 commit
