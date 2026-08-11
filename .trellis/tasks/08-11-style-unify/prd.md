# 统一样式:视觉 Token 化 + 代码风格统一

## Goal

统一全项目视觉样式(消除硬编码,全部走 tokens.ts 设计令牌)与代码风格(组件/命名/类型规范),保持书卷纸墨视觉体系不变。

## Requirements

### R1. 视觉样式 Token 化
- 4 个 feature CSS(home/article/article-page/moxie)+ global.css:硬编码颜色(hex/rgba)、font-family、border-radius、box-shadow 全部替换为 `var(--*)` 令牌。
- 新增 token 需先补入 tokens.ts(遵循既有分组:色彩/字体/间距/圆角/阴影/动效),再被 CSS 引用。
- 间距/字号类硬编码 px 优先映射到既有 sp/f-size 令牌;无对应令牌的小尺寸值(如 1px border)允许保留并在报告说明。
- 删除重复类名定义、未使用样式块(以 audit-report 扫描结果为准)。
- 视觉观感保持一致:不改变设计意图,只替换值来源。

### R2. 代码风格统一
- 组件命名/文件命名/导入顺序/JSX 规范统一(与 shared/ui 既有组件风格对齐)。
- 内联 style 硬编码(颜色/间距)改为 className + CSS 变量。
- TS 类型:消除 any、未用导入、与 types.ts 不一致的结构。

### R3. 验证
- 新增/扩展校验:feature CSS 无硬编码颜色扫描纳入 validate-data.mjs(与 data-audit-fix 协调,避免重复实现)。
- `npm run check` + `npm run test:flow` 全绿;浏览器截图对比(可选,vision 脚本可用时)。

## Constraints

- tokens.ts 是样式单一事实源,key 即 CSS 变量名,与 global.css 一致。
- 不改变视觉设计意图与页面布局(纯值来源替换,不重排布局)。
- 页面样式与组件样式分离约定(global.css 全局 / feature css 页面级)保持不变。

## Acceptance Criteria

- [ ] 4 个 feature CSS + global.css 无硬编码颜色(除注释/渐变保留说明)
- [ ] tokens.ts 覆盖新增需要的全部令牌,无遗漏
- [ ] 无重复类名定义、无未使用样式块(扫描脚本可证明)
- [ ] 组件代码无内联硬编码颜色;无 any/未用导入(tsc --noEmit + lint 扫描)
- [ ] npm run check + test:flow 全绿

## Notes

- 依赖 audit-report 任务的问题清单细化范围。
- 硬编码数量基线(探索阶段):hex 157 / rgba 29 / font-family 11 / 非标准圆角 97 / 硬编码 px ~324。
- 与 data-audit-fix 的样式扫描 gate 协调:由本任务实现扫描逻辑,data-audit-fix 只调用,避免重复。
