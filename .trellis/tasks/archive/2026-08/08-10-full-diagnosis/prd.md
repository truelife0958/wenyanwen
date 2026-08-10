# 全面诊断项目

## Goal

对 wuhan-wenyanwen-app 进行一次全面健康诊断,覆盖四个维度:数据层、前端代码质量、构建与部署链路、功能行为。产出结构化诊断报告,明确每个发现的问题等级(严重/警告/提示)、证据、影响与修复建议,为后续修复任务提供依据。

本次任务**只诊断不修复**(除非发现阻塞性严重问题,需经用户确认后才修)。修复工作另行创建任务。

## 背景

- 纯前端 React 19 + Vite 8 文言文学习应用,数据全部内置(离线 PWA)。
- 数据管道: `src/data/raw/*.json` → `build-runtime-data.mjs` → `src/data/runtime/*.json`;页面经 `src/data/index.ts` 访问。
- 已有设施: `npm run validate`(数据校验)、`npm run typecheck`、`npm run build`、`scripts/ssr-check.mjs`、`scripts/full-flow-test.mjs`(Playwright 全链路)、`scripts/browser-test.mjs`。
- 基线(本次运行): validate 0 错误 / 9 警告;tsc 通过。

## Requirements

### R1 数据层诊断
- 运行 `npm run validate`,逐条分析 9 个警告:是否已知观察项、是否真实缺陷、影响面。
- 检查 raw → runtime 数据管道产物与源数据对齐(文章数、题目数、字词数、题集数)。
- 抽查数据质量问题:重复条目、OCR 残留、截断、引用悬空、字段缺失/类型错误。
- 对比 README/DEPLOY 中声明的数据规模与实际 runtime 数据,找出文档漂移。

### R2 前端代码质量
- `npm run typecheck` 严格模式通过性。
- React 组件结构审查:key 完整性、hooks 依赖、条件渲染空值风险、useEffect 泄漏、内存泄漏(事件监听/定时器)。
- 状态管理(localStorage stores)读写一致性、版本迁移、异常兜底。
- 样式:过时 CSS class 残留(如 `.type-grid.two-cards`)、死代码、未使用导出。
- 已知死数据/死入口:annotation/extra/exam 三类入口现状确认。

### R3 构建与部署链路
- `npm run check` 全链路(data:build → validate → typecheck → vite build → ssr-check)。
- PWA 完整性:manifest、service worker 缓存策略、离线可用性、图标资源。
- 深链 fallback:404.html 兜底机制、SSR 渲染验证。
- 构建产物体积(dist 大小、JS chunk 拆分、首屏加载)。

### R4 功能行为测试
- `npm run test:flow` 全流程冒烟(学习→练习→判分→复习→错题→字词卡→题集→移动端)。
- 关键交互补充验证:背诵卡三模式、朗读设置、深链恢复、PWA 安装。
- 浏览器控制台错误/页面异常收集。

## 交付物

1. `diagnosis-report.md` — 结构化诊断报告(按维度分节,每个发现含:等级、证据、影响、修复建议)。
2. 问题清单(表格形式,按严重度排序)。

## Acceptance Criteria

- [ ] 四个维度均完成实际检查(有命令输出/代码证据,非仅凭印象)。
- [ ] 诊断报告落盘 `.trellis/tasks/08-10-full-diagnosis/diagnosis-report.md`,每个发现含证据与修复建议。
- [ ] validate 的 9 个警告逐条定性(已知观察项 vs 真实缺陷)。
- [ ] 文档漂移(README/DEPLOY vs 实际)全部列出。
- [ ] 未做任何代码修改(或修改清单经用户确认)。
- [ ] 报告给出 P0/P1/P2 分级与修复建议,供后续任务直接使用。

## Notes

- 诊断过程中发现的严重问题(如数据丢失、构建失败)记录在报告,不擅自修复;如用户当场要求修复,更新本 PRD 并创建子任务。
- 运行耗时较长的测试(Playwright 全链路)需确保本地有 chromium 缓存(EXE 路径在 full-flow-test.mjs 中硬编码)。
