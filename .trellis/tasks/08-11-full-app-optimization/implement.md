# 全项目优化精简整合 — 执行计划

## 前置

- [ ] dev server 运行中(`npm run dev`,端口 8765)
- [ ] 基线:full-flow-test.mjs 44/44 全绿(已验证 ✓)

## Phase A: 测试基线固化(R3 先行)

- [ ] A1. 重写 `scripts/browser-test.mjs` 匹配当前 UI(5 tab / 无旧路由 / 当前统计文案 / 首页 1 入口卡)
- [ ] A2. 更新 `scripts/page-scan.mjs` 路由清单(移除 /cards /map /errors;补 /articles/*/appreciate|exam|notes|moxie;样本篇目用现存 id)
- [ ] A3. 验证:node scripts/browser-test.mjs + page-scan.mjs + full-flow-test.mjs 三绿

## Phase B: 功能精简整合(R1)

- [ ] B1. 首页入口区整合:删除 `home-entry-grid` 快捷入口卡,今日任务去掉重复"错题"项(错题并入推荐卡),清理对应 CSS
- [ ] B2. 死代码:ArticleReader 删 `!compact` 分支(article-head)与 compact prop;删 TagChip.tsx
- [ ] B3. `rg` 验证无残留引用 + typecheck
- [ ] B4. 更新 README.md / PROJECT_STRUCTURE.md 至真实功能结构
- [ ] B5. 验证:typecheck + full-flow 全绿(测试断言如涉及已删元素同步更新)

## Phase C: 布局简洁优化(R2)

- [ ] C1. home.css + Home.tsx:对比度(L1/L7)、对齐(L3/L4/L5/L6)、风格统一(L2/L9)
- [ ] C2. global.css:底部导航居中与图标风格(L8)
- [ ] C3. article.css + article-page.css:朗读控件对比度(L11)、标题竖线(L10)、译文/赏析间距(L12)、星标对齐(L13)、高亮词背景(L14)、按钮层级(L17)
- [ ] C4. moxie.css:年级tab选中数字(L15)、卡片内边距(L16)
- [ ] C5. 验证:vision.mjs 复检 首页/学习页/默写页 无高严重度问题;full-flow + browser-test 全绿;移动端无溢出

## Phase D: 性能与加载核查(R4)

- [ ] D1. 检查 moxie.ts 是否被首页同步引入(决定 moxie.json 能否按需拆分),记录结论
- [ ] D2. 核查首屏加载链路与分包产物(build 后 dist 体积),记录结论
- [ ] D3. 交互性能抽查(搜索/年级切换渲染),有明确收益才改

## Phase E: 最终验收(2.2 + 3.3 + 3.4)

- [ ] E1. `npm run check` 全绿(data:build + validate + typecheck + vite build + SSR)
- [ ] E2. 三套浏览器测试全绿(browser-test / page-scan / full-flow)
- [ ] E3. 对照 prd.md 验收标准逐项核对 AC1-AC6
- [ ] E4. 更新 .trellis/spec 相关条目(如需)
- [ ] E5. git 提交(分步:测试→精简→布局→文档),提交信息遵循项目风格

## 验证命令速查

```bash
node scripts/browser-test.mjs   # 快速页级回归(重写后)
node scripts/page-scan.mjs      # 全路由扫描
node scripts/full-flow-test.mjs # 满强度用户流
npm run typecheck
npm run check
node scripts/vision/vision.mjs http://localhost:8765/ --all  # 视觉复检
```
