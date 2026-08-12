# 数据打磨 · 技术设计

## 1. 数据流与管道约束

```
src/data/raw/*.json  →  scripts/build-runtime-data.mjs  →  src/data/runtime/*.json  →  页面(data/index.ts)
```

- raw 是唯一数据源，runtime 由管道生成，**不手改 runtime**
- 修改 raw 后必须重跑 `npm run data:build` 并过 `npm run validate`

### learning.json 相关字段的管道消费

| raw 字段 | 管道消费 | 补充时机 |
|---|---|---|
| `key_terms` | 展开为词条 → words.json（category 优先：重点实词>课文注释） | **82/126 缺**，全部补 |
| `key_sentences` | → recitation.stars（背诵句★） | 仅补未被 moxie 覆盖的 must/core 篇目 |
| `literary_culture.theme` | culture.theme，theme_idea 为空时兜底为主题 | **54/126 缺**，全部补 |
| `theme_idea` | → analysis.theme（优先级高于 culture.theme） | 已有数据的篇目不重复补 |
| `related_questions` | → related 来源题目 | 43 缺，不补（题目非核心缺口） |

### key_terms 展开规则（expandKeyTerm）
- `{word, meaning}` 单义项直接成记录
- 含 `example` 时携带例句
- category 传 "重点实词"
- 补充数据与 notes 同词时，管道按文本去重，注释优先——**不会冲突**

## 2. 补充数据 schema

### key_terms（重点实词）
```json
"key_terms": [{
  "category": "重点实词",
  "items": [
    { "word": "阙", "meaning": "同\"缺\"，空隙、缺口", "example": "两岸连山，略无阙处" },
    { "word": "奔", "meaning": "飞奔的马", "example": "虽乘奔御风，不以疾也" }
  ]
}]
```
**数量标准**：每篇 6-12 个高频考点实词（must 篇目从宽，normal 从紧）；必须能覆盖该篇中考高频考点（对照 exam_tags points）

### literary_culture.theme（主旨）
```json
"literary_culture": { "theme": "全诗通过……，抒发了……之情，表现了……主旨" }
```
**标准**：一句话概括，含手法+情感+主旨三要素

### key_sentences（背诵句）
```json
"key_sentences": [{
  "sentence": "……原文句……",
  "translation": "……译文……"
}]
```
**标准**：仅补 moxie 原文默写未覆盖的 must/core 篇目，每篇 2-5 句

## 3. AI 评估与复核流程

### 3.1 主模型初审（当前模型）
- 逐数据源检查：空字段、重复、占位、格式错误、明显事实错误
- 对 learning.json 内容抽样：译文准确性、注释质量、考点相关性
- 产出：问题清单 + 价值分级

### 3.2 外部模型复核（gemini-2.5-pro-1m，复用 vision 管道 API）
- 新增的 key_terms 词义、theme 主旨、key_sentences 逐条复核
- 复用 scripts/vision/lib.mjs 的 client 配置（bohe/x666.me/gemini-2.5-pro-1m）
- 复核输出格式：JSON 数组 [{原文词义, 判定(正确/需修正), 建议修正}]
- 修正项由主模型确认后写入

### 3.3 网络补充
- 主模型基于领域知识起草（不盲目网络搜索）
- 不确定的事实（作者生平、背景、罕见词义）用 web_search 核实
- 补充数据来源标注在 raw 注释或 README 数据说明

## 4. 删除清单（保守原则）

| 项 | 位置 | 处理 |
|---|---|---|
| glossary "安" 重复义项 | learning.json glossary-shici "安" | 删除重复的 {"sense":"安定，平静","example":"安居而天下熄"} |
| handwritten exam 占位文本 | handwritten.json exam-yueyanglou-bundle original_text | 若 2 题有价值→保留题目，删占位文本；若无价值→整条删除 |
| 其它审计发现的完全重复/孤岛 | 待审计确认 | 仅删完全重复与未消费孤岛 |

## 5. 风险与规避

| 风险 | 规避 |
|---|---|
| 补充词义有事实错误误人子弟 | 外部模型逐条复核 + 主模型二次确认 |
| 误删被消费数据（#658 教训） | 删除前先 grep 引用，删除后跑 validate + 页面回归 |
| key_terms 与 notes 冲突 | 管道自动去重（注释优先），无需手动规避 |
| 补充量太大导致 schema 错 | 每批补完后跑 data:build + validate，小步提交 |
| moxie 覆盖判断不准 | 用脚本核对 moxie sections 原文默写题型覆盖的篇目清单 |

## 6. 分批执行策略

按篇目分批（每批 15-20 篇）：
- **批次 1**：审计报告 + 删除项 + 管道验证基线
- **批次 2**：must 篇目 key_terms/theme 补充 + 复核
- **批次 3**：core 篇目 key_terms/theme 补充 + 复核
- **批次 4**：normal 篇目 key_terms/theme 补充 + 复核
- **批次 5**：key_sentences 补充 + 全量 data:build + validate + typecheck + 页面回归
