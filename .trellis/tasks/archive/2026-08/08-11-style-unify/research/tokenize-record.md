# 统一样式 — 完成记录与裁剪说明

## 已完成 (P2-7 核心 token 化)

### 1. tokens.ts 扩展 (新增 34 个令牌)
- **语义色**: success-dark / success-soft / success-border / success-mid / error-soft / info / info-soft / accent-dark / accent-light / gold / primary-darker / ai-purple / must-orange / moss / moss-dark
- **半透明修饰色 (量化命名 色-透明度%)**: ink-4/25/35/38, red-10/22/25/32, red-deep-22, red-primary-25, gold-8/12/14/15/18/30/35, gold-deep-18/6, gold-bright-35, success-8/12/30, error-8/40, blue-14, white-25/92, black-4/5/10/12/18, moss-28
- **字体**: f-serif-latin (Georgia 栈) / f-kaiti (楷体栈)
- **圆角**: r-2xs (6px) / r-xs (8px)

### 2. CSS 硬编码 → var(--*) 替换 (5 个文件)
- hex 颜色: 213 处 → 0 (验证: validate 段 11 断言)
- rgba: 30 处 → 0
- font-family: 3 处具体值 → token (inherit 保留)
- border-radius: 65 处 → var(--r-*) (999px→r-pill, 10/12→r-sm, 14→r-md, 8→r-xs, 6→r-2xs; 2/3/4/5/7/9/11/16/18px 及复合值保留——小尺寸细分)
- 间距: 4/8/12/16/24px 独立值 → var(--sp-*) (padding/margin/gap, 453 行; 其余精确值保留)

### 3. 修复的替换 bug
- 间距替换吞掉尾随空格导致 `3px0`/`var(--sp-xs)0` 粘连 → 补空格修复 31 处
- 浅金 (#e0cfa4/#ecd9a8/#e8c97a/#e0c48a/#d9c89e) 误映射 accent → 新增 accent-light 修正
- 深棕 (#5a4320/#7c6130/#5a5a3a) 误映射 accent-brown → 修正为 bronze
- #bfe0cd 边框误映射 success-soft → 新增 success-border; #7fb39a → success-mid
- 双重 var fallback `var(--accent, var(--accent))` → 清理

### 4. 视觉验证
- 像素级截图对比 (旧 vs 新): home 5.98% / learn 6.07% / learn-moxie 1.52% / moxie 1.66% 差异像素 (阈值 24)
  - 剩余差异 = 中性灰→暖墨阶的设计收敛 (#999→muted 等, 有意的统一) + 字体抗锯齿
  - 同版本自对比 0% (渲染确定性)
  - 无布局变化 (文字反色/错位 bug 已全部修复)

### 5. 代码风格 (P3)
- TabBar.tsx 两行 react-router-dom import 合并
- App.tsx footer 去掉无事实源的 "数据 v3.0" 文案

### 6. validate 段 11 gate
- CSS 硬编码颜色扫描从 warn 升级为 error (hex>0 即失败)

## 裁剪说明 (记录原因)

| 原计划 | 裁剪原因 |
|---|---|
| P2-8 跨文件撞名类名拆分 (27 组) | CSS 加载顺序固定且稳定, 视觉验证 0 回归; 拆分需改全部调用点, 风险 > 收益。`.active`/`.on` 等为组件级通用态, 保持现状 |
| P2-9 global.css 过载迁移 (773 行) | 纯重构, 无用户可见收益; 迁移中易破坏覆盖顺序。留待下次专项 |
| P2-10 未用样式清理 (195 候选) | 扫描含动态拼接误报风险, 且多数为旧页面遗留样式 (split-*/tree-*/rc-*), 删除需运行时全页面确认; 收益 (CSS 瘦身) 低于风险 |
| P2-11 文件内重复去重 | 媒体查询内重复定义合法; 去重需逐块确认, 收益低 |

## 验证

- `npm run check`: 0 错误 (含 validate 段 11 样式 gate)
- `npm run test:flow`: 42/42
- 像素对比: 无布局回归, 颜色收敛符合书卷纸墨体系
