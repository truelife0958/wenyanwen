# 极致打磨清单 (08-11-polish-99)

## P1 可访问性
| 项 | 现状 | 修复 | 验证 |
|---|---|---|---|
| :focus-visible 焦点环 | article/article-page 无键盘焦点样式 | global.css 统一焦点环(2px accent 描边)+ 输入框专属下划线高亮 | 键盘 Tab 实测 |
| ErrorBoundary 按钮 | 无 type | type="button" | typecheck |
| 输入框 Enter 跳空 | 无 | onKeyDown + isComposing 检查 → 下一空聚焦;最后一空自动判分 | playwright: Enter→第2空聚焦;最后一空→判分 ✓ |
| 判分滚动到结果 | 无 | checked effect scrollIntoView smooth nearest | 实测结果区可见 ✓ |
| 重新作答聚焦 | 无 | retry 后 rAF 聚焦第一空 | 实测聚焦第1空 ✓ |

## P2 交互
| 项 | 修复 |
|---|---|
| placeholder "填写" 冗余 | 移除(横线下划线本身即提示) |
| "对答案"按钮/提示间距与对比度 | gap md + 提示色 ink-light |

## P3 视觉 (gemini 双视口复审 6 页 + 复审 3 页)
| 问题 | 修复 |
|---|---|
| 【真bug】/moxie/:id 页底部"默写"tab 不高亮 | NavLink end 仅用于 /, /moxie 用 startsWith 匹配 ✓ 实测 active |
| 年级 tab 数字(未选中)对比度 | .gt-count 加 color: var(--ink) |
| "查看译文"链接 bronze 对比度低 | 改 accent-brown + 600 字重 |
| 背诵星标(★)位置随意 | 段落右侧居中 → 右上角 |
| 朗读条移动端拥挤 | flex-wrap 换行(实测 355px 无溢出) |
| global.css 死代码 .ac-badge-must/core | 清理(Home 用 .exam-must .ac-badge) |
| app-main 桌面过宽(80vw) | min(1100px, 92vw) 居中 |

视觉模型误报(实测排除): tab 未选中对比度(实际 rgb(77,69,57) ≈ 7:1)、entry 卡偏左(单列全宽)、底部栏与题型 tab 重复(功能不同)。

## P4 性能
- dist 3.5M, 最大 chunk data-questions 1.28MB (gzip 375KB) — 数据 JSON 主导, 已代码分割 + 空闲预加载, 记录不拆分。
- 字体: 系统字体栈 (Noto Serif SC/Songti SC/SimSun), 无外链加载。

## P5 鲁棒性
- localStorage 读写均 try/catch + warn (utils.ts) — 确认不崩溃。
- 空数据: MoxieArticle 无 section → EmptyState; 无空答案题兜底。

## P6 移动端
- 点击目标: tab ≥ 40px、输入框自适应宽度 — 记录达标。
- 键盘弹起: 无固定 100vh 布局, 输入框 min-height 正常 — 记录。

## 验证
- npm run check: 0 错误 (validate 段 11/12/13 全绿)
- npm run test:flow: 42/42
- 键盘交互实测: Enter 跳空 / 自动判分 / 结果滚动 / 重答聚焦
