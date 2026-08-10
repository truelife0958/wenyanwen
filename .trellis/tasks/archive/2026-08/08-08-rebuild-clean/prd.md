# 推倒重做应用层 — 保留优点

## 背景与决策

用户要求整个项目推倒重做、保留优点。已确认：
- **范围**：应用层全新重写；保留数据管道（raw→runtime 126 篇）、设计令牌（tokens.ts）、测试脚本、VisionProbe
- **UI 方向**：简洁纸墨风（印章红+古铜金+米纸底，更简洁克制）
- **功能调整**：保留全部功能模块；**错题本并入复习中心**（不占首页独立入口）；**砍综合题集独立页**（111 题按篇目并入单篇练习）；不加新功能

## 保留的"优点"（资产清单）

| 资产 | 位置 | 保留方式 |
|---|---|---|
| 数据管道 raw→runtime | scripts/build-runtime-data.mjs + data/ | 原样保留 |
| 数据校验 | scripts/validate-data.mjs | 原样 |
| 设计令牌 | src/shared/styles/tokens.ts | 原样 |
| 共享组件 | Icon/PageHeader/EmptyState/TagChip/StemView | 保留并复用 |
| 数据 hooks | shared/hooks/useData.ts | 保留 |
| TTS + 注音字典 | shared/lib/tts.ts + pron-dict.ts | 保留（含率/说等多音字修复） |
| 背诵/练习/字词内嵌浮层 | learning 内联逻辑 | 保留并整合 |
| 测试体系 | check/test:flow/browser-test/page-scan | 保留，适配新结构 |
| VisionProbe | scripts/vision/ | 保留 |

## 功能架构（重做后）

```
首页（简洁）:
  hero（统计）→ 搜索 → 入口卡:
    📖 学习课文（滚动到篇目网格）
    🃏 综合字词（/cards）
    🗂️ 复习中心（/review：单篇练习 + 错题本并入）
  → 学习进度 → 篇目网格（年级 tab）

学习页: 原文 + 内嵌浮层闭环（练习✏/字词📋/背诵★ + 段落角标 题N/★背）
字词卡: 翻卡 + SM-2 + 背诵原文模式 + 词义测验
复习中心: 综合练习列表 + 错题本区块（合并）
```

## 关键改动

1. **路由精简**：删除 /collections 独立页；新增 /review（复习中心=练习+错题本）；首页入口重构
2. **综合题集 111 题并入单篇**：build 阶段按题目 stem 中的《篇名》归属 → articleId；无归属的保留为"综合练习"（挂复习中心）
3. **错题本并入复习中心**：/collections 的 errbook 区块 → 迁移到 /review；首页错题本入口指向 /review 错题区
4. **UI 简洁化**：首页 2 大入口 + 复习中心入口（3 卡）；删除冗余区块；排版更克制

## 验收

1. 6 模块全部可用（学习/练习/字词卡/复习/错题/背诵）
2. 综合题集题目在单篇练习中可见（至少按篇名归属的题）
3. 无 /collections 独立页（路由移除）
4. 错题本在复习中心内（入口 + 区块）
5. check / test:flow / browser-test / page-scan 全绿
6. 代码量较重构前显著精简（目标 -20%）

## 风险

- 综合题归属不准（部分题无法按篇名归属）→ 归入复习中心综合区
- 测试断言需适配新路由/入口
- 无 git：阶段备份（tar src）
