# 数据打磨 · 实施计划

## 前置
- [x] PRD/design 完成，任务在 planning 状态
- [ ] `task.py start` 激活任务（实施开始前）

## 阶段 0: 基线验证
- [ ] 记录当前数据基线：`npm run data:build && npm run validate && npm run typecheck` 全绿
- [ ] 保存 build-report.json 基线（records 计数）

## 阶段 1: 审计报告 + 删除项
- [ ] 完成全部数据源质量审计（learning/moxie/legacy/practice/zhenti/zhenti_web/exam/handwritten）
- [ ] 删除项 1: glossary "安" 重复义项
- [ ] 评估 handwritten exam 占位文本记录 → 决定删除或修复
- [ ] 审计其它完全重复/孤岛数据（如有）
- [ ] 重跑 data:build + validate，确认删除无副作用
- [ ] 产出审计报告落盘 `.trellis/tasks/08-12-data-polish/audit-report.md`

## 阶段 2: must 篇目补充（29 篇）
- [ ] 列出 must 篇目中缺 key_terms / theme 的具体清单（脚本）
- [ ] 起草 key_terms（每篇 6-12 词）+ theme
- [ ] 外部模型逐条复核
- [ ] 写入 learning.json → data:build → validate

## 阶段 3: core 篇目补充（32 篇）
- [ ] 同阶段 2 流程

## 阶段 4: normal 篇目补充
- [ ] 同阶段 2 流程（数量从紧）

## 阶段 5: key_sentences 补充
- [ ] 脚本核对 moxie 原文默写覆盖篇目
- [ ] 仅补未覆盖的 must/core 篇目
- [ ] 外部复核 + 写入 + data:build + validate

## 阶段 6: 全量回归
- [ ] `npm run data:build && npm run validate && npm run typecheck` 全绿
- [ ] 更新 build-report 数据规模说明（如有文档）
- [ ] 启动 dev server，跑 browser-test / page-scan 回归
- [ ] 检查页面数据（首页网格/篇目工作区/默写/错题本）

## 阶段 7: 收尾
- [ ] 更新 README 数据规模（如变化）
- [ ] 更新 spec（数据补充约定）
- [ ] git commit（分阶段提交：审计/删除 → must → core → normal → 收尾）

## 验收对照（PRD）
- [ ] 审计报告落盘
- [ ] 删除项完成且 validate 绿
- [ ] 补充项完成且外部复核无事实错误
- [ ] data:build + validate + typecheck 全绿
- [ ] 页面回归通过
