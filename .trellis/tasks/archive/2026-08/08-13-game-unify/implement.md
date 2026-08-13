# 执行计划: 文言文闯关游戏整合

## 前置检查

```bash
npm run typecheck && npm run validate    # 基线全绿后再动手
```

## 实施步骤（顺序执行）

### Step 1: 建展示层映射工具
- 新建 `src/shared/lib/game-terms.ts`：
  - `g(s)`：`学习→历练`、`默写→默诵` 通用替换
  - `MOXIE_TYPE_MAP`：原文默写→原文默诵、理解性默写→理解默诵、词义默写→词义默诵、译文默写→译文默诵、名句默写→名句默诵（对 MoxieSection.type 精确映射）
- 验证：`tsc` 无错

### Step 2: 抽共享训练组件 MoxieTrainer
- 新建 `src/features/moxie/MoxieTrainer.tsx`，从 `MoxieArticle.tsx` **原样搬移**：`FillQuestionCard`、`renderWord`、`renderBlankInputs`、`normAnswer`、`answerOptionsFor`、`matchAnswer`、`blanksCount` 及训练主体逻辑
- 组件接口：`{ article: MoxieArticle; learning?: CanonicalArticle | null; backHref?: string }`
  - 内部保留题型 tab + 判分 + `saveMoxieResult`/`game.addResult`/`addWrong` + 进度显示
  - 顶部"看课文"链接改为可选的 `learning` prop 渲染（关卡页内嵌时隐藏，避免 tab 内嵌 tab 混乱）
- `MoxieArticle.tsx` 重写为薄壳：PageHeader(backTo="/moxie") + `<MoxieTrainer article learning />`
- 验证：`/moxie/:id` 手工/测试仍可做题判分

### Step 3: 关卡页内嵌默诵训练
- `ArticlePage.tsx`：
  - TABS: `learn→历练 / appreciate→鉴赏 / exam→考点 / notes→注释 / moxie→默诵`
  - `tab==='moxie'` 分支改为 `<MoxieTrainer article={moxie} />`（moxie 存在时）；无 moxie 显示"本篇暂无默诵题"
  - `moxieProg` 进度、meta、backLabel 文案游戏化
  - PageHeader `badge`/meta 不变（"中考必考/核心考点"非禁词）
- 验证：`/articles/:id/moxie` 可直接做题、判分、加 XP

### Step 4: 路由重定向
- `App.tsx`：
  - 新增 `MoxieRedirect` 组件（`/moxie/:id` → `/articles/:id/moxie`，articleId 优先，title 兜底，失败回 `/moxie`）
  - 路由顺序：`/moxie/errors` 在 `/moxie/:id` 之前（稳妥）
  - `/moxie` 仍渲染 MoxieHome
- 验证：直接访问 `/moxie/<id>` 落到关卡页默诵 tab

### Step 5: 关卡地图链接
- `LevelMap.tsx`：关卡节点 `to` 改 `/articles/${encodeURIComponent(article.articleId || article.id)}/moxie`
- 验证：地图点击关卡 → 关卡页默诵 tab

### Step 6: 首页/导航/全局文案游戏化
- `TabBar.tsx`：学习→历练
- `Home.tsx`：今日学习→今日历练、默写进度→历练进度、默写错题回炉→失误回炉、开始默写→开始闯关(→/map)、默写x题→默诵x题、继续上次学习→继续上次历练、相关 aria-label/title
- `App.tsx`：h1"文言文闯关"、header-info"篇章·默诵"、footer"历练 + 默诵"
- `HeroStats.tsx`：aria-label 学习等级→历练等级、gx-sub 文案
- `ArticleReader.tsx`：背诵学习引导→诵读引导、去默写训练→去默诵挑战
- `ArticleExam.tsx`/`ArticleNotes.tsx`：题型/考点文案走 `g()` 映射（`pt.point.includes('默写')` 判断保留原数据字符串判断，仅渲染时映射）
- `achievements.ts`：desc 文案改（默写题→默诵题、篇默写→个关卡、连续学习→连续历练、129篇默写→全部关卡）
- `store.tsx`/`data/index.ts`/`utils.ts`/`types.ts`/`HighlightText.tsx`：注释顺手清理
- `data/exam-tags.ts`：**数据值不动**（背诵默写等保留，展示层映射）

### Step 7: 默诵列表/失误回炉文案
- `MoxieHome.tsx`：默写练习→默诵、默写篇目→默诵篇目、默写N题→默诵N题、aria-label 改造；卡片进度条保留
- `MoxieErrors.tsx`：默写错题本→失误回炉、默写列表→默诵列表、默写练习→默诵、错题相关文案

### Step 8: 测试同步（关键）
- 先 `grep -n "学习\|默写" scripts/browser-test.mjs scripts/page-scan.mjs scripts/full-flow-test.mjs` 列出全部断言
- 逐一更新：
  - browser-test(67)：头部统计正则、今日学习标题、五标签断言、学习标签激活、默写 tab 点击/路由断言、默写入口卡(moxie-entry-card 删除或改)等
  - page-scan(85)：路由清单（/moxie/:id 是否仍直接断言渲染）、文案断言
  - full-flow-test(44)：学习流/默写流断言、/moxie/:id 直连
- **新增断言**：默诵 tab 内嵌做题、/moxie/:id 重定向、地图→关卡页
- 同步更新 page-scan 路由清单与 App.tsx 一致性

### Step 9: 回归验证
```bash
npm run typecheck
npm run validate
node scripts/browser-test.mjs   # 67 项
node scripts/page-scan.mjs      # 85 项
node scripts/full-flow-test.mjs # 44 项
npm run build
```
- 终检：`grep -rn "学习\|默写" src/ --include="*.tsx"` 仅剩数据文件与注释

## 验证命令速查
- 基线/回归：`npm run typecheck && npm run validate`
- 快速回归：`node scripts/browser-test.mjs`
- 全路由扫描：`node scripts/page-scan.mjs`
- 满强度流：`node scripts/full-flow-test.mjs`
- 构建：`npm run build`

## 回滚点
- Step 2/3 前后：/moxie/:id 直链可做题（降级路径保留）
- 每步结束跑 typecheck；Step 8 前跑 browser-test 确认功能未破
- 全部完成后一次 git commit；若线上异常，git revert 即回滚（无迁移）
