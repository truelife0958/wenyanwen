# 极致打磨 9.9: 细节完美收官

## Goal

在前几轮基础上做最终打磨:修复全部剩余缺陷,统一可访问性/交互/视觉/性能细节,达成"项目评分 9.9"。

## Background (现状审查已确认)

- 数据层:空数不匹配仅剩 4 个等价答案题(赠从弟/庄子/出师表/诗经,前端已正确处理,非缺陷);q 有空无答案 = 0。
- 代码:仅 1 处 button 缺 type(ErrorBoundary);home.css 残留 2 处硬编码间距(4px/6px);article.css/article-page.css 无 :focus-visible 样式(键盘可访问性缺失)。
- index.html/main.tsx: manifest/PWA/主题色/语言 已完备。

## Requirements

### R1. 可访问性 (A11y)
- 全局统一 `:focus-visible` 焦点环(2px 金色描边,不破坏现有视觉)。
- ErrorBoundary 按钮补 type="button"。
- 默写输入框:键盘 Enter 跳到下一空(移动端友好);判分后焦点移至结果区。
- 交互元素(按钮/链接/tab)检查 aria-label 与可读文本。

### R2. 交互细节
- 判分后自动滚动到题卡结果(不跳动,平滑)。
- "重新作答"后自动聚焦第一空。
- 默写错题本/列表空状态文案与图标完善。
- 加载态(PageLoader)样式统一。

### R3. 视觉细节
- home.css 残留 4px/6px → token。
- 视觉模型复审 6 页(桌面+移动),修复发现的细节问题(对齐/留白/对比度/层级)。
- 对比度检查:次要文字(muted)在纸色背景 ≥ 4.5:1(大字号 3:1)。

### R4. 性能
- 检查 dist 体积与代码分割(已 lazy);字体加载策略(preload? font-display? 检查是否外链)。
- 输入框受控渲染优化(大量输入框时避免全卡重渲染,可接受则记录)。

### R5. 鲁棒性
- localStorage 读写失败兜底(已有 warn,确认不崩溃)。
- 空数据/异常数据渲染兜底复查。

### R6. 移动端
- 输入框在移动键盘弹起时体验(100dvh、safe-area)。
- 点击目标 ≥ 44px 检查。

## Acceptance Criteria

- [ ] :focus-visible 全局焦点环覆盖全部交互元素
- [ ] 输入框 Enter 跳空 + 判分滚动到结果 + 重答聚焦第一空
- [ ] 视觉复审修复完成(截图对比或视觉模型确认)
- [ ] 无硬编码间距/颜色残留(validate 段 11/13 全绿)
- [ ] check + test:flow 全绿
- [ ] 打磨清单记录 research/polish-list.md(逐项: 现状 → 修复 → 验证)

## Notes

- 视觉复审沿用 vision 流程(双视口截图 + gemini 审查),重点: 首页/学习页/默写练习页。
- 不新增功能,只打磨现有体验;所有改动保持既有视觉体系(书卷纸墨)。
