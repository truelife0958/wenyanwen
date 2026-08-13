# 执行计划: 新中式·古风雅致全站视觉重构

## 前置检查
```bash
npm run typecheck && npm run validate   # 基线全绿
```

## 实施步骤

### Step 1: 游戏层色板（game.css --gx-*）
- 重定义 `:root` 的 `--gx-*` 全套为新中式色（见 design 2.1）
- 节点：`.playable` 青瓷柔光、`.done` 哑金柔光、`.locked` 墨灰
- 路径：`.gx-path-main/flow/glow` 哑金柔化
- 玩家旗帜、世界列卡片、导航按钮、成就墙配色同步
- 验证：typecheck + 地图截图目检（无荧光/霓虹）

### Step 2: 墨色页头 + 印章（global.css + App.tsx）
- `.app-header`：红色渐变 → 墨青深色渐变 + 金色细线 + 米白文字
- `App.tsx` header：加 CSS 印章 logo（朱砂方章"文"字）
- `.tab-bar`：active/hover 去红（墨青灰底 + 米金字 + 金线）
- 验证：首页/关卡页截图（无红块）

### Step 3: 关卡页配色（article.css）
- 篇目标题"中考必考/核心考点"标签：红底 → 金褐/哑金底
- 朗读按钮：红底 → 黛青/墨青底
- 五 tab 选中态：红 → 金褐/黛青
- 讲解入口 `.lec-start`、讲解模式 `.lec-*`：哑金 + 去蓝紫底
- 正文注音背景块柔化
- 验证：关卡页截图

### Step 4: 默诵页/其他（moxie.css 等）
- 默诵页进度环/判分卡/失误回炉配色：如有红/霓虹 → 黛青/哑金
- 验证：默诵页截图

### Step 5: 测试与验证
```bash
npm run typecheck
npm run validate    # 段11 hex gate
node scripts/browser-test.mjs   # 80 项
node scripts/page-scan.mjs      # 101 项
node scripts/full-flow-test.mjs # 48 项
npm run build
```
- 截图目检：地图/关卡页/讲解/默诵/成就/导航（无刺眼元素）
- 首屏 chunk 不含 moxie 数据

### Step 6: 部署
- commit + push GitHub
- `vercel --prod --yes`
- 生产验证：墨色页头/无红块/青瓷哑金节点/讲解模式

## 验证命令速查
- 基线/回归：`npm run typecheck && npm run validate`
- 快速回归：`node scripts/browser-test.mjs`
- 全路由扫描：`node scripts/page-scan.mjs`
- 满强度流：`node scripts/full-flow-test.mjs`
- 构建：`npm run build`

## 回滚点
- 每步结束跑 typecheck + 截图目检
- 全部完成后一次 git commit；线上异常 git revert 即回滚（纯 CSS/视觉）
