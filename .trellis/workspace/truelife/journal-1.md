# Journal - truelife (Part 1)

> AI development session journal
> Started: 2026-08-08

---



## Session 1: 全面体检:数据一致性与准确性排查

**Date**: 2026-08-08
**Task**: 全面体检:数据一致性与准确性排查

### Summary

修复 127 个校验错误+25 处英文残留+水印+86 条背诵句污染+61 篇 questionIds 重复+茅屋截断+错别字; 隐藏段落序号; 校验脚本新增 7 项防回归; browser-test 重写 40/40; npm run check 全通过

### Git Commits

(No commits - planning session)

### Testing

- [OK] npm run validate(0错误) / typecheck / check / browser-test 40/40

### Status

[OK] **Completed**

### Next Steps

- 无


## Session 2: 统一布局与模块整合:全页面体检

**Date**: 2026-08-08
**Task**: 统一布局与模块整合:全页面体检

### Summary

新增共享视觉原子(page-title/section-title/chip pill); 清理 practice.css 陈旧 fallback 与重复 .btn; collections.css 空壳重写; ReviewTab 标记错题精简; 错题本整合进 CollectionsPage 左栏(原 /errorbook 悬空); page-scan.mjs 全页面扫描 137 项 0 问题; browser-test 44/44; npm run check 全过

### Git Commits

(No commits - planning session)

### Testing

- [OK] npm run check / page-scan(137/0) / browser-test(44/44)

### Status

[OK] **Completed**

### Next Steps

- 无


## Session 3: 初三向UI动效重构+依赖激进升级

**Date**: 2026-08-08
**Task**: 初三向UI动效重构+依赖激进升级

### Summary

激进升级 React19.2/Vite8.2(rolldown)/RR7/@types19, npm audit 0漏洞; 适配 advancedChunks+lightningcss; 动效系统v2(stagger/按压/判分反馈/reduced-motion降级); Flashcards懒加载; 抽取共享组件 PageHeader/EmptyState/TagChip/QuestionCard; 补练习选项判分样式(原缺失); 首屏 index gzip 90→83KB

### Git Commits

(No commits - planning session)

### Testing

- [OK] check / page-scan 137/0 / browser-test 44/0 / reduced-motion 验证 / 产物 757.9→779.7KB

### Status

[OK] **Completed**

### Next Steps

- 无


## Session 4: 仓库地毯式清理+Bug排查+满强度测试

**Date**: 2026-08-08
**Task**: 仓库地毯式清理+Bug排查+满强度测试

### Summary

激进清理: 删 ocr(3.9M)/data(1.7M)/logs/test-results/oneoff-archive/调试脚本, 仓库-36%至9.6M; build.sh裁剪; 新增 full-flow-test.mjs 满强度用户流 38/38; 边界探针 7/7; 无应用级BUG(测试暴露均为脚本逻辑); README/PROJECT_STRUCTURE 重写

### Git Commits

(No commits - planning session)

### Testing

- [OK] npm run check / test:flow 38/38 / page-scan 137/0 / 边界7/7

### Status

[OK] **Completed**

### Next Steps

- 无


## Session 5: 去掉顶部导航,篇目中心为主页

**Date**: 2026-08-08
**Task**: 去掉顶部导航,篇目中心为主页

### Summary

移除 App 顶部 篇目/字词/复习 导航栏; 篇目中心为唯一主页; 字词/复习/错题经首页分类进入; Flashcards/CollectionsPage 左栏加 返回篇目中心 链接; 清理 global.css 导航死样式; 修复 Vite dev 缓存导致 App.tsx 模块解析问题(清 node_modules/.vite 重启); 全量回归通过

### Git Commits

(No commits - planning session)

### Testing

- [OK] browser-test 45/45 / full-flow 38/38 / page-scan 137/0 / check 全过

### Status

[OK] **Completed**

### Next Steps

- 无


## Session 6: 修复文章页无CSS与练习页useErrorBook报错

**Date**: 2026-08-08
**Task**: 修复文章页无CSS与练习页useErrorBook报错

### Summary

修复: 1) ArticleReader 未 import article.css(572行学习页样式从未加载)导致文章无CSS — 补 import; 2) useErrorBook 在无 Provider 时抛错导致练习页崩溃(HMR双实例/SSR) — 改为返回 no-op 空存储兜底, DEV 下 warn; 3) gloss-pop 不支持 Escape 关闭(键盘可达性) — 补 keydown 监听; 4) index.html 清理废弃 meta; 验证: 学习页样式/练习判分样式实测生效

### Git Commits

(No commits - planning session)

### Testing

- [OK] full-flow 38/38 / browser-test 45/45 / page-scan 137/0 / check 全过

### Status

[OK] **Completed**

### Next Steps

- 无


## Session 7: 全项目CSS问题修复

**Date**: 2026-08-08
**Task**: 全项目CSS问题修复

### Summary

修复: 补全 7 个使用但无定义的类样式(cat-name 分类名/judge-progress 自评进度/material-box+material-text 练习材料区/page-loader 加载器带旋转动画/qsj-btn+qsj-tip 自评按钮); 清理 App.tsx 重复引入 global.css(main.tsx 已有); 悬空类名扫描清零

### Git Commits

(No commits - planning session)

### Testing

- [OK] full-flow 38/38 / browser-test 45/45 / page-scan 137/0 / check 全过

### Status

[OK] **Completed**

### Next Steps

- 无


## Session 8: 清洗段落分析编号残留与标点

**Date**: 2026-08-08
**Task**: 清洗段落分析编号残留与标点

### Summary

用户反馈《狼》学习页段落分析残留【3】【4】编号与半角逗号。全库清洗 raw learning.json 段落分析: 36 处【N】段落编号删除(引用句转换为'这句/这两句'), 1043 个半角逗号/冒号/分号全角化(72 篇文章); 保留合法分析小标题(【首联】【炼字】【用典】等考点标签); 重建 runtime

### Git Commits

(No commits - planning session)

### Testing

- [OK] validate 0错 / full-flow 38/38 / browser-test 45/45 / page-scan 137/0 / check 全过

### Status

[OK] **Completed**

### Next Steps

- 无


## Session 9: 修复组合篇目书名号拆裂与原文标点

**Date**: 2026-08-08
**Task**: 修复组合篇目书名号拆裂与原文标点

### Summary

用户反馈《穿井得一人》《杞人忧天》原文开头残留》且标题书名号拆裂。根因: 1) findCompat 索引转换 bug(匹配串前有书名号/标点时 start 偏移, 标题行'》'漏入下一段) — 修正转换逻辑停在第 rawIndex 个归一化字符; 2) 组合条目寓言二则原文半角逗号+分析无 original — 重构原文按语义分段+补 original+全角化; 3) 全库 20 篇文章原文半角标点 204 个全角化。全库段落拼接 0 不一致

### Git Commits

(No commits - planning session)

### Testing

- [OK] validate 0错 / full-flow 38/38 / browser-test 45/45 / page-scan 137/0 / check 全过

### Status

[OK] **Completed**

### Next Steps

- 无


## Session 10: 修复寓言二则与子篇目重复

**Date**: 2026-08-08
**Task**: 修复寓言二则与子篇目重复

### Summary

用户反馈七上列表 寓言二则(组合)/穿井得一人/杞人忧天 重复。修复: learning.json 移除组合条目寓言二则(知识点与子篇高度重叠), 其 related_questions 2 题按内容迁入穿井/杞人; practice.json 寓言二则组(8题课外迁移)改挂穿井得一人; README 126 篇; browser-test 统计断言动态化。列表现仅 杞人忧天+穿井得一人 两个独立篇目

### Git Commits

(No commits - planning session)

### Testing

- [OK] validate 0错 / full-flow 38/38 / browser-test 45/45 / page-scan 137/0 / check 全过

### Status

[OK] **Completed**

### Next Steps

- 无


## Session 11: 修复潼关段落切分与诗歌换行显示

**Date**: 2026-08-08
**Task**: 修复潼关段落切分与诗歌换行显示

### Summary

用户反馈《潼关》学习页段落 2+1+1 不对称且句间空格。修复: 1) 潼关段落合并为 2 段(每段两句, 拟人+末句分析合并); 2) .para-orig 加 white-space: pre-line, 全库 57 个段内换行正常显示(诗歌两句一行); 验证段落与排版

### Git Commits

(No commits - planning session)

### Testing

- [OK] validate 0错 / full-flow 38/38 / browser-test 45/45 / page-scan 137/0 / check 全过

### Status

[OK] **Completed**

### Next Steps

- 无


## Session 12: 修复errorbook上下文跨实例失配

**Date**: 2026-08-08
**Task**: 修复errorbook上下文跨实例失配

### Summary

控制台刷屏 [errorbook] useErrorBook 在 Provider 外使用(每次渲染打印)。根因: Vite HMR 多实例 — errorbook.tsx 多次热更新后浏览器中旧模块实例的 Context 与 Provider 新实例不匹配。根治: 1) Context 单例挂 globalThis 跨模块实例共享; 2) warn 模块级去重(仅提示一次)。模拟双实例加载验证 warn 0 次

### Git Commits

(No commits - planning session)

### Testing

- [OK] full-flow 38/38 / browser-test 45/45 / page-scan 137/0 / check 全过 / 双实例模拟 0 warn

### Status

[OK] **Completed**

### Next Steps

- 无


## Session 13: 书卷纸墨精致化视觉大改造

**Date**: 2026-08-08
**Task**: 书卷纸墨精致化视觉大改造

### Summary

系统性视觉升级: 1) global.css 设计令牌重做(米纸底渐变背景/暖白卡片/墨色三阶文字/古铜金印章红层次/分层阴影/radius 12-16); 2) 顶部栏书法感(印章红渐变+金线+字距4px); 3) 新增 Icon.tsx 内联SVG图标集(book/cards/review/pencil/seal/search等12个)替代emoji; 4) 首页重设计: hero横幅(印章徽标+墨香习文+统计)+分类chips SVG化+4张分类大卡片+搜索SVG; 5) 卡片hover提升/学习页原文字距+译文金边/题集卡片hover/继续学习横幅渐变; 6) 测试断言适配 hero-title

### Git Commits

(No commits - planning session)

### Testing

- [OK] full-flow 38/38 / browser-test 45/45 / page-scan 137/0 / check 全过

### Status

[OK] **Completed**

### Next Steps

- 无


## Session 14: 从零重构应用层(feature-first)

**Date**: 2026-08-08
**Task**: 从零重构应用层(feature-first)

### Summary

应用层全面重构: 1) 架构 pages/components/store 平铺 → features/(home/learning/practice/review/collections/cards/errorbook) + shared/(ui/hooks/lib/styles) + app/; 2) 巨型组件拆分: Flashcards拆 FlipCard/RateBar/StatsBar(423→3组件), ArticleReader拆 GlossPop, PracticeSession拆 SelfJudge; 3) 新增 shared/hooks/useData 数据访问层(useArticle/useArticleWords/useArticleQuestions/useCollection/useWord); 4) import 全量重写55处+扩展名清理11文件; 5) 旧目录删除; 6) README 目录更新。数据管道与行为完全保留

### Git Commits

(No commits - planning session)

### Testing

- [OK] typecheck / check / full-flow 38/38 / browser-test 45/45 / page-scan 137/0

### Status

[OK] **Completed**

### Next Steps

- 无


## Session 15: 封装设计令牌系统

**Date**: 2026-08-08
**Task**: 封装设计令牌系统

### Summary

把书卷纸墨视觉系统封装为单一事实源 tokens.ts: 44 个设计令牌(色19/字9/距5/圆角4/阴影2/动效6), 扁平变量名与 CSS 完全一致; injectTheme() 运行时注入 :root CSS 变量(main.tsx 调用), global.css 移除重复 :root 定义; 导出 theme/ThemeTokens 支持组件 JS 侧取值与主题覆盖扩展; 验证令牌注入/变量解析/视觉无回归

### Git Commits

(No commits - planning session)

### Testing

- [OK] check / full-flow 38/38 / browser-test 45/45 / page-scan 137/0 / 令牌44变量生效

### Status

[OK] **Completed**

### Next Steps

- 无


## Session 16: 封装视觉大模型VisionProbe弥补DeepSeek多模态

**Date**: 2026-08-08
**Task**: 封装视觉大模型VisionProbe弥补DeepSeek多模态

### Summary

新建 scripts/vision/: lib.mjs(playwright截屏+base64+OpenAI兼容VLM调用+UI审查/描述双提示词模板+报告生成) + vision.mjs CLI(桌面/移动/双视口/已存截图/describe模式, env可配provider)。默认 bohe/gemini-2.5-pro-1m。实测审查首页: VLM 给出真实问题清单(必考标签与卡片边框重叠/进度区按钮割裂/标签样式不统一等) — 已修复高优 2 项。package.json vision script + README 章节 + .gitignore

### Git Commits

(No commits - planning session)

### Testing

- [OK] vision 实测成功 / check 全过 / browser-test 45/45 / page-scan 137/0

### Status

[OK] **Completed**

### Next Steps

- 无


## Session 17: VLM全站页面视觉审查

**Date**: 2026-08-08
**Task**: VLM全站页面视觉审查

### Summary

VisionProbe(gemini-2.5-pro-1m) 审查全站 15 页(桌面9+移动6): audit-all.mjs 批量脚本(修复 --limit 解析bug, DEFAULT_PROVIDER 改 bohe 已验证收图)。修复 9 项高优问题(进度条分隔/测验按钮蓝改金/三步学习青色改金/练习标签蓝改金/次要文字对比度/muted加深/长标题卡片/输入框描边/标题去重/题集间距); 中低优记录待优化。报告落盘 vision-shots/audit-master-report.md

### Git Commits

(No commits - planning session)

### Testing

- [OK] check / browser-test 45/45 / page-scan 137/0 / VLM 15页 0失败

### Status

[OK] **Completed**

### Next Steps

- 无


## Session 18: 字词卡数据排查+页面加宽+错题本入口+VLM深审

**Date**: 2026-08-08
**Task**: 字词卡数据排查+页面加宽+错题本入口+VLM深审

### Summary

4 项完成: 1) 字词卡数据乱: buildCards 去重+每字8卡上限(993→866, id 保持进度不丢); 2) 页面加宽: home/collections/workspace max-width→100%(继承 80vw, 首页 800→1024px); 3) 错题本入口: /collections?err=1 滚动定位+高亮; 4) VLM 二轮深审发现修复: 选项 A. A. 前缀重复(数据清洗 build 两处)/页脚对比度/翻面提示/左栏对齐/列表布局/译文留白

### Git Commits

(No commits - planning session)

### Testing

- [OK] validate 0错 / check / browser-test 45/45 / full-flow 38/38 / page-scan 137/0 / 选项无重复 / 错题定位生效

### Status

[OK] **Completed**

### Next Steps

- 无


## Session 19: 字词卡卡片内容过长修复

**Date**: 2026-08-08
**Task**: 字词卡卡片内容过长修复

### Summary

排查: 866 卡中释义大多<20字, 长内容来自虚词多义列举(①…②…)与例句。修复 FlipCard: 1) 背面删除重复例句(正面已有, 内容减半); 2) fc-meaning 长释义(含①列举)紧凑显示 16px 左对齐+9em 可滚动; 3) 正面 fc-guwen 例句 line-clamp 3 截断防卡片过高。实测虚词卡翻卡正常

### Git Commits

(No commits - planning session)

### Testing

- [OK] browser-test 45/45 / full-flow 38/38 / check 全过

### Status

[OK] **Completed**

### Next Steps

- 无


## Session 20: 首页信息架构重构去冗余+修复全站圆角塌陷

**Date**: 2026-08-08
**Task**: 首页信息架构重构去冗余+修复全站圆角塌陷

### Summary

首页重构: 删除 cat-nav chips 与 activeCat 分类切换(入口重复), 4 入口大卡唯一入口层始终显示, 篇目网格始终显示(加标题), 学习课文入口滚动到网格。顺带发现并修复重大 BUG: tokens 重构后 CSS var(--radius) 变量消失+无单位导致全站圆角塌陷 0px — 补 radius 兼容变量(带px), 圆角恢复。home.css 3 个 entry-card 定义合并

### Git Commits

(No commits - planning session)

### Testing

- [OK] browser-test 45/45 / full-flow 39/39 / page-scan 137/0 / check 全过 / 圆角 12px 恢复

### Status

[OK] **Completed**

### Next Steps

- 无


## Session 21: VLM全站审查优化+BUG排查

**Date**: 2026-08-08
**Task**: VLM全站审查优化+BUG排查

### Summary

VLM(gemini-2.5-pro-1m) 审查重构后全站 9 页 49 条问题。批量修复: hero数据垂直居中/必考标签不重叠+统一pill/年级计数加深/进度条分隔/开始复习(0)disabled弱化/朗读按钮红渐变突出/译文对比度加深/题集空态美化(📚引导)/列表间距/split-home间距/练习q-list间距/重置进度红色警示。均 CSS 级修复无行为变更

### Git Commits

(No commits - planning session)

### Testing

- [OK] browser-test 45/45 / full-flow 39/39 / page-scan 137/0 / check 全过

### Status

[OK] **Completed**

### Next Steps

- 无


## Session 22: 四入口卡重设计+整体界面美化

**Date**: 2026-08-08
**Task**: 四入口卡重设计+整体界面美化

### Summary

入口卡重设计: 2×2 大卡(图标徽章渐变/标题描述/右侧数据+进度), 学习卡红渐变/错题卡墨绿渐变/字词复习卡古铜金, hover 上浮+金边+图标微旋, 装饰径向光晕; 修复 CSS 结构问题(@media 误包裹导致全站 home.css 解析失败, 入口卡/hero/continue-card 样式丢失 → 重构该段并补回 hero/continue 样式); 对齐微调后 VLM 评价提升至'精致协调典雅书卷气'

### Git Commits

(No commits - planning session)

### Testing

- [OK] browser-test 45/45 / full-flow 39/39 / page-scan 137/0 / check 全过 / VLM 评价提升

### Status

[OK] **Completed**

### Next Steps

- 无


## Session 23: 字词卡恢复背诵学习模式

**Date**: 2026-08-08
**Task**: 字词卡恢复背诵学习模式

### Summary

背诵功能在首页重构中丢失 — 已恢复为字词卡新学习模式: buildReciteQueue 收集 105 篇 350 句背诵句(recitation.stars), 翻卡式(句子→译文+篇名/类型标签), 记住了/不熟自评(localStorage wyw_recite_progress_v2 进度), 完成页(已背 N/350+再背一轮)。实测: 进卡/翻面/自评/下一句 2/350 全通

### Git Commits

(No commits - planning session)

### Testing

- [OK] full-flow 39/39 / browser-test 45/45 / page-scan 137/0 / check 全过 / 背诵实测通过

### Status

[OK] **Completed**

### Next Steps

- 无


## Session 24: 率字读音修复+背诵句关联原文

**Date**: 2026-08-08
**Task**: 率字读音修复+背诵句关联原文

### Summary

1) pron-dict 缺'率'条目: 出师表'当奖率三军'朗读读 lǜ(律) — 已加 3 条 context 匹配(奖率/率三军/大率 → 帅/shuài), TTS 验证替换生效; 2) 背诵关联原文: ArticleReader 段落含背诵句时显示 ★背 按钮(匹配 article.recitation.stars), 点击弹内嵌背诵浮层(句子+译文+记住了/不熟), 进度存 wyw_recite_progress_v2 与字词卡背诵共享, 零跳转。实测出师表'苟全性命于乱世'浮层+记住了流程通过

### Git Commits

(No commits - planning session)

### Testing

- [OK] full-flow 39/39 / browser-test 45/45 / page-scan 137/0 / check 全过 / 率→帅 TTS 验证 / 背诵浮层实测

### Status

[OK] **Completed**

### Next Steps

- 无


## Session 25: 练习与字词浮层化(关联原文)

**Date**: 2026-08-08
**Task**: 练习与字词浮层化(关联原文)

### Summary

学习页篇内功能条(原文下方): ✏本篇练习(有题时) + 本篇字词按钮。练习浮层: 复用 PracticeSession 内嵌做题(31题), 完成后关闭, 底部操作条 sticky; 字词浮层: 本篇字词清单(字+分类标签+义项, 75条)。与背诵浮层统一 .inline-modal 风格(遮罩+居中+popIn)。零跳转闭环: 学习→练习→字词→背诵全在原文页

### Git Commits

(No commits - planning session)

### Testing

- [OK] full-flow 39/39 / browser-test 45/45 / page-scan 137/0 / check 全过 / 练习31题+字词75条实测

### Status

[OK] **Completed**

### Next Steps

- 无


## Session 26: 单题与单字词卡标注原文+浮层

**Date**: 2026-08-08
**Task**: 单题与单字词卡标注原文+浮层

### Summary

1) 单字词卡浮层: 原文点字(annot-gloss)浮层升级为词卡(大字+分类义项+例句 word-card-pop); 2) 单题挂段落: 双向匹配(题目引用句≥8字在段落 + 段落句≥6字被题目引用) 把题目挂到对应段落, 段旁显示 题N 红色pill按钮, 点击弹单题浮层(StemView+答案折叠details); 岳阳楼记 31 题中 7 题挂段落。期间修复删除事故(补齐 reading/activeRow/expandedRows/showAnalysis/refs/words/examTag/original/reciteStars 声明)

### Git Commits

(No commits - planning session)

### Testing

- [OK] full-flow 39/39 / browser-test 45/45 / page-scan 137/0 / check 全过 / 单题7挂+词卡浮层实测

### Status

[OK] **Completed**

### Next Steps

- 无


## Session 27: 练习右置+匹配覆盖提升+字词段落标记

**Date**: 2026-08-08
**Task**: 练习右置+匹配覆盖提升+字词段落标记

### Summary

1) 段落题N按钮 left→right(与★背同侧右上); 2) 匹配覆盖提升: 双向匹配阈值放宽(题句≥6/段句≥5)+引号片段+专名词匹配 — 论语 14 题中 8 题挂段落(原 4), 岳阳楼记 12 题; 3) 段落词N按钮(段内注释字词, 点击弹本篇字词浮层), 词按钮 padding-right 给★背让位。右侧按钮排布: 词N | 题N | ★背

### Git Commits

(No commits - planning session)

### Testing

- [OK] full-flow 39/39 / browser-test 45/45 / page-scan 137/0 / check 全过 / 论语题8词12背8实测

### Status

[OK] **Completed**

### Next Steps

- 无


## Session 28: 段落角标分组分隔:字词/练习单独

**Date**: 2026-08-08
**Task**: 段落角标分组分隔:字词/练习单独

### Summary

段落右侧角标重构为三组(.para-marks): 词组(每个字词单独按钮 词:子/时/不亦说乎, 最多4个+更多) | 题组(每题单独数字按钮) | 背组(★), 组间竖线分隔(.pm-group+.pm-group border-left), 右对齐 flex-wrap。解决字词一股脑挤一个按钮+题/背混排看不清。论语实测: 词48/题8/背8 独立按钮清晰

### Git Commits

(No commits - planning session)

### Testing

- [OK] full-flow 39/39 / browser-test 45/45 / page-scan 137/0 / check 全过 / 角标三组实测

### Status

[OK] **Completed**

### Next Steps

- 无


## Session 29: 去掉右侧字词标记+文中字词标注去重优化

**Date**: 2026-08-08
**Task**: 去掉右侧字词标记+文中字词标注去重优化

### Summary

1) 段落右侧词组(词N按钮)删除 — 字词入口回归文中点字(annot-gloss)与 本篇字词 整篇按钮; 2) AnnotText 标注优化: 同词条(word.id)仅首次出现标注可点(弹词卡), 后续出现渲染纯文本不重复标注 — 论语 88 词条全部首次标注无遗漏、无满屏重复。右侧保留 题组+背组

### Git Commits

(No commits - planning session)

### Testing

- [OK] full-flow 39/39 / browser-test 45/45 / page-scan 137/0 / check 全过 / 词按钮0+标注88去重实测

### Status

[OK] **Completed**

### Next Steps

- 无


## Session 30: 推倒重做:复习中心重构+综合题并入单篇

**Date**: 2026-08-08
**Task**: 推倒重做:复习中心重构+综合题并入单篇

### Summary

重做核心: 1) 综合题集 111 题按《篇名》归属单篇(71 题并入 articleId, build 阶段), validate 空题集降警告; 2) 删 /collections 独立页 → 复习中心 /review(ReviewPage: 单篇练习6年级126篇 + 综合题集13组 + 错题本并入, 页内做题); 3) 首页入口 → /review + /review?err=1; 4) 测试断言适配新路由; 5) 删除旧 CollectionsPage

### Git Commits

(No commits - planning session)

### Testing

- [OK] full-flow 39/39 / browser-test 45/45 / page-scan 137/0 / check 全过 / 复习中心实测

### Status

[OK] **Completed**

### Next Steps

- 无


## Session 31: 孩子体验重设计落地(今日学习+Tab+明亮纸墨+打卡)

**Date**: 2026-08-08
**Task**: 孩子体验重设计落地(今日学习+Tab+明亮纸墨+打卡)

### Summary

方案确认后落地: P1 明亮现代纸墨视觉(tokens: 暖白底/朱红#c4453c/淡金/圆角20/轻阴影, header朱红渐变); P2 首页=今日学习(问候+连续天数🔥+进度环SVG+推荐卡+今日任务); P3 底部3Tab导航(学习/字词/我的 + /me页面: 数据统计+错题本); P4 学习打卡(streak记录+首页显示); P5 背诵句译文补齐(198→87); P6 全量回归+VLM验收('温润雅致视觉统一性好'), 修细节(数据对齐/tab居中/占位对比度); ssr-check适配新路径

### Git Commits

(No commits - planning session)

### Testing

- [OK] full-flow 39/39 / browser-test 45/45 / page-scan 137/0 / check 全过 / VLM好评

### Status

[OK] **Completed**

### Next Steps

- 无

## 2026-08-09 · 跨项目借鉴融合 · 考点图谱 (博采众长)

### 任务
用户要求综合 ebak 目录中其他相似项目（ai-smartexam 智考真题实验室、zhongkaoexam 研途），博采众长糅合进本项目并跑通。

### 调研结论
- ai-smartexam (ebak/aistudy/ai-smartexam)：学习驾驶舱（主攻考点+练习包+薄弱考点+错题回炉路径）、buildTagStats 考点聚合、getTextbookLinks 考点→教材映射、掌握度评分启发式、离线 IndexedDB+syncEngine。
- zhongkaoexam (ebak/zhongkaoexam)：考点图谱 ExamMap（命题点→高频过滤→学科分组→频次徽章）、tracks 刷法归属派生、严格题目契约 schema。
- 本项目数据资产已含考点标签：questions 426 题带 points + 205 题 key_points + EXAM_TAGS 篇目考点表。

### 实施（4 处融合 + 1 处修复）
1. **src/data/exam-map.ts**（新）：考点图谱数据层。三级考点来源（points/key_points/EXAM_TAGS 篇目级），聚合 547 考点 / 381 高频；pointQuestions/pointArticle 组装练习复用 PracticeSession；weakPointsFromErrors 错题→薄弱考点聚合。
2. **src/features/map/ExamMap.tsx + exam-map.css**（新）：考点图谱页。全部/只看高频过滤（研途式）、薄弱考点回炉区（ai-smartexam 式）、考点卡片（题数/真题/年份/篇数/必考徽章）、点卡进考点练习（错题自动入本）。路由 /map（懒加载），TabBar 加"图谱"tab，Icon 加 map 图标。
3. **首页融合**：今日推荐升级为错题驱动（有错题→"错题回炉·薄弱考点"直达 /map?p=）；entry-grid 加第 5 张卡"考点图谱"（桌面 3 列）。
4. **复习中心**：错题本顶部加"薄弱考点"chips 直达 /map。
5. **修复既有 bug**：Home.tsx 用 {items} 结构读错题本，实际 store.tsx 存数组 → 首页错题统计恒 0、推荐永不变化。改为兼容数组+{items} 两种格式。

### 测试修复
- ssr-check.mjs：cat-nav 断言过时（v2 改版已删）→ 改 home-entry-grid；/collections 路径不存在 → /review；新增考点图谱 SSR 检查。
- full-flow-test.mjs：入口卡 4→5 张；新增 9.5 考点图谱段（渲染/过滤/练习区）。注意 HashRouter → 浏览器 URL 用 #/map。

### 验证
- npm run check 全绿（数据校验 + SSR 验证全部通过）
- full-flow-test 43/43 通过（含移动端 6 页无溢出、无 JS 错误）
- 薄弱考点闭环实测：写入错题 → 首页"错题回炉"推荐 → 点击跳 /map?p=名句默写 → 薄弱区块+考点练习区展开
- VisionProbe 视觉审查两轮迭代（标签对比度、筛选按钮状态、卡片间距）

### 借鉴明细
| 本项目落地 | 来源 |
|---|---|
| 考点图谱页（高频过滤/频次徽章） | 研途 ExamMap |
| 薄弱考点/错题回炉闭环 | ai-smartexam weakTags |
| 考点摘要行（真题/年份/篇数） | ai-smartexam TagStat |
| 错题驱动的今日推荐 | ai-smartexam 驾驶舱 |

## 2026-08-09 · 练习题目出处系统 (拆开+注明出处)

### 需求
把练习题拆开（混合来源分组），每题注明出处。

### 实施
1. **src/data/question-source.ts**（新）：出处系统 questionSourceOf() → { badge, label }。六来源徽章：真题(年份·省份)/一文一练(篇目·题集)/AI生成(篇目·考点)/考点/相关/手写。真题 label 如 "中考真题 · 2024 · 武汉"，practice 如 "《岳阳楼记》一文一练"。
2. **QuestionCard.tsx**：细徽章（rq-badge-{tone} 变体，深底白字高对比）+ 出处行 "出处：…"。
3. **PracticeSession.tsx**：做题每题题干上方加 q-source-line（出处）。
4. **ReviewTab.tsx**：篇内复习按出处分组（真题→一文一练→考点→AI生成→相关→手写），组标题带题数。
5. **types.ts**：PracticeQuestion 补 origin/origins/articleId/collectionId/articleTitle 字段。

### 修复既有 bug（重要）
toPracticeQuestion 的 fromZhenti 逻辑误写 `origins.includes('exam-gen')`（应为 'zhenti'）→ 426 个 AI 生成题全被标成真题，做题/复习时真题徽章错误、真题过滤混入 AI 题。已修 data/index.ts + exam-map.ts 两处。runtime 数据层 fromZhenti 本身正确（161 真题）。

### 验证
- typecheck ✅ / npm run check 全绿 ✅ / full-flow-test 43/43 ✅
- 浏览器实测：复习分组"真题 10 | 一文一练 3 | 考点 3 | AI生成 7 | 手写 8"，出处行"中考真题 · 广西贵港"，真题过滤精确 10 题（修复前混入 AI 题）
- VisionProbe：徽章对比度修复（深底白字），移动端无溢出

## 2026-08-09 · 练习单题流改造 (每题单独, 信息不堆积)

### 需求
练习题拆成每题单独展示，不要所有题放一个页面（信息堆积太密）。

### 实施
1. **PracticeSession.tsx 单题流**：整卷一屏 → 一屏一题 + 逐题提交。新增 page state + qSubmitted（每题提交状态）；进度条（已判 X/N）+ "第 X/N 题"；操作：作答 → 提交本题判分（选择自动判/主观自评）→ 下一题 → 最后一题查看结果。修改答案需重新提交。跳过未判的题记为答错。
2. **ReviewTab.tsx 单题浏览**：按出处分组展平 → 一屏一卡 + 上/下一题导航 + 位置指示（第 X/N 题）+ 组徽章。
3. **CSS**：ps-progress 进度条 / ps-actions 单题操作区 / rq-view 单卡浏览 + rq-nav 导航。
4. **full-flow-test.mjs**：练习段改为逐题流循环（作答→提交本题→自评→下一题→查看结果）；复习段适配单卡选择器 + 单题浏览进度检查。

### 验证
- typecheck ✅ / npm run check 全绿 ✅ / full-flow-test 44/44 ✅（含新增"逐题进度条"、"单题浏览进度"、"完成全部题目"检查）
- 浏览器实测：岳阳楼记练习第一题（主观）→ 填写 → 提交本题判分 → 判分反馈 + 下一题按钮；复习单题浏览 + 导航；移动端无溢出
- VisionProbe：单题流页面信息密度大幅降低，视觉审查无新增严重问题

## 2026-08-09 · 练习题去滚动条 + 深度数据核查修复

### 需求
1. 练习题页面不要出现滑动条
2. 深度核查数据，修复不合理项

### 滚动条清除
- practice.css `.material-box`（练习材料区 220px 限高滚动）→ max-height none / overflow visible 完整展示
- collections.css `.errbook-items`（错题列表 180px 滚动）→ max-height none
- 浏览器验证：练习/复习/多选页内部滚动容器 = 0

### 数据核查与修复
1. **伪年份 59 题**：raw/zhenti_web.json 的 year='经典'(52) + '真题'(7) → 规范化置空。runtime 重新生成后只剩 8 个真实年份(2018-2025, 81 题)。出处显示已用 REAL_YEAR 过滤，数据层现在也干净。
2. **多选答案题 1 题**（practice:183 愚公移山断句位置题, 答案 ABD, options=位置标号）：前端原按单选 indexOf 判分 → 用户选 A 也判对（"ABD".indexOf("A")>=0）。修复：QItem 检测 isMultiChoice（答案多字母且选项单字母标号），支持多选 toggle + 精确集合匹配判分（correctCount/finish 同步），UI 加"可多选"提示。
3. **隐藏 bug：底部 TabBar 遮挡自评按钮**：长答案题提交后自评按钮被推到视口底部，被固定 TabBar（高 ~72px）部分遮挡，点击无效（playwright elementFromPoint 证实 topEl=tab-bar）。修复：app-main padding-bottom 40→96px（移动 30→92px）+ 提交本题后 useEffect 自动 scrollIntoView 到 .q-answer-box。

### 验证
- typecheck ✅ / npm run check 全绿 ✅ / full-flow-test 44/44 ✅
- 多选：勾 ABD → ✓ 答对；只选 A → ✗ 答错（修复前误判答对）
- 自评：题 3（长答案）提交后自动滚动，自评按钮可点击，进度 3/31
- 练习/复习/愚公移山页内部滚动容器 = 0

## 2026-08-09 · 考点图谱分类 + 弹窗做题

### 需求
1. 考点图谱增加分类
2. 考点卡片弹窗展示做题，不要在页面底部展示

### 实施
1. **考点分类**（exam-map.ts）：CATEGORY_RULES 关键词规则 → 8 类：背诵默写/字词句翻译/内容理解/写作手法/语言赏析/主旨情感/人物形象/篇目特色。groupPointsByCategory() 按分类分组（组内高频+题数降序）。分布：8/24/44/74/24/74/4/295。篇目特色 = 篇目级细粒度考点兜底。
2. **弹窗做题**（ExamMap.tsx）：点击考点卡 → inline-modal 弹窗（复用项目弹窗体系，宽 720px，高 86vh），头部考点名+题数+关闭，body 内 SessionView 做题（错题自动入本）。移除底部 map-player 区。保留 ?p= 直达（首页薄弱考点入口自动弹窗）。弹窗样式独立写入 exam-map.css（页面未引入 article.css）。
3. **数据修复**：出处系统 double 书名号——article.title 本身是 "《论语》十二章" 带书名号，questionSourceOf 又套《》→ "《《论语》十二章》"。新增 wrapTitle() 检测已带《》不重复包裹。
4. **CSS**：进度条对比度加深（bg-soft → border 底色 + 边框）。

### 验证
- typecheck ✅ / npm run check 全绿 ✅ / full-flow-test 46/46 ✅（新增分类区块/弹窗打开/弹窗内做题/弹窗可关闭 4 项）
- 浏览器实测：8 分类区块渲染、点卡弹窗做题、关闭正常、移动端无溢出、页面无双重书名号
- VisionProbe：分类页观感良好；弹窗进度条对比度修复

## 2026-08-09 · 主页去重精简

### 需求
主页有重复功能模块。

### 重复识别
主页原有 8 区块，3 处重复：
1. **继续学习重复**：今日推荐（无错题时=继续上次学习）vs 继续学习横幅 continue-card → 删 continue-card
2. **统计重复**：home-strip 学习概览条（已背诵/已学字词/待复习错题/复习中心链接）vs 功能入口卡（词条数/错题数/题集数统计）→ 删 home-strip
3. **背诵进度丢失补偿**：今日任务"读课文"→"背课文 X/Y"（背诵统计并入）

### 实施
- Home.tsx：删 home-strip 区块（17 行）+ continue-card 区块（16 行）；今日任务首项改"背课文 {reciteCount}/{reciteTotal}"
- home.css：删 .home-strip/.hs-*/.continue-card/.cc-* 55 行无用样式
- ssr-check.mjs："进度概览"断言 home-strip → today-tasks

### 验证
- typecheck ✅ / npm run check 全绿 ✅ / full-flow-test 46/46 ✅
- 主页区块收敛为 5 个：今日学习头/今日推荐/今日任务/搜索/功能入口(+篇目区)，无重复
- 移动端无溢出，VisionProbe 观感良好

## 2026-08-09 · 字词卡内容过多排查修复

### 需求
"略无"字词卡正面反面内容都太多，全面排查类似问题。

### 根因（重大数据展示 bug）
**findArticleExample 按 \n 取行**，但部分课文原文无换行（一整段）→ 例句 = 整段课文。送东阳马生序 641 字整段被几十张卡引用为例句（致/患/趋/稍/质/或/复/俟/负/汤/寓/再…等 164 张卡例句超 60 字）。"略无"来自该文"略无慕艳意"处也中招。

### 修复
1. **findArticleExample 窗口截断**：truncateExample() 取词 + 前后各 14/18 字上下文，超长加省略号，上限 48 字。buildCards 的 meaning.example 也过 truncateExample 兜底。
2. **背诵卡译文截断**（同类问题）：recitation.stars 的 translation 数据曾整段挂载（醉翁亭记背诵句译文 269 字整段）→ buildReciteQueue 译文超 80 字截断 + 空译文占位 '——'（87 张原无译文）。

### 排查结果
- 字词卡例句超 60 字：164 → **0**（最长 42 字）
- 释义超 60 字：0（最长 48 字，合理）
- 背诵卡原句超 60 字：0；译文超 100 字 26 张 → 截断到 80+…
- 学习页 GlossPop 词条 example 最长 18 字 ✓

### 验证
- typecheck ✅ / npm run check 全绿 ✅ / full-flow-test 46/46 ✅
- 浏览器：背诵卡正常无溢出；卡片内容无溢出

## 2026-08-09 · 全站功能去重 + 布局紧凑 (一个功能一次一个地方)

### 需求
使用现成数据，精简去重，一个功能只出现一次一个地方，重新组合布局，紧凑。

### 重复盘点
| 功能 | 重复位置 | 处置 |
|---|---|---|
| 学习课文 | TabBar"学习" + 主页卡"学习课文"(仅滚动) + 工作区 | 删主页卡 |
| 字词卡 | TabBar"字词" + 主页卡"综合字词" | 删主页卡 |
| 考点图谱 | TabBar"图谱" + 主页卡"考点图谱" | 删主页卡 |
| 复习中心 | 主页卡"综合复习" + /me 链接 | 保留主页卡 |
| 错题本 | 主页卡 + /review 页内 + /me 链接 | 保留主页卡 |
| 学习统计 | 主页今日任务 + /me 统计页 | 删 /me 页 |

### 实施
1. **主页**：入口卡 5 → 2（综合复习/错题本，TabBar 未覆盖的入口）；删 entry-learn/cards/map 卡；布局 2 列紧凑
2. **TabBar**：4 tab → 3（学习/字词/图谱，删"我的"）
3. **App.tsx**：删 /me 路由 + MyPage import；/me 落入 catch-all → 首页
4. **删 MyPage.tsx**（统计与主页任务重复）
5. **home.css**：entry-grid 2 列、清理 entry-cards/map/learn 样式
6. **测试**：入口卡 5 → 2

### 最终结构 (每功能唯一入口)
- 学习：TabBar"学习" → 主页(推荐/任务/搜索/篇目区/快捷卡)
- 字词+背诵+测验：TabBar"字词" → /cards
- 考点图谱：TabBar"图谱" → /map
- 复习/错题：主页快捷卡 → /review
- 篇目工作区：学习/练习/复习 3 tab（篇内流程，与全局互补）

### 验证
- typecheck ✅ / npm run check 全绿 ✅ / full-flow-test 46/46 ✅
- 浏览器：2 快捷卡 + 3 tab、/me 跳回首页、移动端无溢出
- VisionProbe：主页雅致简洁、层级清晰

## 2026-08-09 · 真题识别修复 + 工作区 tab 重组 (学习/鉴赏/练习)

### 需求
1. （青海省卷）《诫子书》家教题是中考真题但没识别
2. 练习和复习功能重复
3. 鉴赏作为单独标签放到学习右边

### 一、真题识别修复 (build-runtime-data.mjs)
- **根因1**：题干带省/市/卷标记（（青海省卷）等）的题，来源非 zhenti 时不标真题 → 新增 ZHENTI_MARK 正则，cleanQuestion 自动标记 fromZhenti + origin='zhenti'
- **根因2**：同真题跨篇挂载 4 次未合并（questionKey 含 articleId 维度）→ questionKey 对 fromZhenti 题改用 `z:normKey(stem):normKey(answer)` 全局键（normKey 去省份前缀+全角转半角）
- **根因3**：related 变体（无省份前缀的同题）→ mergeQuestions 加 zhentiIndex 回溯合并（非真题来源同题干同答案合并进已收录真题）
- **根因4**：answer 混入【参考答案】/【解析】内容 → cleanAnswerText 剥离（含 // 前缀变体）
- 结果：青海家教题 3 条 → 1 条（标 zhenti）；全库带省/卷标记 0 漏标；answer 残留 0；题数 2033→2022（去重 11 条）

### 二、工作区 tab 重组
- TABS：学习/练习/复习 → **学习/鉴赏/练习**（删复习 tab，练习+复习去重；错题统一全局 /review）
- 新建 ArticleAppreciation.tsx：逐段赏析（原文+译文对照+段落分析，复用 paragraphs/alignLines）+ 整篇鉴赏（ArticleAnalysis 主旨/结构/写法/文化）
- ArticleReader 精简：移除段落赏析(para-ana) + 底部鉴赏折叠区 → 纯原文阅读（译文 toggle 保留）
- ArticlePage：appreciate tab 路由 + practice errorHref 改 /review
- ssr-check/full-flow-test：复习 tab 断言改鉴赏流

### 验证
- typecheck ✅ / npm run check 全绿 ✅ / full-flow-test 44/44 ✅（练习流 6 + 鉴赏流 3）
- 浏览器：tabs=学习/鉴赏/练习；鉴赏页 9 段赏析 + 整篇鉴赏；移动端无溢出
- 真题：青海省卷题正确标 zhenti，出处显示"中考真题 · 青海"

## 2026-08-09 · 字词卡改为核心实虚词分类列表 (去翻卡)

### 需求
字词卡只保留核心实词虚词，少而精覆盖高频必考；不要翻卡，像篇目列表一样分类展示。

### 实施
1. **词库精选**：buildCoreVocab() = words.filter(scope==='global') → 86 核心词（实词 80 + 虚词 6，教材全库实虚词表，含义项/例句/出处篇目）
2. **Flashcards.tsx 重写**（228 行）：
   - 移除 SM-2 翻卡/评分/词义测验/进度重置（FlipCard/RateBar/StatsBar 不再引用）
   - 分类列表：实词/虚词 tab + 词条卡片（词+分类徽章+N义+N篇，点击展开全部义项/例句/出处）
   - 保留"背诵原文"入口（原文逐句→译文翻卡背诵）
3. **Home.tsx 适配**：移除 CARD_SEEN_KEY（SM-2 进度）依赖；进度环改用背诵进度 recitePct；今日任务"记字词 X/Y"→"学字词 · 核心 86 词"
4. **flashcard.css**：新增 vocab-* 列表样式
5. **full-flow-test**：6. 字词段改列表检查（核心词列表/实虚词 tab/展开义项/背诵入口）

### 修复的 bug
- buildCoreVocab 误用 globalWords（=全部 2144 词）导致虚词 2064 条 → 改用 words.filter(scope==='global')，实词 80 + 虚词 6
- Home coreWordCount 同样修正为 global scope 词数

### 验证
- typecheck ✅ / npm run check 全绿 ✅ / full-flow-test 45/45 ✅
- 浏览器：实词 80 + 虚词 6 卡、展开义项正常（"安"4 义带例句出处）、背诵入口正常、移动端无溢出
- 视觉审查：古典书卷风，层级清晰

## 2026-08-09 · URL 去 # + 字词 6 列网格 + 复习中心移除

### 需求
1. /#/cards 去掉 #（BrowserRouter）
2. 字词卡片每行 6 个排列
3. 重点内容换颜色醒目区分
4. 去掉复习中心（用户确认：错题本保留，综合题集随删）

### 一、BrowserRouter（去 #）
- main.tsx HashRouter → BrowserRouter
- full-flow-test 的 goto 修复双斜杠 bug（BASE('/')+h('/errors')='//errors'）→ BASE.replace(/\/$/,'')+h

### 二、字词 6 列网格 + 重点颜色
- .vocab-list: grid 6 列（响应式 5/4/3/2 列）
- .vocab-word 主色红大字；摘要主色加粗；例句 accent-brown
- articleCount>=4 的词加红色"高频"徽章（实词 24 个）
- 卡片 head 元数据 flex-wrap 对齐优化

### 三、复习中心移除 + 错题页
- 删 /review 路由 + ReviewPage.tsx + ReviewTab.tsx + QuestionCard.tsx + collections 目录 + collections.css
- 新建 ErrorBookPage.tsx（独立错题本：按篇分组 + 薄弱考点入口 + 搜索 + 移除/清空）+ errorbook.css
- Home：快捷卡"综合复习"删除，只剩"错题本"→ /errors；entry-grid 1 列
- ArticlePage/ExamMap 的 errorHref → /errors
- 修复 .errbook-title 命名冲突（页面标题 vs 分组标题 → .errbook-group-title）
- 综合题集：数据保留（data 层），UI 移除

### 验证
- typecheck ✅ / npm run check 全绿 ✅ / full-flow-test 44/44 ✅
- 浏览器：/cards 无 #；1600px 6 列 / 390px 2 列无溢出；高频徽章 24；错题页正常
- 视觉审查："精致沉静的中国风，信息排布有序"

## 2026-08-09 · 原文注释角标 + hover 显示 + 字词弹窗

### 需求
1. 原文中带注释字加序号角标，滑动显示，重复不显示
2. 字词卡片弹窗显示

### 一、原文注释角标（ArticleReader）
- **序号**：注释词（课文注释类）按原文首次出现顺序编号（①-⑳ ㉑-㉟ (36)+），角标 sup 显示在词后
- **滑动显示**：hover 注释词显示 GlossPop（onMouseEnter 显示 / onMouseLeave 延迟 260ms 关闭）；点击仍可用（移动端）
- **重复不显示**：noteFirst 纯计算映射（词 → {段落, 偏移} 首现位置），渲染时仅首现位置标角标。关键坑：初始用共享 Set（useRef）在 StrictMode 双渲染下二次渲染全部"已见"→ 不标（g=0），改为纯计算 map 无副作用
- **注释列表**（NoteList）共享同一序号（①②...），与原文角标对应

### 二、字词卡弹窗（Flashcards）
- VocabCard 点击 → VocabModal 弹窗（560px/82vh，词+分类+高频徽章+全部义项/例句/出处，✕ 关闭）
- 移除内联展开（expandedId → selected state）

### 验证
- typecheck ✅ / npm run check 全绿 ✅ / full-flow-test 46/46 ✅（新增弹窗检查）
- 浏览器：岳阳楼记 43 个注释词角标 ①-㉟(36)-(43) 递增、hover 浮层正常、注释列表序号对应、词条弹窗正常

## 2026-08-09 · QA 审查全量修复

### 修复清单 (对应审查报告编号)
| 项 | 修复 |
|---|---|
| R1/R3 竞态 | store.tsx 全部变更改 mutate() 函数式更新 (setItems(prev=>...)), 写前基于最新 state 去重合并; 多 Tab 经 storage 事件同步后合并 |
| R2 竞态 | Flashcards reciteRate 改 setReciteProgress 函数式更新, 快速连点不覆盖 |
| R4/M1 泄漏 | ArticleReader hoverTimer useEffect 卸载清理 |
| M3 泄漏 | ErrorBookProvider storage 监听移除 location 依赖 (只挂一次) |
| S3/E1 安全 | saveLS 失败 console.warn 告警; 错题本上限 600 条 (slice 保最新) |
| E3 判分 | 单题流改答案时同时清 qSubmitted + judge 残留 (避免 finish 误判) |
| E4 空题 | 考点弹窗 count=0 显示"该考点暂无题目" |
| E5 输入 | Home 搜索 useDeferredValue 防抖 + input maxLength=50 |
| E10 残留 | main.tsx 启动清理 wyw_cards_v2/wyw_cards_seen_v2/v1 (SM-2 已废弃) |
| M2 SW | sw.js 导航后台更新改增量: 已有缓存资源跳过只抓新 hash 资源 |
| 依赖 | package.json 清理 esbuild@0.21.5 allowScripts 残留 (实际未安装, 防 CVE 误解) |
| 性能 | PracticeSession judgedCount/correctCount/unanswered useMemo 缓存 (682 题考点) |

### 未修(低优先级/文档级)
- S5: BrowserRouter 静态部署需服务器 history fallback (部署文档事项)
- E2/E7/E9: 跨篇同题语义 / 历史 qid 失效 / SSR 与 BrowserRouter 差异

### 验证
- typecheck ✅ / npm run check 全绿 ✅ / full-flow-test 46/46 ✅
- 浏览器: 搜索防抖正常, 错题读写正常

## 2026-08-09 · QA 低优先级项修复 (S5/E2/E7/E9)

| 项 | 修复 |
|---|---|
| S5 深链 | public/404.html (纯静态托管 404 兜底: 记录 wyw_deep_link → 回首页) + App DeepLinkRestore 启动恢复导航 + DEPLOY.md (nginx/Vercel/Netlify 配置) |
| E2 跨篇同题 | addWrong/importItems 去重键 `${articleId}:${qid}` → 纯 qid (qid 全局唯一, 跨篇同题只记一条) |
| E7 失效 qid | ErrorBookPage 顶部 staleCount 提示 "N 条原题已更新" + 列表条目标记 .errbook-stale; weakPointsFromErrors 继续静默忽略失效题 |
| E9 SSR 路由 | ssr-check.mjs 新增 StaticRouter 深链批量渲染 (12 条路径: 有效/无效 id、旧版 /learning /practice、未知路由兜底)。注意: react-router-dom v7 无 ./server 子路径, StaticRouter 从 'react-router' 主包导入 |

### 验证
- typecheck ✅ / check 全绿 ✅ (深链 12/12 ✅) / full-flow-test 46/46 ✅
- 浏览器: wyw_deep_link 恢复 → /cards ✅ 且清理; E7 失效标记渲染 ✅

## 2026-08-09 · 紧凑布局 (减少滚动条)

### 改动 (全部为 CSS 覆盖段追加, 未动组件逻辑)
- global.css: app-header 压到单行 (隐藏 subtitle)、app-main padding 12px/74px、tab-bar/tab-item 更矮、footer display:none (被固定 TabBar 覆盖无意义)
- home.css 多层覆盖: hero 横幅紧凑化 → 移动端隐藏; today 区 (标题/环形/推荐卡) 逐级压缩, 推荐卡 sub 行隐藏; 分类 chip/年级 tab 更矮; 卡片网格 minmax 128px、gap 5-6px、卡片 padding 7-9px、ac-title 0.85rem/行高 1.25; 移动端 (≤640px) 隐藏 hero + 今日推荐, 网格 2 列
- article-page.css: content-head/word-section/rq-card/error-item 微压

### 实测
- 桌面 1366x768 ✅ 一屏 (768/768), 1440x900 ✅ (900/900)
- 移动端 390x844 1340px: 剩滚动全为篇目网格内容列表 (126 篇), 属正常内容滚动
- 学习/练习/图谱/字词卡为内容页, 滚动属合理 (图谱全考点展开)

## 2026-08-09 · 练习题出处 + 字词卡弹窗 + 小题竖线 + 逐段赏析

### 1. 练习出处行强化 (PracticeSession)
- q-source-line 改卡片样式: "原文出处" 徽章(::before) + 彩色来源徽章(真题红/一文一练铜/AI生成紫/考点蓝/相关灰/手写绿, questionSourceTone) + 课文名加粗 label
- 2022 题全部有篇目归属, 出处行无条件显示

### 2. 字词卡整卡可点 + 弹窗样式
- VocabCard: div 整卡 onClick + role=button/tabIndex/键盘 Enter 空格; vocab-head 改 span
- 弹窗: 入场动画 (vocab-pop), 头部红色渐变 + 词 1.5rem 白字, 义项改卡片 (灰底圆角), 序号圈号徽章(红圆白字), 例句/出处分层小字, 关闭按钮旋转动画

### 3. 小题竖线移除
- .stem-item 的 border-left: 3px solid var(--primary) 删除 → 纯悬挂缩进

### 4. 逐段赏析样式 (article.css)
- appr-para 卡片化: 米白渐变 + 左边 accent 粗条 + 右上装饰光斑 + 序号徽章(红胶囊, 悬在卡顶)
- 原文用楷体 1.02rem, 译文灰字+左边线, 赏析块米黄底色虚线框 + "赏析 " 前缀
- 验证: 9 段赏析渲染正常

## 2026-08-09 · 学习页精简 + 背诵句五角星

### 删除
- inline-actions (本篇练习 N / 本篇字词 N 按钮) → 朗读全文上方只留朗读
- 段内 pm-questions 数字按钮 (本题涉及本段 1,2,1)
- 段内 pm-recite ★ 弹窗按钮 + 相关弹窗 (questionPop/practicePop/wordsPop/recitePop) 及 state/import 清理 (PracticeSession/StemView/Icon/loadLS 等)

### 新增
- 背诵默写句: 段落右缘金色 ★ 标记 (recite-star, 呼吸动画), 每背诵句一个 ★ (title=背诵句文本)
- 匹配归一化: 全/半角标点差异 (sentence 半角逗号 vs 原文全角) 需去除标点后 includes 匹配 (岳阳楼记 7 句全部命中)

### 验证
- typecheck ✅ / build ✅ / full-flow-test 46/46 ✅
- 浏览器: 功能条已删, 无 pm 按钮, 7 个金色 ★ (rgb(230,168,23))

## 2026-08-09 · 视觉体检优化 (程序化布局审计)

### 检查方法
- playwright 程序化体检: 横向溢出 / 元素越界 / ellipsis 截断 / 空白块 / 块间距 / 对比度 / 移动端溢出
- (当前模型不支持看图, 用 DOM 布局量化替代人工视觉)

### 发现并修复
| 问题 | 修复 |
|---|---|
| 首页快捷功能卡偏高 (92px) | entry-card 压缩 8px padding + icon 32px → 72px |
| ac-meta 溢出 40px 截断信息 | 改两行 -webkit-line-clamp:2, 完整显示 "春秋战国 · 孔子弟子及再传弟子" |
| 背诵星标定位错位 (伸出段缘 17px) | .para-orig 加 position:relative + padding-right:30px; 星标 right:8px top:50% 垂直居中 |
| 图谱 547 卡长页导航弱 | .map-cat-head sticky 吸顶 + 卡片 hover 微反馈 |
| 首页 CSS 死代码 | 清理 .home-hero 全段 (Home.tsx 无此块) 13 条规则 |

### 验证
- 首页 1280x800 ✅ 一屏; 星标 right 1107 ≤ 段 right 1114 ✅
- 移动端 390px 全页无横向溢出 (grade-tabs 横滚为预期)
- build ✅ / full-flow-test 46/46 ✅ / typecheck ✅

## 2026-08-09 · gemini 视觉审查 + 数据审计

### 方法
- scripts/vision/lib.mjs (gemini-2.5-pro-1m @ x666.me, OpenAI 兼容) 对 8 页截图逐页 UI 审查
- 复检 3 页确认修复

### 视觉修复 (gemini 发现)
| 问题 | 修复 |
|---|---|
| 篇目卡片 ac-badge 遮挡标题 (首页+背诵页) | 标签 max-width 44% 缩小, 卡片 padding-right |
| 黄色"核心重点"标签白字对比度低 | 改浅黄底 + 深棕字 (#7a5a00) |
| "三步学习"按钮悬浮+淡黄白字对比差 | 白底深灰字 + 描边 |
| 底部导航未选中浅灰难辨 | #5a4a3a; 选中态统一红底白字 |
| 图谱卡底部题型文字浅灰 | map-card-meta #6b5b45 + types 加深 |
| 赏析文字淡黄底棕字对比低 | appr-ana 加深 #3a2c14 |
| "查看译文"暗金对比低 | 加深 #8a6d3b + 加粗 |
| 段落卡片间距不统一 | para-list gap 12px |
| 图谱筛选按钮未选中无底 | 加浅米底; 文字垂直居中 |
| 错题本空态居左与居中混排 | 搜索/空态居中 |
| 字词卡标签样式雷同 | 词性描边 vs 数量填充; 释义加深 |

### 数据审计 (UI 标注 vs 数据源, 全部一致 ✅)
- 126 篇 / 2144 词义 / 2022 题 / 16 题集 == 头部信息
- 年级加总 19+19+27+21+23+17 = 126
- 岳阳楼记 31 题 == UI; questionIds 1982 引用 0 悬空
- 背诵 0/350 == 350 句 stars (105 篇); 核心词 86 (80实+6虚)
- 发现: /recite 无独立路由 (背诵模式在 /cards 内), 首页"背课文"为纯展示项 — 非 bug
- buildReciteQueue = 350 句 (旧 1065 逐句卡已重构为背诵句)

### 验证
- build ✅ / full-flow-test 46/46 ✅ / typecheck ✅

## 2026-08-09 · 全方位细粒度视觉排查 (gemini 逐类特写审查)

### 方法
- 程序化一致性扫描: 每类元素高度/宽度/行数统计
- 5 张区域特写 (字词卡/图谱/原文/赏析/练习) → gemini 逐类审查 (API 偶发超时, 重试成功)

### 修复
**高度统一 (先扫后修)**
- 篇目卡 3 种高度 → min-height 70px + grid-auto-rows:1fr → 1 种 ✅
- 字词卡 4 种高度 (70-119) → min-height 100px + summary clamp2 → 119px 统一 ✅
- 图谱卡 2 种 (122/147) → min-height 147px → 统一 ✅

**gemini 逐类建议落地**
- 字词卡: "高频"红块 → 金底描边柔和; 词性标签描边弱化
- 图谱: 辅助文字 #6b5b45→#4a3c2a; 卡间距 12x10; 移除顶部虚线
- 原文: 段落卡去边框 (border:none 纯间距分隔, reading-para 高亮态保留圆角底); 重点词高亮加深
- 赏析: 文字 #2e2110; 段内译文/赏析间距加大
- 练习: 三步学习按钮 → 实底金 #f3e8cf + 深棕字

### 验证
- build ✅ / full-flow-test 46/46 ✅
- 复检: 段边框 0px ✅ / 高频描边 1px 金色 ✅ / 图谱文字 #4a3c2a ✅ / 间距 12x10 ✅

## 2026-08-09 · 满强度逐元素交互测试

### 方法
- v1 选择器精确匹配失败 → v2/v3 按 selector 枚举 + 智能处理 (disabled 跳过/弹窗先关/动画 force)
- 7 页 281 次逐元素点击 + 12 条深层交互流

### 结果
- 基础点击: 281 次 0 失败 0 页面错误 ✅
- 交互流全过: 练习全流程(作答→提交→自评→下一题→结果页)、答错入错题本(+1 且去重)、字词卡弹窗/分类切换、背诵模式(350句入口→翻面→记住了连点)、图谱弹窗+1题考点全流程、搜索过滤/清除、注释 hover 浮层、篇目卡导航、移动端 tap+tab
- 练习页"提交本题判分" disabled 逻辑正确 (未作答禁用, 作答后可用)

### 修复 (测试暴露)
- 背诵星标: 无限 transform 动画导致点击不稳定 + absolute 可能拦截原文点击 → 动画改 opacity-only + pointer-events:none (纯装饰标记)

## 2026-08-10 · 全面诊断任务 (08-10-full-diagnosis)

完成四维度全面诊断,报告: `.trellis/tasks/08-10-full-diagnosis/diagnosis-report.md`
- 数据: validate 0 错/9 警告(全部已知观察项),抽查 0 问题,引用全通
- 代码: tsc 通过;发现死代码: card-progress.ts / sm2Schedule / FlipCard / RateBar / StatsBar / EmptyState / Home CATEGORIES / entry-review CSS / errorHref '/collections' 死默认值
- 构建: check 全链路通过, PWA 离线实测通过, 深链恢复实测通过, dist 2.9MB
- 行为: test:flow 46/46 通过 0 错误
- 关键发现: README 与实现漂移(SM-2/四档评分/词义测验/三模式背诵/综合题集均已移除但文档未更新); README 数字过时(2144/2495/2022/40 题)
- 问题: P0 0 · P1 4 · P2 8
- 项目无 git 仓库,无法 commit(环境限制)

## 2026-08-10 · 文档更新与死代码清理任务 (08-10-docs-cleanup)

按诊断报告 P1 全部 + P2 低风险执行完毕:
- README 全面重写: 功能表/模块表/数字(2144/2495/2022)与实现一致,移除 SM-2/综合题集/三模式背诵等已移除功能声明,删除旧版目录结构节
- 死代码删除: card-progress.ts, FlipCard/RateBar/StatsBar/EmptyState/useData, utils.ts SM-2 块(Sm2Card/sm2Schedule/isDue), Home CATEGORIES 常量, entry-review/empty-state CSS, errorHref 默认值 '/collections'→'/errors'
- page-scan.mjs 修复: hash 路由(#/cards)在 BrowserRouter 下假阳性(137 项全扫首页)→ 真实路径路由,暴露并修复字词卡无 h2 标题(span→h2)
- sw.js absolute() 改用 registration.scope 支持子路径部署
- validate 两个值为 0 的误报警告降级为 ✓(9→7 警告)
- 验证: typecheck ✓, check 全链路 ✓, test:flow 46/46 ✓, page-scan 77/77 ✓

## 2026-08-11 · 全面审查 + 数据修复 + 样式统一任务 (08-11-audit-unify-data 树)

**父任务**: 08-11-audit-unify-data(全面审查:统一样式 + 数据全盘校验去重),3 子任务全完成。

### 子任务 1: audit-report(五层审查报告)
- 报告: archive/2026-08/08-11-audit-report/research/audit-report.md
- 发现 P0×2 / P1×4 / P2×5 / P3×3:
  - P0-1: moxie qid 361 个重复(格式缺题型序号, 1 qid 指 4 题) → 默写进度串题
  - P0-2: moxie 顶层 id 10 条重复(默写效果检测×6 + 约客/渡荆门送别×2)
  - P1: title 考频后缀×5、bak 残留×3、望洞庭湖错字(5 题丢失)、exam-tags 失配
  - P2: 213 hex/30 rgba/11 font/97 圆角硬编码、27 组跨文件撞名、global.css 过载、195 疑似未用类名
- 误报修正: zhenti_web"同题不同答案"实为不同篇目同模板题干(含篇目维度后 0 重复)

### 子任务 2: data-audit-fix(全部修复)
- qid 唯一化: build 强制重写 `moxie-{title}:{sec}:{i}`, raw 1651+1081 qid 同步; 前端 startsWith('moxie:')→('moxie')
- id 唯一化: 默写效果检测-{page}×6; 约客/渡荆门送别 legacy 合并修复(剥离考频后缀后自动合并)
- 望洞庭湖赠张丞相: 16 处错字修正(practice 5 题挂回篇目)
- 年级长名规范化 378 条(七年级上册→七上;九年级→附录)
- bak 清理 + .gitignore *.bak*
- validate 新增段 8(raw 唯一)/9(真题重复)/10(runtime 一致性)/11(样式 gate)
- test:flow 深链修复(模拟 404.html 兜底流程, 基线验证为既有问题)
- **注意**: 8007528 提交遗漏 raw/runtime/scripts 修改(原因未明, 疑 stash 干扰), 已补提交 9955c16

### 子任务 3: style-unify(视觉 token 化)
- tokens.ts 扩展 34 令牌(语义色 + 量化 rgba + 字体 + 圆角)
- 213 hex + 30 rgba + 65 圆角 + 453 间距行 → var(--*), 5 文件 hex/rgba 清零
- 替换 bug 修复: 间距粘连(3px0)×31、浅金误映射 accent、深棕误映射 accent-brown、双重 var fallback
- 像素对比验证: 同版本 0% 差异, 旧新 1.5-6%(设计收敛 + 抗锯齿), 无布局回归
- validate 段 11 升级 error gate; TabBar import 合并; footer 文案清理
- 裁剪记录: P2-8 撞名拆分 / P2-9 global 迁移 / P2-10 未用清理 / P2-11 去重(风险>收益, 留待专项)

### 最终验证
- npm run check: 0 错误; npm run test:flow: 42/42
- spec 更新: quality-guidelines qid 约定(新格式+历史变更)、错题本前缀、validate 段说明

## 2026-08-11 · 默写体验改造 + 全页面视觉美化 (08-11-moxie-input-visual-polish 树)

用户反馈"太丑" + 要求原文默写"至少保留一句、不要2空、横线可写答案"。

### 子任务 1: visual-audit-fix
- 13 页 × 桌面/移动截图 + gemini 视觉模型逐张审查 (research/reviews/*.md)
- 修复: workspace-tabs button 蓝色默认边框 (MoxieArticle 用 button 无样式)、注音红色→bronze、底部导航遮挡 (padding-bottom 74→96px)、移动端卡片等高 (grid-auto-rows)、错题卡文字换行、mq-type 加粗
- 复审: mob-home 通过; 默写页发现 legacy 合并导致"2空" → build 合并改为原文默写题型以 book 为准

### 子任务 2: moxie-input-fill
- **数据重写** (scripts/moxie/rewrite-original-moxie.py v5):
  - 全挖句 → 保留前分句挖后分句 (答案取 learning 原文, 78 题)
  - 部分挖句原样 (132 题); 首句完整保留 38 篇
  - 半角标点全角归一化 3806 字段 (qid 排除)
  - 人工修正: 子衿/水调歌头/别云间 (原始答案错乱)
  - 教训: 重写脚本必须幂等+失败回退+校验门; 答案修正分支 (v3) 引入新错误 → 回退
- **交互**: 原文默写 ___ → 可输入横线, 填完点"对答案"自动判分 (normAnswer 容错标点/全半角), 答错自动进错题本 + 显示答案 + 重新作答
- validate 段 12: 无多分句答案/无全挖题断言
- test:flow 步骤 3/6 适配输入流程
- 验证: check 0 错误 + test:flow 42/42 + 浏览器实测 (观沧海 6 空, 答对 1/6 → 错题本 +1)

### 遗留
- 部分挖题的原答案错误 (如次北固山下题3"乡书何处达"答案错位) 未修 (不臆造, 记录)
- 原文默写剩余数据质量: 桃花源记/卖油翁等引号句原样保留

## 2026-08-11 · 4 类默写输入化 + 数据全量排查 (08-11-all-moxie-input)

用户: 4 类默写全部横线输入判分; 词义好多重复; 标点错; 多小题分行; 全面排查数据问题。

### 数据修复 (dedup-legacy-moxie.py v1-v5 + 人工)
- legacy 多小题拆分 46→160 (词义 1.2.3. / 译文 1.2.)
- 词义按【词】去重 (book 优先, title 归一化匹配《》差异) 120 题
- 半角标点归一 legacy 491 + book 520; 序号"1。"→"1." 385
- 译文 [句式] 段删 23 / [鉴赏] 截断 34 / | 答案拆分 122
- 答案补全: learning 句级映射 8 + 分句展开 21 + 人工 32
- 修错乱: 默写效果检测词义 78 题答案错位 → 移除; 水调歌头/别云间等原文重写
- 空数对齐: 咏物抒怀/主题2(答案错位: 日暮乡关→独坐幽篁里)/太常引/骊山/朝天子
- 教训: 1) 合并重复检测必须 title 归一化 (《论语》十二章 vs 论语十二章); 2) 词义"重复词"可能是一词多义, 按 q+答案判; 3) 多小题拆分首段无序号 bug (v1) → v3 补拆; 4) 自动补全答案必须验证包含原答案, 否则引入新错

### 前端
- FillQuestionCard 覆盖 4 类题型: 输入横线 → 对答案自动判分 (容错标点/全半角 + 主干匹配) → 绿/红 + 答案 + 重新作答 + 错题本
- 等价答案 | 展开; 词义【字】高亮; 无空题兜底显示原文
- 实测: 论语词义 17 空 (无重复), 填主干"古代对男子的尊称"判对; 译文 7 空判分

### 遗留
- 骊山 1:1 等 q 与答案结构错乱题 → 前端"答案待补"兜底 (5 题内)
- 等价答案组 6 个 (卖油翁/蒹葭等) 前端任一匹配

## 2026-08-11 · 极致打磨 9.9 (08-11-polish-99)

用户: 精益求精, 极致打磨, 细节完美, 评分 9.9。

### 打磨内容 (polish-list.md 全清单)
- 可访问性: 全局 :focus-visible 焦点环; 输入框 Enter 跳空(最后一空自动判分); 判分滚动到结果; 重答聚焦第一空
- 交互: placeholder 冗余移除; 按钮/提示间距对比度
- 视觉 (gemini 双视口复审 6 页): /moxie 子路由 tab 不高亮【真bug】; 年级数字对比度; 查看译文颜色; 背诵星标位置; 朗读条 wrap; 死代码清理; app-main 桌面宽度
- 性能: 记录 dist 3.5M / chunk 375KB gzip (数据主导, 已分割+预加载)
- 视觉模型误报 3 项 (tab 对比度 7:1 实际正常等) — 用 computed style 实测排除, 不盲改
- 验证: check 0 错误 + test:flow 42/42 + 键盘交互 playwright 实测全通过

## 2026-08-11 · 词义默写格式统一 + 答案串位修复 (08-11-cy-normalize)

用户: 词义默写有的是下划线有的是书名号(【】), 考点词与句子挨得太近; 全面排查。

### 数据 (normalize-cy.py v6, 幂等)
- 格式统一: 单考点 "句子【考点】： ___"; 多考点 "句子：\n考点：___"(每行一个); 无【】题补标
- 答案串位修复 (learning notes 按篇匹配): 周亚夫军细柳/陈涉世家/饮酒/春望/渡荆门/钱塘湖/邹忌/曹刿/出师表 等 700+ 题
- 人工修正 11 题 (一词两义/整句注释误配/标签顺序)
- 教训: 1) 规范化脚本必须幂等(多次运行污染: "： ___" 叠加/高亮被删) — 单/多考点分流 + 已规范化跳过; 2) 删除标签区分"句中高亮 vs 标签"(【词】:___ 单考点=保留, 多考点=删); 3) 注释里别写 \n (Python 转义断行); 4) notes 匹配按篇优先防跨篇误配; 5) 数据修复先 git checkout 恢复再重跑, 避免脏状态叠加
### 前端
- .moxie-word 加 margin/背景; q 内 \n → <br/> 换行
- validate 段 14 新断言; check 0 错误 + test:flow 42/42

## 2026-08-11 · 赏析整合 (08-11-appreciation-merge)

用户: 逐段赏析内容放到原文"查看译文"下方, 做成"查看赏析"折叠; 整篇鉴赏用逐段赏析的样式; 移除逐段赏析标签。

### 实施
- ArticleReader: para-extra 加"查看赏析"按钮(ana-toggle, 与查看译文同排), 展开显示段级 analysis (para-analysis 样式)
- ArticleAppreciation: 移除"逐段赏析" section (内容已并入阅读区), 只剩整篇鉴赏
- ArticleAnalysis: 卡片容器交给 .appr-para (analysis-card 只留内部布局), 标题/内容用 appr-orig/appr-ana 风格 → 整篇鉴赏=逐段赏析样式
- CSS: para-extra flex + gap; ac-culture-label 颜色 (accent 橙黄 → accent-brown 深褐, 对比度修复)
- test:flow 步骤 4 重写 (44/44): 阅读区赏析按钮/展开 + 整篇鉴赏卡片
- 视觉复审: learn-ana OK; appr-whole culture label 对比度 → 修复
