# 执行计划: 关卡动画讲解 + 横版卷轴世界地图 + 分流跳转

## 前置检查
```bash
npm run typecheck && npm run validate   # 基线全绿
```

## 实施步骤

### Step 1: 分流跳转（最小改动）
- `LevelMap.tsx`：节点 Link 目标按状态分流
  - passed → `/articles/:id/moxie`；unlocked 未通关 → `/articles/:id/learn`
  - 锁定不可点（现状）
- 验证：未通关关节点 → /learn；已通关 → /moxie

### Step 2: 讲解模式组件 LectureMode
- 新建 `src/features/learning/LectureMode.tsx`：
  - 数据：`article.reading.paragraphs` → splitSentences 拆句，句子数组 `{ text, paraIdx }`；段译文映射 `paraIdx → translation`
  - 状态：currentIdx / playing / done；播放用 `speak()`（tts.ts），句完自动进下句；无 TTS 静音手动
  - 渲染：顶部（标题/进度/关闭）+ 原文句子列表（当前句 .lec-active 高亮，可点击跳句）+ 段译文卡片 + 底部控制条（播放/暂停/⏮⏭/进度 range/语速）
  - 动画：CSS lec-pop 句切换、高亮过渡、当前句 scrollIntoView
  - 卸载时 stopSpeak()
- 入口：`ArticleReader.tsx` 工具条加"▶ 讲解"按钮（.lec-start），打开 LectureMode
- CSS：`article.css` 追加讲解模式样式（全屏覆盖层 .lec-overlay 等）
- 验证：关卡页点讲解 → 逐句高亮 + 译文 + 播放控制；无 TTS 环境可手动逐句

### Step 3: 横版卷轴地图重构（LevelMap）
- 重构 `LevelMap.tsx`：
  - 容器 `.gx-map-h`（overflow-x auto）+ 世界导航条 `.gx-world-nav`（6 按钮 scrollIntoView）+ 轨道 `.gx-world-track`（flex 横排）
  - 每世界 `.gx-world-card`（固定宽，内部纵向小 S 形节点 + SVG 蜿蜒路径）
  - 玩家 Token：定位第一个未通关已解锁关（兜底最后通关），`.gx-player-token` 发光徽标；useEffect 自动滚动到玩家世界
  - 节点 Link 分流（Step 1 的 dest 逻辑复用）
- CSS `game.css`：
  - `.gx-map-h/.gx-world-track/.gx-world-card`（横版）+ `.gx-world-bridge`
  - 路径流动光效 `.gx-path-flow`（stroke-dashoffset 循环动画）+ static 底路径
  - `.gx-player-token` 呼吸发光
  - 节点触控区扩大、点击高亮
- 验证：横版滚动、自动定位玩家、路径流动、节点分流

### Step 4: 测试同步
- `browser-test.mjs`：
  - 地图结构断言改横版（.gx-map-h/.gx-world-track/.gx-player-token）
  - 分流断言：未通关点→/learn、通关点→/moxie（用 localStorage 预置通关状态模拟）
  - 讲解模式：入口按钮存在、打开后逐句/译文/控制条渲染
  - 移动端横版地图无页面溢出
- `page-scan.mjs`：首页/移动首页扫描（横版容器内滚动不溢出）
- `full-flow-test.mjs`：首屏地图断言改横版；地图点击→历练 tab 流程
- `ssr-check.mjs`：检查是否需要同步

### Step 5: 回归验证
```bash
npm run typecheck
npm run validate
node scripts/browser-test.mjs
node scripts/page-scan.mjs
node scripts/full-flow-test.mjs
npm run build
```
- 截图目检：桌面/移动端横版地图（玩家 token/路径流动/世界并排）、讲解模式（逐句高亮/译文/控制条）
- 首屏 chunk 检查（主 chunk 不含 moxie 数据）

### Step 6: 部署
- commit + push GitHub
- `vercel --prod --yes`
- 生产验证：分流跳转、讲解模式、横版地图、无"学习/默写"

## 验证命令速查
- 基线/回归：`npm run typecheck && npm run validate`
- 快速回归：`node scripts/browser-test.mjs`
- 全路由扫描：`node scripts/page-scan.mjs`
- 满强度流：`node scripts/full-flow-test.mjs`
- 构建：`npm run build`

## 回滚点
- Step 1 后：分流生效可单独验证
- Step 2 后：讲解模式可单独验证（不动地图）
- Step 3 后：横版地图可单独验证
- 全部完成后一次 git commit；线上异常 git revert 即回滚
