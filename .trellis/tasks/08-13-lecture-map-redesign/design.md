# 设计: 关卡动画讲解 + 横版卷轴世界地图 + 分流跳转

## 1. 架构现状

- LevelMap：竖版 S 形画布（2026-08-13），节点绝对定位 + SVG 三次贝塞尔路径；点击一律 `/articles/:id/moxie`
- ArticleReader：段落渲染（para-orig/para-trans），TTS 基础设施完善：`speak(text,onEnd,onBoundary,rate)` + `stopSpeak()` + `ttsSupports()`（src/shared/lib/tts.ts），语速持久化 `wyw_tts_rate`
- 数据：`article.reading.paragraphs`（CanonicalParagraph: original/translation/analysis）+ `article.reading.translation`；`splitSentences`（utils.ts）可拆句
- 无 TTS 降级：ArticleReader 已有 `if (!ttsSupports()) return` 模式

## 2. R1 分流跳转（最小改动）

LevelMap 节点 Link 目标按状态：
```tsx
const dest = passed ? `/articles/${id}/moxie` : `/articles/${id}/learn`;
```
- passed（已通关）→ 默诵 tab（复习刷题）
- unlocked 未通关 → 历练 tab（先读课文再挑战）
- 注意：`article.articleId || article.id` 的 id 解析保持

## 3. R2 程序化动画讲解模式

### 3.1 组件 `LectureMode.tsx`（新文件，src/features/learning/）
- 全屏覆盖层（Modal 或固定层），props: `{ article, onClose, rate }`
- 数据构建：
  - 句子列表：遍历 `article.reading.paragraphs`，每段 `splitSentences(original)` 拆句，记录每句的 `{ text, paraIdx, segIdx }` 与对应译文（段内译文按句数均分或匹配）
  - 简化：句粒度用段落译文整体 + 当前段译文显示（避免句-译对齐复杂化）
- 状态：`currentIdx`、`playing`、`done`
- 渲染：
  - 顶部：标题 + 进度（第 n/总句）+ 关闭
  - 原文区：句子数组，当前句 `.lec-active`（金色下划线+背景+scale），点击任一句可跳转播放
  - 译文区：当前句所在段译文（金色渐变卡片）
  - 底部控制条：播放/暂停、⏮ 上一句、⏭ 下一句、进度条（input range）、语速（复用 rt-btn 逻辑或简单 select）
- 播放逻辑：
  - `play()`：`speak(sentence.text, () => { 下一句或结束 }, onBoundary?)`
  - 句结束 onEnd → next 自动播放（若 playing）
  - 无 TTS：静音逐句（手动 ⏭ / 自动定时器可选）
  - 结束：显示"🎉 本关讲解完毕"，停止自动
- 动画：句切换 fade/slide（CSS animation lec-pop）、高亮下划线过渡
- 滚动：当前句 `scrollIntoView({ block: 'center', behavior: 'smooth' })`
- 数据驱动：142 关通用

### 3.2 入口
- ArticleReader 顶部工具条（read-tools 旁）加"▶ 讲解"按钮（`lec-start`），点击打开 LectureMode
- 复用 `wyw_tts_rate` 语速

## 4. R3 横版卷轴世界地图（重构 LevelMap）

### 4.1 布局（横版卷轴）
```
地图容器 .gx-map-h: overflow-x auto, 横向滚动
├ 世界导航条 .gx-world-nav: 6 个世界按钮 (点击 scrollIntoView)
└ 世界轨道 .gx-world-track: display flex, 横向并排
   └ 每个 .gx-world-card: 固定宽度 (桌面 320px, 移动端 86vw), 内部纵向蜿蜒路径
       ├ .gx-world-head: 图标 + 标题 + 进度
       └ .gx-canvas (相对定位, 高 = 节点数×间距):
           ├ SVG 路径 (蜿蜒弧线, 流动光效)
           └ 节点 (S 形小蛇形: x 交替 28%/72%)
```
- 世界间连接：`.gx-world-bridge`（连接线 + "▶ 下一世界" 箭头装饰）
- 移动端：轨道宽度 ≈ 6×86vw（约 2000px），横向触摸滑动；页面 body 不溢出（滚动在 .gx-map-h 容器内）

### 4.2 玩家 Token
- 定位：`useGame().state` 找当前关卡 = 第一个未通关的已解锁关卡（或最后一个通关）
- `.gx-player-token`：绝对定位在当前关节点上方（-24px），金色发光徽标（⚔️ 或 🧭），呼吸动画
- 进入地图：`useEffect` 中 `mapContainer.scrollTo({ left: 当前世界卡片 offsetLeft - 60, behavior: 'smooth' })`
- 移动端同样自动滚动到玩家所在世界

### 4.3 路径流动光效
- SVG path 加 class `.gx-path-flow`：
```css
stroke-dasharray: 12 10;
animation: gx-dash-flow 1.2s linear infinite;
@keyframes gx-dash-flow { to { stroke-dashoffset: -22; } }
```
- 底层 static 路径（细）+ 上层 flow 路径（亮色流动）

### 4.4 节点状态与动效
- 4 态：`.locked`（灰锁）/ `.playable`（翠绿呼吸）/ `.done`（金色+星）/ `.player`（玩家 token 标记）
- 可玩节点呼吸：现有 gx-pulse 加强
- 点击高亮：`:active { transform: scale(0.94) }` + `.gx-node-wrap:active .gx-node-label` 变色（现有已有 scale，补视觉反馈）
- 触控区：`.gx-node-wrap` 扩大为 64×64（视觉 58 + padding），命中区 ≥44px

### 4.5 视觉分层
- `.gx-sky` 背景已有星云；世界卡片半透明深底 + 金边（已有样式复用）
- 世界标题金色 + 图标差异化（七上🌱/七下🌿/八上🎋/八下🍃/九上🍁/九下❄️ 等）

### 4.6 布局常量（横版）
```
世界卡片宽: 桌面 330px / 移动端 80vw
节点: NODE 58, GAP 96, X 交替 26%/74%, TOP 34
世界高 = TOP + (n-1)*GAP + NODE/2 + 24
轨道总宽 = Σ(卡片宽 + 桥宽 40)
```

## 5. 数据流（不变）

```
地图: moxieArticles(142, 排除附录) + useGame.levels + isUnlocked + starsFor
点击节点 → 分流 (/learn 或 /moxie) → 关卡页 → MoxieTrainer 判分 / ArticleReader 阅读
讲解模式: article.reading.paragraphs + splitSentences + speak()
判分/XP/解锁/失误入库链路全部不动
```

## 6. 权衡

| 方案 | 取舍 |
|---|---|
| 程序化讲解 vs 真视频 | 纯前端、142关全适用、无外部依赖；非真人视频但动画讲解效果足 |
| 句-译对齐简化（段落译文） | 避免复杂对齐算法；讲解观感 OK |
| 横版世界并排 vs 整图蜿蜒 | 世界并排清晰、滚动可控；世界内保留蜿蜒路径的"冒险感" |
| 滚动容器内横向滚动 | 页面不溢出，移动端手势自然；初始自动滚动到玩家位置 |
| 玩家 token 定位"最近可玩/通关" | 明确引导下一步 |

## 7. 兼容性 / 回滚

- 分流只改 Link 目标；讲解模式是新增（不影响既有阅读）；地图重构保持类名兼容尽量（.gx-world-card 复用）
- 数据/进度零改动
- 回滚：git revert
- 测试：三套同步，讲解模式静音降级断言

## 8. 风险与对策

| 风险 | 对策 |
|---|---|
| 句-译对齐不准 | 段级译文展示（每段一个译文块），不做逐句对齐 |
| TTS 在 headless/手机异常 | 静音降级（无 TTS 时手动逐句），测试断言降级路径 |
| 横版滚动撑破页面 | 滚动容器 overflow-x:auto + 页面 overflow 检查（page-scan 拦截） |
| 玩家 token 定位不准 | 定位逻辑 = 第一个未通关已解锁关，兜底最后通关关 |
| 讲解模式与朗读冲突 | 进入讲解 stopSpeak() 现有朗读；退出 stopSpeak() 清理 |
