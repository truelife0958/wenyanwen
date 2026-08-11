# 数据全盘校验 / 去重 / 准确性修复

## Goal

对全部 8 个数据源做全盘校验,修复重复 id/qid、清理备份残留、扩展校验脚本、修正数据准确性问题;保证构建管道端到端不回归。

## Requirements

### R1. 重复修复
- moxie.json 6 条 `moxie-默写效果检测` 重复 id 唯一化(如加 book_page 后缀),保持路由可达、React key 无冲突、既有默写进度(qid)不丢失。
- 全量检查 8 个数据源 id 唯一性;检查所有 qid 全局唯一。
- zhenti_web 完全重复题检测:同省+同年+同题型+同题干 → 去重或标注。

### R2. 清理
- 删除 raw 目录备份残留:`learning.json.bak3`、`zhenti_web.json.bak`、`zhenti_web.json.bak2`(先确认内容与主文件一致,必要时先对比)。

### R3. 校验脚本扩展 (scripts/validate-data.mjs)
新增校验项:
- raw 8 数据源:必填字段、id 唯一、qid 唯一、年级短名、标题空值
- 跨源重复题目(同篇目+同题干+同答案)
- zhenti_web 完全重复题(同省+同年+同题型+同题干)
- runtime 产物:articleById 无冲突、questions 无重复 id
- 样式硬编码扫描(hex 颜色未走 var(--*))作为 style-unify 的 gate

### R4. 准确性修复
- 抽样比对原文/译文与权威文本(≥10 篇),修正错别字、标点、断句、译文错误。
- 修正后全量 rebuild + validate 通过。

## Constraints

- 页面只读 runtime/*.json 约定不变;raw 字段名/结构不做破坏性变更。
- qid 修复策略:只做后缀唯一化,不重排既有 qid(进度存储 `wyw_moxie_progress_v1` 按 qid 记)。
- 修复后 `npm run check`(data:build + validate + typecheck + build + ssr)与 `npm run test:flow` 全绿。

## Acceptance Criteria

- [ ] raw 8 数据源无重复 id;全部 qid 全局唯一(validate 脚本可证明)
- [ ] 6 条默写效果检测 id 唯一化,前端路由/进度不受影响
- [ ] raw 目录无 .bak* 残留
- [ ] validate-data.mjs 新增校验项实现且 exit 0
- [ ] 准确性抽样修正完成,修正清单记录于任务目录
- [ ] npm run check + test:flow 全绿

## Notes

- 依赖 audit-report 任务的问题清单细化范围(允许按清单裁剪,记录原因)。
- 准确性抽样选择:学习类 5 篇(learning)+ 真题 3 篇 + 默写 2 篇。
