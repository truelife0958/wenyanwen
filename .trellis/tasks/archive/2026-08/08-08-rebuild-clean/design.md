# 设计：推倒重做应用层

## 原则

1. 就地重写 UI/路由/页面，保留 feature 架构骨架与全部共享资产（data/ hooks/ ui/ lib/ tokens）
2. 数据管道不动；综合题归属在 build 阶段完成（不改 raw）
3. 每阶段可运行可验证（typecheck + 测试）

## 数据调整（build 阶段）

综合题集 111 题：71 题按《篇名》归属单篇（加 articleId）；40 题保留 collectionId（复习中心综合区展示）

## 路由（新）

```
/           首页 (hero + 3入口 + 搜索 + 篇目网格)
/articles/:id/:tab  学习页 (原文+内嵌浮层闭环)
/cards      字词卡 (翻卡/背诵/测验)
/review     复习中心 (单篇练习列表 + 综合题集 + 错题本)
/learning/:title /practice/:title  旧链接跳转
```

- 删除 /collections 独立页（CollectionsPage → ReviewPage 重构）
- 首页入口: 学习课文 / 综合字词 / 复习中心(含错题本)

## 复习中心（/review）

- 左栏：单篇练习列表（有题文章）+ 综合题集列表（16 组）+ 错题本区块（并入）
- 右栏：选中后页内做题（浮层/内嵌）

## 首页（简洁化）

- hero（统计）
- 搜索
- 3 入口卡（学习课文/综合字词/复习中心）
- 学习进度
- 篇目网格（年级 tab）

## 组件复用

- CollectionsPage 双栏结构 → ReviewPage（复用 split 布局 + SessionView）
- errbook 区块 → 迁入 /review 左栏
- 学习页内嵌浮层逻辑原样保留（练习✏/字词📋/背诵★/角标）

## 实施顺序

1. build 归属（71 题 articleId）
2. 路由 + ReviewPage（迁移 CollectionsPage → 加综合题集 + 错题本）
3. 首页 3 入口重构
4. 测试断言适配（/collections → /review）
5. 全量回归 + 视觉审查（VisionProbe）
