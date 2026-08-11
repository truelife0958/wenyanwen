# 全项目优化精简整合 — 技术设计

## 1. 现状与边界

### 1.1 功能全景(当前真实结构)

```
App
├── 首页 /            — 今日学习(问候+进度环) / 今日推荐 / 今日任务 / 搜索 / 快捷入口(错题本) / 全部篇目(年级tab+卡片)
├── 篇目工作区 /articles/:id/:tab — 学习 / 鉴赏 / 考点 / 注释 / 默写 (5 tab)
├── 默写模块 /moxie  — 统计头 / 年级tab / 篇目网格
├── 默写练习 /moxie/:id — 题型tab(原文/理解/词义/译文) / 自动判分 / 自评 / 错题入库
├── 默写错题本 /moxie/errors — 分组 / 重练 / 移除
└── 旧路由: /learning/:title → 学习页; /errors → /moxie/errors; * → /
```

### 1.2 已移除但文档/测试仍引用的旧功能

练习(practice)、字词卡(cards)、考点图谱(map)、真题页、CollectionsPage、Flashcards —— 数据仍存在于 runtime/questions.json(origin: practice/zhenti),但页面已不消费。**结论:数据保留(管线产物,校验依赖),页面/文档/测试引用必须更新。**

## 2. 设计决策

### D1 首页入口区整合(对应 R1.1)

现状三块重叠:
1. `today-recommend`(今日推荐:错题回炉 or 继续学习)
2. `today-tasks`(今日任务:默写进度 / 错题 / 开始默写)
3. `home-entry-grid`(快捷入口:默写错题本卡)

整合方案:合并为**两块**:
- **今日推荐卡**(保留,唯一主入口):错题>0 显示错题回炉,否则继续学习。
- **今日任务行**(保留,但去掉与推荐卡重复的"错题"项,保留 默写进度 / 开始默写 两项,错题数字并入推荐卡副文案)。
- 删除 `home-entry-grid` 错题本入口卡(其信息已由推荐卡+任务行覆盖)。

数据流不变;删除对应 CSS(.home-entry-grid / .entry-card 相关),保留 .entry-* 若他处使用。

### D2 死代码清理(对应 R1.2)

- ArticleReader:`compact` prop 固定传 true,删除 `!compact` 分支(article-head 块 + article-title/meta 样式),组件简化为纯 compact 形态。删除 prop 定义,调用点同步。
- TagChip.tsx:全项目无引用(`rg` 验证),删除文件。
- 删除前用 `npm run typecheck` 确认无类型引用;`rg` 确认无字符串引用。

### D3 过时产物更新(对应 R1.3)

- **browser-test.mjs**:基于当前 UI 重写。断言目标:
  - 首页:标题 / 统计 / 今日推荐 / 今日任务(2项) / 搜索过滤(篇名+作者) / 年级tab / 篇目卡含必考徽章 / 无旧路由残留。
  - 篇目页:5 个 tab 标签(学习/鉴赏/考点/注释/默写) / 原文渲染 / 注释点击弹层 / 译文展开 / 赏析展开 / 朗读按钮存在 / 背诵星标弹窗 / 默写入口卡。
  - 默写页:统计 / 年级tab / 卡片 / 题型tab / 输入判分 / 错题入本。
  - 错题本:分组 / 移除。
  - 移动端 375px:首页/学习/默写 无横向溢出。
  - 保留:JS 错误监听(pageerror + console.error),0 错误断言。
- **page-scan.mjs**:路由清单改为 `['/', '/articles/jc-yueyanglouji/learn', '/articles/jc-yueyanglouji/appreciate', '/articles/jc-yueyanglouji/exam', '/articles/jc-yueyanglouji/notes', '/articles/jc-yueyanglouji/moxie', '/moxie', '/moxie/errors']`,移除 /cards /map /errors;样本篇目换成当前存在的 id。
- **README.md / PROJECT_STRUCTURE.md**:按 1.1 功能全景重写页面职责表、路由、测试说明。

### D4 布局修复(对应 R2)

修复清单(按 vision 报告 + CSS 定位):

| # | 问题 | 位置 | 方案 |
|---|---|---|---|
| L1 | 核心重点标签对比度不足 | home.css `.ac-badge`(core) | 加深文字色/加粗/深底浅字 |
| L2 | 中考必考/核心重点 标签+描边规则不一 | home.css `.article-card.exam-*` | 统一:必考=红描边+红标签,核心=金描边+金标签(深字) |
| L3 | 进度环孤立无上下文 | Home.tsx today-head | 环下加"默写进度"小字标签 |
| L4 | 今日推荐卡元素未垂直居中 | home.css .rec-card | flex align-items:center + 统一 gap |
| L5 | 错题本卡"0条错题"比例失衡 | home.css .entry-meta | 数字字号收敛 + 分割线加粗/移除 |
| L6 | 任务行基线不齐 | home.css .today-tasks | 统一 line-height + align-items:center |
| L7 | 搜索占位符对比度过低 | home.css .home-search-box input | placeholder 颜色加深 |
| L8 | 底部导航图标文字未居中/风格不一 | global.css .tab-bar | align-items:center;图标统一面性风格(Icon 组件补齐) |
| L9 | 篇目卡标签位置/间距不一 | home.css .article-card | 统一 padding + 标签绝对定位规范 |
| L10 | 标题前竖线多余 | article.css .page-title / .moxie-title | 移除或统一为装饰线(左对齐) |
| L11 | 朗读控件对比度低 | article.css .read-tools / .read-hint | 文字加深 |
| L12 | 查看译文/赏析间距小 | article.css .para-toggle | gap 加大 8px+ |
| L13 | ★ 星标垂直对齐 | article.css .recite-star | vertical-align 修正 |
| L14 | 高亮词背景不显 | article.css .annot-gloss / HighlightText | 背景色加深一档 |
| L15 | 年级tab选中数字对比度低 | moxie.css .grade-tab.active | 数字改白/浅色 |
| L16 | 篇目卡标题距顶过近 | moxie.css .article-card | padding-top 增加 |
| L17 | 学习/默写按钮样式不一 | article.css moxie-entry-card | 视觉层级统一(主按钮一致) |

验收:每项修复后 vision.mjs 复检对应页,报告不再出现同级问题。

### D5 测试策略(对应 R3)

- 基线:full-flow-test.mjs(44/44)是主回归;browser-test.mjs 重写后作为快速页级回归;page-scan 作为全路由扫描。
- 布局改动后必须重跑三者。
- 新增断言覆盖 R3.1 每项功能按钮(以现有 full-flow 为基础补全,不重复造轮子)。

### D6 性能核查(对应 R4)

- 首页同步数据:article-meta.json 44K(仅元数据,合理);articles/words/questions 走 lazy + idle 预加载 —— 保持。
- 包体积:4.6MB 运行时数据已按 advancedChunks 分包;moxie.json 仅默写路由触发(验证 moxie.ts 是否被首页 import —— 若 Home 引 moxie 统计则无法拆,记录结论)。
- 渲染热点:127 卡 useDeferredValue 防抖已有;核对 groupByGrade/排序 useMemo 依赖正确。
- 输出:核查结论写入 journal;仅在有明确收益时改动。

## 3. 兼容性与回滚

- 全部改动为纯前端;localStorage 键不动(wyw_* 保持)。
- 删除代码前 git 可回滚;每个子步骤独立提交,便于回退。
- 数据管线(raw→runtime)零改动;`npm run validate` 必须通过。

## 4. 风险

- 布局 CSS 改动可能影响 full-flow 的选择器断言 → 改后必跑测试,断言随真实 DOM 更新(仅当选择器语义变化)。
- 首页整合删除入口卡可能影响用户习惯 → 保留视觉等价入口(推荐卡+任务行已覆盖)。
- page-scan 假通过掩盖回归 → 重写路由清单后,新增"路由存在性"断言(非重定向)。
