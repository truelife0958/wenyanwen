# 设计：从零重构应用层

## 原则

1. **渐进迁移，无大爆炸**：目录骨架先行，模块逐个搬迁，每阶段 typecheck + 测试通过
2. **保留数据契约**：runtime JSON 结构、data/index.ts 的导出 API 不破坏（页面迁移期间混用新老路径可运行）
3. **先拆后删**：新 feature 目录建好后搬迁组件，全部迁完删旧目录
4. **行为不变**：重构不动判分/SM-2/错题逻辑，只动组织与表达

## 数据访问层（hooks）

```ts
// shared/hooks/useData.ts
export function useArticle(id: string | undefined): CanonicalArticle | null;
export function useArticleQuestions(articleId: string): CanonicalQuestion[];
export function useArticleWords(articleId: string): CanonicalWord[];
export function useErrorCount(): number;
```
底层复用 data/index.ts 现有 Map/selector，页面迁移时逐个替换裸 import。

## 组件树（迁移后）

```
features/learning/ArticleReader/
├── index.tsx          (组装)
├── ReaderToolbar.tsx  (朗读/对照/设置)
├── ParaBlock.tsx      (段落块: 原文+译文+分析)
├── NoteList.tsx       (注释清单)
└── GlossPop.tsx       (点字浮层)
features/cards/Flashcards/
├── index.tsx          (模式路由 + 状态)
├── FlipCard.tsx       (翻卡)
├── RateBar.tsx        (评分)
├── StatsBar.tsx       (统计)
└── QuizMode.tsx       (词义测验)
features/practice/PracticeSession/
├── index.tsx          (会话流程)
├── QuestionItem.tsx   (单题: 选择题/主观题分支)
└── SelfJudge.tsx      (自评区)
```

## 路由（集中）

```tsx
// app/routes.tsx
export const ROUTES = [
  { path: '/', element: <Home /> },
  { path: '/articles/:id/:tab?', element: <ArticlePage /> },
  { path: '/collections/:id?', element: <CollectionsPage /> },
  { path: '/cards', element: <CardsPage /> },
  ...legacy redirects, fallback
];
```

## 类型域

- types.ts 按域分组：Article/Reading/Paragraph / Question/Practice / Word/Glossary / Collection / Progress
- 不破坏 runtime 字段名（数据契约）

## 样式

- global.css → shared/styles/global.css（令牌 + 共享类不变，保持全站生效）
- feature css 随组件搬迁（learning/article.css 等）

## 迁移顺序（依赖拓扑）

1. **Phase 0**: 备份 src → tar
2. **Phase 1**: 骨架 — app/ shared/hooks/ features/errorbook（store 搬迁，Provider 引用更新）
3. **Phase 2**: features/home（零依赖外迁）→ collections → review
4. **Phase 3**: features/practice → cards（巨型拆分）→ learning（巨型拆分）
5. **Phase 4**: app/App.tsx + routes 装配，删旧 pages/ components/
6. **Phase 5**: 全量回归 + 文档更新

## 验证矩阵

| 阶段 | 验证 |
|---|---|
| 每阶段 | npm run typecheck + npm run check（构建/SSR） |
| Phase 3 后 | full-flow-test（功能回归） |
| Phase 5 | check + test:flow + browser-test + page-scan 全绿 |
