# 设计: 主页面 = 画布式闯关地图

## 1. 架构现状

```
/                   首页: HeroStats英雄区 + 今日历练 + 推荐卡 + 任务卡 + 搜索 + 全部篇目列表 (Home.tsx)
/map                闯关地图: 竖向列表式路径 (LevelMap.tsx, lazy)
/achievements       成就墙 (Achievements.tsx, lazy)
TabBar: 历练(/) / 闯关(/map) / 成就(/achievements)
```

- LevelMap 依赖：`moxieArticles`(data/moxie, 555KB lazy chunk) + `useGame`(关卡进度/解锁) + `starsFor`(xp)
- Home 依赖：`articleMeta`(轻量) + `useErrorBook` + `useGame` + `HeroStats` + `useStreak` + `examTags`
- 首屏红线：App/首页禁静态 import data/moxie（555KB），LevelMap 已是 lazy

## 2. 目标结构

```
/                   画布式闯关地图 (LevelMap 重做, lazy) ← 唯一主页
/map                → Navigate 到 / (兼容旧入口)
/achievements       成就墙 (不变)
TabBar: 地图(/) / 成就(/achievements)
```

- 删除：Home.tsx / home.css / HeroStats.tsx（无引用后）
- 保留：/moxie 列表(深链)、/moxie/errors、关卡页 /articles/:id/:tab、其他路由不变

## 3. 画布式地图实现

### 3.1 布局（S 形蛇形）

每个世界（年级）一个 `.gx-world` 卡片，内部 `.gx-canvas` 画布（相对定位）：

```
节点定位（百分比 + 像素）:
  x = (i % 2 === 0) ? 16% : 66%        // 左右交替 (S 形)
  y = 24 + i * GAP                      // GAP = 120px 纵向等距
  节点大小 NODE = 58px, 节点中心 = (x%, y + NODE/2)
```

### 3.2 金色蜿蜒路径（SVG）

- 画布内一张绝对定位 SVG：`viewBox="0 0 100 H"`（x 0-100 对应百分比，y 对应像素，H = 画布高）
- `preserveAspectRatio="none"` + path `vector-effect="non-scaling-stroke"`（保线宽）
- path 连接相邻节点中心：`M x1 y1c Q mx my x2 y2c`（二次贝塞尔，控制点 = 中点，形成 S 弧）
- 样式：金色渐变 stroke（通关段亮金、未达段暗金），`stroke-linecap="round"`，发光 filter（可选 feGaussianBlur 或双重 stroke）

### 3.3 节点

- 复用现有状态类：`.gx-node.done`(金)/`.playable`(翠绿跳动)/`.locked`(灰锁)，尺寸扩至 58px
- 节点内容：全局关卡编号；done 加星标（★ 按 starsFor 1-3）
- hover 放大（scale 1.12 + 光晕）
- 可玩节点：跳动光圈动画（现有 gx-pulse）
- 节点是 `<Link to={/articles/:id/moxie}>`（通关/可玩）或 `<span>`（锁定）

### 3.4 世界分组

```
.gx-world (卡片: 半透明深底 + 金边 + 圆角 + 星空装饰)
  ├ .gx-world-head: 世界标题(金色, 如"七年级") + 副题("通关本篇解锁下一篇") + 进度(x/y)
  └ .gx-canvas: SVG 路径 + 节点
```

- 世界间不画跨世界路径（每世界独立画布，标题分隔）

### 3.5 地图头部

```
.gx-map-head: "🗺️ 闯关地图" + 总进度 (x/142 已通关)
.gx-map-cta: "🏅 我的成就 →" (保留现有 gx-cta)
```

### 3.6 视觉增强（game.css 新增/调整）

- 星空背景：`.gx-sky` 已有暗色星空；补星点装饰（径向渐变 + 少量绝对定位小星点，CSS 生成）
- 世界卡片：半透明深色 + 金色边框 + 内阴影，与星空融合
- 路径发光：SVG 双重 stroke（粗暗金 + 细亮金）模拟发光
- 节点光晕：done/playable 加 box-shadow 光晕（现有已有）
- 响应式：节点百分比定位天然自适应；画布 max-width 760px 居中；移动端 GAP 保持 120px（纵向滚动）

## 4. 路由与 TabBar

### 4.1 App.tsx
```tsx
const LevelMap = lazy(() => import('./features/game/LevelMap'));
<Route path="/" element={<LevelMap />} />
<Route path="/map" element={<Navigate replace to="/" />} />
```
- 移除 `import Home` 及 Home 路由引用
- LevelMap 保持 lazy（首屏主 chunk 不含 moxie 数据）

### 4.2 TabBar.tsx
```tsx
const TABS = [
  { to: '/', label: '地图', icon: 'map' },
  { to: '/achievements', label: '成就', icon: 'trophy' },
];
// 激活: '/' + '/articles/*' 激活地图; '/achievements' 激活成就
```

## 5. 组件清理

- `Home.tsx`：删除（App 不再引用）
- `home.css`：仅 Home 使用 → 删除
- `HeroStats.tsx`：仅 Home 使用 → 删除
- 检查：grep 确认无其他引用（game.css 中 gx-hero 样式保留无害，不删）
- `wyw_last_article` 记录（ArticlePage）保留（虽首页不再展示，但无害）

## 6. 数据流（不变）

```
地图渲染: moxieArticles(142, 排除附录) + useGame.state.levels + isUnlocked
点击关卡 → /articles/:id/moxie (关卡页默诵 tab) → MoxieTrainer 做题
关卡进度/X/解锁逻辑全部不动
```

## 7. 权衡

| 方案 | 取舍 |
|---|---|
| S 形画布 + SVG 曲线 vs 保留列表式 | 手游观感强、视觉焕新；实现稍复杂但可控 |
| 每世界独立画布（无跨世界路径） | 简化世界间连线；世界标题做自然分隔 |
| /map 重定向 vs 双渲染 | 重定向保兼容、无重复代码 |
| 删除 Home/HeroStats vs 保留死代码 | 删除更干净；grep 确认无引用后安全 |
| 地图必然加载 555KB moxie 数据 | 产品需求决定（首页=地图）；lazy 保证主 chunk 干净，gzip ~160KB 可接受 |

## 8. 兼容性 / 回滚

- 旧链接：`/map` 重定向 `/`；`/moxie/:id` 重定向关卡页（已有）；`/learning/:title`（已有）
- 数据/进度：零改动，用户进度零丢失
- 回滚：git revert 即可
- 测试：三套测试首页断言全改，任何残留被回归拦住

## 9. 风险与对策

| 风险 | 对策 |
|---|---|
| SVG 路径与节点错位 | 统一坐标公式（x 百分比 + y 像素 + NODE/2 偏移），矢量保线宽 |
| 移动端溢出 | 百分比定位 + 画布自适应，page-scan 375px 扫描拦截 |
| 删除 Home 后残留引用 | grep 全量确认再删；typecheck 拦截 |
| 测试首页断言大量改动 | 集中重写首页 section，新增地图断言 |
| 首屏加载 555KB | lazy 分割，主 chunk 干净；gzip 160KB 可接受（产品必然） |
