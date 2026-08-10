# Implement: 默写书全量抽取 + 应用改造（学习/默写双模块）

## 0. 前置：版本基线

- [ ] `git init` + `.gitignore`（node_modules/ dist/ ocr/ vision-shots/）+ 初始 commit「baseline: 默写改造前」
- 回滚点 A：此 commit。之后每阶段独立 commit。

## 1. 抽取管道搭建（scripts/moxie/）

- [ ] `convert.mjs`：pdftoppm 主书 p004–p120 → `ocr/moxie/img/main_pNNN.png`；答案册 p002–p033 → `ans_pNNN.png`（150dpi）；完成后清单文件 `ocr/moxie/img/manifest.json`
- [ ] `extract-main.mjs`：逐页 VLM（prompt 契约见 design §2）→ `ocr/moxie/raw/main_pNNN.json`；strip ```json 包裹；失败重试 1 次；断点续跑；并发 `MOXIE_CONCURRENCY=4`；失败页记 failed.txt
- [ ] `extract-ans.mjs`：同上，答案册 → `raw/ans_pNNN.json`
- [ ] `toc.mjs`：目录页 → `ocr/moxie/toc.json`（篇目→书页，校验基准）
- [ ] 抽查机制：每 20 页抽 1 页人工/二次 VLM 复核（记入 journal）

**审查门 G1**：抽取完成 → 随机抽查 5 页 JSON 内容质量（题量/填空/答案完整性），与试点标准一致才继续。

## 2. 配对与校验

- [ ] `pair.mjs`：按篇目标题归一化配对主书题+答案 → `src/data/raw/moxie.json`（schema 见 design §3）；articleId 对齐 learning（titleKey 匹配）
- [ ] `validate.mjs`：页覆盖 117/117、篇目 126、每篇题型齐全、空数=答案数、配对率 100%、toc 对齐
- [ ] 跨页/多篇同页异常处理：合并规则（同 title 相邻页合并；一页多 title 拆分）

**审查门 G2**：validate 全绿 + 抽 3 篇完整人工核对（题目逐字 vs 扫描页）后才进前端。

## 3. 旧数据 AI 转换

- [ ] `convert-legacy.mjs`：practice/zhenti/zhenti_web/handwritten(exam类)/exam_point_rewrites → 4 题型分类（设计 §4 规则）→ `src/data/raw/moxie-legacy.json` + 转换报告
- [ ] 去重合并：与 moxie.json 同篇同题型归一化判重，book 优先

**审查门 G3**：转换报告记录转换/丢弃数；丢弃的题类抽查确认确实不可归入默写。

## 4. 数据构建改造

- [ ] `build-runtime-data.mjs`：新增 moxie.json（moxie + legacy 合并）runtime 输出；counts 增加 moxie；确认 learning articles/words 保留；移除 practice/collections/exam-generated 相关输出（先确认前端引用后删）
- [ ] `scripts/validate-data.mjs` 同步更新
- [ ] 更新 `data/index.ts`：moxie 类型 + counts 字段 + GRADE_ORDER 复用

**审查门 G4**：`npm run data:build && npm run validate` 通过；runtime 文件清单符合设计。

## 5. 前端：导航收窄 + 默写模块

- [ ] TabBar → 学习/默写 2 tab；App.tsx 路由改造（删 /cards /map /practice，增 /moxie*）
- [ ] 删除组件：Flashcards、ExamMap、practice/*（含 CSS）；清理引用（article-links 的 practice tab、LegacyArticleRedirect practice 分支）
- [ ] `src/features/moxie/`：MoxieHome（年级 tab+篇目网格+进度）、MoxieArticle（4 题型 tab、填空输入/选择作答、自评对答案、错题入库）、MoxieErrors（默写错题分组+重练）
- [ ] 首页改造：今日任务/推荐卡/统计改为 学习+默写；移除字词卡/图谱/背诵引用；错题入口 → 默写错题
- [ ] 错题本 store：兼容 moxie qid（`moxie:` 前缀过滤）
- [ ] 学练联动：ArticlePage「去默写」按钮；MoxieArticle「看原文」链接

**审查门 G5**：`npm run check` 通过；本地 dev 手测：首页 2 卡、默写出题→作答→自评→错题全流程、联动跳转。

## 6. 学习模块打磨

- [ ] 阅读体验：字号调节、主题切换（夜间/纸张，tokens.ts 变量）、阅读进度记忆增强
- [ ] 对照与朗读：TTS 语速控制、逐段对照打磨
- [ ] 内容深化：learning.json 4 类精要核对补全（重点：缺失项）
- [ ] 学练联动验证（与 5 联动）

**审查门 G6**：打磨项逐项演示通过；回归 learning 原功能不破坏。

## 7. 总验收

- [ ] `npm run check` 全绿
- [ ] vision 截图验收：首页（2 卡）、默写列表、默写练习、错题本、学习页联动
- [ ] validate.mjs 报告留存（ocr/moxie/report.md）
- [ ] spec 更新（trellis-update-spec）+ 最终 commit

## 验证命令速查

```bash
node scripts/moxie/convert.mjs          # PDF → PNG
node scripts/moxie/extract-main.mjs     # 主书逐页抽取 (可重跑续跑)
node scripts/moxie/extract-ans.mjs      # 答案册逐页抽取
node scripts/moxie/toc.mjs              # 目录 → toc.json
node scripts/moxie/pair.mjs             # 配对 → src/data/raw/moxie.json
node scripts/moxie/validate.mjs         # 完整性校验
node scripts/moxie/convert-legacy.mjs   # 旧数据转换
npm run data:build && npm run validate && npm run typecheck && vite build && node scripts/ssr-check.mjs
npm run test:flow
```

## 风险与对策

| 风险 | 对策 |
|---|---|
| VLM 抽取个别页质量差（漏题/错字） | 每页重试+抽查复核；validate 空数/配对率检测；失败页 failed.txt 重跑 |
| 跨页篇目/一页多篇合并错位 | pair 时 title 归一化锚定；validate 与 toc 对齐兜底 |
| 旧数据转换量大、部分题不可归类 | 批量调用+丢弃报告；丢弃确认后接受 |
| 移除模块时遗漏引用导致 typecheck 失败 | 逐组件删 + `tsc --noEmit` 循环清引用 |
| 无 git 历史 | 前置 git init 基线（步骤 0） |
