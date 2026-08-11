# 项目全面审查报告

- 日期: 2025-08-11
- 范围: 代码架构 / 类型安全 / 样式 / 数据 / 运行时 五层
- 审查方式: 源码静态扫描 + 数据全量脚本校验 + 构建验证(`npm run check` 42/42 通过)

---

## 0. 审查结论摘要

项目整体架构清晰(数据访问层、组件分层、懒加载、错误边界、构建管道均健康),类型定义与运行时数据结构基本一致,构建与 SSR 验证全绿。

但存在 **2 个 P0 级数据缺陷** 直接损害用户体验:

1. **默写 qid 全局不唯一(361 个重复,涉及 56% 题目)** — 进度存储按 qid 记录,导致用户答题进度互相污染、错题本错乱。
2. **默写篇目顶层 id 重复(10 条)** — React key 冲突 + 路由跳转指向错误篇目。

另有样式体系未完全 token 化(141+ 硬编码)、CSS 类名跨文件撞名等问题,见下文分级清单。

---

## 1. 数据层 (P0/P1 集中区)

### P0-1: 默写 qid 全局不唯一 — 进度错乱

- **位置**: `src/data/raw/moxie.json`(qid 字段);`src/data/moxie.ts` 的 `saveMoxieResult`/`loadMoxieProgress`/`articleProgress` 按 qid 存取;`scripts/build-runtime-data.mjs:780-791` 的 qid 兜底生成(`it.qid || ...` 因 raw 已有 qid 而**不生效**)
- **现象**: 1651 题中仅 722 个唯一 qid,361 个 qid 重复(重复 2-31 次,分布 {2:81, 3:146, 4:120, 5:2, 6:4, 7:1, 8:1, 16:1, 26:1, 28:1, 30:2, 31:1})。
- **根因**: raw 抽取时 qid 规则为 `moxie:{title}:{section内序号}`,**未包含 section(题型)序号**。同一篇目下"原文默写/理解性默写/词义默写/译文默写"4 个 section 的 items 各自从 `:0` 编号,导致同 qid 指向最多 4 道不同题目。
- **影响**: 用户答对"理解性默写第 1 题"时,`articleProgress` 把同 qid 的"词义默写第 1 题"也计为已答/全对;错题本(`moxie:` 前缀条目)同样串题。
- **修复建议**: qid 格式改为 `moxie:{title}:{sectionIdx}:{itemIdx}`(build 脚本**强制重写** qid,不依赖 raw;或修正 raw)。旧进度数据无法精确迁移(本身错乱),修复后旧 qid 悬空、进度归零可接受——在发布说明中注明。

### P0-2: 默写篇目顶层 id 重复(10 条)

- **位置**: `src/data/raw/moxie.json` + `moxie-legacy.json` 合并产物 `runtime/moxie.json`;`src/features/moxie/MoxieHome.tsx:84`(`key={article.id}` + 路由 `to={/moxie/${article.id}}`)
- **现象**:
  - `moxie-默写效果检测` ×6(book_page 15/32/57/76/88/110,grade 七上/附录/八上/附录/附录/附录)
  - `moxie-约客` ×2(book title "约客 3年9考" + legacy title "约客")
  - `moxie-渡荆门送别` ×2(book title "渡荆门送别 3年21考" + legacy title "渡荆门送别")
- **根因**: ①"默写效果检测"是每单元检测页,OCR 抽取时同 id 复用;②book title 带考频后缀(`3年N考`)导致 `titleKey` 匹配失败,legacy 同名篇目被重复 push。
- **影响**: React key 冲突警告;6 个"默写效果检测"卡片点击跳转**同一 URL**;约客/渡荆门送别出现两个入口。
- **修复建议**: ①id 唯一化(如 `moxie-默写效果检测-15`);②清理 book title 考频后缀(见 P1-3)后 legacy 合并不再撞车;build 时对合并结果做 id 唯一性兜底校验。

### P1-3: moxie-book title 混入考频标注(5 条)

- **位置**: `src/data/raw/moxie.json`
- **现象**: `约客 3年9考`、`渡荆门送别 3年21考`、`过松源晨炊漆公店(其五) 3年3考`、`《孟子》三章 得道多助,失道寡助 (3年7考)`、`过零丁洋(3年45考)`
- **影响**: ①前端卡片直接展示带考频的标题;②`titleKey` 与 legacy/learning 匹配失败(造成 P0-2 的约客/渡荆门送别重复);③`articleKey` 与学习篇目匹配失败(联动降级)。
- **修复建议**: 从 title 剥离 `\d+年\d+考` 后缀(保留原题名),必要时写入独立字段。

### P1-4: raw 目录备份残留

- **位置**: `src/data/raw/learning.json.bak3`、`src/data/raw/zhenti_web.json.bak`、`src/data/raw/zhenti_web.json.bak2`
- **影响**: 混淆数据源,可能被误读;仓库膨胀。
- **修复建议**: 与主文件 diff 确认后删除,`.gitignore` 加 `*.bak*`。

### P1-5: zhenti_web 同题不同答案(2 组)→ **已复核,误报关闭**

- **结论**: 5 条(web-bg-049/056/077/101/108)实为**不同篇目**的同模板题干(省/市/题型/题干相同但 title 不同: 江南逢李龟年/晚春/浣溪沙/如梦令/采桑子),非重复题,数据健康。
- **教训**: 重复判定必须包含篇目维度。
- **防线**: validate 段 9 新增"完全重复(含篇目)"断言 + "同题干不同答案"警告(当前 0 组)。

### P1-6: exam-tags 篇目与 learning 不匹配

- **位置**: `src/data/exam-tags.ts`
- **现象**: `望洞庭湖上张丞相` 在 learning 中不存在(应为"望洞庭湖赠张丞相"之类)。
- **影响(比预想严重)**: practice 该篇 5 题因标题匹配失败**从篇目练习中丢失**(runtime 该篇仅有 exam_point+exam_gen 题);考试标注同样失效。
- **修复**: `practice.json` 5 处 + `moxie-legacy.json` 6 处 + `learning.json` 4 处 + `exam-tags.ts` 1 处,统一为《望洞庭湖赠张丞相》;5 题已挂回篇目。

### 数据层健康确认(无需处理)

- `questions`(2026 题)/ `words` 无重复 id;`article-meta` 与 `articles` id 集合一致;moxie `articleId` 全部指向存在的学习篇目。
- zhenti / zhenti_web / practice / learning / handwritten / exam_point_rewrites 内部 id 唯一。
- zhenti_web 338 条 = 110 篇 × 一文多题(设计使然),除 P1-5 两组外无完全重复。
- practice ∩ learning 标题重叠 124 篇为设计(practice 仅贡献题目,原文/译文字段不消费)。
- 原文准确性抽样(岳阳楼记/醉翁亭记/曹刿论战/三峡 14 个名句)全部正确;译文 127 篇仅"竹里馆"46 字偏短(待人工确认是否完整)。
- 手写题库 11 篇 46 题无空题干/空答案;exam_point_rewrites 127 篇全部有重写内容。

---

## 2. 样式层 (P2)

### P2-7: 硬编码值未走令牌体系

- **统计**(`tokens.ts` 已定义完整设计令牌): hex 色 157 处 / rgba 29 处 / font-family 11 处 / 非标准 border-radius 97 处 / 硬编码 px ~324 处,分布于 4 个 feature CSS + global.css(global.css 49 hex、article.css 95、article-page.css 26、home.css 18、moxie.css 2)。
- **影响**: 主题切换、视觉统一、暗色适配均无法实现;数值漂移。
- **修复建议**: 全部替换为 `var(--*)`;缺失令牌先补 `tokens.ts`(按既有分组);1px border 等细值允许保留并注释说明。

### P2-8: 跨文件类名撞名(27 组)

- **典型**: `.active` 在 4 个文件定义(global tab 激活 / home 年级 tab / article 按钮 / article-page 工作区 tab),语义各异却共享全局类名;`.on` 在 article.css(阅读栏激活)与 moxie.css(判题对/错)语义完全不同;`.chip`、`.btn`、`.article-card`、`.content-head`、`.ac-badge` 等 global 与 feature 双重定义。
- **影响**: 样式覆盖顺序敏感(后加载 CSS 覆盖先加载),改一处影响全局;feature 想覆盖 global 需依赖加载顺序,脆弱。
- **修复建议**: feature 私有样式加前缀(如 `.moxie-*`、`.art-*`);global 与 feature 语义不同的类名拆分或限定作用域。

### P2-9: global.css 过载(773 行)

- 包含大量 feature 级样式(`.article-list`/`.article-link`/`.grade-*`/`.stem-*`/`.tree-*`/`.rc-*` 等),与 feature CSS 职责重叠。
- **修复建议**: 按使用方迁移到对应 feature CSS;global.css 仅保留 shell/通用基础样式。

### P2-10: 疑似未用样式(208 个类名)

- TSX `className` 静态引用扫描未命中: `.auto-practice`/`.ep-item`/`.gloss-num`/`.feedback-pop`/`.hover-lift`/`.btn-accent`/`.article-tabs` 等 208 个。
- **注意**: 部分可能经 JS 动态拼接(扫描不完全),删除前需人工复核(可用运行时 DOM 扫描二次确认)。
- **修复建议**: style-unify 中逐项复核后清理。

### P2-11: 文件内重复定义

- `global.css .split-nav ×38`、`.stagger ×9`、`.btn ×7`、`.active ×6`、`.article-card ×5`;`home.css .article-grid ×14`、`.entry-card ×10` 等。
- **说明**: 部分为媒体查询内合法重复;部分为冗余块(如不同断点重复相同声明)。
- **修复建议**: 去重相同声明块;媒体查询内重复保留但合并相同值。

---

## 3. 代码架构层 (P3)

- 架构健康: `data/index.ts` 惰性加载核心数据 + 轻量 meta 首屏,职责清晰;组件分层合理(shared/ui 8 个通用组件);路由懒加载 + ErrorBoundary + Suspense 完备;errorbook Context 单例防 HMR 失配、容量上限 600 条,设计良好。
- `App.tsx` footer 文案 "数据 v3.0" 与 package.json version 2.0.0 不一致(若指数据版本则需说明)。
- `TabBar.tsx` 两行 `react-router-dom` import 可合并(风格统一项)。

## 4. 类型安全层 (P3)

- `types.ts`(285 行)与运行时结构一致;`MoxieArticle.book_page` 为 number 但 legacy 条目为 0(语义: 无页码,建议注释或改 `number | null`);`PracticeArticle.original_text/translation/notes` 实际不消费但类型保留(供 future 使用,可注明)。
- 全项目无 `any` 滥用(tsc --noEmit 通过,无 TODO/FIXME/debugger 残留)。

## 5. 运行时层 (确认健康)

- `npm run check` 42/42 通过(data:build → validate → typecheck → vite build → SSR 深链 10 条)。
- `article-meta` ↔ `articles` id 无漂移;moxie articleId 无死链;路由兜底 `/unknown → /` 正常。
- ssr-check 存在 `<Navigate>` initial render 噪音警告(StaticRouter 语义,非 bug,可忽略或加注释)。
- localStorage 键: `wyw_moxie_progress_v1`(qid 修复需注意)、`wyw_errorbook_v2`、`wyw_last_article`、`wyw_deep_link`,命名一致。

---

## 6. 修复范围建议

### 进入 data-audit-fix(必做)
| 编号 | 级别 | 内容 |
|---|---|---|
| P0-1 | 阻断 | moxie qid 唯一化(section 序号纳入)+ 进度兼容评估 |
| P0-2 | 阻断 | moxie 顶层 id 唯一化(10 条)|
| P1-3 | 重要 | moxie-book title 剥离考频后缀(5 条)|
| P1-4 | 重要 | 删除 raw 备份残留 3 个文件 |
| P1-5 | 重要 | zhenti_web 2 组同题核对修正(5 条)|
| P1-6 | 一般 | exam-tags "望洞庭湖上张丞相" 对齐 |
| — | 增强 | validate-data.mjs 新增: raw id/qid 唯一、跨源重复题、zhenti_web 完全重复、moxie 合并 id 兜底 |

### 进入 style-unify(必做)
| 编号 | 级别 | 内容 |
|---|---|---|
| P2-7 | 一般 | 硬编码值 token 化(157 hex + 29 rgba + 11 font + 97 圆角)|
| P2-8 | 一般 | 跨文件撞名类名拆分(27 组)|
| P2-9 | 一般 | global.css 去重迁移(773 行瘦身)|
| P2-10 | 一般 | 208 个疑似未用类名复核清理 |
| P2-11 | 建议 | 文件内重复块去重 |

### 裁剪/建议(本期可不做)
- P3-12/13/14: footer 版本文案、import 合并、ssr 警告注释 — 随手修复,不单列。
- 运行时 DOM 级未用样式二次确认 — 依赖浏览器环境,成本高,以静态复核替代。

---

## 7. 验证基线(修复后复测)

```bash
npm run check        # data:build + validate + typecheck + build + ssr 全绿
npm run test:flow    # 端到端 42/42
# 新增: validate-data.mjs 中 qid/id 唯一断言、样式硬编码扫描断言
```
