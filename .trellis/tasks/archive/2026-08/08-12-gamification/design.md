# 游戏化改造 · 技术设计

## 1. 架构总览

```
┌─ 游戏状态层 (src/features/game/)
│   store.tsx      GameProvider + useGame (Context 单例, 复用 errorbook globalThis 模式)
│   xp.ts          等级曲线 / 称号 / XP 计算
│   achievements.ts 成就定义 + 检测
│   game.css       古风奇幻视觉 + 游戏特效动画
│   LevelMap.tsx   闯关地图页面 (懒加载路由)
│   Achievements.tsx 成就墙页面 (懒加载路由)
│   HeroStats.tsx  首页英雄区组件
│   ComboFx.tsx    连击/得分特效组件 (飘字/火焰/星光)
├─ 接入点
│   App.tsx        挂 GameProvider + 新路由 /map /achievements
│   TabBar.tsx     新增"闯关"tab
│   MoxieArticle.tsx handleJudged 接入 XP/连击
│   Home.tsx       英雄区
└─ 令牌 (src/shared/styles/tokens.ts)
    gamification 主题变量: --gx-bg / --gx-gold / --gx-star / ...
```

## 2. 数据模型 (localStorage `wyw_game_v1`)

```ts
interface GameState {
  xp: number;              // 累计 XP
  combo: number;           // 当前连击
  bestCombo: number;       // 历史最高连击
  todayXp: number;         // 今日 XP
  todayDate: string;       // YYYY-MM-DD
  streak: number;          // 连续学习天数 (与 wyw_streak_v1 同步)
  levels: Record<string, { stars: number; bestCombo: number; total: number; passed: number }>;
  achievements: string[];  // 已解锁成就 id
  sound: boolean;          // 音效开关
  fxSeen: Record<string, number>; // 特效去重
}
```

持久化：每次变更 `saveLS('wyw_game_v1', state)`。Context 跨 HMR 单例（globalThis 模式，与 errorbook 相同）。

## 3. XP 与等级

```
XP 规则:
  答对: +10, 全对(该题所有空): +5, 答错: +2
  连击加成: combo≥3 ×1.2, ≥5 ×1.5, ≥8 ×2.0 (Math.round)
升级曲线: levelFromXp(xp) — 累进: 每级需要 80 + 40*(n-1), 即 L1→L2:80, L2→L3:120, L3→L4:160...
称号: ['学童','蒙童','秀才','举人','贡士','进士','探花','榜眼','状元','文曲星']
```

## 4. 连击与特效

- handleJudged(qid, pass) → game.addResult(pass)
- addResult: pass? combo+1 : combo=0；计算 xpGain（含加成）
- 特效组件读取 recent 事件队列（store 内 event buffer, 组件消费后清除）
- 特效层级: 飘字(得分) / 火焰(连击≥3) / 金flash(升级) / 星光(连击≥8) / 成就横幅
- 全部 CSS animation，无第三方依赖

## 5. 闯关地图

- 数据: 懒加载 moxieArticles（129 篇, 555KB chunk 不走首屏）
- 按 grade 分组: 七年级/八年级/九年级（GRADE_ORDER）
- 解锁链: 同年级内顺序解锁（前一篇 stars>0 或 passed>0 解锁下一篇）；跨年级需当前年级全通
- 星级: stars = 3 (全部题 passed) / 2 (≥80% correct) / 1 (≥60%)
  - 注意: 以"已作答题的正确率"计, 未作答不算错误
- 节点: 圆形关卡徽章, SVG 路径连接, 山峦剪影背景 (CSS/SVG)

## 6. 成就系统

- 定义在 achievements.ts: { id, name, desc, icon, check(state): boolean, hidden? }
- 每次 state 变更后 runCheck() 检测 → 新解锁 push + event
- 成就墙: 网格卡片, 已解锁金色发光, 未解锁灰 + 条件
- 隐藏成就(满腹经纶): 未解锁显示 ??? 

## 7. 路由与懒加载

```
/map          → LevelMap (lazy)
/achievements → Achievements (lazy)
/moxie        → MoxieHome 保留(或重定向到 /map?) — 设计: /map 替代默写入口, /moxie 保留兼容
```

TabBar: 学习 / 闯关 / 成就（3 tab）或 学习 / 闯关(默写地图) 2 tab + 成就从地图进入。

## 8. 兼容性风险

| 风险 | 规避 |
|---|---|
| 首屏拉入 555KB moxie | LevelMap 懒加载路由, 首页不 import moxie 数据 |
| 测试回归 | browser/page-scan/full-flow 路由清单须同步 (TabBar 变更 + 新路由) |
| 判分逻辑被破坏 | 游戏化只加回调, 不改判分算法; handleJudged 保持原逻辑 + 追加 game.addResult |
| localStorage 溢出 | 单 key 小对象, 上限控制 (levels 最多 129 条目) |
| 视觉冲突 | 游戏化样式独立 game.css + 新令牌命名空间 --gx-*, 不覆盖现有组件样式 |
| 音频自动播放限制 | 音效仅在用户交互后触发 (判分点击), 默认关闭可开关 |

## 9. 分批实施

- 批1: Game Store + XP/等级 + 接入 handleJudged (核心数据层)
- 批2: 古风奇幻 tokens + 暗色星空背景 + HeroStats 首页英雄区
- 批3: 闯关地图页面 (LevelMap + 解锁 + 星级)
- 批4: 连击/得分特效 (ComboFx) + 判分动画
- 批5: 成就系统 + 成就墙 + 隐藏成就
- 批6: TabBar/路由整合 + 全量回归 + 部署
