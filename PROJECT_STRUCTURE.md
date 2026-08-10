# 武汉中考文言文 App · 项目结构

## 顶层目录

```text
wuhan-wenyanwen-app/
├── src/                    React 应用
│   ├── components/         单篇阅读、练习会话、复习、题面渲染组件
│   ├── data/
│   │   ├── raw/            保留源 JSON，不进入页面依赖
│   │   ├── runtime/        生成后的规范化 JSON
│   │   ├── index.ts        统一数据访问层
│   │   ├── article-links.ts 篇目/题集 ID 互查与深链接
│   │   ├── exam-tags.ts    中考必考/核心篇目标注表
│   │   └── card-progress.ts 旧卡片进度迁移
│   ├── pages/              页面与页面样式
│   ├── store/              错题本状态与迁移
│   ├── styles/             全局样式
│   ├── App.tsx             导航(篇目/字词/复习)与路由
│   └── types.ts            规范化类型
├── scripts/                数据生成、校验与测试脚本
├── public/                 PWA 清单、图标和 Service Worker
└── dist/                   Vite 构建产物
```

## 页面职责

| 页面 | 职责 |
|---|---|
| `Home.tsx` | 127 篇按册次分类及搜索；学习/字词/复习/错题分类；继续学习横幅 |
| `ArticlePage.tsx` | 单篇三标签工作区(学习/练习/复习)及稳定深链接 |
| `PracticePage.tsx` | 单篇做题会话(ArticlePractice 复用) |
| `CollectionsPage.tsx` | 16 个跨篇综合题集 |
| `Flashcards.tsx` | 全局字词复习及词义测验 |

> 说明：早期版本存在 LearningPage/ZhentiPage/Recite/ErrorBookPage 独立页面，
> React 重构后已并入 ArticlePage 三标签(学习=ArticleReader、练习=ArticlePractice、
> 复习=ReviewTab 聚合真题/考点/错题)与 CollectionsPage(错题本入口)。

## 运行时数据

| 文件 | 所有权 |
|---|---|
| `runtime/articles.json` | 篇目元数据、正文/译文、段落分析、背诵句和引用 ID |
| `runtime/words.json` | 合并后的词条与多义项；含一次性旧卡 ID 别名 |
| `runtime/questions.json` | 统一去重后的练习、真题、相关题、考点题与 AI 生成题 |
| `runtime/exam-generated.json` | AI 生成中考题源(gen-exam-questions.py 产物，合并进 questions) |
| `runtime/collections.json` | 无法归入单篇的组合篇目题集 |
| `runtime/build-report.json` | 源记录、运行时记录、去重与无效记录计数 |

页面只从 `data/index.ts` 读取运行时文件。源 JSON 的 OCR 专用字段不会进入组件；文章、词条、题目和题集通过 ID 双向关联。

当前规模：127 篇；2168 个词条、2519 个词义（归一化去重 + 一词多义拆分后）；2011 道题（1900 道归入单篇、111 道归入 16 个综合题集）。

## 数据管线

```text
curated source -> src/data/raw/*.json
                         |
             build-runtime-data.mjs
                         |
             src/data/runtime/*.json -> App
```

`raw/` 是规范化构建的唯一输入；`runtime/` 由管道生成，页面只读此层。历史 OCR 批次产物已清理（见任务 08-08-repo-purge-and-test）。

## 脚本

| 命令/脚本 | 用途 |
|---|---|
| `npm run data:build` | 从 `raw/` + `runtime/exam-generated.json` 生成 `runtime/` |
| `npm run validate` | 校验 ID、引用、段落覆盖、背诵句完整性、英文/水印残留、源记录闭合 |
| `npm run typecheck` | TypeScript 严格检查 |
| `npm run check` | 完整发布前检查(data:build + validate + typecheck + vite build + SSR) |
| `scripts/browser-test.mjs` | 桌面/移动端功能、迁移和溢出回归 |
| `scripts/gen-exam-questions.py` | AI 生成必考/核心篇目中考试题到 exam-generated.json |
| `scripts/extract_zhenti.py` | 教材 OCR 提取到 `raw/zhenti.json` |

完整 OCR 流程见 [`ocr/PIPELINE.md`](ocr/PIPELINE.md)。
