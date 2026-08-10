# 从零重构应用层 — 改动清单 (2026-08)

> 状态: 完成并全量验证

## A. 架构重构 (feature-first)

旧: pages/ + components/ + store/ 平铺
新: features/ (7 模块) + shared/ (ui/hooks/lib/styles) + app/ (装配)

| 迁移 | 目标 |
|---|---|
| pages/Home + home.css | features/home/ |
| pages/ArticlePage + article-page.css | features/learning/ |
| components/ArticleReader + article.css | features/learning/ |
| components/ArticleAnalysis | features/learning/ |
| pages/PracticePage + practice.css | features/practice/ |
| components/PracticeSession | features/practice/ |
| components/ReviewTab + QuestionCard | features/review/ |
| pages/CollectionsPage + collections.css | features/collections/ |
| pages/Flashcards + flashcard.css | features/cards/ |
| store/errorbook.tsx | features/errorbook/store.tsx |
| components/ui/* (Icon/PageHeader/EmptyState/TagChip) | shared/ui/ |
| components/StemView/ErrorBoundary | shared/ui/ |
| components/tts/pron-dict | shared/lib/ |
| utils.ts | shared/lib/utils.ts |
| styles/global.css | shared/styles/global.css |

## B. 巨型组件拆分

- ArticleReader (334) → + GlossPop.tsx (点字浮层)
- PracticeSession (276) → + SelfJudge.tsx (自评区)
- Flashcards (423) → + FlipCard.tsx (翻卡含 PronExample) + RateBar.tsx (SM-2 评分) + StatsBar.tsx (统计条)

## C. 数据访问层

- 新增 shared/hooks/useData.ts: useArticle/useArticleWords/useArticleQuestions/useCollection/useWord
- data/index.ts + card-progress.ts 的 utils 引用 → shared/lib/utils

## D. 规范化

- import 路径全量重写 (55 处按绝对路径重算)
- import 扩展名 (.tsx/.ts) 全部清理 (11 文件)
- App.tsx/main.tsx 引用更新
- 旧目录 pages/components/store/styles 删除

## E. 验证

```
npm run typecheck       ✅
npm run check           ✅ (data:build + validate 0错 + build + SSR)
full-flow-test          ✅ 38/38
browser-test            ✅ 45/45
page-scan               ✅ 137/0
代码规模: 3235 → 3857 行 (拆分样板 +19%, 可读性收益)
```

## F. 回滚

- /tmp/wyw-rebuild-backup/phase0-src.tar.gz (重构前完整 src)
