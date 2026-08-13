# 执行计划: 主页面 = 画布式闯关地图

## 前置检查
```bash
npm run typecheck && npm run validate   # 基线全绿
```

## 实施步骤

### Step 1: 重做 LevelMap（画布式地图）
- 重写 `src/features/game/LevelMap.tsx`：
  - 保留数据逻辑：按年级分组(排除附录)、levelKey、isUnlocked、starsFor、全局编号、Link→/articles/:id/moxie
  - 新增世界组件 `LevelWorld({ grade, articles, startIdx })`：
    - 节点定位：`x = i%2===0 ? 16% : 66%`，`y = 24 + i*120`，NODE=58
    - SVG：`viewBox="0 0 100 H"`，`preserveAspectRatio="none"`，path `vector-effect="non-scaling-stroke"`，二次贝塞尔连接相邻节点
    - 节点：复用 `.gx-node.done/playable/locked`，绝对定位，`transform: translate(-50%,-50%)` 居中
  - 地图头部：标题 + 总进度 + 成就 CTA（保留 gx-cta）
- 样式：在 `game.css` 新增 `.gx-canvas`、`.gx-svg`、`.gx-world-card` 等，调整 `.gx-node` 尺寸至 58px、hover 放大
- 验证：typecheck + `/map` 截图目检

### Step 2: 首页 = 地图（App.tsx 路由）
- `App.tsx`：
  - 移除 `import Home`；`/` 路由 element → `<LevelMap />`（保持 lazy）
  - 新增 `<Route path="/map" element={<Navigate replace to="/" />} />`（原 `/map` 渲染 LevelMap 改为重定向）
- 验证：访问 `/` 显示地图；访问 `/map` 跳回 `/`

### Step 3: TabBar 两 tab
- `TabBar.tsx`：TABS 改 `地图(/)` / `成就(/achievements)`；激活逻辑 `'/'`+`/articles` 激活地图
- 验证：TabBar 两 tab，关卡页时地图 tab 高亮

### Step 4: 组件清理
- grep 确认引用后删除：`src/features/home/Home.tsx`、`src/features/home/home.css`、`src/features/game/HeroStats.tsx`
- 检查 `home.css` 是否被其他文件引用（仅 Home 用则删）；game.css 的 gx-hero 样式保留
- 验证：typecheck 无残留引用

### Step 5: 测试同步
- `scripts/browser-test.mjs`：
  - 首页 section 重写：断言 `.gx-map`/`.gx-world`/`.gx-canvas` 渲染、TabBar 两 tab、无 `.article-card`/`.today-title`/`.home-search-box`/`.rec-card`
  - 篇目进入：首页不再有卡片 → 地图点击首关或直接 goto 关卡页
  - `/map` 重定向断言；移动端首页=地图无溢出
- `scripts/page-scan.mjs`：首页/移动-首页扫描（渲染地图）；`/map` 路由保留（重定向到 `/`，扫描仍通过）
- `scripts/full-flow-test.mjs`：首屏断言改（无 .article-card）；历练流从地图进入或深链；新增地图首页断言
- `scripts/ssr-check.mjs`：首页渲染断言（App SSR 渲染 LevelMap）——检查现有断言是否需要同步

### Step 6: 回归验证
```bash
npm run typecheck
npm run validate
node scripts/browser-test.mjs
node scripts/page-scan.mjs
node scripts/full-flow-test.mjs
npm run build
```
- 截图目检：桌面/移动端首页地图、节点/路径/状态视觉
- 首屏 chunk 检查：主 chunk 不含 moxie.json 数据

### Step 7: 部署
- commit + push GitHub
- `vercel --prod --yes`
- 生产验证：首页=地图、/map 重定向、无"学习/默写"

## 验证命令速查
- 基线/回归：`npm run typecheck && npm run validate`
- 快速回归：`node scripts/browser-test.mjs`
- 全路由扫描：`node scripts/page-scan.mjs`
- 满强度流：`node scripts/full-flow-test.mjs`
- 构建：`npm run build`

## 回滚点
- Step 1/2 前后：截图目检地图渲染；Step 5 前跑 browser-test 确认功能未破
- 全部完成后一次 git commit；线上异常 git revert 即回滚（无迁移）
