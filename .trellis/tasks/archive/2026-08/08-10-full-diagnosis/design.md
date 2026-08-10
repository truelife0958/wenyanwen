# 全面诊断 — 技术设计

## 诊断方法总览

诊断采用「命令证据 + 代码审查 + 数据交叉比对」三层方法,每个发现必须有可复现证据:

```
证据级别: 命令输出(强) > 代码引用(行号,中) > 数据样本(中) > 推断(弱)
```

## D1 数据层诊断设计

### 1.1 validate 警告逐条定性
- 运行 `npm run validate` 捕获完整输出,提取全部 9 个警告条目。
- 对每个警告,用现有 memory/历史记录(项目 memory #249/#270/#300 等)判定是否已知观察项;
  对可疑项(如"题集已空")深入 runtime 数据核实影响面。
- 分类: `KNOWN-OBSERVATION`(已知无害)/ `REAL-DEFECT`(真实缺陷)/ `DOC-DRIFT`(文档漂移)。

### 1.2 管道对齐检查
- 读 `build-runtime-data.mjs`,提取其处理的 raw 源文件与产出的 runtime 文件。
- 统计口径: 文章数(articles.json)、题目数(questions.json + collections)、字词数(words.json)、题集数(collections.json)。
- 与 README 声明(126 篇 · 2168 词条/2519 词义 · 2011 题)对比,输出漂移清单。

### 1.3 数据质量抽查
用 node 脚本对 runtime JSON 做定向抽查:
- 重复: 文章 id、字词条目、题目 id 去重检测。
- 残留: 英文单词/水印/OCR 乱码(`[` 异常、`□`、连续空白)扫描。
- 截断: 标题/正文结尾异常字符(无句号结尾的中文长句等)。
- 悬空引用: article.questionIds → questions.id;collection.questionIds → questions.id;card wordId → words.id。
- 空值: 必填字段缺失(article.title/author、question.prompt/options 等)。

### 1.4 文档漂移
- 提取 README 中所有数字声明(篇数/词条/题数/功能表),与 runtime 实际值逐一比对。
- 检查 DEPLOY.md 声称的机制(404.html、SW 深链)是否在 public/ 与代码中真实存在。

## D2 前端代码质量设计

### 2.1 静态检查
- `npm run typecheck` 全量。
- `npx eslint` 不存在则跳过(项目无 eslint 配置则不引入)。
- 用 `grep`/`rg` 扫描已知死代码标记: `.type-grid.two-cards`、`features.js`、`annotation`/`extra`/`exam` 数据入口。

### 2.2 组件审查范围(人工 + 定向 grep)
- `src/features/learning/ArticleReader.tsx` — 最大最复杂组件: 渲染循环 key、事件监听清理、scrollIntoView 调用点。
- `src/features/practice/PracticeSession.tsx` — 会话状态机。
- `src/features/cards/Flashcards.tsx` + `card-progress.ts` — SM-2 算法、localStorage 读写。
- `src/features/recite/*` — 三模式逻辑。
- `src/shared/lib/ls.ts` — localStorage 封装: JSON.parse 异常兜底、版本迁移。
- 定向 grep: `useEffect(` 中未清理的 `addEventListener`/`setInterval`/`setTimeout`;`.map(` 缺 `key`(人工抽查)。

### 2.3 状态层审查
- `errorbook/store.tsx` — 上下文 + localStorage 同步模式。
- `card-progress.ts` — SM-2 数据模型与 `wyw_cards_v1` / `wyw_recite_cards` 键。

## D3 构建与部署链路设计

### 3.1 全链路构建
- `npm run check`(含 data:build → validate → typecheck → vite build → ssr-check),记录每步耗时与结果。

### 3.2 PWA 完整性
- 读 `public/` 清单: manifest.webmanifest 字段(名称/图标/start_url/display)、sw.js 缓存策略(预缓存列表是否与 dist 产物匹配——重点检查 build 哈希文件名是否被 SW 预缓存正确引用)。
- 检查 index.html 中 manifest/SW 注册链接。
- 图标资源文件存在性与尺寸。

### 3.3 深链与 SSR
- 验证 `public/404.html` 兜底逻辑与 `DeepLinkRestore` 组件(代码审查)。
- ssr-check 各路由渲染输出非空。

### 3.4 产物分析
- `du -sh dist/*` 与 dist 内 JS/CSS 文件大小排序。
- 检查是否存在超大 chunk(>500KB)或未拆分的 vendor 包。

## D4 功能行为测试设计

### 4.1 全流程冒烟
- `npm run test:flow`,若失败收集失败断言与 console 错误。
- 补充 `scripts/browser-test.mjs` 检查其覆盖范围,决定是否运行。

### 4.2 关键交互补充(用 playwright 脚本或浏览器测试)
- 背诵卡三模式(首字/接龙/译文)切换。
- 朗读设置持久化。
- 深链恢复: 直接访问 `/cards` 深链 → 404.html → localStorage → 恢复。
- PWA: SW 注册成功、离线加载首页。

### 4.3 错误收集
- full-flow-test 已挂载 pageerror/console.error 收集,运行后检查 errors 数组内容。

## 报告结构

`diagnosis-report.md` 模板:

```markdown
# 全面诊断报告
## 0. 总览(基线、通过项、问题计数)
## 1. 数据层(R1)
   1.1 validate 警告逐条定性表
   1.2 管道对齐
   1.3 数据质量抽查
   1.4 文档漂移
## 2. 前端代码质量(R2)
## 3. 构建与部署(R3)
## 4. 功能行为(R4)
## 5. 问题清单(按 P0/P1/P2 排序)
```

## 风险与对策

| 风险 | 对策 |
|---|---|
| Playwright chromium 路径失效 | full-flow-test.mjs 内 EXE 硬编码 `/home/truel/.cache/ms-playwright/chromium-1234/...`,运行前 `ls` 验证,缺失则报告而非重装 |
| 长耗时测试 | check 与 test:flow 串行运行,每步 timeout 120-300s |
| 诊断面过大 | 以既有校验设施为骨架,人工审查聚焦高风险文件(ArticleReader/PracticeSession/card stores) |
