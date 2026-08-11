# Design: UI 一致性修复 (8 类视觉建议)

## 设计原则

- **对比度红线不放松**：选中态红底白字是此前刻意设计（940c219），所有改动保持对比度 ≥ 4.5:1。
- **令牌唯一来源**：所有新颜色/字体走 `tokens.ts`，禁止硬编码 hex（validate 段11 gate）。
- **误报不盲改**：卡片高度（实测 70px 一致）、底部 Tab 选中态（红底白字已达标）只做回归确认，不动代码。
- **语义统一**：徽章按语义分级——must=印章红系、core=古铜棕系、普通=描边。

## 改动方案（按文件）

### 1. `src/shared/styles/global.css`
- **`.ac-badge-must` / `.ac-badge-core` 恢复**（真实 bug，ArticlePage.tsx 仍在使用）：
  - `.ac-badge-must`: `background: var(--primary); color: var(--card-bg);`（红底白字，与首页 `.exam-must .ac-badge` 一致）
  - `.ac-badge-core`: `background: var(--bronze-deep); color: var(--card-bg);`（棕底白字，与首页 `.exam-core .ac-badge` 一致）
  - 删除误导注释"死代码已清理"。
- **`.page-header-back a` 按钮化**：
  - 加 `display: inline-flex; align-items: center; gap: 4px;`
  - 颜色 `ink-2` → hover `primary` + 下划线/背景 `primary-soft`
  - 加 `padding: 4px 8px; border-radius: var(--r-xs);` 扩大点击热区
  - 说明：返回箭头 `←` 已含在 backLabel 文本中，无需额外图标。
- **`.page-header-meta` 提升可读性**：`color: var(--ink-2)`（原 ink-light），`font-size: 0.88rem`（原 0.86rem），保持次级层级。

### 2. `src/shared/styles/global.css` — `app-header` 副标题
- `.app-header-info`: `font-size: 0.7rem → 0.76rem`，`color: ink-light → ink-2`（适度，不抢 h1）。

### 3. `src/features/learning/article-page.css` — workspace-tabs 选中态
- `.workspace-tabs a.active`：
  - 保留红下划线（`border-bottom-color: var(--primary)`）
  - 加 `background: var(--primary-soft)`；`font-weight: 700`（原 600）
  - `border-radius: var(--r-xs) var(--r-xs) 0 0`（下划线对接）
- 未选中项保持 `ink-light`；hover 已有 primary。
- 移动端 `min-width: 76px; flex: 1 0 76px` 不变（横滑可用）。

### 4. `src/features/home/home.css` — 年级标签 & 篇目页 meta
- `.grade-tab.active`：**保留红底白字**，`box-shadow: 0 3px 10px var(--red-25) → 0 2px 6px var(--red-10)`（弱化跳跃感）。
- `.gt-count` 在 active 态：`background: var(--accent-soft)` 保持。
- 无需改卡片高度（回归确认）。

### 5. `src/features/learning/article-page.css` — 篇目页标题 meta 分隔
- 无单独 meta 容器类名，PageHeader 渲染 `.page-header-meta`；内容为 `朝代 · 作者 · 年级` 字符串。
- 在 `ArticlePage.tsx` 将 meta 渲染为带分隔符的 JSX：
  ```tsx
  const metaParts = [article.dynasty, article.author, article.grade].filter(Boolean);
  meta={metaParts.map((part, i) => <span key={part}>{i > 0 && <span className="meta-sep">·</span>}{part}</span>)}
  ```
- CSS `.meta-sep { margin: 0 6px; color: var(--border); }`（global.css 或 article-page.css）。
- 移动端 `flex-wrap: wrap` 自动换行，不挤堆。

### 6. TabBar（回归确认）
- 选中态 `color: var(--card-bg); background: var(--primary); font-weight: 700` 已达标，不动。
- 验证未选中项 `color: var(--ink-2)` 对比度 ≥ 4.5:1（ink-2 #4d4539 on white ≈ 8:1，通过）。

### 7. 卡片高度（回归确认）
- 桌面/移动实测全 70px，不动。`.ac-meta` 两行换行保留（信息不截断）。

## 不修改项（误报/刻意设计）
- TabBar"样式不统一"：选中/未选中态差异，属正常。
- 卡片高度"不齐"：实测一致。
- emoji 图标：已在上个任务修复（f-emoji 令牌）。

## 风险
- workspace-tabs 加背景色可能影响移动端横向滚动观感——测试确认无溢出。
- page-header-back 按钮化可能影响布局换行——flex-wrap 已存在，测试确认。
- 徽章恢复背景色可能改变篇目页视觉——目标即与首页统一。
