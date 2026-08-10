# 全面诊断报告 — wuhan-wenyanwen-app

诊断日期: 2026-08-10 · 任务: `.trellis/tasks/08-10-full-diagnosis`
诊断方式: 命令证据 + 代码审查 + 数据交叉比对(全部发现含可复现证据,研究产物见 `research/`)

## 0. 总览

| 维度 | 结果 |
|---|---|
| 数据校验 `npm run validate` | ✅ 0 错误 / 9 警告(逐条定性见 1.1) |
| 数据质量抽查(重复/残留/悬空/空值/截断) | ✅ 0 问题(spot-check.mjs 输出见 research/) |
| TypeScript `tsc --noEmit` | ✅ 通过 |
| 构建全链路 `npm run check` | ✅ 通过(data:build → validate → typecheck → vite build → ssr-check 12 路由) |
| PWA 离线 | ✅ SW 注册/缓存/离线加载全部实测通过 |
| 全流程 `npm run test:flow` | ✅ 46/46 通过,0 控制台错误 |
| 深链恢复 | ✅ 实测到达 /cards |

**问题统计: P0(严重) 0 · P1(警告) 4 · P2(提示/清理) 8**

核心结论: **应用功能健康,无阻塞性缺陷**。主要问题集中在「文档/代码漂移」:README 声明与实现不一致、一批已移除功能的死代码残留未清理。

---

## 1. 数据层 (R1)

### 1.1 validate 9 个警告逐条定性

| # | 警告 | 定性 | 说明 |
|---|---|---|---|
| 1 | 无注释段落 5 条(jc-zuoqianzhilanguanshizhizunxiang 3 + jc-guanju 2) | **KNOWN-OBSERVATION** | 诗歌尾联/重章句无注释,正常文学现象,前端无影响 |
| 2 | 有拼音词条 0/2144 (0%) | **KNOWN-OBSERVATION** | words.json 无 pinyin 字段,但前端字词卡不渲染拼音;原文注音由 pron-dict.ts 独立提供(buildPronMap 196 条 expose),不依赖此字段 |
| 3 | 有例句义项 706/2495 (28%) | **KNOWN-OBSERVATION** | 教材课文注释天然少例句,glossary 实虚词才有;非缺陷 |
| 4 | 无关联题目: 0 | **KNOWN-OBSERVATION** | 值为 0 表示无孤立题目,是"好消息被标为警告"的误报式提示 |
| 5 | 题集 唐诗三首 已空 | **KNOWN-OBSERVATION** | 题目并入单篇(管道注释"砍独立页后并入单篇练习"),空壳集合残留,前端无 /collections 入口,无用户影响 |
| 6 | 题集 《诗经》二首 已空 | 同上 | 同上 |
| 7 | 题集 短文两篇 已空 | 同上 | 同上 |
| 8 | 无题目文章 0/126 | **KNOWN-OBSERVATION** | 同 #4,值为 0 = 全部文章有题 |
| 9 | 段落编号覆盖 39/82/5 | **KNOWN-OBSERVATION** | validate 自注"仅观察;序号不在前端渲染" |

**结论: 9 个警告全部为已知观察项,无真实数据缺陷。**

### 1.2 管道对齐与数字核实

build-report.json 关键数字(与 README 声明对比):

| 指标 | README 声明 | 实际 runtime | 差异 |
|---|---|---|---|
| 文章数 | 126 篇 | 126 | ✅ 一致 |
| 字词条 | 2168 词条 | **2144** | ⚠ README 多 24 |
| 词义 | 2519 义 | **2495** | ⚠ README 多 24 |
| 题目 | 2011 题 | **2022** | ⚠ README 少 11 |
| 综合题集 | 16 个 / 111 题 | 16 个 / **40 题** | ⚠ README 题数严重虚高(111 vs 40) |
| 练习组 | — | 141 组 / 740 题 | README 未声明 |

题目构成(按 origin): practice 735 · exam_gen 426 · exam_point 393 · related 246 · zhenti 181 · handwritten 41 = 2022

### 1.3 数据质量抽查(spot-check.mjs, research/ 留档)

- ✅ 文章/字词/题目/题集 id 无重复;字词 (word+article) 2144/2144 唯一
- ✅ 文本乱码(□/watermark/undefined 等)0 条;英文残留以 validate"无英文残留"为准(通过)
- ✅ 必填字段(标题/作者/年级/原文/theme/题干/答案)无空值
- ✅ 引用无悬空: 文章→题目 1982 条、题集→题目 40 条、题目→文章/题集、字词→文章 全通过
- ✅ 题干截断 0;无归属(孤立)题目 0

### 1.4 文档漂移清单

1. **README 数字过时**(P2): 2168→2144 词条、2519→2495 词义、2011→2022 题、综合题集 111→40 题。注意: 词汇数字实际是**下降**的(合并去重后),README 可能基于早期管道版本。
2. **README 功能表与实现不符**(P1,见 2.3/4.1): "SM-2 间隔复习 + 四档评分 + 词义测验"不存在;首页"篇目中心分类入口"(学习/字词/复习/错题四卡)实际只有错题本 1 卡。
3. **README 模块表有 review/collections 但代码无此模块**(P1): "复习 | 本篇真题/考点/练习聚合"在代码中已并入学习页 tab;综合题集功能已移除(flow-test 第 7 节"综合题集 (已移除)"实证)。
4. build-report `deduplicatedQuestions: -297` 负值(P2): 字段名误导——它 = rawQuestions(1725) − questions(2022),但负差来自合并后又追加 426 条 exam-gen 题,并非"新增了题";建议改名或拆分统计口径。
5. DEPLOY.md 描述与实现一致(404.html 兜底 ✓、SW 网络优先 ✓)。

---

## 2. 前端代码质量 (R2)

### 2.1 静态检查

- ✅ `tsc --noEmit` 严格模式通过(0 错误)。
- ✅ 无 eslint 配置(项目不引入,不视为缺陷)。

### 2.2 死代码清单(有消费者检查实证)

| 文件/符号 | 状态 | 证据 |
|---|---|---|
| `src/data/card-progress.ts`(CARD_STATE_KEY/loadCardProgress) | **死代码** | 全项目 0 引用(仅自引用) |
| `src/shared/lib/utils.ts` 的 `sm2Schedule` | **死代码** | 全项目 0 引用 |
| `src/features/cards/FlipCard.tsx` | **死组件** | 0 引用 |
| `src/features/cards/RateBar.tsx` | **死组件** | 0 引用 |
| `src/features/cards/StatsBar.tsx` | **死组件** | 0 引用 |
| `src/features/home/Home.tsx` CATEGORIES 常量(5 分类卡) | **死代码** | 定义后无渲染循环;注释声称"其他标签点击时跳转对应页面"但无实现 |
| `src/features/home/home.css` `.entry-review` | **死样式** | CSS 有定义,JSX 无对应元素 |
| `src/shared/ui/EmptyState.tsx` | **死组件** | 0 引用 |
| `src/features/practice/PracticePage.tsx` `errorHref = '/collections'` 默认值 | **死默认值** | `/collections` 路由不存在;唯一调用方 ArticlePage 传了 `/errors`,默认值永不生效 |

> 附注: `main.tsx` 启动时主动删除 `wyw_cards_v2/wyw_cards_seen_v2/wyw_cards_seen_v1`(注释"翻卡功能已移除 E10")——证明 SM-2 翻卡被**有意移除**,但上述 SM-2 相关代码(组件/工具/存储层)未同步删除,属清理遗漏。

### 2.3 组件/状态层审查结论(无新缺陷)

- ✅ `ArticleReader.tsx`(449 行,最大组件): document click/keydown 监听有清理;hoverTimer 清理;stopSpeak 卸载清理;useMemo 缓存充分;注释词序号/首现计算正确。
- ✅ `PracticeSession.tsx`: 判分逻辑(多选 ABD/选项包含匹配/自评)正确;函数式更新避免闭包竞态;judgedCount/correctCount useMemo 缓存;未判题计答错有提示。
- ✅ `errorbook/store.tsx`: storage 事件跨 Tab 同步有清理;容量上限 600 防溢出;旧格式迁移(数组 vs {items});Context 挂 globalThis 防 HMR 失配——质量高。
- ✅ `shared/lib/utils.ts` loadLS/saveLS: JSON.parse 异常兜底、写入失败显式 warn。
- ✅ `card-progress.ts`(虽为死代码,逻辑本身): 旧 ID→新 ID 别名迁移正确。
- ✅ 数据访问层 `data/index.ts`: 全量 Map 索引 + titleKey 归一化,无裸 OCR 字段泄漏。

---

## 3. 构建与部署链路 (R3)

### 3.1 全链路构建

`npm run check` 全通过: data:build ✓ → validate(0 错) ✓ → typecheck ✓ → vite build(341ms) ✓ → ssr-check 12/12 路由 ✓(含 404 兜底路由)。

### 3.2 产物体积

| 产物 | 大小 |
|---|---|
| dist 总计 | 2.9 MB |
| data-questions.js | 1.2 MB |
| data-articles.js | 672 KB |
| data-words.js | 588 KB |
| index.js | 208 KB |
| 其余(懒加载页/CSS) | < 60 KB 每个 |

> 3 个大数据 chunk 为 JSON 内嵌的领域数据(题目/文章/字词),已按 advancedChunks 拆分且 `modulepreload` 预取;无失控的 vendor 包。对纯静态离线应用属合理规模。首屏 JS ~1.5MB(gzip 后约 ~400KB,数据为主),可接受。

### 3.3 PWA 完整性(实测)

- ✅ manifest.webmanifest: name/short_name/display:standalone/icons(192+512 PNG 尺寸实测正确)/theme_color 齐全。
- ✅ sw.js 策略: 壳预缓存(install 解析 index.html 提取 hash 资源,实测 7 个资源全部命中)+ stale-while-revalidate + 导航网络优先→缓存回退。
- ✅ **离线实测**: SW 注册 active、缓存 wyw-shell-v5、setOffline(true) 后 reload 页面正常渲染(文章卡 19 张,无错误)。
- ✅ index.html 引用 manifest/SW 注册(仅 PROD)。

### 3.4 深链与 404 兜底

- ✅ `public/404.html` 逻辑: 存 `wyw_deep_link` → `location.replace('/')`;`DeepLinkRestore` 读后 navigate——与 DEPLOY.md 一致。
- ✅ **实测**: 注入 wyw_deep_link='/cards' 后 reload 到达 /cards。
- ✅ ssr-check 全部深链路由可渲染。

### 3.5 子路径部署隐患 (P2,仅提示)

`sw.js` 的 `absolute()` 用 `new URL(u, self.location.origin)` 解析相对资源——若部署在子路径(如 GitHub Pages 项目页 `user.github.io/repo/`),预缓存会指向 `origin/assets/...` 而非 `origin/repo/assets/...`。当前部署(根路径/Vercel)不受影响;README 声明"可离线"且 base:'./' 表明设计兼容子路径,建议 SW 改用 `self.registration.scope`。

---

## 4. 功能行为测试 (R4)

### 4.1 全流程冒烟

`npm run test:flow` **46/46 通过,0 失败,0 控制台/页面错误**。覆盖: 首屏 → 学习(注释浮层/译文/朗读) → 练习(单题流/判分/错题入本) → 鉴赏 → 错题本 → 字词卡(实虚词/弹窗/背诵入口) → 综合题集(已移除✓) → 旧链接深链 → 移动端 375px 无溢出(5 页) → 考点图谱(过滤/弹窗/做题)。

### 4.2 关键交互补充验证

| 交互 | 结果 | 证据 |
|---|---|---|
| PWA 离线加载 | ✅ | 实测 offline reload 正常 |
| 深链恢复 /cards | ✅ | 实测到达 |
| 背诵卡三模式(首字/接龙/译文) | ❌ **不存在** | Flashcards.tsx 仅"原文→译文翻卡"单模式;README 与 memory 声称的三模式已随重构移除 |
| 朗读设置持久化 | ⚠ 未单独验证 | full-flow 仅验证朗读按钮存在;朗读进度高亮逻辑代码审查通过 |
| SM-2 字词复习(README 声称) | ❌ **不存在** | 见 2.2,功能已移除但 README 未更新 |

---

## 5. 问题清单(按优先级)

### P1(建议尽快处理 — 文档/一致性)

| # | 问题 | 证据 | 影响 | 修复建议 |
|---|---|---|---|---|
| 1 | README 功能声明与实现不符(SM-2 翻卡/四档评分/词义测验/三模式背诵已移除) | 死代码清单 + main.tsx 清理注释 + flow-test §7 | 误导用户与后续维护者 | 重写 README 功能表,反映当前真实功能(字词列表+弹窗+背诵翻卡) |
| 2 | README 声称"综合复习 16 题集 111 题"但功能已移除且无路由 | flow-test §7 实证 + App.tsx 无 /collections 路由 | 数据层 16 集合(40 题)成为死数据;文档夸大 | 删除/归档 collections 相关 README 声明;确认是否保留数据(3 个空集合建议管道清理) |
| 3 | 死代码残留: SM-2 全套(card-progress.ts/sm2Schedule/FlipCard/RateBar/StatsBar)+ EmptyState + CATEGORIES + entry-review CSS + errorHref 死默认值 | 0 引用实证(2.2) | 维护混淆、包体略增;CATEGORIES 注释描述的功能不存在,极易误导 | 清理任务: 删死组件/常量/样式,errorHref 默认值改为 '/errors' 或删除 |
| 4 | README 数据规模数字过时(2144/2495/2022/40) | runtime 实测 | 文档漂移 | 用 build-report.json 数字更新 README |

### P2(提示/低优先)

| # | 问题 | 证据 | 修复建议 |
|---|---|---|---|
| 5 | sw.js 子路径部署下预缓存路径错误 | absolute() 用 origin 而非 scope(3.5) | 改用 `self.registration.scope` |
| 6 | build-report deduplicatedQuestions 负值误导 | -297(1.4) | 重命名为 mergedQuestionsDelta 或拆分统计 |
| 7 | 3 个空题集集合残留(唐诗三首/诗经二首/短文两篇) | collections.json(1.1) | 管道端不输出空集合,或 validate 降级为 info |
| 8 | validate 两个"值为 0 的警告"(无关联题目/无题目文章)误报式提示 | validate 输出(1.1) | 改为 check(值>0 才 warn)或降为 info 行 |
| 9 | 拼音字段 0% 警告语义不清 | words.json 无 pinyin(1.1) | validate 注释说明拼音由 pron-dict 提供,非数据缺陷 |
| 10 | 首页仅有 1 张入口卡(错题本),CATEGORIES 声称的 4 卡不存在 | Home.tsx(2.2) | 若有意精简则删 CATEGORIES 常量;若需恢复入口则补实现 |
| 11 | 数据 chunk 体积(questions 1.2MB) | 产物分析(3.2) | 可选: 惰性按需加载(当前一次性加载为离线设计,非缺陷) |
| 12 | 背诵句译文 >80 字被截断加"…" | buildReciteQueue(Flashcards.tsx:58) | 前端翻卡可展示全文,截断仅为列表观感;如有需要可保留 |

---

## 6. 建议后续动作

1. **P1-1~4 一批文档更新 + 死代码清理任务**(小规模,可直接执行)。
2. 若产品方向确定"综合题集"不再回归,归档 `src/data/runtime/collections.json` 的 3 空集与 README 相关声明;若未来要恢复,数据仍在。
3. 长期: 将 `npm run check` 纳入每次变更的必跑门禁(当前已在 package.json 提供)。

## 7. 研究产物清单

- `research/validate-full.txt` — validate 完整输出(2009 行)
- `research/spot-check.mjs` + `research/spot-check-output.txt` — 数据质量抽查脚本与结果
- `research/check-full.txt` — npm run check 全链路输出
- `research/flow-test.txt` — Playwright 全流程输出(46/46)
