# 从零重构优化应用层

## 背景

用户要求从零重构整个项目。已确认：**重写应用层**（保留 raw→runtime 数据管道与测试脚本，数据是多年积累资产）、**保持 React19+Vite8+RR7 栈**、**6 功能模块保功能重实现**、创建任务完整规划。

## 现状（应用层）

| 文件 | 行数 | 问题 |
|---|---|---|
| Flashcards.tsx | 423 | 巨型组件（模式切换/翻卡/评分/统计一锅端） |
| ArticleReader.tsx | 334 | 巨型组件（原文/注释/译文/朗读/分析内联） |
| PracticeSession.tsx | 276 | 巨型组件（题型分支/自评/进度） |
| Home.tsx | 269 | 首页逻辑+布局耦合 |
| StemView.tsx | 181 | 复杂 |
| types.ts | 247 | 领域类型混杂 |
| global.css | 673 | 共享类+基础令牌 |

结构问题：pages/ + components/ 平铺，无 feature 边界；组件内部高度耦合；数据层裸导入（无 hooks 封装）。

## 目标架构（feature-first）

```text
src/
├── main.tsx                 入口（保持）
├── app/
│   ├── App.tsx              Provider + 路由装配
│   ├── routes.tsx           集中路由表
│   └── providers.tsx        ErrorBookProvider 组合
├── features/
│   ├── home/                Home.tsx + home.css
│   ├── learning/            ArticlePage/ArticleReader/ArticleAnalysis + article css
│   ├── practice/            PracticePage/PracticeSession + practice.css
│   ├── review/              ReviewTab/QuestionCard
│   ├── collections/         CollectionsPage + collections.css
│   ├── cards/               Flashcards + flashcard.css
│   └── errorbook/           store + ErrorBookSection
├── data/                    保留管道；index.ts 提供查询 API
├── shared/
│   ├── ui/                  Icon/PageHeader/EmptyState/TagChip
│   ├── hooks/               useArticle/useArticleQuestions 等
│   ├── lib/                 sm2/ls/align 工具
│   └── styles/              global.css
├── types.ts
```

## 质量目标

1. 目录 feature-first，模块边界清晰
2. 数据访问 hooks 化（useArticle/useQuestions/useProgress），页面不再裸读 import
3. 巨型组件拆分：ArticleReader → ReaderToolbar/NoteList/GlossPop/ParaBlock；Flashcards → 模式路由
4. 类型域清晰（article/question/word/collection/practice）
5. 集中路由 + Provider 组合
6. 设计系统落位（书卷纸墨令牌 + Icon + 共享组件）
7. 每阶段可运行可验证（渐进迁移，无大爆炸）

## 验收

1. `npm run check` 全链路通过
2. `npm run test:flow`（38）+ browser-test（45）+ page-scan（137）全过
3. 6 功能模块行为一致（保功能）
4. 目录符合目标架构，旧 pages/components 平铺结构移除
5. 代码行数不膨胀（拆分后总量 ≤ 现量 ×1.15）

## 风险

- 无 git：每阶段前 tar 备份 src；每阶段结束跑 check
- import 路径批量改写易错：脚本化迁移 + typecheck 兜底
- 巨型组件拆分引入行为回归：full-flow 测试逐模块覆盖
