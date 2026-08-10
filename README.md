# 武汉中考 · 初中语文文言文学习练习 App

面向武汉中考（初三）的纯前端文言文学习练习应用。覆盖七至九年级全部课文篇目，学习、练习、错题本、字词卡、考点图谱一体，可离线使用（PWA）。

## 功能

| 模块 | 说明 |
|---|---|
| 篇目中心（主页） | 126 篇按年级分类，支持篇名/作者/朝代搜索，学习进度概览、继续学习横幅、背诵进度 |
| 学习 | 完整原文（可朗读，通假字/多音字注音）、逐段译文、课文注释（点击/悬停浮层）、段落赏析；中考必考/核心篇目标注 |
| 练习 | 本篇题目自动归集（单题流）：选择题自动判分，主观题对照自评，错题自动入错题本 |
| 错题本 | 按篇目分组的错题回顾，可移除/清空（容量上限 600 条） |
| 字词卡 | 核心实词/虚词列表（点击展开义项与例句），附原文逐句背诵翻卡（原文 → 译文） |
| 考点图谱 | 中考考点分类地图，按高频过滤，薄弱考点回炉练习 |

数据规模：126 篇 · 2144 词条 / 2495 词义 · 2022 题（其中中考真题 181、考点题 393、AI 生成考点题 426）。

## 快速开始

```bash
npm install
npm run dev          # 开发服务器 http://localhost:8765
npm run build        # 数据生成 + 生产构建到 dist/
```

## 数据

数据全部内置（离线可用），由**真实数据生成管道**产出：

```text
src/
├── app/                应用装配 (App.tsx / Provider / 路由)
├── features/           功能模块 (feature-first)
│   ├── home/           首页 (篇目中心 + 错题本入口)
│   ├── learning/       学习 (ArticleReader/赏析/注释浮层)
│   ├── practice/       练习 (会话/题型/自评)
│   ├── cards/          字词卡 (实虚词列表/词条弹窗/背诵翻卡)
│   ├── errorbook/      错题本 store
│   └── map/            考点图谱
├── data/               数据层 (raw/ 源 + runtime/ 生成 + 查询 API)
├── shared/
│   ├── ui/             共享组件 (Icon/PageHeader/StemView/TagChip/ErrorBoundary)
│   ├── lib/            工具 (ls 封装/pron-dict 注音/tts 朗读/align)
│   └── styles/         全局样式 (书卷纸墨令牌 + 共享类)
└── types.ts            领域类型
scripts/                数据生成/校验/测试脚本
public/                 PWA 清单/图标/Service Worker
```

- `raw/` 是唯一数据源（学习/练习/真题/手写题/AI 生成题重写）；`runtime/` 由管道生成，不手改
- 页面只通过 `src/data/index.ts` 访问数据，不直接消费 OCR 字段

## 测试与校验

```bash
npm run validate     # 数据校验: 引用完整性/背诵句/英文水印残留/去重等
npm run typecheck    # TypeScript 严格检查
npm run check        # 完整发布前检查 (生成+校验+类型+构建+SSR)
npm run test:flow    # 满强度用户流测试 (浏览器自动化: 学习→练习→判分→错题→字词卡→图谱→移动端)
node scripts/page-scan.mjs    # 全页面扫描 (全部路由×桌面/移动: JS 错误/溢出/渲染)
```

测试需要 chromium（playwright-core 已配置路径），开发服务器需已启动。

## 视觉大模型（VisionProbe）

弥补 DeepSeek 等文本模型无法看图的缺陷 —— 截屏后调用 VLM（gemini-2.5-pro-1m）做视觉审查：

```bash
npm run vision -- http://localhost:8765/              # UI 审查（桌面）
npm run vision -- http://localhost:8765/ --mobile     # 移动端视口
npm run vision -- http://localhost:8765/ --all        # 桌面+移动双视口
npm run vision -- <截图文件.png>                       # 分析已有截图
npm run vision -- http://localhost:8765/ --describe   # 纯视觉描述（供文本模型理解）
```

- 输出：截图 + 结构化视觉审查报告（布局/色彩/对比度/问题清单/改进建议），落盘 `vision-shots/`
- 可配置：`VISION_PROVIDER / VISION_MODEL / VISION_BASE_URL / VISION_API_KEY`（默认 bohe/gemini-2.5-pro-1m）

## 技术栈

React 19 · Vite 8 (rolldown) · TypeScript · react-router 7 · PWA (Service Worker)

## 部署

纯前端 SPA + PWA，构建产物 `dist/` 可部署到任意静态托管。深链直访（如 `/cards`）需要服务器 history fallback 或内置 `404.html` 兜底，详见 [DEPLOY.md](./DEPLOY.md)。
