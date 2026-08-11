# 全项目优化精简整合 + 浏览器全功能测试

## Goal

对武汉中考文言文 App 做一次全项目体检式优化:功能精简整合(去冗余、去死代码、更新过时产物)、布局简洁易操作(修复视觉审查发现的对齐/对比度/一致性问题)、全功能浏览器回归(重写过时测试,覆盖每个按钮/环节)、性能与加载核查。追求"功能无冗余、布局简洁、测试全绿"的完美状态。

## Background(现状调研结论)

- 功能基线:full-flow-test.mjs 44/44 全绿;page-scan.mjs 77 项通过(但含过时路由假通过);browser-test.mjs 严重过时并崩溃(测旧 UI:四入口卡/三标签/练习tab)。
- 视觉审查(vision.mjs + Gemini VLM)发现首页/学习页/默写页多类问题:对比度不足(核心重点标签、年级tab选中数字、朗读控件、搜索占位符)、对齐不统一(今日推荐卡、错题本卡、底部导航图标、卡片标签间距)、风格不一致(中考必考标签与描边规则不一、面性/线性图标混用、学习/默写按钮样式不一)。
- 文档/脚本过时:README.md、PROJECT_STRUCTURE.md 描述已删除的页面(练习/字词卡/考点图谱/Collections/Flashcards);page-scan.mjs 测试 /cards /map /errors 已移除路由(假通过);browser-test.mjs 基于旧 UI 断言。
- 死代码:ArticleReader 的 `compact=false` 分支(article-head 整块)无调用点;TagChip.tsx 未被引用;Home.tsx 中"今日推荐/今日任务/快捷入口"三块功能重叠(均指向错题本/默写)。
- 数据层:运行时 JSON 共约 4.6MB(articles 940K + words 932K + questions 1.4M + moxie 848K + exam-generated 444K),已有 advancedChunks 分包 + 路由懒加载 + idle 预加载;首页同步加载 article-meta(44K)。

## Requirements

### R1 功能精简整合

- R1.1 首页"今日推荐 + 今日任务 + 快捷入口"三块重叠区整合为至多两块,消除指向同一目的地的重复入口,减少首屏操作负担。
- R1.2 清理死代码:ArticleReader 非 compact 分支(article-head)、未引用的 TagChip.tsx;如影响面小直接删,否则标注 TODO 并记录原因。
- R1.3 更新过时产物:browser-test.mjs 重写为匹配当前 UI(或整合进 full-flow-test);page-scan.mjs 移除已删除路由、补当前路由;README.md / PROJECT_STRUCTURE.md 同步真实功能结构。
- R1.4 核对 src/data/raw/ 与 scripts/ 中无引用文件,保留数据管线必需项,清理纯死文件。

### R2 布局简洁易操作(视觉问题修复)

- R2.1 对比度修复:核心重点标签文字、年级tab选中数字、朗读控件(语速/字号/说明)、搜索占位符 —— 达到可读标准。
- R2.2 对齐修复:今日推荐卡元素垂直居中、错题本卡内部布局、底部导航图标文字居中、任务行基线、篇目卡标签间距与位置统一、标题竖线移除或统一。
- R2.3 风格统一:中考必考/核心重点标签+描边规则一致化;底部导航图标风格统一;学习页"学习/默写"按钮视觉层级合理;高亮词背景增强可辨识。
- R2.4 防误触:查看译文/查看赏析间距加大;★ 星标垂直对齐。
- R2.5 验收:修复后跑 vision.mjs 复检,新报告不再出现同等级(高/中)问题;桌面+移动双视口无横向溢出。

### R3 全功能浏览器回归测试

- R3.1 每个功能按钮/环节可测且测试全绿:首页(搜索/年级tab/入口/继续学习)、学习页(朗读/语速/字号/主题/注释点击/译文赏析展开/背诵星标/默写入口)、默写(题型tab/输入判分/自评/错题入库/重练/移除)、错题本、旧路由跳转、深链恢复、移动端溢出。
- R3.2 修复后的 browser-test.mjs(或等价测试)通过;full-flow-test.mjs 44/44 保持全绿;page-scan 无假通过。
- R3.3 `npm run check`(data:build + validate + typecheck + vite build + SSR)全绿。

### R4 性能与加载核查

- R4.1 核查首屏加载链路:首页同步数据量、懒加载边界、idle 预加载有效性;如无阻塞问题则记录结论,不做无谓改动。
- R4.2 数据包体积评估:4.6MB 运行时数据是否可进一步按需(如 moxie 仅默写模块用、exam-generated 已合并进 questions 则检查重复加载)。
- R4.3 交互性能:列表渲染(127 篇卡片)、搜索结果防抖已用 useDeferredValue;核查无 N+1 重渲染热点。

## Constraints

- 纯前端静态托管(PWA),不改数据管线结构(raw → runtime 单向)。
- 不得破坏 127 篇/2011 题/2168 词条数据完整性;validate 必须通过。
- 保持古典书卷视觉基调,不引入新设计体系。
- 兼容桌面(1280px)与移动(375px)双视口。

## Acceptance Criteria

- [ ] AC1:首页入口区整合后 ≤2 块,视觉对齐、无重复指向同一目的地的相邻入口。
- [ ] AC2:死代码清理完成(ArticleReader 非 compact 分支 / TagChip),`rg` 验证无残留引用。
- [ ] AC3:browser-test.mjs 重写后全绿且不再崩溃;page-scan 路由清单与当前 App 路由一致;README/PROJECT_STRUCTURE 与真实功能一致。
- [ ] AC4:vision.mjs 复检首页/学习页/默写页,报告无"高"严重度问题,中级问题较基线减少。
- [ ] AC5:full-flow-test.mjs 44/44 全绿;`npm run check` 全绿。
- [ ] AC6:性能核查结论记录在任务 journal(首屏链路/包体积/渲染热点),无遗留未决优化项。

## Notes

- 任务执行顺序:先 R3 测试基线固化 → R1 功能精简 → R2 布局 → R3.2 测试补全 → R4 性能核查 → 最终验收。
- 布局改动后必须重跑 full-flow 与 browser 测试,防止选择器断言回归。
