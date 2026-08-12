# 武汉中考 · 初中语文文言文学习 App

面向武汉中考（初三）的纯前端文言文学习应用。覆盖七至九年级全部课文篇目，**学习 · 鉴赏 · 考点 · 注释 · 默写**五合一工作区，错题自动归档，可离线使用（PWA）。

## 功能

| 模块 | 说明 |
|---|---|
| 篇目中心（主页） | 126 篇按年级分类，支持篇名/作者/朝代搜索；今日学习概览（默写进度环）、今日推荐（继续学习/错题回炉）、今日任务 |
| 学习 | 完整原文（可朗读，通假字/多音字注音，语速/字号/夜间主题可调）、逐段译文/赏析折叠、课文注释点击浮层+圈号角标、背诵句★学习引导 |
| 鉴赏 | 整篇鉴赏：主旨、结构、写法、文化背景卡片 |
| 考点 | 中考必考/核心重点篇目考点清单（重点/难点徽章），非重点篇目空态提示 |
| 注释 | 本篇课文注释清单（序号与原文角标对应），词义默写考查词标"考点"徽章 |
| 默写 | 原文/理解/词义/译文四种题型，输入自动判分+自评，答错自动入错题本；151 篇 / 2444 题 |
| 错题本 | 按篇目分组的错题回顾，可重练/移除/清空（容量上限 600 条） |

数据规模：126 篇课文 · 2326 词条 / 2896 词义 · 1957 道题（单篇 + 17 个综合题集）。

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
├── features/           功能模块 (feature-first)
│   ├── home/           首页 (今日学习/推荐/任务/搜索/篇目网格)
│   ├── learning/       篇目工作区 (学习=ArticleReader/鉴赏/考点/注释)
│   ├── moxie/          默写 (列表/练习/错题本)
│   └── errorbook/      错题本 store (Context + localStorage)
├── data/               数据层 (raw/ 源 + runtime/ 生成 + 查询 API)
├── shared/
│   ├── ui/             共享组件 (Icon/PageHeader/HighlightText/Modal/EmptyState/SectionHeader/ErrorBoundary)
│   ├── lib/            工具 (ls 封装/pron-dict 注音/tts 朗读/align)
│   └── styles/         全局样式 (书卷纸墨令牌 + 共享类)
└── types.ts            领域类型
scripts/                数据生成/校验/测试脚本
public/                 PWA 清单/图标/Service Worker
```

- `raw/` 是唯一数据源（学习/练习/真题/手写题/AI 生成题重写）；`runtime/` 由管道生成，不手改
- 页面只通过 `src/data/index.ts` 访问数据，不直接消费 OCR 字段
- 加载策略：首屏仅同步加载轻量 `article-meta.json`；全文/词条/题目走路由懒加载 + 空闲预加载

## 测试与校验

```bash
npm run validate     # 数据校验: 引用完整性/背诵句/英文水印残留/去重等
npm run typecheck    # TypeScript 严格检查
npm run check        # 完整发布前检查 (生成+校验+类型+构建+SSR)
npm run test:flow    # 满强度用户流测试 (浏览器自动化: 学习→默写→判分→错题→移动端)
node scripts/browser-test.mjs   # 篇目中心快速回归 (五标签工作区/搜索/旧路由/移动端)
node scripts/page-scan.mjs      # 全页面扫描 (全部路由×桌面/移动: JS 错误/溢出/渲染)
```

测试需要 chromium（playwright-core 已配置路径），开发服务器需已启动（`npm run dev`）。

## 视觉大模型（VisionProbe）

截屏后调用 VLM（gemini-2.5-pro-1m）做视觉审查，弥补文本模型无法看图的缺陷：

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

纯前端 SPA + PWA，构建产物 `dist/` 可部署到任意静态托管。深链直访需要服务器 history fallback 或内置 `404.html` 兜底，详见 [DEPLOY.md](./DEPLOY.md)。
