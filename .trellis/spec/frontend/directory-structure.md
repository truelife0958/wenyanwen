# Directory Structure

> How frontend code is organized in this project (v3.0 双模块版).

---

## 模块总览

```
src/
  App.tsx                    # 路由: / /moxie /moxie/:id /moxie/errors /articles/:id/:tab
  features/
    home/                    # 首页 (学习入口 + 搜索 + 年级 tab + 篇目网格)
      Home.tsx TabBar.tsx    # TabBar 固定 2 tab: 学习(/) 默写(/moxie)
    learning/                # 学习模块 (课文全解)
      ArticlePage.tsx        # 3 tab: learn / appreciate / moxie(默写入口卡)
      ArticleReader.tsx      # 原文/注释/朗读/阅读工具条(语速/字号/夜间主题)
      ArticleAppreciation.tsx
    moxie/                   # 默写模块 (v3.0 新增)
      MoxieHome.tsx          # 统计 + 年级 tab + 篇目网格(进度条)
      MoxieArticle.tsx       # 题型 tab + 题卡(对答案/自评/错题入库)
      MoxieErrors.tsx        # 默写错题本 (仅 moxie: 前缀 qid)
      moxie.css
    errorbook/store.tsx      # 错题 store (通用, moxie qid 前缀过滤)
  data/
    index.ts                 # re-export moxieArticles/moxieCount + articleMeta
    moxie.ts                 # 默写数据层: 查询/进度(localStorage wyw_moxie_progress_v1)
    raw/                     # 源数据 (learning.json / moxie.json / moxie-legacy.json)
    runtime/                 # build 产物 (articles/words/moxie.json ...)
  shared/                    # ui / lib(tts,utils) / styles(tokens.ts 含 darkTheme)
```

## 数据管道 (scripts/)

```
scripts/moxie/               # 默写书抽取管道 (PDF → JSON)
  convert.mjs                # pdftoppm → ocr/moxie/img/{main,ans}_pNNN.png
  extract.mjs <main|ans>     # VLM 逐页抽取 → ocr/moxie/raw/*.json (并发/断点续跑/429退避)
  toc.mjs                    # 从正文聚合篇目清单 → ocr/moxie/toc.json
  pair.mjs                   # 主书题 × 答案册配对 → src/data/raw/moxie.json
  validate.mjs               # 完整性校验 → ocr/moxie/report.md
  convert-legacy.mjs         # 旧试题 AI 转换 4 题型 → moxie-legacy.json
  enrich-learning.mjs        # learning.json 文学文化字段补全
scripts/build-runtime-data.mjs  # raw → runtime (含 moxie 合并/去重/qid 重写)
scripts/validate-data.mjs       # npm run validate 数据校验
scripts/full-flow-test.mjs      # 端到端浏览器测试 (playwright)
scripts/ssr-check.mjs           # SSR 深链渲染检查
```

## 已移除模块 (v2.x → v3.0)

- `features/cards/` (字词卡 Flashcards) — 移除
- `features/map/` (考点图谱 ExamMap) — 移除
- `features/practice/` (一文一练练习) — 移除; 数据经 convert-legacy 转为默写题
- `data/exam-map.ts` — 移除
- 路由 /cards /map /practice/:title — 移除; /errors → /moxie/errors
