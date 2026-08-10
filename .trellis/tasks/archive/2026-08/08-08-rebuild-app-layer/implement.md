# 执行计划：从零重构应用层

## 顺序

Phase 0 备份 → 1 骨架 → 2 低依赖模块 → 3 巨型模块 → 4 装配清理 → 5 回归收尾

## Phase 0: 备份
- [ ] tar 备份 src/（含 runtime）到 /tmp/wyw-rebuild-backup/

## Phase 1: 骨架搭建
- [ ] 建 app/ shared/hooks/ shared/lib/ features/ 目录
- [ ] shared/lib: 迁 utils.ts（sm2/ls/align/escapeHtml）→ shared/lib/utils.ts，旧 utils.ts 保留 re-export（兼容）
- [ ] features/errorbook: 迁 store/errorbook.tsx → features/errorbook/store.tsx，Provider 引用更新
- [ ] typecheck

## Phase 2: 低依赖模块迁移
- [ ] features/home: Home.tsx + home.css（更新 import 路径）
- [ ] features/collections: CollectionsPage + collections.css
- [ ] features/review: ReviewTab + QuestionCard（共享组件保留在 shared/ui 或 review 内）
- [ ] 每模块后 typecheck + build

## Phase 3: 巨型模块拆分迁移
- [ ] features/practice: PracticePage + PracticeSession（拆 QuestionItem/SelfJudge）+ practice.css
- [ ] features/cards: Flashcards 拆 FlipCard/RateBar/StatsBar/QuizMode + flashcard.css
- [ ] features/learning: ArticlePage + ArticleReader（拆 ReaderToolbar/ParaBlock/NoteList/GlossPop）+ ArticleAnalysis + article css
- [ ] full-flow-test 回归（功能一致性）

## Phase 4: 装配与清理
- [ ] app/routes.tsx 集中路由 + app/App.tsx 装配
- [ ] shared/hooks/useData.ts（useArticle/useQuestions/useWords）接入页面
- [ ] 删旧 src/pages/ src/components/（保留 ui/ 迁移到 shared/ui）
- [ ] global.css → shared/styles/global.css（main.tsx 引用更新）
- [ ] typecheck + check

## Phase 5: 回归收尾
- [ ] npm run check
- [ ] test:flow（38）+ browser-test（45）+ page-scan（137）
- [ ] README/PROJECT_STRUCTURE 更新目录结构
- [ ] scan-findings 落盘 + journal + 归档

## 验证命令

```bash
npm run typecheck
npm run check
node scripts/full-flow-test.mjs
node scripts/browser-test.mjs
node scripts/page-scan.mjs
```

## 回滚

- 每阶段前 tar 备份（/tmp/wyw-rebuild-backup/phase-N.tar.gz）
- 阶段失败 → 解包回滚该阶段
