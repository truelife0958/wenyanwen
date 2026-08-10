# 设计：全面体检修复方案

## 决策记录

| 决策点 | 结论 |
|---|---|
| 段落序号【N】显示 | **隐藏**：ArticleReader 不再渲染 para-num；数据保留 number 字段供分析文本交叉引用 |
| 数据污染修复 | **修源数据 raw/*.json + 重建 runtime**：不手工改 runtime；build 脚本不承担业务清洗 |
| 防回归 | validate-data.mjs 新增检查 + 源头修复两手都做（用户选「修源数据+重建」为主，校验增强为辅） |

## 分层职责

```
raw/*.json (修复后源)                     ← 本任务修改
   │ npm run data:build
runtime/*.json (重建生成, 不手改)
   │
src/data/index.ts → 组件 (渲染层修改)
scripts/validate-data.mjs (校验增强)
```

## 修复设计

### WS1: raw 源数据修复

**1a. 英文残留替换**（learning.json / practice.json / exam_point_rewrites.json / zhenti_web.json）

映射表（人工核对后落地）：

| 位置 | 原文 | 替换 |
|---|---|---|
| 论语 段落分析 paraphrase | `...新的理解 and 体会` | `...新的理解和体会` |
| 三峡 段落分析 paraphrase | `顺流而下 and 逆流而上` | `顺流而下和逆流而上` |
| 临江仙 theme_idea | `盛况， contrast 现实` | `盛况，对比现实` |
| 出师表 notes[37] | `在位) and 灵帝` | `在位)和灵帝` |
| 定风波 段落分析 | `地点 and 缘由` | `地点和缘由` |
| 曹刿论战 writing_features | `准备 and 战后论战` | `准备和战后论战` |
| 水调歌头 分析×2 | `宇宙 and 人生` / `思念 and 对天下` | `和` |
| 泊秦淮 分析 | `历史 and 现实` | `历史和现实` |
| 湖心亭看雪 分析 | `景色 and 看雪之行` | `景色和看雪之行` |
| 爱莲说 分析/相关题 | `爱菊 and 世人` / `气节 and 高尚` | `和` |
| 白雪歌 culture.theme | `边塞 of 奇寒雪景` | `边塞奇寒雪景`（去 of） |
| 记承天寺夜游 key_sentences trans | `竹子 and 柏树` | `竹子和柏树` |
| 赤壁 exam_points | `英雄人物 and 战事结果` | `英雄人物和战事结果` |
| 过零丁洋 分析 | `国家命运 and 个人命运` | `国家命运和个人命运` |
| 陈涉世家 writing_features | `准备 and 发动` | `准备和发动` |
| 杞人忧天 rewrite stem | `只使坠 formally 亦无所增块` | `只使坠亦无所增块` |
| 酬乐天扬州初逢席上见赠 rewrite answer | `巧 f 用了设问` | `巧用了设问` |
| practice 诗the题目为 | 修正整句 | `诗题目的` 语义修正 |
| 核舟记 notes | `分明可数的 can。` | 语义修正（can→个? 人工判断） |
| vs×4 | 保留评估：zhenti_web 分析中 `vs` → 中文「对比」较安全（同一任务内顺手修正；learning related_questions 的 `vs` 同理） |

注意：括号内拼音（zhǔ 等）与年份（970—1034）为合法内容，**不得误伤**。替换时用精确字符串匹配而非正则全局替换。

**1b. 水印修复**

- raw zhenti.json[27] zt-124-15：题干尾 ` 教辅公众号★全科AA+` 删除
- raw practice.json 对应题（practice:366 来源）：同样删除
- 归属错配：zt-124-15 标题「渔家傲(天接云涛连晓雾)」但内容（后两句论史抒怀/三国史事/东风周郎）实为《赤壁》→ 需与赤壁篇对齐（toc 确认赤壁原文后两句后再定标题字段），至少修正标题或从真题中剔除；practice:366 的 articleId 归属同样核查（jc-yujiaao=渔家傲，应为赤壁篇 jc-chibi 或对应 id）

**1c. 背诵句清洗（sentenceStars 源）**

背诵句来自 raw 两个来源：
1. `key_sentences`（重点句，人工字段）——干净
2. `exam_points` 中 point === '名句默写' 的 detail 按句切分——污染源

修复策略（修源数据）：
- 对 raw learning.json 中每个 article 的 `exam_points[].detail`（名句默写类），把「重点考查」「等名句的直接默写与理解性默写」「直接4考/理解1考」等评注从背诵提取路径剥离——**修数据而非修脚本**：把 detail 中的评注句清理掉（但 detail 本身是考点内容，学习页会展示，需保留可读性：可保留评注原文用于展示，但背诵提取应干净）。
  - 用户选「修源数据+重建」，但 sentenceStars 提取逻辑在 build 脚本里——修数据时把 exam_points.detail 中混入的评注清理干净（如「重点考查名句如：」→ 去掉），同时可在 build 脚本 add() 处增加防御性清理（strip 引号/序号/评注前缀），双保险。
- 清洗目标：背诵句全部为原文子串（标点归一化后），或明确为整句原文（可为逗号子句，如三峡「重岩叠嶂,隐天蔽日。」——保留此类子句？需判断：逐句背诵用完整句更好，子句背诵造成重复。决策：保留原文存在的子句，但去掉引号垃圾「」，；」与评注）

**1d. 杂散字符**

- shiciwushou-yinjiu[1]/answer 孤立 f → 删除
- handwritten.json explanation 尾部孤立句点 → 删除

### WS2: 校验脚本增强（validate-data.mjs）

- 修复 A1：年级有效集合改为短名 `['七上','七下','八上','八下','九上','九下','附录','未分类']`（长名不再出现，若出现报错更有价值——可加反向检查）
- 更新 A2：题目阈值从固定 1585 改 2011 基线（或与 build-report 交叉校验）
- 新增检查：
  - N1 背诵句完整性：每条 star.sentence 标点/空白归一化后必须是原文子串，否则 error（允许逗号子句）
  - N2 英文残留：中文字符串值中 [a-zA-Z]{2,} 英文单词（排除括号内拼音/年份/选项标签 A./B.）→ error
  - N3 水印模式：`教辅公众号|全科AA|公众号|★` → error
  - N4 段落编号一致性：带 number 的段落比例（当前 228/564）；若渲染层已隐藏，则检查 number 仅用于分析引用——至少 warn 不一致情况
  - N5 头部统计一致性：不放在 validate（那是编译期数据），放在 runtime 检查：questions.length 与 build-report 对齐
  - N6 exam-generated 合并题必须有 origin 字段（补 `origin: 'exam_point'` 或新增合法值 `'exam_gen'`，同步 types.ts 联合类型）
  - N7 无分析无译文段落 warn（C8）
  - N8 孤立句点/杂散字母正则（C 类）

### WS3: 渲染层修改

- ArticleReader.tsx：删除 `{row.number && <span className="para-num">…</span>}` 渲染（或保留 DOM 但 CSS 隐藏——直接删除更干净）；article.css 的 .para-num 样式可保留（死样式）或删除
- App.tsx：头部统计 `127 篇 · 2519 词义 · 1585 题` → 使用动态 counts（`counts.learning 篇 · counts.cards 词义 · counts.practiceQuestions+… 题`）；footer「数据 v2.2」核对版本语义（可改为 build-report schemaVersion 或保持静态标注）
- types.ts：CanonicalQuestion.origin 联合类型增加 exam_gen（若采用）
- build-runtime-data.mjs：合并 exam-gen 时补 `origin: 'exam_gen'`（C4）

### WS4: 文档与产物

- PROJECT_STRUCTURE.md 更新为当前实际结构（3 导航/3 tab、页面清单、数字）
- dist/ 重建（npm run check 全链路）
- 问题清单落盘任务目录（audit-findings.md，含证据/状态）

## 关键风险

- 英文替换误伤拼音/年份：用精确匹配 + 人工核对清单
- 背诵句清洗过度：保留原文子句，仅去评注/引号垃圾/序号
- zt-124-15 归属错配修正需对照教材赤壁原文确认「后两句」——若无法确认，最低限度是删除水印并加注
- runtime 重建后校验脚本的 1585 基线若未同步更新会继续误报

## 验证方式

- `npm run validate`（0 error）
- `npm run typecheck`
- `npm run check`（全链路含 SSR）
- `node scripts/browser-test.mjs`（需要 dev server；可选）
- 抽查渲染：dev server 打开学习页确认无【N】序号、无英文、无「句子前序号」
