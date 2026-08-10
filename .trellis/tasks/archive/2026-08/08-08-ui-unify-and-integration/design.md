# 设计：统一布局与模块整合

## 设计原则

1. **共享优先**：视觉原子（页面标题 / 卡片 / 按钮 / chip / 空状态）收敛为 global.css 共享类，页面私有样式只写差异
2. **变量唯一来源**：颜色/圆角/阴影一律走 global.css CSS 变量；清理 practice.css 等文件中的陈旧 fallback 值
3. **行为不改**：只改样式与入口组织，不改判分/存储/路由数据逻辑

## 视觉规范（统一目标）

| 原子 | 规范 | 说明 |
|---|---|---|
| 页面标题 | 共享 `.page-title`（约 1.35rem/700 印章红 + 左边框古铜金） | 替换各页 25.6/20.8/19.2/15.2px 自定义 |
| 区块标题 | 共享 `.section-title`（约 1.05rem/600） | collections split-title、fc-head 等 |
| 卡片 | 共享 `.card` 基类（白底 r10 米色边 轻阴影） | .rq-card 已是该语言；.article-card / .collection-row 对齐 |
| 按钮 | 已统一 `.btn` 系（primary/accent/ghost/sm） | 维持，补 hover 过渡一致 |
| chip | 共享 `.chip`（pill r999） | .cat-chip 已是 pill；.pf-chips .chip 对齐 |
| 空状态 | 共享 `.module-empty` | 已有，核对各页复用 |

## 实施分区

### WS1: global.css 共享原子
- 新增 `.page-title`（页面主标题，替换 workspace-head h2 / collection-session-head h2 / flashcard h3 / split-title）
- 新增 `.card` 基类样式；`.rq-card` 改为继承/对齐
- chip 圆角统一为 pill（r999）
- 各页面 css 清理：去掉重复定义、改引用共享类

### WS2: 页面私有样式收敛
- practice.css：清理陈旧 fallback（#2f6f4e / #f5f7fa / #e5e7eb → 全局变量），删除与 global 重复的 btn/卡片定义
- collections.css：从空壳改为承载 collections 专有样式（从 practice.css 迁移 .collections-page/.split-layout/.collection-row 等），practice.css 保留练习会话专有
- home.css / article.css / flashcard.css：标题与卡片类对齐规范

### WS3: 字词/复习整合精简
- ReviewTab：题卡交互精简 —— 「查看答案」切换保留；「标记错题」改为在查看答案后同卡内联显示（或图标按钮），每卡可见按钮 ≤2
- 错题入口去重：ReviewTab 顶部保留「错题本」链接（路径直达），Home 分类「错题本」保留（首页定位需要），检查 CollectionsPage 内是否多余
- Home「复习中心 ›」横幅链接检查：若与导航「复习」重复则改文案或移除
- Flashcards：5 按钮保留（各有功能），仅视觉对齐

### WS4: 全页面扫描脚本 scripts/page-scan.mjs
- 路由清单（含全部 16 个综合题集 + 字词卡 + 全部篇目学习/练习/复习各抽 3 篇 + 移动端关键页）
- 每页断言：无 JS 错误 / 无横向溢出 / 主内容非空 / 标题存在 / 共享类生效
- 输出问题清单（页面 × 检查项），0 错误为目标
- 移动端：375px 宽遍历关键页

### WS5: 文档
- 扫描问题清单落盘 `.trellis/tasks/08-08-ui-unify-and-integration/scan-findings.md`
- PROJECT_STRUCTURE.md 若涉及页面结构调整同步

## 验证

- `npm run check`（data:build + validate + typecheck + build + SSR）
- `node scripts/browser-test.mjs`（更新断言：共享类生效、ReviewTab 按钮数 ≤2/卡）
- `node scripts/page-scan.mjs`（0 JS 错误 / 0 溢出 / 标题与共享类检查通过）
- 移动端 375px 遍历无溢出

## 风险

- 过度统一破坏既有良好细节 → 共享类只收敛视觉原子，页面布局结构不动
- ReviewTab 精简误删功能 → 只合并可见按钮，保留全部动作
- page-scan 覆盖面过大耗时 → 分桌面/移动两轮，每轮超时保护
