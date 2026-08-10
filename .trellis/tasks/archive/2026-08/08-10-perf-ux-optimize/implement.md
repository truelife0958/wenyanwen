# 执行计划

## Step 1 数据按需加载(R3 核心)
1. build-runtime-data.mjs 额外输出 article-meta.json(126 篇: id/title/grade/author/dynasty/origin/examLevel/wordIds 数/questionIds 数/counts)
2. src/data/index.ts 重构:
   - 静态: meta + collections
   - 动态: loadQuestions() / loadWords() / loadArticles()(动态 import, 缓存 promise)
3. 改造消费方:
   - Home: meta + counts(从 meta 计算)
   - Flashcards: loadWords + loadArticles(背诵句在 articles.recitation)
   - ArticlePage/ArticleReader: loadArticles
   - PracticePage/ExamMap/ErrorBookPage: loadQuestions
4. data/index.ts 保留兼容导出(learningArticles 等改从 load 后填充?不——静态导出删除, 逐个修消费方)

## Step 2 动画丝滑化(R1)
1. global.css: 动画 token(--dur-fast/--dur-base/--ease-out 已有, 检查覆盖)
2. 列表项/卡片 hover 补 transform 合成(will-change 仅用于持续动画)
3. prefers-reduced-motion 覆盖所有 keyframes
4. 页面切换过渡(路由变化时内容区 fade/slide)

## Step 3 组件重构(R2)
1. src/shared/ui/ 新增: Card.tsx / Tag.tsx / Modal.tsx / EmptyState.tsx / SectionHeader.tsx
2. 替换: 首页/学习页/字词卡/错题本 中的重复 JSX
3. 删除被替换的死 CSS

## Step 4 依赖评估 + 页面细节(R3 余项 + R4)
1. npm outdated 复查, 可安全升级的升(devDeps)
2. 六页细节修复 ≥ 10 处

## Step 5 验证
- npm run check / test:flow / page-scan / validate
- 构建产物对比: 首屏 chunk 大小
- 浏览器实测各页正常
