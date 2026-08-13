# 设计: 文言文闯关游戏整合

## 1. 架构现状

```
路由                             数据                    组件
/                   首页(今日学习+篇目列表+HeroStats)   Home.tsx
/articles/:id/:tab  篇目工作区 5tab(学习/鉴赏/考点/注释/默写) ArticlePage + ArticleReader/Appreciation/Exam/Notes
/moxie              默写列表                            MoxieHome.tsx
/moxie/:id          默写训练(题型tab)                   MoxieArticle.tsx (FillQuestionCard判分)
/moxie/errors       默写错题本                          MoxieErrors.tsx
/map                闯关地图 142关卡→/moxie/:id          LevelMap.tsx
/achievements       成就墙                              Achievements.tsx
```

- 数据：`moxie.json` 的 `MoxieArticle.sections[].type` = 原文默写/理解性默写/词义默写/译文默写（**用户可见**，但存于数据层）
- 判分链路：MoxieArticle 的 `FillQuestionCard` → `saveMoxieResult`(本地进度) + `game.addResult`(XP/连击/关卡) + `addWrong`(错题入 errorbook)
- 关卡 key：`articleId || id || title`（LevelMap 与 addResult 已统一）
- 进度：`wyw_moxie_progress_v1`(localStorage) + `wyw_game_v1`(Game store)

## 2. 目标结构

```
路由                             说明
/                   游戏大厅(今日历练+篇目列表+HeroStats)
/articles/:id/:tab  唯一关卡页 5tab(历练/鉴赏/考点/注释/默诵)
                    └ 默诵 tab 内嵌 MoxieTrainer(题型子导航+判分卡片)
/moxie              默诵列表(保留, 文案改造)
/moxie/:id          → 302 Navigate 到 /articles/:id/moxie
/moxie/errors       失误回炉(保留, 文案改造)
/map                闯关地图 关卡节点→/articles/:id/moxie
/achievements       成就墙(文案改造)
```

## 3. 核心组件重构

### 3.1 抽共享训练组件 `MoxieTrainer`
从 `MoxieArticle.tsx` 抽出**训练主体**为共享组件（保留原文件作为薄壳或删除后由路由重定向承接）：

- 新文件建议：`src/features/moxie/MoxieTrainer.tsx`
- 内容：题型 tab 导航 + `FillQuestionCard` 列表 + 判分/XP/错题入库逻辑（现 MoxieArticle 的 `handleJudged`、进度显示）
- 输入 props：`article: MoxieArticle`（可选带 `learning` 关联用于"看课文"链接）
- 输出：无外部副作用（判分副作用照旧走 saveMoxieResult/game.addResult/addWrong）
- `MoxieArticle.tsx` 重写为薄壳：`<PageHeader backTo="/moxie">` + `<MoxieTrainer>`；或直接删除（路由重定向 `/moxie/:id`→关卡页），**但保留组件不删更稳**——关卡页内嵌用它，/moxie/:id 重定向不再渲染它

> 决策：**保留 MoxieArticle 页面文件**，内部改为渲染共享 `MoxieTrainer`（保持 `/moxie/:id` 直链可访问性作为降级路径），同时 App.tsx 增加 `/moxie/:id` → `/articles/:id/moxie` 重定向路由。双重保障。

### 3.2 ArticlePage 改造
- TABS 常量：`learn→历练 / appreciate→鉴赏 / exam→考点 / notes→注释 / moxie→默诵`
- `tab==='moxie'` 分支：不再渲染跳转入口卡，改为渲染 `<MoxieTrainer article={moxie} />`
- 无 moxie 数据的篇目仍显示 EmptyState（文案改"本篇暂无默诵题"）
- `useEffect` 记录 lastArticle 逻辑保留
- 页面 meta/backLabel 文案游戏化

### 3.3 展示层映射工具 `src/shared/lib/game-terms.ts`
```ts
export function g(term: string): string  // 学习→历练, 默写→默诵, 及题型专名映射
export const MOXIE_TYPE_MAP: Record<string,string> // 原文默写→原文默诵 ...
```
- 用于数据驱动文案：题型名、考点标签("背诵默写"→"背诵默诵")、成就 desc 数据（成就 desc 是代码内静态字符串，直接改字，不走映射）
- 静态 UI 文案：直接改字（更明确、可被 grep 验收）

### 3.4 路由重定向
`App.tsx` 增加：
```tsx
function MoxieRedirect() {
  const { id } = useParams();
  const article = findMoxieArticle(id);
  const target = article?.articleId
    ? findArticleMeta(article.articleId) ?? null
    : findArticleMeta(article?.title ?? '');
  if (!article || !target) return <Navigate replace to="/moxie" />;
  return <Navigate replace to={articleHref(target, 'moxie')} />;
}
<Route path="/moxie/:id" element={<MoxieRedirect />} />
```
注意 `/moxie/errors` 路由需放在 `/moxie/:id` **之前**（react-router 精确匹配，errors 不会被 :id 吞掉——但保持顺序稳妥）。

### 3.5 关卡地图链接
`LevelMap.tsx`：两处 `to={`/moxie/${...}`}` → `to={`/articles/${encodeURIComponent(article.articleId || article.id)}/moxie`}`。需要保证 articleId 存在（LevelMap 的 moxieArticles 均有 articleId 或 id 兜底，与 levelKey 一致）。

### 3.6 文案清单（静态直接改字）
| 位置 | 旧 | 新 |
|---|---|---|
| App header h1 | 文言文学习 | 文言文闯关 |
| App header-info | N 篇课文 · M 篇默写 | N 篇篇章 · M 篇默诵 |
| App footer | 学习 + 默写练习 | 历练 + 默诵 |
| TabBar | 学习 | 历练 |
| Home | 今日学习/默写进度/默写错题回炉/开始默写/默写x题 | 今日历练/历练进度/失误回炉/开始闯关/默诵x题 |
| HeroStats aria | 学习等级 | 历练等级 |
| ArticleReader | 背诵学习引导/去默写训练 | 诵读引导/去默诵挑战 |
| MoxieHome | 默写练习/默写篇目/默写N题 | 默诵/默诵篇目/默诵N题 |
| MoxieErrors | 默写错题本/默写列表 | 失误回炉/默诵列表 |
| MoxieArticle | 默写篇目/默写列表/默写书 | 默诵篇目/默诵列表/默诵书 |
| achievements | 默写题/篇默写/连续学习/129篇默写 | 默诵题/个关卡/连续历练/全部关卡 |
| ArticleExam/Notes | 默写(题型引用) | 走 g() 映射 |

## 4. 数据流（不变部分）

```
做题 → FillQuestionCard.check() → onJudged(qid, pass, allPass)
  → saveMoxieResult(qid, pass)          [wyw_moxie_progress_v1]
  → game.addResult(levelKey, qid,...)   [wyw_game_v1 XP/连击/关卡/成就]
  → addWrong(...)                       [错题回炉]
```
本次改造**不触碰**这条链路与任何存储 key。仅改变渲染入口（关卡页内嵌 vs 独立页）。

## 5. 权衡

| 方案 | 取舍 |
|---|---|
| 数据 json 保持"原文默写"等，展示层 g() 映射 | 构建管道/校验零风险；代价是每处展示要套映射，遗漏会有残留 |
| /moxie/:id 保留组件+重定向 | 兼容旧链接/深链/测试，双保险；代价是少量冗余 |
| 保留 /moxie 列表页(改文案) vs 重定向 /map | 保留：附录篇目仅此可浏览、测试覆盖；不破坏年级浏览入口 |
| 静态文案直接改字 vs 全走 g() | 直接改字可被 grep 验收、无运行时依赖；g() 只用于数据驱动文本 |

## 6. 兼容性 / 回滚

- 旧链接兼容：`/moxie/:id`（重定向）、`/learning/:title`（已有旧重定向）、`/errors`→`/moxie/errors`（已有）
- 数据兼容：json 字段、localStorage key、qid 全部不动 → 用户进度零丢失
- 回滚：纯前端改动，git revert 即可；无迁移脚本
- 测试：三套 playwright 断言同步更新，任何文案/路由残留会被 67/85/44 回归拦住

## 7. 风险与对策

| 风险 | 对策 |
|---|---|
| 题型名映射遗漏 → 用户看到"原文默写" | 验收 grep + page-scan 断言"默诵"出现、"默写"不出现 |
| MoxieTrainer 抽取破坏判分/XP | 保持 FillQuestionCard 逻辑原样搬移，回归 44 满强度流覆盖 |
| 重定向循环 | 重定向目标固定为 /articles/:id/moxie，不递归 |
| 测试里大量文案断言要同步 | implement 阶段先列测试断言清单再改，改完统一重跑 |
| 附录篇目无关卡(地图排除)但列表有 | /moxie 列表保留，附录卡片点击仍走重定向(articleId 可能为空→用 title 匹配 findArticleMeta) |
