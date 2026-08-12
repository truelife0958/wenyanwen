# 数据审计报告（2026-08-12）

## 审计方法
- 主模型（deepseek-v4-flash）初审：空字段/重复/占位/格式/事实抽样
- 数据管道（build-runtime-data.mjs）消费关系核对（防误删）
- 外部模型复核：阶段 2 起对新增数据逐条复核

## 一、数据源总览

| 数据源 | 规模 | 质量结论 | 处理 |
|---|---|---|---|
| learning.json | 126 课文 + 1 glossary | 主体质量好，key_terms 缺口大 | **补充 key_terms 82 篇** |
| moxie.json | 134 条 / 1562 题 | 无重复 qid，质量好 | 保留 |
| moxie-legacy.json | 144 条 / 1076 题 | 与 moxie 交叉 526 qid，管道已去重合并 | 保留（设计使然） |
| practice.json | 141 篇 / 740 题 | 原文与 learning 重复，题目有价值 | 保留 |
| zhenti.json | 38 条 | 完整 | 保留 |
| zhenti_web.json | 338 条 | 题目+答案完整；335 缺 material、141 缺 analysis、184 缺 year | 保留（页面不展示 material） |
| exam_point_rewrites.json | 127 篇 / 395 条 | 质量好 | 保留 |
| handwritten.json | 11 条 | 1 条占位文本已清理，题目保留 | 已处理 |

## 二、问题清单与处置

### 已删除/清理
1. **glossary "安" 重复义项**（learning.json）："安定，平静/安居而天下熄" 与 "安定,平静/安居而天下熄" 完全重复 → 已删 1 处
2. **handwritten exam-yueyanglou-bundle 占位文本**：original_text="参见【类型二 · 岳阳楼记】。" → 已清空（2 道题有完整价值，保留）

### 待补充（本任务核心）
3. **key_terms（重点实词）缺 82/126 篇**：
   - must 13 篇：论语十二章、使至塞上、出师表、观沧海、春望、望岳、桃花源记、渔家傲·秋思、陋室铭、破阵子·为陈同甫赋壮词以寄之、行路难（其一）、送杜少府之任蜀州、醉翁亭记
   - core 20 篇：十一月四日风雨大作（其二）、卖油翁、南乡子·登京口北固亭有怀、登幽州台歌、周亚夫军细柳、夜雨寄北、孙权劝学、富贵不能淫、望洞庭湖赠张丞相、核舟记、渡荆门送别、狼、生于忧患，死于安乐、登飞来峰、相见欢(无言独上西楼)、答谢中书书、饮酒（其五）、赤壁、送友人、陈太丘与友期行
   - normal 49 篇（清单见 /tmp/missing-list.json）
4. **key_sentences（背诵句）缺 4 篇**：论语十二章、行路难（其一）、饮酒（其五）、十一月四日风雨大作（其二）——其余缺背诵句的 must/core 已被 moxie 原文默写覆盖，不重复补

### 已确认不缺（修正早期误判）
5. **theme（主旨）**：126 篇全部有 theme_idea 或 literary_culture.theme 兜底 → 无需补充
6. **related_questions**：288 条"疑似无效"为审计脚本误报（字段名 q/a 非 stem/answer），实际全部有效 → 不处理

### 保留（设计使然/非缺陷）
7. practice 原文与 learning 重复（一文多题，题目粒度有价值）
8. moxie vs legacy 交叉（管道按 book 优先去重）
9. zhenti_web 缺 material/analysis（页面不展示 material；analysis 缺失不影响做题）

## 三、补充计划
- key_terms：82 篇，每篇 6-12 个中考高频考点实词（对照 exam-tags points）
- key_sentences：4 篇，每篇 2-5 句背诵句 + 译文
- 全部新增数据经外部模型（gemini-2.5-pro-1m）逐条复核
