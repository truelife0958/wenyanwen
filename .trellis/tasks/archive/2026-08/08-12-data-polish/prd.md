# 数据打磨: AI评估学习价值 + 网络补充 + 删除无帮助数据

## Goal

对全部数据源做一次学习价值审计（AI 初审 + 外部模型复核），删除明确无帮助的数据，通过网络搜索补充对中考文言文学习有帮助的缺失数据，使数据更完整、更有针对性、零冗余。

## 背景与数据现状（审计结论）

数据源全部位于 `src/data/raw/`，由 `scripts/build-runtime-data.mjs` 管道生成 runtime，页面只读 `src/data/index.ts`。

| 数据源 | 规模 | 审计发现 |
|---|---|---|
| learning.json | 126 篇课文 + 1 篇附录 glossary | **82/126 缺 key_terms（重点实词）**，其中 must 13 篇、core 20 篇；**82/126 缺 key_sentences（背诵句）**，但审计确认仅 4 篇 must/core 未被 moxie 覆盖需补；theme 有 theme_idea 兜底全部不缺（修正早期审计）；related_questions 实际全有效（字段名 q/a 误报）；glossary "安" 字有 1 处完全重复义项 |
| moxie.json | 134 条 / 1562 题 | 无重复 qid；与 moxie-legacy 有 526 个 qid 交叉，管道已按 book 优先去重合并（设计使然，保留） |
| moxie-legacy.json | 144 条 / 1076 题 | 同上；19 篇独有篇目（综合套卷）被消费 |
| practice.json | 141 篇 / 740 题 | 原文与 learning 大量重复（一文多题，题目有价值，保留）；页面已不消费原文 |
| zhenti.json | 38 条 | 完整，质量好 |
| zhenti_web.json | 338 条 | **335/338 缺 material（原文材料）、141 缺 analysis（解析）、184 缺 year**；题目+答案完整 |
| exam_point_rewrites.json | 127 篇 / 395 条 | 质量好 |
| handwritten.json | 11 条 | **exam-yueyanglou-bundle 的 original_text 为占位文本"参见【类型二 · 岳阳楼记】。"**（2 题需评估）；其余 passage/annotation/extra 有效 |

## 需求

### R1. AI 学习价值评估
- **R1.1** 主模型（当前模型）对全部数据源做质量初审：内容准确性、完整性、对中考文言文学习的价值
- **R1.2** 对重点数据（must/core 篇目的题目、考点、词义）调用外部模型（bohe/gemini-2.5-pro-1m，复用 vision 管道配置）复核打分
- **R1.3** 产出审计报告：问题清单、价值分级（高/中/低/无）

### R2. 网络补充缺失数据
- **R2.1** 补充全部 82 篇缺失的 key_terms（重点实词）：must 13 + core 20 + normal 49，每篇 6-12 个中考高频考点实词
- **R2.2** key_sentences：仅补未被 moxie 原文默写覆盖的 4 篇（论语十二章、行路难（其一）、饮酒（其五）、十一月四日风雨大作（其二））
- **R2.3** theme 无需补充（审计确认 theme_idea/culture.theme 兜底全覆盖）
- **R2.4** 补充数据须符合现有 schema，通过 `npm run validate` 校验
- **R2.5** 补充来源标注（source 字段或注释）

### R3. 删除无帮助数据
- **R3.1** 保守删除原则：只删明确无用的——完全重复记录、占位文本、未被任何页面消费的孤岛数据
- **R3.2** 已知待删：glossary "安" 字重复义项（1 处）
- **R3.3** 待评估后决定：handwritten exam 占位文本记录（若其 2 题无独立价值则删除）
- **R3.4** 审计中发现的其它明确无价值数据（如有）

### R4. 回归验证
- **R4.1** `npm run data:build` 成功且 `npm run validate` 全绿
- **R4.2** `npm run typecheck` 通过
- **R4.3** 页面不回归：browser-test / page-scan 通过（需 dev server）

## 非目标
- 不改页面代码/UI（除非数据删除导致页面报错，仅做最小兼容修复）
- 不重写数据管道架构
- 不补充 normal 级别篇目的全部缺失字段（工作量控制，除非审计发现其数据明显错误）
- 不引入新的数据源格式

## 验收标准
1. 审计报告落盘（问题清单 + 价值分级 + 删除清单 + 补充清单）
2. 删除项：glossary 重复义项删除、无价值记录删除，且 validate 通过
3. 补充项：82 篇 key_terms + 4 篇 key_sentences 补充完成，数据经外部模型全部逐条复核无事实错误
4. `npm run data:build && npm run validate && npm run typecheck` 全绿
5. 核心页面（首页/篇目工作区/默写/错题本）回归测试通过
6. 数据规模报告更新（build-report 或文档）

## 已确认决策（2026-08-12）
1. **补充范围**：must(29) + core(32) + normal 全部篇目，凡缺失 key_terms / theme 均补充；key_sentences 仅补未被 moxie 原文默写覆盖的 must/core 篇目
2. **外部复核**：所有新增数据（词义/主旨/背诵句）逐条过外部模型（bohe/gemini-2.5-pro-1m）复核，验证无事实错误
3. **删除尺度**：保守删除（完全重复/占位文本/未消费孤岛数据），内容质量差者修复而非删除
4. **评估方式**：主模型初审 + 外部模型逐条复核
