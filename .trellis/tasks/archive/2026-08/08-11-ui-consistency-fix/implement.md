# Implement: UI 一致性修复 (8 类视觉建议)

## 执行清单（有序）

- [x] 1. **global.css**: 恢复 `.ac-badge-must` / `.ac-badge-core` 背景色（删除"死代码"注释），与首页徽章配色统一
- [x] 2. **global.css**: `.page-header-back a` 按钮化（inline-flex + hover 反馈 + 点击热区）
- [x] 3. **global.css**: `.page-header-meta` 颜色 ink-light→ink-2、字号 0.86→0.88rem
- [x] 4. **global.css**: `.app-header-info` 字号 0.7→0.76rem、颜色→ink-2
- [x] 5. **article-page.css**: `.workspace-tabs a.active` 加 primary-soft 背景 + font-weight 700 + 顶部圆角
- [x] 6. **home.css**: `.grade-tab.active` 阴影弱化（red-25 → red-10）
- [x] 7. **article-page.css**: 新增 `.meta-sep` 分隔符样式
- [x] 8. **ArticlePage.tsx**: meta 改 JSX 分隔渲染
- [x] 9. 验证: typecheck
- [x] 10. 验证: page-scan (85) / browser-test (67) / full-flow (44)
- [x] 11. 验证: validate-data (段11 gate: 无硬编码 hex)
- [x] 12. 视觉回归复查: 重新截图 3 个代表页（首页/篇目页/默写页 desktop+mobile），确认问题消除

## 验证命令

```bash
npm run typecheck
node scripts/page-scan.mjs            # 85 项
node scripts/browser-test.mjs         # 67 项
node scripts/full-flow-test.mjs       # 44 项
npm run validate                      # 数据 + CSS 颜色 gate
```

## 回归截图命令

```bash
node scripts/vision/batch-shots.mjs   # 全路由双视口
# 对首页/篇目页/默写页 3 组截图调用 vision_chat 复查
```

## 回滚点

- 每步独立小改动；如某步破坏布局，`git checkout -- <file>` 单文件回滚。
- 提交前全部测试绿；提交后 `git revert` 可整体回滚。

## 审查门

- review: trellis-check 跑 spec compliance + 跨层数据流（无数据流改动，主要是样式）。
- 提交信息遵循项目惯例（中文描述 + 测试计数）。
