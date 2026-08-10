# 全面体检：数据一致性与准确性排查

## 背景

用户对 wuhan-wenyanwen-app 提出全面体检要求：检查每一个细节、数据一致性、数据准确性。用户已观察到至少一个渲染问题（原文中每个句子/段落前有序号）。

项目现状（侦察确认）：

- React 重构版（Vite + TS），数据管道 raw/*.json → build-runtime-data.mjs → runtime/*.json → src/data/index.ts → 页面
- runtime: 127 篇 / 2168 词条 / 2519 词义 / 2011 题 / 16 综合题集
- `npm run validate` 当前报 **127 个错误**（全部为「年级有效」误报：校验期待长名「七年级上册」，runtime 用短名「七上」——短名是既有约定，校验脚本过时）
- `npm run typecheck` 通过；dist/ 构建产物早于最新数据（Aug 7 vs Aug 8 13:13）

## 目标

对项目做系统性体检，输出问题清单并修复，覆盖：

1. **数据准确性**：英文残留、水印/广告残留、背诵句污染、错别字/截断
2. **数据一致性**：跨文件数字一致（头部统计 vs runtime）、校验脚本与数据形态对齐、ID/引用闭合、构建报告语义
3. **渲染细节**：原文前段落序号【N】的显示策略、注释序号①死数据、头部统计动态化
4. **校验能力**：validate-data.mjs 修复过期检查 + 新增防回归检查（英文残留、背诵句、水印、段落编号一致性）

## 已发现问题清单（侦察阶段）

### A. 校验脚本（validate-data.mjs）
- A1. 127 个「年级有效」错误：校验期待 `七年级上册` 等长名，runtime 用短名 `七上`（见 memory #243，短名为约定）→ 修复校验
- A2. 校验注释/阈值过时：「应有 1585 题」实际 2011
- A3. 缺少新形态检查（背诵句、英文残留、水印、段落编号一致性）

### B. 数据准确性（raw 污染）
- B1. 英文残留 ~20 处：`and`×16（论语/三峡/定风波/水调歌头×2/泊秦淮/湖心亭看雪/爱莲说×2/曹刿论战/赤壁/过零丁洋/陈涉世家/记承天寺夜游/出师表 notes）、`contrast`（临江仙 theme_idea）、`of`（白雪歌 culture.theme）、`formally`（杞人忧天 exam rewrite stem）、`the`（practice 诗 the 题目为）、`can`（核舟记 notes）、`vs`×4（中性，评估）
- B2. 水印残留：`教辅公众号★全科AA+` 出现于 raw zhenti.json[27]（zt-124-15）与 raw practice.json；runtime practice:366 题干含水印；且该题标题/归属错配（标题「渔家傲」但内容实为赤壁「后两句论史抒怀」+ 三国史事答案）
- B3. 背诵句污染 86 条（339 条中）：评注文本（「重点考查…」「等名句的直接默写…」）、编号列表（`1. xxx`）、引号/标点垃圾（`"，；"`、`"（，）；"`）——根因 sentenceStars() 提取逻辑不清理评注
- B4. 杂散字母：exam_point_rewrites 中 `shiciwushou-yinjiu[1]/answer` 含孤立 `f`
- B5. handwritten.json 某 explanation 尾部孤立句点

### C. 数据一致性
- C1. App.tsx 头部硬编码 `127 篇 · 2519 词义 · 1585 题`，其中 1585 过期（runtime 2011）；Home 用动态 counts → 两处数字不一致
- C2. 段落序号覆盖不一致：44 篇全文带【N】、83 篇无、3 篇部分（共 228/564 段）→ 学习页渲染不一致（用户投诉的「句子前有序号」）
- C3. build-report `deduplicatedQuestions: -282`（负值，语义混乱：因 exam-generated 合并 +282）
- C4. 426 条 exam-generated 合并题缺 `origin` 字段（schema: CanonicalQuestion.origin 必需）
- C5. PROJECT_STRUCTURE.md 过时（LearningPage/PracticePage/ZhentiPage/Recite/ErrorBookPage 已不存在；数字过期）
- C6. 注释 `number` ①-⑪ 数据存在但组件未渲染（死数据）
- C7. footer「数据 v2.2」与 package.json v2.0.0 版本语义需核对
- C8. 14 段无分析无译文（左迁至蓝关/关雎/十五从军征等）——评估是否为设计空缺

### D. 构建/产物
- D1. dist/ 构建产物早于最新 runtime 数据 → 需重建
- D2. 词条分类 `实词(251)/虚词(54)` 为 global 词，不参与文章内标注（ArticleReader 只标 article-scoped）——与旧版行为差异，需确认设计意图

## 验收标准

1. `npm run validate` 通过（0 错误），并新增背诵句/英文残留/水印/段落编号一致性检查
2. `npm run typecheck` 通过
3. `npm run check` 全链路通过（data:build + validate + typecheck + vite build + SSR）
4. 英文残留、水印、背诵句污染在 raw 源数据修复（runtime 由重建生成，不手工改 runtime）
5. App 头部统计动态化，与 runtime 数据一致
6. 段落序号显示策略确定并实现（与用户确认或按推荐方案）
7. 问题清单文档化（含证据、修复状态），写入任务目录

## 范围外（明确不做）

- OCR 层再提取（memory #281：OCR 缺失的 8 个实词条目不可恢复）
- 教材 OCR 全文重新校对（数据已对齐 master_toc）
- 新功能开发（背诵 UI、新页面等）
