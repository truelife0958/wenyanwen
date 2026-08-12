# 游戏化改造 · 实施计划

## 批1: Game Store 核心 (数据层)
- [ ] src/features/game/xp.ts: 等级曲线 + 称号 + XP 计算
- [ ] src/features/game/store.tsx: GameProvider + useGame (Context 单例, localStorage wyw_game_v1)
- [ ] MoxieArticle.tsx handleJudged 接入 game.addResult(pass, allPass)
- [ ] 验证: localStorage 持久化 + 刷新不丢

## 批2: 古风奇幻视觉 + 首页英雄区
- [ ] tokens.ts 新增 --gx-* 令牌 (星空背景/金色/发光)
- [ ] game.css: 暗色星空+水墨山峦背景, 通用游戏化样式
- [ ] HeroStats.tsx: 等级徽章/经验条/数据行
- [ ] Home.tsx 集成 HeroStats

## 批3: 闯关地图
- [ ] LevelMap.tsx: 年级世界 + 关卡路径 + 解锁链 + 星级
- [ ] 懒加载路由 /map
- [ ] 验证: 129 篇关卡正确渲染/解锁

## 批4: 连击/得分特效
- [ ] ComboFx.tsx: 飘字/火焰/金flash/星光
- [ ] MoxieArticle 判分区集成特效
- [ ] 升级横幅

## 批5: 成就系统
- [ ] achievements.ts: 14 个成就定义 + 检测
- [ ] Achievements.tsx 成就墙 + 隐藏成就
- [ ] 达成横幅 + 音效(可选)

## 批6: 整合 + 回归 + 部署
- [ ] TabBar 新增"闯关"tab + 成就入口
- [ ] App.tsx 挂 Provider + 新路由
- [ ] 同步更新 browser/page-scan/full-flow 测试 (路由清单)
- [ ] npm run check 全绿 + 三套回归
- [ ] 部署 Vercel + 线上验证
