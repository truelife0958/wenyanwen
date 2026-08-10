# VLM 全站页面视觉审查 — 问题与修复清单 (2026-08)

> 工具: scripts/vision/audit-all.mjs (gemini-2.5-pro-1m)
> 桌面 9 页 + 移动 6 页 = 15 页全部审查成功

## A. 审查范围

桌面: 首页/字词卡/复习中心/篇目学习/练习/复习/古诗学习/题集详情/题集列表
移动: 首页/学习/练习/复习/题集/字词卡

## B. 已修复问题 (高优)

| 问题 | 页面 | 修复 |
|---|---|---|
| 学习进度条三数据无分隔 | 首页 | hs-item 加竖分隔线 |
| 词义测验按钮蓝色与色系冲突 | 字词卡 | btn-quiz → 古铜金渐变 |
| workspace-progress 青色边框低对比 | 学习页 | → 品牌金 pill |
| 复习页练习标签蓝色突兀 | 复习 | rq-badge → 品牌金 |
| 次要文字对比度低 | 全站 | muted #9b917f → #857b63 |
| 长篇目标题拥挤 | 首页 | 卡片 padding+overflow |
| 作答输入框黑实线突兀 | 练习 | q-input 纸色描边+focus ring |
| 篇目标题重复 | 练习 | content-head 副标题化 |
| 题集头部间距不足 | 题集 | page-header 加垂直间距 |

## C. 记录待优化 (中低优)

- 字词卡四按钮视觉范式不统一 (保留语义差异, 视觉已统一 pill)
- "开始复习(0)" 按钮权重高 (disabled 态已弱化 opacity)
- 年级 tab 九年级截断无滚动提示
- "中考必考"标签位置归属感弱
- 复习页 tabs 下划线 vs chips 色块 (交互范式差异, 语义一致)

## D. 工具改进

- DEFAULT_PROVIDER → bohe/gemini-2.5-pro-1m (elysiver 不收图, 已验证)
- audit-all.mjs --limit 解析 bug 修复 (NaN 导致 0 页)

## E. 验证

```
npm run check / browser-test 45/45 / page-scan 137/0 ✅
桌面 9 页 + 移动 6 页 VLM 审查 0 失败
```

## F. 报告产物

- vision-shots/audit-master-report.md (桌面 15 页全量审查报告)
- vision-shots/audit/*.png + report.md
