# Design: 默写书全量抽取 + 应用改造（学习/默写双模块）

## 1. 数据源与页码映射

| 源 | 文件 | PDF 页 | 内容 |
|---|---|---|---|
| 主书 | `2026《初中语文•一本必背文言文+古诗默写》7-9年级.pdf` | p001 封面, p002–p003 目录, **p004–p120 正文(117 页, 书页 1–117)** | 126 篇 × 4 题型(原文/理解性/词义/译文默写), 含"默写效果检测/课标补充篇目/附录主题默写" |
| 答案册 | `...7-9年级答案册.pdf` | p001 封面, **p002–p033 答案(32 页, 书页 1–32)** | 按篇目分组的全部答案 |

- 偏移：主书 PDF 页 = 书页 + 3；答案册 PDF 页 = 书页 + 1。
- 目录页（p002–p003）抽取后生成 `toc.json`：篇目 → 书页映射，作为合并与完整性校验的基准。
- 扫描版无文本层，VLM 抽取已试点验证（gemini-2.5-pro-1m @ bohe，单页 ~60s，质量达标）。

## 2. 抽取管道（scripts/moxie/，产物落在 ocr/moxie/）

```
pdf → convert.mjs (pdftoppm 150dpi) → ocr/moxie/img/main_pNNN.png / ans_pNNN.png
       → extract-main.mjs (逐页 VLM, 并发 4-6, 断点续跑) → ocr/moxie/raw/main_pNNN.json
       → extract-ans.mjs  (逐页 VLM, 并发 4-6, 断点续跑) → ocr/moxie/raw/ans_pNNN.json
       → pair.mjs (按篇目标题配对主书题+答案, 归一化标题) → src/data/raw/moxie.json
       → validate.mjs (完整性校验) → 报告
       → convert-legacy.mjs (旧数据 AI 转换) → src/data/raw/moxie-legacy.json
```

- **extract-main** prompt 契约：输出 `{title, grade, book_page, sections:[{type, items:[{q}]}]}`；填空 `___`、加点字 `【】`、选项与中考来源标注保留；VLM 返回的 ` ```json ` 包裹由脚本 strip 后 `JSON.parse`，失败自动重试 1 次。
- **extract-ans** prompt 契约：输出 `{articles:[{title, answers:[{q, a}]}]}`；q 含题型+序号+题干特征用于配对。
- **断点续跑**：输出文件存在且可解析即跳过（幂等）；并发上限可配（`MOXIE_CONCURRENCY`，默认 4）；失败页记 `ocr/moxie/failed.txt` 供重跑。
- **pair.mjs 配对规则**：篇目标题归一化（去序数前缀/《》/空格，对齐 learning 的 titleKey 规则）→ 主书 section item 顺序 = 答案册 answers 顺序（同题型内按序配对）；词义默写用题干加点字做锚点；多空答案 `|` 拆分为逐空。
- **validate.mjs 校验项**：主书页覆盖 117/117；篇目数 126；每篇 sections 含 4 题型（或按实际页面上出现）；原文默写空数 vs 答案段数一致；答案配对率 100%；标题归一化后与 toc.json 100% 对齐。

## 3. 数据 Schema（src/data/raw/moxie.json）

```jsonc
// 数组, 每篇一个对象
{
  "id": "moxie-guancanghai",          // moxie- + slug(title)
  "title": "观沧海",
  "grade": "七上",                     // 短名对齐 GRADE_ORDER (build 时 grade() 转换)
  "book_page": 1,                      // 主书页码
  "source": "moxie-book",              // 题源: moxie-book | legacy-converted
  "articleId": "…",                    // pair 时尽力对齐 learning article.id (学练联动用), 可为 null
  "sections": [
    { "type": "原文默写", "items": [
        { "qid": "moxie-guancanghai:1:0", "q": "…___…", "blanks": 14, "answers": ["东临碣石", …] }
    ]},
    { "type": "理解性默写", "items": [
        { "qid": "…", "q": "1.(四川绵阳中考)…___…", "source_note": "四川绵阳中考", "answers": ["树木丛生"] }
    ]},
    { "type": "词义默写", "items": [
        { "qid": "…", "q": "1.东【临】碣石 临: ___", "word": "临", "answers": ["到达,登上"] }
    ]},
    { "type": "译文默写", "items": [
        { "qid": "…", "q": "1.水何澹澹…译文: ___…", "answers": ["水波多么荡漾,山岛耸立。"] }
    ]}
  ]
}
```

- 题型 type 以页面上实际出现为准（可能有"文学常识"等附加题型，保留原 type 名）。
- legacy 转换数据同 schema，`source: "legacy-converted"`；与 moxie-book 同篇目合并（book 优先，qid 前缀区分）。
- runtime 输出：`src/data/runtime/moxie.json`（全量）+ `article-meta.json` counts 增加 `moxie` 数。

## 4. 旧数据 AI 转换（convert-legacy.mjs）

- 输入：`practice.json`（一文一练 307 题）、`zhenti.json`+`zhenti_web.json`（真题）、`handwritten.json` 的 passage/exam 类、`exam_point_rewrites.json`。
- 转换方式：批量（每篇聚合该篇全部旧题 → 一次 VLM 调用）→ 输出 4 题型 JSON；分类规则：
  - 补写诗句/默写类 → **原文默写**（原填空保留）
  - "文中表现…的句子是…"/理解填空 → **理解性默写**
  - 加点词解释 → **词义默写**
  - 翻译句子 → **译文默写**
  - 纯阅读理解选择/简答（无法归入默写）→ 丢弃，报告中记录丢弃数
- 去重：与 moxie-book 同篇目同题型题干相似度（归一化后相等）判重，book 优先。
- 产物：`src/data/raw/moxie-legacy.json` + 转换报告（各篇转换/丢弃计数）。

## 5. 前端改造

### 5.1 导航与路由
- `TabBar`：2 tab — 学习 `/`、默写 `/moxie`。
- `App.tsx` 路由：删除 `/cards`、`/map`、`/practice/:title`；`/learning/:title` 保留（tab 仅 learn）；新增 `/moxie`、`/moxie/:title`、`/moxie/errors`；`/errors` 保留并指向默写错题（或重定向到 `/moxie/errors`）。
- 删除组件：`features/cards/Flashcards.tsx`、`features/map/ExamMap.tsx`、`features/practice/*`（PracticePage/PracticeSession/SelfJudge）。
- 首页（Home.tsx）：移除字词/图谱/背诵相关引用（examLevel/examPoints/weakPointsFromErrors → 改为默写错题统计）；今日任务改为「学课文/默写练习」；推荐卡保留（继续学习 / 默写错题优先）。

### 5.2 默写模块（src/features/moxie/）
- `MoxieHome`：年级 tab（GRADE_ORDER）+ 篇目网格（含 4 题型进度指示）；顶部统计（已默写 X/126 篇）。
- `MoxieArticle`：篇目页 — 4 题型 tab；每题展示：题干（填空 `___` → 输入框；选择题 → 选项）、作答后"对答案"自评（显示答案/多空展开）；错题自动写入错题本；"看原文"→ `/articles/:articleId` 联动。
- `MoxieErrors`：错题本（仅默写错题），按篇目/题型分组，支持重练（再次作答→移出错题或保留）。
- 进度存储：`localStorage.wyw_moxie_progress_v1`（篇目/题型/每题对错+时间）；错题复用现有 errorbook store（qid 前缀 `moxie:` 过滤）。
- 学练联动：ArticlePage 增加「去默写」入口（articleId → moxie 篇目）；Moxie 篇目有 articleId 时显示「看原文」。

### 5.3 学习模块打磨
- 阅读体验：字号调节（localStorage `wyw_font_scale`）、夜间/纸张主题（CSS 变量切换，检查 tokens.ts 后落地）、阅读进度记忆（现有 LAST_ARTICLE_KEY 基础上加段落/位置）。
- 对照与朗读：TTS 语速控制（0.5x–1.5x）、原文/译文逐段对照增强（现有 renderOriginal 对照模式保留并打磨）。
- 内容深化：learning.json 127 篇 4 类精要核对补全（theme/outline/writing/culture）。
- 学练联动：见 5.2。

### 5.4 数据构建
- `build-runtime-data.mjs`：保留 learning→articles、words→words（**字词卡功能移除但 glossary 数据保留**，学习模块点字查询依赖）；questions/collections 仅保留转换为默写后的内容（若学习模块无引用则从 runtime 移除）；新增 `moxie.json` 输出；article-meta counts 更新。
- 移除的 runtime：`exam-generated.json`、`collections.json`（若确认无引用）、practice 相关派生。

## 6. 验证与回滚

- `validate.mjs`（抽取完整性）+ `npm run check`（data:build + validate + typecheck + vite build + ssr-check）+ `npm run test:flow`（若适配）+ vision 截图验收（首页 2 卡、默写练习流、错题流）。
- **回滚**：项目当前无 git 仓库 → 开工前 `git init` + 初始 commit（.gitignore 排除 node_modules/dist/ocr 大文件）；每阶段（抽取完成/前端改造/打磨）独立 commit，可逐级回退；抽取产物（ocr/moxie/）不入 git（可再生成），raw JSON 入 git。
