# 全项目样式/逻辑/数据全面排查报告

日期: 2026-08-10 · 任务: 08-10-full-style-logic-data-audit

## R3 数据层(全部修复)

### 🔧 核心修复: mergeQuestions 同题去重 bug
- **根因**: zhentiIndex 只在遍历到真题记录时才注册,而 practice 先于 zhenti 处理,导致 practice 永远无法命中后注册的真题键 → **189 条 practice↔zhenti 内容重复**(一文一练与真题库同一题出现两遍)
- **修复**: 两遍法——先预注册全部记录的内容键(`c:stem:answer` 归一化),再按优先级合并(practice > zhenti > related > exam_point > handwritten)
- **效果**: 题目 2200 → 2026,内容重复 189 → 0(仅剩 4 条答案差评分后缀的轻微变体 + 14 条 exam_gen 模板题干误报)
- 顺带消解 practice↔related 重复 173 条

### 数据校验结果(validate-data.mjs 全绿)
- 文章 126 条: 无重复 id、无缺字段、无 OCR 残留、原文译文段落对齐 ✓
- 题目 2026 条: 无重复 id、choice 答案全部 A-D 合法、无悬空 articleId ✓
- 字词 2192 条: 无重复、无空值 ✓
- 已知遗留(记录): zhenti 2 条缺选项(823/860, raw 数据 OCR 级缺失)、3 个空题集(唐诗三首/《诗经》二首/短文两篇, 前端已兜底)

## R1 样式层(修复 13 项)

| # | 问题 | 修复 |
|---|---|---|
| 1 | 未选中年级 tab/chip 对比度不足 | color → var(--ink-2) #4d4539 |
| 2 | 中考必考/核心重点徽章样式不统一(浅黄底黑字 vs 红底白字) | 统一实心胶囊: must=红底白字, core=accent-brown 底白字 |
| 3 | 搜索框 placeholder #bbb 过浅 | → #a39a88 |
| 4 | 卡片作者/朝代文字 #a89880 过浅 | → #8a7a66 |
| 5 | 今日任务"✓"浅绿对浅绿背景 | done 态 → 深绿 #2e7d4f + 深绿底 #edf7f1 |
| 6 | 进度环底环过浅 | → #d9cdb8, ring-text 字号 0.85→1rem 加粗居中 |
| 7 | 背诵原文按钮图标未垂直居中 | .recite-btn 加 inline-flex + align-items:center |
| 8 | 复习页段落间距过小 | .para-list gap 12→16px |
| 9 | 字词卡"高频"标签被覆盖为浅黄底 | 删除覆盖,恢复实心 primary 底白字 |
| 10 | 字词卡实词/虚词标签双色混乱 | 统一为描边浅色样式 |
| 11 | 字词卡展开箭头过小过浅 | caret → bronze 0.95rem |
| 12 | 字词卡网格间距过小 | gap 10→12px |
| 13 | **底部导航选中态 bug(逻辑)** | 学习 tab `end:true` 导致子页面永不激活 → 改用 useLocation 判断 /articles 前缀 |

## R2 逻辑层
- 底部导航修复(见上 #13): 学习子页/字词/图谱三页实测选中态正确
- 其余逻辑项此前 full-manual-test 已 90/90 覆盖,本轮无新发现
- VLM 报告若干条经 playwright computed style 实测确认为误报(未选中 tab 实际 #4d4539 对比度 7:1、高频标签已实心白字等)

## 验证
- `npm run check` ✓ 0 错误 · SSR ✓
- `test:flow` 46/46 ✓ · `page-scan` 77/77 ✓ · `validate` 0 错误

## 遗留(P2,建议后续)
1. zhenti:823/860 选项缺失(raw OCR 级,前端按主观题处理)
2. 3 个空题集(数据完整性,不影响前端)
3. 4 条 practice↔zhenti 答案差评分后缀的变体(可接受)
4. 拼音注音对比度(VLM 报,实测正文色正常,待确认数据来源)
