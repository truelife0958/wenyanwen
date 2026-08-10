# 文档更新与死代码清理

## Goal

按全面诊断报告(`.trellis/tasks/archive/2026-08/08-10-full-diagnosis/diagnosis-report.md`)的 P1-1~4 全部问题 + P2 低风险修复项,更新 README 至与实现一致,删除已移除功能的死代码残留,修复 sw.js 子路径隐患与 validate 误报式警告。

## Requirements

### R1 README 更新 (P1-1, P1-2, P1-4)
- 功能表重写: 反映当前真实功能(字词卡=实虚词列表+弹窗+原文背诵翻卡单模式;无 SM-2/四档评分/词义测验/三模式背诵)。
- 模块表: 移除 review/collections 模块声明,或改为准确描述(学习页 tab 内复习聚合;综合题集已移除)。
- 数据规模数字更新: 126 篇 · 2144 词条 / 2495 词义 · 2022 题(16 综合题集 40 题,或说明题集已无前端入口)。
- 首页描述更新: 实际仅 1 张错题本入口卡。

### R2 死代码清理 (P1-3)
删除以下 0 引用代码(诊断已实证无消费者):
- `src/data/card-progress.ts`(整个文件)
- `src/shared/lib/utils.ts` 中 `sm2Schedule` 函数
- `src/features/cards/FlipCard.tsx`、`RateBar.tsx`、`StatsBar.tsx`
- `src/shared/ui/EmptyState.tsx`
- `src/features/home/Home.tsx` 中 `CATEGORIES` 常量
- `src/features/home/home.css` 中 `.entry-review` 样式
- `src/features/practice/PracticePage.tsx` 中 `errorHref = '/collections'` 死默认值(改为 '/errors' 或去掉默认值)

注意: `main.tsx` 中删除 `wyw_cards_v2` 等键的启动清理代码**保留**(仍有用户旧数据需清理)。

### R3 P2 低风险修复
- `public/sw.js`: `absolute()` 改用 `self.registration.scope` 解析相对路径,支持子路径部署。
- `scripts/validate-data.mjs`: "无关联题目: 0" 与 "无题目文章: 0" 两个值>0 才 warn 的误报式警告降级(值为 0 时输出 info 行而非 ⚠)。

## Acceptance Criteria

- [x] `npm run check` 全链路通过(含 typecheck、vite build、ssr-check)。
- [x] `npm run test:flow` 46/46 通过,无回归。
- [x] 死代码文件删除后 `rg` 确认无残留引用(tsc 通过即证明)。
- [x] README 所有数字与 build-report.json 一致;功能表与 App.tsx 路由/组件一致。
- [x] sw.js 子路径解析修正(代码审查: absolute 使用 registration.scope)。
- [x] validate 误报式警告降级后,正常输出不再出现这两个 ⚠。

## Notes

- 不修改任何数据文件(src/data/runtime/*、raw/*)。
- 不新增功能,只做文档与清理。
- 综合题集数据(collections.json)保留不动,仅文档说明其无前端入口。
