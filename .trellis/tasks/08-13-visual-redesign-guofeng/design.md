# 设计: 新中式·古风雅致视觉系统

## 1. 现状诊断

| 问题 | 现状 | 根源 |
|---|---|---|
| 荧光绿刺眼 | `.gx-jade: #3dd6b0`、playable 节点 | game.css 霓虹色 + 硬发光 |
| 红块夹击 | app-header 红色渐变 + tab-item.active 红底 | tokens `--primary #c4453c` 滥用 |
| 金色生硬 | `--gx-gold #f5c542` 荧光金 | 饱和度过高 |
| 蓝紫霓虹 | `--gx-bg-deep #0b1026` | 深蓝紫底 |
| 字体混搭 | 标题衬线/正文无衬线 | 未统一字号层级 |
| 布局拥挤 | 间距不足 | 紧凑布局过度 |

## 2. 新中式色板（设计系统核心）

### 2.1 游戏层 `--gx-*`（game.css :root 重定义）
```css
:root {
  --gx-bg-deep: #13161e;      /* 墨青黑 (去蓝紫) */
  --gx-bg-mid: #1a1f29;
  --gx-gold: #c9a45c;         /* 哑金 (低饱和) */
  --gx-gold-bright: #e6d2a0;  /* 米金 */
  --gx-gold-dim: #8a7440;     /* 深金褐 */
  --gx-ink: #ece4d2;          /* 米白 */
  --gx-ink-dim: #9a9082;      /* 灰米 */
  --gx-jade: #4a8f84;         /* 黛青/青瓷 (取代荧光绿) */
  --gx-jade-bright: #79b5a9;
  --gx-cinnabar: #a8483e;     /* 朱砂 (印章点缀, 少量) */
  --gx-star: #e6d2a0;
  --gx-fire: #c96f45;         /* 暖褐 */
  --gx-ring: rgba(201, 164, 92, 0.16);
  --gx-mtn: #1c2230;
  --gx-mtn-light: #242c3c;
}
```

### 2.2 节点状态（柔光不刺眼）
- `.playable`（青瓷可玩）：`radial-gradient(#e8f5f1, #4a8f84 60%, #35655e)` + 柔光 `box-shadow: 0 0 18px rgba(74,143,132,0.35)` + 细呼吸（非霓虹）
- `.done`（哑金通关）：`radial-gradient(#f7ecd4, #c9a45c 60%, #8a7440)` + 柔光 `rgba(201,164,92,0.4)` + 金星
- `.locked`（墨灰锁定）：`#2a2f3a` 底 + 半透明锁 + 无光
- 发光统一：`box-shadow: 0 0 14px rgba(色, 0.3)`（宽 blur + 低透明度 = 羽化）

### 2.3 路径
- `gx-path-main`：哑金 `rgba(201,164,92,0.85)` 细线
- `gx-path-flow`：`rgba(230,210,160,0.55)` 流动（降透明度）
- `gx-path-glow`：`rgba(201,164,92,0.18)` 宽柔光

## 3. 墨色页头（app-header）

```css
.app-header {
  background: linear-gradient(165deg, #1b1f2a 0%, #141822 60%, #10141c 100%);
  color: var(--gx-ink);
  /* 无红色 */
}
.app-header::after { /* 金色细线 */ background: linear-gradient(90deg, transparent, rgba(201,164,92,0.55) 20%, rgba(201,164,92,0.55) 80%, transparent); }
```
- 印章 logo：`.app-header h1` 前加朱砂印章（CSS 方块 + "文"字 + 圆角 + 印章红底米白字）
- h1 文字米白、字距加大；info 米白半透明

## 4. TabBar

```css
.tab-item.active {
  background: #2a313d;          /* 墨青灰底 */
  color: var(--gx-gold-bright); /* 米金字 */
  box-shadow: inset 0 -2px 0 rgba(201,164,92,0.7); /* 底部金线 */
}
.tab-item:hover { color: var(--gx-gold-bright); background: rgba(201,164,92,0.1); }
```
- 无红色

## 5. 讲解模式/成就墙

- `.lec-overlay/.lec-box`：底 `#13161e→#1a1f29`（同 gx 色板，去蓝紫）
- `.lec-sentence.active`：高亮 `rgba(201,164,92,0.22)` + 金色左线（哑金）
- 成就墙 `.gx-ach-card`：哑金边框、unlocked 渐变 `rgba(201,164,92,0.14)`
- 成就未解锁图标：墨灰（保留）

## 6. 关卡页（article.css）

- 篇目标题标签"中考必考/核心考点"：红底 → 金褐底（`--accent-brown`/哑金渐变）+ 白字，或朱砂印章窄章
- 朗读按钮"▶ 朗读全文"：红底 → 黛青/墨青底
- 五 tab 选中态：红 → 金褐/黛青
- 正文注音背景块：柔化（降低不透明度/去块）
- 讲解入口 `.lec-start`：哑金描边 + 米金文字

## 7. 文件清单

| 文件 | 改动 |
|---|---|
| `src/features/game/game.css` | :root --gx-* 全量换色 + 节点/路径/旗帜/世界列/导航/成就 配色 |
| `src/shared/styles/global.css` | app-header 墨色 + 印章 + tab-bar 去红 |
| `src/App.tsx` | header 加印章 logo 元素 |
| `src/features/learning/article.css` | 关卡页标题标签/朗读/五tab/讲解入口 配色 |
| `src/features/moxie/moxie.css` | 默诵页进度/判分卡配色同步（如有红/霓虹） |
| `src/shared/styles/tokens.ts` | 如需新增令牌（印章色/墨色页头色） |

## 8. 风险与对策

| 风险 | 对策 |
|---|---|
| validate 段 11 hex gate | 新色全部走 tokens.ts 或 --gx-* 令牌（game.css 不在检查列表，但 article.css/global.css 必须令牌） |
| 改动面大破坏回归 | 只改 CSS 颜色/视觉，不动结构/类名/逻辑；测试全量重跑 |
| 发光羽化后可玩节点不明显 | 保留呼吸动画 + 顶部旗帜定位 + 高亮描边 |
| 印章 emoji 在 headless 显示 X | 印章用 CSS 绘制（方块+文字），不用 emoji |
