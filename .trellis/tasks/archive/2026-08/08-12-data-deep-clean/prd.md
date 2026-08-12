# 数据深度清洗: gemini-2.5-pro 全量逐条复核 + 删除无关/重复/无用/低频数据

## Goal

用 gemini-2.5-pro-1m 对全部数据源逐条复核，删除四类数据（无关 / 完全重复 / 无用 / 低频），使题库与词条更精准、零冗余，同时不破坏页面消费与数据校验。

## 背景

上一轮（data-polish）已补齐 82 篇 key_terms + 4 篇 key_sentences。本次聚焦"减法"：
对全部 8 个 raw 数据源逐条复核，找出并删除无价值数据。

当前数据规模：
- learning.json: 126 课文 + 1 glossary（含 key_terms 82 篇已补、key_sentences 44 篇、exam_points、related_questions 288 条）
- moxie.json: 134 条 / 1562 题项（默写主源）
- moxie-legacy.json: 144 条 / 1076 题项（合并源，19 篇独有）
- practice.json: 141 篇 / 740 题
- zhenti.json: 38 条
- zhenti_web.json: 338 条（335 缺 material、141 缺 analysis、184 缺 year）
- exam_point_rewrites.json: 127 篇 / 395 条考点
- handwritten.json: 11 条
- runtime: words 2361 / wordMeanings 2931 / questions 2026 / collections 17

## 需求

### R1. gemini-2.5-pro 全量逐条复核
- **R1.1** 每个数据源的每条记录调用外部模型复核，按四类判定：
  - **无关**：与中考文言文学习无关（错题归属错误、题干与课文不符、跨篇错挂）
  - **完全重复**：与其他记录完全相同（归一化后）
  - **无用**：空字段、占位文本、无答案/无题干、解析为空且无法修复
  - **低频**：考查频率极低且无学习价值（如某词义仅出现 1 次且非考点、冷门题）
- **R1.2** 复核结果逐条落盘（保留/删除 + 理由），主模型人工裁定后执行

### R2. 删除执行
- **R2.1** 按复核清单删除，保守把握"完全重复"（管道已按题目粒度去重，重点查跨源重复）
- **R2.2** 删除不破坏数据管道与页面消费（先 grep 引用，防 #658 类误删）
- **R2.3** 删除后 `npm run data:build && npm run validate` 必须全绿

### R3. 回归验证
- **R3.1** `npm run validate` + `npm run typecheck` 全绿
- **R3.2** 页面回归：browser-test 67 / page-scan 85 / full-flow 44
- **R3.3** 数据规模报告更新（build-report / README）

## 非目标
- 不修改页面代码（除非数据删除导致页面报错，仅最小兼容）
- 不重写数据管道
- 不补充新数据（仅复核 + 删除；若复核发现关键缺失，记录到报告不补）

## 验收标准
1. 复核报告落盘：每条记录的四类判定 + 删除/保留理由
2. 删除项与报告一致，删除后 validate 全绿
3. `npm run check`（build+validate+typecheck+SSR）通过
4. 页面回归 67/85/44 全绿
5. 数据规模报告更新

## 已确认决策（2026-08-12）
1. **低频标准**：词义在全部课文中仅出现 1 次、且非中考高频考点词（不在 exam-tags points 中）→ 删除；题目按考点重合度判断
2. **zhenti_web**：题目+答案完整且属考点篇目 → 保留（仅缺解析不删）；无 material 且脱离原文无法作答的才删
3. **related_questions 跨篇错挂**：题干《书名号》指向其它篇目的 → 从错误篇目删除/转移到正确篇目
4. **moxie 重复**：raw 层不动（管道已去重），只逐条复核题目质量，删质量差的
