# Quality Guidelines

> Code quality standards for this project (v3.0 双模块版).

---

## 验证命令链 (改数据/前端后必跑)

```bash
npm run check        # data:build + validate + typecheck + vite build + ssr-check
npm run test:flow    # playwright 端到端 (45 项: 历练/默诵/判分/失误/移动端/深链/重定向)
node scripts/browser-test.mjs  # 篇目中心快速回归 (68 项: 五标签/搜索/默诵/旧路由/移动端)
node scripts/page-scan.mjs     # 全路由扫描 (101 项: JS错误/横向溢出/渲染; 路由清单须与 App.tsx 同步)
node scripts/moxie/validate.mjs   # 默写抽取完整性 (页覆盖/篇目/配对率) → ocr/moxie/report.md
node scripts/vision/vision.mjs <url> --mobile --mode describe   # UI 视觉验收
npm run validate   # 含段 8 raw 唯一性 / 段 9 真题重复 / 段 10 runtime 一致性 / 段 11 样式硬编码 gate
```

## 数据约定

- **默写数据**：`src/data/raw/moxie.json`（书抽取）+ `moxie-legacy.json`（旧题转换），`build-runtime-data.mjs` 合并去重 → `runtime/moxie.json`；**qid 必须全局唯一**（build 强制重写为 `{artId}:{secIdx}:{itemIdx}`，artId=`moxie-{title}`；raw 文件内 qid 亦须唯一，validate 段 8/10 断言）。
- **抽取管道**（scripts/moxie/）：VLM (gemini-2.5-pro-1m @ bohe) 逐页抽取；**API 限速 25 req/5min**，并发默认 3、429 等待 60s；断点续跑（输出文件存在且可解析即跳过）。
- **标题归一化**（pair.mjs normTitle）：去 `[唐]王湾` 行尾作者、`3年21考` 考频标签、全角中点 `・`；匹配策略：精确 → 包含/后缀。**一页两篇**页必须拆分为 `articles` 数组输出。
- **检测卷**（默写效果检测/综合练习）：答案册条目按页序与主书连续页分组配对（`__detect_N` key），卷内答案**全局顺序分配**（答案册把词义/活用/古今答案都标为"词义默写"）。
- **grade**：优先从 learning.json 对齐，其次页面标注；非法值归 `附录`（检测卷/主题默写所在）。
- **错题本**：moxie 错题 qid 前缀 `moxie`（旧格式 `moxie:` 与新格式 `moxie-` 均匹配，`startsWith('moxie')`），`/moxie/errors` 过滤展示。
- **qid 历史变更**：2026-08-11 从 `moxie:{title}:{i}`（缺题型序号, 361 个重复）改为 `moxie-{title}:{sec}:{i}`；旧进度不兼容, 已重置。

## 前端约定

- TabBar 固定 2 tab（地图/成就）；新功能入口不新增 tab。
- **地图首页（2026-08-13 横版版）**：`/` 渲染**横版卷轴世界地图**（LevelMap, lazy）——世界（年级）横向并排在 `.gx-map-h` 滚动容器（overflow-x auto，页面不溢出），世界内节点纵向小 S 形（x 百分比 24/74 交替 + y 像素 GAP 96），SVG 三次贝塞尔金色路径 + `.gx-path-flow` 流动光效（stroke-dashoffset 循环）。玩家 Token 为 CSS 旗帜（`.gx-token-flag`，勿用 emoji——headless 无彩色字体显示为 X），定位第一个未通关已解锁关并自动滚动到其世界。节点分流：**已通关→`/articles/:id/moxie`，未通关→`/articles/:id/learn`**。`/map` 重定向 `/`。改布局须同步常量（NODE/GAP/X_LEFT/X_RIGHT/TOP/世界列宽 330px）。
- **动画讲解模式（2026-08-13）**：`src/features/learning/LectureMode.tsx`（全屏覆盖层，入口按钮 `.lec-start` 在 ArticleReader 顶部）。逐句拆自段落（start/end 切片 + `splitSentences`），段译文用 `alignLines` 对齐（段落无 translation 字段）；`speak()` TTS 朗读 + 句完自动进下句 + onEnd；无 TTS 静音降级。控制：播放/暂停/⏮⏭/进度 range/语速（复用 `wyw_tts_rate`）。CSS 类前缀 `.lec-`，颜色须走 var(--gx-*) 令牌（validate 段 11 gate article.css）。
- **游戏化术语映射（2026-08-13）**：UI 消灭"学习/默写"二字（学习→历练、默写→默诵）。数据 json 保持原值（题型"原文默写"、标题"默写效果检测"、考点"背诵默写"等），展示层统一走 `src/shared/lib/game-terms.ts` 的 `g()`/`moxieTypeLabel()`；静态 UI 文案直接改字。新增"默写/学习"文案必须经映射或直接禁用。
- **关卡页结构**：篇目工作区 `/articles/:id/:tab` 是唯一关卡页（历练/鉴赏/考点/注释/默诵）；默诵 tab 内嵌共享训练组件 `src/features/moxie/MoxieTrainer.tsx`（题型 tab + 判分 + XP + 失误入库），判分副作用统一走 `saveMoxieResult`/`game.addResult`/`addWrong`。`/moxie/:id` 由懒组件 `MoxieRedirect` 重定向→关卡页默诵 tab。
- **首屏性能**：`article-meta.json` counts 含 `moxieArticles/moxieQuestions`（build 生成）；首页/App 只从 counts 读默写统计，**禁止** import `data/moxie.ts`（会静态拉入 555KB moxie.json chunk）。需用默写数据的页面直接引 `data/moxie.ts`（路由懒加载生效）。
- **新中式视觉系统（2026-08-13 重构）**：全站"新中式·古风雅致"——墨青深底 + 哑金(`--gx-gold #c9a45c`/`--accent-brown`) + 青瓷(`--gx-jade #4a8f84` 取代荧光绿) + 朱砂印章(`--seal-red #a8483e` 仅印章/停止态点缀)。墨色页头(`--header-bg`/`--header-ink` + 印章伪元素)。禁荧光绿/荧光金/蓝紫霓虹。强调色用金褐(`--accent-brown`)不用 `--primary`(红只作朱砂点缀)。CSS 硬编码 hex 禁止(validate 段11 gate global/article/moxie.css)；game.css 不在检查列表但也要用 `--gx-*` 令牌。
- `localStorage` 读取要处理 `null`（`Number(null)=0` 陷阱，见 ArticleReader loadSetting）。
- 阅读工具条（语速/字号/主题）状态持久化 key：`wyw_tts_rate` / `wyw_font_scale`。
- **three.js 3D 水墨粒子（2026-08-13）**：`src/features/ink/InkScene.tsx` 全站背景——three 动态 import 懒加载（独立 chunk，主包不含 three）；WebGL 不可用自动降级 2D CSS 墨韵（.ink-fallback）；粒子数桌面 1500/移动 450，DPR 上限 2，页面隐藏暂停 rAF。`inkBurst()` 提供粒子扩散特效（讲解模式内容卡触发）。新增 3D 相关页面须走 InkScene 复用，不要重复创建渲染器。
- **五段式动画讲解（2026-08-13）**：LectureMode 数据编排 = 句子流 + 内容卡（重点字词=词义默写题 word+answers 按句匹配 / 重点句=recitation.stars / 鉴赏=paragraphs[].analysis 段末 / 随堂练习=本关 moxie 真题判分）。内容卡类 .ink-*（word/key/analysis/practice）。练习判分复用 normAnswer/matchAnswer。词义题经 findMoxieArticle(title) 取（articleId 不存在于 CanonicalArticle）。
