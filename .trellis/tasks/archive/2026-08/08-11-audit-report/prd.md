# 项目全面审查报告

## Goal

对项目做一次全面深度审查,覆盖五层:代码架构 / 类型安全 / 样式 / 数据 / 运行时表现,产出分级问题清单与修复建议,作为 data-audit-fix 与 style-unify 两个修复子任务的范围依据。

## Requirements

### R1. 五层审查
- **代码架构**:src/ 目录结构、组件划分(home/learning/moxie/errorbook/shared)、数据访问层(data/index.ts 惰性加载)、跨模块依赖是否合理;死代码/未用导出。
- **类型安全**:types.ts 与实际数据结构一致性(如 MoxieArticle.id 语义、PracticeArticle 字段消费情况);`npm run typecheck` 之外的类型隐患。
- **样式**:tokens.ts 与 global.css 一致性;feature CSS 硬编码颜色/圆角/字体/间距统计;重复类名、未用样式、内联样式。
- **数据**:8 个 raw 数据源字段完整性、id/qid 唯一性、跨源重复(标题/题目级)、zhenti_web 一文多题判定、准确性抽样(原文/译文与权威文本比对)。
- **运行时**:路由链接完整性(article-links.ts 死链)、App 页面可达性、localStorage 进度键兼容性、构建产物 sanity。

### R2. 报告产出
- 报告存放于本任务目录 `research/audit-report.md`(或本任务根目录),包含:
  - 问题清单,按严重度分级(P0 阻断 / P1 重要 / P2 一般 / P3 建议)
  - 每项:位置(文件:行)、现象、根因、修复建议
  - 修复范围建议:哪些必须修(进 data-audit-fix / style-unify),哪些裁剪并记录原因

## Acceptance Criteria

- [ ] 五层审查全部完成,无遗漏层面
- [ ] 报告包含完整问题清单,每项含位置/现象/根因/修复建议
- [ ] 问题按 P0-P3 分级
- [ ] 修复范围建议明确,裁剪项记录原因
- [ ] 审查过程发现的每个数据/样式问题可在报告中追溯到证据

## Notes

- 审查为只读活动,不修改业务代码(除非发现 P0 级立即风险,需另行确认)。
- 已知问题(探索阶段发现)直接纳入报告:6 条重复 moxie id、bak 残留文件、141+ 硬编码颜色。
