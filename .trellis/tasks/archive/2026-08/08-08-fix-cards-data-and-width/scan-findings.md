# 字词卡数据排查+页面加宽+错题本入口+VLM深审 — 问题与修复 (2026-08)

## A. 字词卡数据乱 (核心)

根因: buildCards 993 张卡 — 同字超多卡("之"43/"以"33/"其"23) + 29 组同字同释义真重复(课文注释/实词多源交叉)。

修复 (src/features/cards/Flashcards.tsx buildCards):
- 同字同释义去重 (char|meaning 精确)
- 每字最多 8 卡 (虚词多义限流, 保留常用义项)
- 卡片 id 用原始 meaning 下标 → 去重后用户 SM-2 进度不丢
- 效果: 993 → 866 卡, 每字 ≤8

## B. 整体页面加宽到 80%

根因: .home max-width 800px / .collections-page 1120px / .article-workspace 1120px 限制在 app-main(80vw) 内。

修复: 三处 → 100% (继承父级 80vw)。实测 1280 视口: 1024px (原首页 800px)。

## C. 错题本入口误跳综合复习

根因: Home 错题本分类 → navigate('/collections') 无定位, 用户只见综合题集。

修复: → navigate('/collections?err=1'); CollectionsPage 读 err 参数 scrollIntoView 错题本区块 + 高亮动画(errbook-flash)。实测滚动 Y=201 定位成功。

## D. VLM 二轮审查发现并修复 (第二轮)

| 问题 | 修复 |
|---|---|
| 选项前缀重复 "A. A." (exam_gen 61 题 + 数据 1 题) | build options strip ^[A-D][.、．] 前缀 (两处: 主归一化 + exam_gen) |
| 页脚文字对比度低 | #999 → var(--muted) |
| "轻点卡片翻面"说明过浅 | fc-flip-tip 加深 |
| 复习中心左栏边缘未对齐 | split-nav 统一左缘 |
| 题集列表名与题数空白割裂 | space-between → flex-start+gap |
| 译文框内容偏上留白不均 | para-trans padding 10/14 |

## E. 验证

```
validate 0错 / check / browser-test 45/45 / full-flow 38/38 / page-scan 137/0 ✅
选项 A. A. 重复: 0 (实测无重复)
卡片: 993→866, 每字 ≤8
页面宽度: 首页 800→1024px (1280 视口 80%)
错题本入口: 定位+高亮生效
```
