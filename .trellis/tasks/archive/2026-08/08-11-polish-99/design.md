# 设计: 极致打磨 9.9

## 打磨清单 (发现 → 修复 → 验证)

### P1 可访问性
1. global.css 加统一 `:focus-visible` 焦点环: `outline: 2px solid var(--accent); outline-offset: 2px; border-radius: 4px`(输入框/按钮/链接/tab)。
2. ErrorBoundary 按钮 `type="button"`。
3. MoxieArticle 输入框: Enter → 下一空 (onKeyDown, 最后一个空 → 触发判分若全部填完);判分后结果区 `ref` scrollIntoView({behavior:'smooth', block:'nearest'})。
4. "重新作答" 后聚焦第一空 (ref 数组)。

### P2 交互
5. 判分结果滚动: FillQuestionCard 内 checked 时 effect scroll 到 `.mq-answer`(若不在视口)。
6. 重答聚焦: retry 后 requestAnimationFrame 聚焦 inputs[0]。
7. 空状态复查: EmptyState 组件已通用,检查文案。

### P3 视觉
8. home.css `.grade-tabs { padding: 0 0 4px; gap: 6px }` → `var(--sp-xs)` / gap 6px 保留(非 4/8/12/16/24 体系,记录说明)。
9. 视觉复审: 双视口截图 6 页 → gemini 审查 → 修复 → 复审。

### P4 性能
10. 字体: 检查是否外链 (index.html 无 font link → 系统字体栈, 无加载问题, 记录)。
11. dist 体积检查: `npm run build` 后 dist/assets 大小; > 500KB gzip 则考虑进一步拆分 (记录即可)。

### P5 鲁棒性
12. localStorage 兜底确认 (utils.ts 已 try/catch + warn)。
13. 空数据兜底: MoxieArticle 无 section → EmptyState (已有); Home 无数据 → 检查。

### P6 移动端
14. 点击目标: tab/按钮最小高度检查 (≥ 40px, 可接受记录)。
15. 键盘弹起: 输入框 min-height 无固定 100vh 布局 → 无问题, 记录。

## 验证链
- npm run check (0 错误) + test:flow (42/42)
- validate 段 11 (硬编码颜色) / 段 13 (数据质量) 全绿
- 视觉复审截图对比
- 键盘实测: Enter 跳空 (playwright 脚本)

## 风险
- Enter 跳空与移动端输入法"确认"键冲突 → 仅当 event.key === 'Enter' 且非 composition 状态 (e.nativeEvent.isComposing 检查)。
- focus 环破坏视觉 → 仅在 :focus-visible (键盘导航) 显示, 鼠标点击不显示。
