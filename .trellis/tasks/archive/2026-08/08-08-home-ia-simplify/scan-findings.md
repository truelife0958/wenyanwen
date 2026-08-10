# 首页信息架构重构 — 去冗余 (2026-08)

## A. 冗余清理

| 项 | 现状 → 重构 |
|---|---|
| cat-nav chips (5个) | 删除 (入口由大卡承担) |
| activeCat 分类切换 | 删除 (无分类切换) |
| entry 大卡 | 仅非all显示 → 始终显示 (唯一入口层, 4卡 4列) |
| 篇目网格 | 仅all显示 → 始终显示 (加 "全部篇目 · N 篇" 标题) |
| 学习课文入口 | → 滚动到篇目网格 (smooth) |

首页新结构: hero → 搜索 → 4入口大卡 → 学习进度 → 继续学习 → 篇目网格。同一功能只有唯一入口。

## B. 隐藏 BUG: 全站圆角塌陷 (重大)

根因: tokens.ts 重构时 CSS 大量 var(--radius)/var(--radius-lg) 变量消失(令牌只有 r-sm/r-md/r-lg), 且 radius 数字无单位(12 → border-radius: 12 无效) → 全站 border-radius 塌陷 0px。

修复: tokens.ts 补 'radius': '12px' / 'radius-lg': '16px' 兼容变量 + r-*/sp-* 全部带单位。圆角恢复 12/16px。

影响: 此前视觉"丑"的部分感知可能源于此 (圆角全平)。

## C. 样式去重

- home.css 3 个 .entry-card 定义 (旧3列/4卡/字体) → 合并为 1 个权威定义
- 旧 .home-entry 容器样式删除 (home-entry-grid 取代)
- media query 引用更新

## D. 验证

```
browser-test 45/45 (断言适配 entry-card) / full-flow 39/39 (含入口卡4张) / page-scan 137/0 / check 全过
圆角: entry-card 0px → 12px (全站恢复)
```
