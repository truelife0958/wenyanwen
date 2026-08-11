# 武汉中考文言文 App · 项目结构

## 顶层目录

```text
wuhan-wenyanwen-app/
├── src/                    React 应用
│   ├── features/          功能模块 (feature-first)
│   │   ├── home/          首页: 今日学习/推荐/任务、搜索、年级分类篇目网格
│   │   ├── learning/      篇目工作区: 学习(ArticleReader)/鉴赏/考点/注释 + 页面样式
│   │   ├── moxie/         默写模块: 列表(MoxieHome)/练习(MoxieArticle)/错题本(MoxieErrors)
│   │   └── errorbook/     错题本 Context store + localStorage 持久化
│   ├── data/              数据层
│   │   ├── raw/           源 JSON(管线唯一输入)
│   │   ├── runtime/       生成后的规范化 JSON(页面只读此层)
│   │   ├── index.ts       统一数据访问层(懒加载 + 空闲预加载)
│   │   ├── article-links.ts 篇目/题集 ID 互查与深链接
│   │   ├── exam-tags.ts   中考必考/核心篇目标注表
│   │   └── moxie.ts       默写数据访问 + 进度
│   ├── shared/
│   │   ├── ui/            共享组件(Icon/PageHeader/HighlightText/Modal/EmptyState/SectionHeader/ErrorBoundary/StemView)
│   │   ├── lib/           工具(ls 封装/pron-dict 注音/tts 朗读/alignLines)
│   │   └── styles/        全局样式(书卷纸墨令牌 + 共享类)
│   ├── App.tsx            导航、路由、懒加载、深链恢复、数据预加载
│   └── types.ts           规范化类型
├── scripts/               数据生成、校验与测试脚本
├── public/                PWA 清单、图标和 Service Worker
└── dist/                  Vite 构建产物
```

## 页面职责

| 路由 | 职责 |
|---|---|
| `/` | 首页: 今日学习(问候+默写进度环)、今日推荐(继续学习/错题回炉)、今日任务、搜索、年级 tab + 篇目网格 |
| `/articles/:id/:tab` | 篇目五标签工作区: 学习 / 鉴赏 / 考点 / 注释 / 默写(带稳定深链接) |
| `/moxie` | 默写列表: 统计、年级 tab、篇目进度卡 |
| `/moxie/:id` | 默写练习: 原文/理解/词义/译文四题型, 输入自动判分 + 自评, 答错自动入错题本 |
| `/moxie/errors` | 默写错题本: 按篇目分组、重练、移除、清空 |
| `/learning/:title` | 旧版学习深链 → 新篇目工作区 |
| `/errors` | 旧错题本路由 → `/moxie/errors` |

> 早期版本存在练习/字词卡/考点图谱/真题等独立页面,已在 React 重构与后续精简中移除;
> 相关数据(origin: practice/zhenti)仍保留在 runtime/questions.json,页面不再消费。

## 运行时数据

| 文件 | 所有权 |
|---|---|
| `runtime/article-meta.json` | 篇目轻量元数据(首屏同步加载, 44K) |
| `runtime/articles.json` | 篇目正文/译文/段落分析、背诵句(懒加载) |
| `runtime/words.json` | 合并后的词条与多义项(懒加载) |
| `runtime/questions.json` | 统一去重后的练习/真题/考点题/AI 生成题(懒加载) |
| `runtime/moxie.json` | 默写篇目/题型/题项(默写模块加载) |
| `runtime/exam-generated.json` | AI 生成中考题源(合并进 questions 的原始产物) |
| `runtime/collections.json` | 综合题集 |
| `runtime/build-report.json` | 源记录、运行时记录、去重与无效记录计数 |

页面只从 `data/index.ts` 读取运行时文件。源 JSON 的 OCR 专用字段不会进入组件;文章、词条、题目和题集通过 ID 双向关联。

当前规模:126 篇;2192 个词条、2644 个词义(归一化去重 + 一词多义拆分后);2026 道题;默写 151 篇 2444 题;17 个综合题集。

## 数据管线

```text
curated source -> src/data/raw/*.json
                         |
             build-runtime-data.mjs
                         |
             src/data/runtime/*.json -> App
```

`raw/` 是规范化构建的唯一输入;`runtime/` 由管道生成,页面只读此层。

## 脚本

| 命令/脚本 | 用途 |
|---|---|
| `npm run data:build` | 从 `raw/` + `runtime/exam-generated.json` 生成 `runtime/` |
| `npm run validate` | 校验 ID、引用、段落覆盖、背诵句完整性、英文/水印残留、源记录闭合 |
| `npm run typecheck` | TypeScript 严格检查 |
| `npm run check` | 完整发布前检查(data:build + validate + typecheck + vite build + SSR) |
| `npm run test:flow` | 满强度用户流测试(scripts/full-flow-test.mjs) |
| `scripts/browser-test.mjs` | 篇目中心快速回归(五标签/搜索/默写/错题/旧路由/移动端) |
| `scripts/page-scan.mjs` | 全页面扫描(全部路由 × 桌面/移动: JS 错误/横向溢出/渲染) |
| `scripts/vision/vision.mjs` | VisionProbe 视觉审查(截屏 + VLM 报告) |
| `scripts/gen-exam-questions.py` | AI 生成必考/核心篇目中考试题到 exam-generated.json |
| `scripts/extract_zhenti.py` | 教材 OCR 提取到 `raw/zhenti.json` |

完整 OCR 流程见 [`ocr/PIPELINE.md`](ocr/PIPELINE.md)。
