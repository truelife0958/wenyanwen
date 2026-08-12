# 数据深度清洗 · 技术设计

## 1. 复核与判定标准

### 四类判定（gemini-2.5-pro 逐条输出）
| 类别 | 判定标准 | 处理 |
|---|---|---|
| 无关 | 题干与所属篇目不匹配（跨篇错挂）、与中考文言文无关 | 删除/转移 |
| 完全重复 | 与其它记录归一化后完全相同 | 保留优先序高的源，删冗余 |
| 无用 | 空字段、占位文本、无题干/无答案 | 删除 |
| 低频 | 词义全库仅 1 次且非考点词；题目无考点重合 | 删除 |

### 复核范围（全部 8 个 raw 源）
- **learning.json**：key_terms 词义低频、related_questions 跨篇错挂、exam_points 质量
- **moxie.json / moxie-legacy.json**：题目质量（错题、缺答案、非考点）
- **practice.json**：跨源完全重复、错挂
- **zhenti.json / zhenti_web.json**：脱离原文无法作答的（无 material 且题干不完整）
- **exam_point_rewrites.json**：与自动生成重复、质量差
- **handwritten.json**：重复题

## 2. 删除执行约束
- **删除前 grep 引用**（防 #658 类误删），确认不破坏管道与页面
- **删除后跑 data:build + validate**，必须全绿
- 完全重复：保留 practice（优先级5）> zhenti（4）> related（3）> exam_point（2）> handwritten（1）

## 3. 跨篇错挂转移逻辑
- 解析 related_questions 题干中的《书名号》篇目
- 若目标篇目存在 → 转移到目标篇目（合并进其 related_questions）
- 若目标篇目不存在 → 从源篇目删除
- 需核对题目 q/a 字段名（related_questions 用 q/a，其它用 stem/answer）

## 4. 低频词义判定
- 词义在全部课文（含 key_terms + notes）中仅出现 1 次
- 且不在 exam-tags 该篇 points 中（非考点词）
- 二者都满足 → 删除该 key_terms 词条

## 5. zhenti_web 保留判定
- 有 answer + 题干自包含（可脱离原文作答：如翻译/词义/理解题自带文句）→ 保留
- 无 material 且题干需原文才能作答（如"请分析文中划线句"无原文）→ 删除
- 缺 analysis 不影响（答案可用）

## 6. 复核输出与流程
```
gemini-2.5-pro 逐条 → JSON 判定清单(保留/删除/转移+理由)
→ 主模型人工裁定（拒绝误判，对照教材）→ 删除清单落盘
→ 逐批执行删除 → data:build + validate → 提交
```

## 7. 风险与规避
| 风险 | 规避 |
|---|---|
| 误删被消费数据 | grep 引用确认 + validate + 页面回归 |
| 外部模型误判 | 主模型对照教材裁定（上轮已有"广/轻"误判案例） |
| 删太多导致题库缩水 | 有答案即保留原则 + 低频仅删非考点词 |
| 跨篇转移破坏管道 | 转移后跑 data:build 核对 questionIds |
