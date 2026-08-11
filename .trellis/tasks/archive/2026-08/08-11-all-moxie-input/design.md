# 设计: 4 类默写输入化 + 词义去重 + 数据全量排查

## 数据流

```
raw/moxie.json (book, 151 篇) + raw/moxie-legacy.json (legacy, 144 篇)
  → [修复脚本 scripts/moxie/dedup-legacy-moxie.py: 拆分多小题/词义去重/标点归一]  (修改 legacy + book raw)
  → build-runtime-data.mjs 合并 (原文默写 legacy 已丢弃; 词义默写按词去重在 raw 层完成)
  → runtime/moxie.json → MoxieArticle.tsx 渲染 (4 类输入)
```

## 关键设计决策

### D1. 词义默写去重位置: raw 层 (修复脚本), 不在 build
- 原因: build 合并时按 section 类型 merge, 题干级去重无法识别【词】级重复; raw 层按【词】去重更彻底、可审计。
- 规则: 提取 `【([^】]+)】` 为词键 (归一化); 同篇同 section: book 优先, legacy 同词丢弃; legacy 独有词保留。
- 结果写入 fix-record.md: 去重词数、保留的 legacy 独有词数。

### D2. 多小题拆分 (legacy 译文 6 题)
- 匹配 `(?:^|\n)\s*\d+[\.．、]` 切分 q; 每段为一个小题。
- answers: 若为数组且长度=小题数 → 一一对应; 若为单元素含 `|` → split('|') 对应; 长度不足 → 按该小题句子的关键词在 book/learning 数据中匹配译文, 匹配不到 → 小题保留原 q、answers 留空 (渲染"答案待补", 记录)。
- qid: 原 qid + `:s{序号}` 后缀 (如 `moxie-望岳:3:0:s1`)。

### D3. 4 类输入化 (MoxieArticle.tsx)
- FillQuestionCard 覆盖全部题型: `section.type !== '原文默写'` 也渲染输入横线。
- 词义默写: q 中 `【字】` 高亮 (renderWord), `___` → 输入框。
- 译文默写: 输入框宽度 `size=Math.min(14, 答案长+2)`, 自动判分 (normAnswer); 答错显示参考译文 (可换行)。
- 其他题型 (理解性等): 输入框 + 自动判分。
- "对答案"按钮文案统一; 全部填完才可判分; 判分后 disabled。
- 移除 QuestionCard 自评分支? 保留作为兜底 (无 answers 的题: 显示"答案待补" + 自评) —— 处理 answers 缺失的题。

### D4. validate 段 13
- 词义默写: 同篇同 section 无重复【词】。
- 无多小题 q: q 中 `\d+[\.．、]` 数量 ≤1 且 `译文：` 出现 ≤1。
- 无 `|` 答案; q/answers/extra 无半角标点 (`,;:?!()'"` 等)。
- answers 含 `___`/空 → error; q 空 → error。
- runtime: 同篇同题型 q 归一化后无重复。

## 兼容性

- qid 变更: 拆分小题产生新 qid (后缀 :sN), 旧 qid 进度悬空无害 (与上轮 qid 重写一致, 已重置过)。
- 词义去重删除的 legacy 题 qid 消失 → 进度悬空无害。
- test:flow: 步骤 3 (观沧海 → 第一题型) 与步骤 6 (moxie 列表第一篇) 均输入化, 填"占位答" → 判分 → 错题本; 无需改逻辑, 验证通过即可。

## 验证链

1. `npm run data:build` → runtime 重建
2. `npm run validate` → 段 13 断言全绿
3. `npm run check` → 0 错误
4. `npm run test:flow` → 42/42
5. 浏览器实测: 论语十二章词义 (无重复)、望岳译文 (多小题拆分、独立判分)、观沧海 (4 题型输入)
