# 全面审查:统一样式 + 数据全盘校验去重

## Goal

对武汉中考文言文学习 App 做一次全面深度审查(代码架构、类型安全、样式、数据、运行时表现),产出审查报告;完成全部 8 个数据源的全盘校验、去重、准确性修复;统一视觉样式(设计令牌化)与代码风格。

## Background (审查前置发现)

探索阶段已确认的现状与问题:

- 8 个数据源:zhenti(38 条)、zhenti_web(338 条/110 篇,一文多题为设计)、practice(141)、learning(127)、moxie(134)、moxie-legacy(144)、handwritten(5)、exam_point_rewrites(127)。
- practice ∩ learning 标题重叠 124 篇:practice 原文不消费(仅取 questions),属设计,不视为重复。
- **已知 bug**:moxie.json 有 6 条 id 均为 `moxie-默写效果检测`(book_page 15/32/57/76/88/110),MoxieHome.tsx 以 `article.id` 作 React key 和路由 → key 冲突且 6 个卡片跳转同一页。
- **raw 目录残留备份文件**:`learning.json.bak3`、`zhenti_web.json.bak`、`zhenti_web.json.bak2`。
- 样式硬编码:feature CSS 中约 157 处 hex 色 + 29 处 rgba + 11 处 font-family + 97 处非标准圆角 + 大量硬编码 px,未走 tokens.ts 令牌体系。

## Requirements

### R1. 项目全面审查 (子任务 08-11-audit-report)
- 覆盖五层:代码架构 / 类型安全 / 样式 / 数据 / 运行时表现(路由、死链、未用代码)。
- 产出审查报告,列出问题清单(按严重度分级)、根因与修复建议,并驱动其余两个子任务的范围确认。

### R2. 数据全盘校验 / 去重 / 准确性修复 (子任务 08-11-data-audit-fix)
- 全部 8 个数据源逐条校验:必填字段、id/qid 全局唯一、标题/年级/朝代规范性。
- 修复 moxie.json 6 条重复 id(唯一化,保持与前端路由/进度兼容)。
- 清理 raw 目录备份残留文件。
- 扩展 `scripts/validate-data.mjs` 覆盖新增校验项(重复 id/qid、跨源重复题、真题完全重复、样式硬编码扫描)。
- 数据准确性:原文/译文与权威文本比对抽样,修正错别字/标点/断句问题。

### R3. 统一样式 (子任务 08-11-style-unify)
- **视觉**:feature CSS 全部硬编码颜色/圆角/阴影/间距走 tokens.ts CSS 变量;删除重复/未用样式;统一字体栈、行高、卡片规范。
- **代码风格**:组件结构、命名、TS 类型规范统一;清理内联样式硬编码。

## Constraints

- 页面只读取 `runtime/*.json`,不直接消费 raw(数据访问层既有约定)。
- 样式单一事实源:`src/shared/styles/tokens.ts`(书卷纸墨视觉系统),global.css 与页面样式经 CSS 变量引用。
- 年级约定短名(`七上`/`七下`/...),长名(`七年级上册`)为过时形态。
- 数据修复必须保持构建管道端到端不回归(`npm run check` + `npm run test:flow` 全绿)。
- 进度存储 key `wyw_moxie_progress_v1` 按 qid 记录,修复 qid 时需保证既有学习进度不丢失(仅新增唯一性后缀,不重排既有 qid)。

## Acceptance Criteria (跨子任务)

- [x] 审查报告产出,覆盖五层,问题清单分级明确、修复建议可执行
- [x] raw 8 数据源:无重复 id;qid 全局唯一;zhenti_web 无完全重复题目(同省+同年+同题型+同题干)
- [x] raw 目录无 `.bak*` 残留文件
- [x] validate-data.mjs 新增校验项全部实现且全量通过(exit 0)
- [x] feature CSS 无硬编码颜色(全部 `var(--*)`),无重复类名定义
- [x] `npm run check`、`npm run test:flow` 全绿
- [x] 既有默写进度不丢失(qid 修复保持前缀稳定) — 注: 旧 qid 本身错乱(1 qid 对多题)无法迁移, 按设计决策接受重置, fixes.md 注明

## Child Task Map

| 任务 | 交付物 | 依赖 |
|---|---|---|
| 08-11-audit-report | 审查报告(五层覆盖) | 无 |
| 08-11-data-audit-fix | 数据校验/去重/修复 + 校验脚本扩展 | audit-report 范围确认后 |
| 08-11-style-unify | 视觉 token 化 + 代码风格统一 | audit-report 范围确认后 |

## Notes

- 执行顺序:audit-report(发现)→ data-audit-fix + style-unify(修复)。
- 审查报告存档于 audit-report 任务目录,修复范围以其问题清单为准(允许裁剪,裁剪项需记录原因)。
