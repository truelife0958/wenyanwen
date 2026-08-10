# 全面体检问题清单 (2026-08)

> 任务: 08-08-full-audit-data-quality
> 范围: 数据一致性、数据准确性、渲染细节、校验能力
> 状态说明: 全部已修复并通过验证（npm run validate 0 错误、typecheck、npm run check、browser-test 40/40）

## A. 已修复问题（含证据）

### A1. 校验脚本「年级有效」误报 127 个错误
- **证据**: `npm run validate` 报 127 个「年级有效」错误；校验期待长名（七年级上册），runtime 用短名（七上）
- **根因**: validate-data.mjs 的 validGrades 列表未随数据约定更新（短名约定见历史记录）
- **修复**: 校验集合改为短名 `[七上,七下,八上,八下,九上,九下,附录,未分类]` + 反向警告长名出现

### A2. 英文残留 25+ 处（模型生成污染）
- **证据**: 中文文本混入英文单词 — `and`×18（论语/三峡/临江仙/出师表/定风波/曹刿论战/水调歌头×2/泊秦淮/湖心亭看雪/爱莲说×2/记承天寺夜游/赤壁/过零丁洋/陈涉世家）、`contrast`（临江仙 theme）、`of`（白雪歌 theme）、`formally`（杞人忧天）、`the`（唐诗三首题干）、`can`（核舟记注释）、`vs`×6（learning/practice/zhenti_web/exam-generated）
- **修复**: raw 源数据精确替换（learning.json 18 处 + practice.json 3 处 + exam_point_rewrites 4 处 + zhenti_web 3 处 + exam-generated 1 处）
- **防回归**: validate 新增 8.2 英文残留检查（词边界白名单，排除括号拼音）

### A3. 水印残留「教辅公众号★全科AA+」
- **证据**: zhenti.json[27] zt-124-15 与 practice.json[52] 题干尾部含水印
- **附带发现**: 该题内容实为《赤壁》（后两句论史抒怀/东风周郎/三国史事），却归在「渔家傲(天接云涛连晓雾)」下；zt-124-14 同样错配
- **修复**: 水印清除；zt-124-14/15 标题改「赤壁」；practice[52] 两条错配赤壁题移除（与 practice[90] 赤壁题重复）；practice[52] 空条目整体移除

### A4. 背诵句污染 86/339 条
- **证据**: 背诵句中混入评注文本（「重点考查…」「等名句的直接默写与理解性默写」）、编号列表（`1. 十五从军征…`）、引号/标点垃圾（`"，；"`、`"（，）；"`）
- **根因**: sentenceStars() 从 exam_points「名句默写」detail 按句切分时未清理评注/统计（直接N考）/序号
- **修复**: 74 处 名句默写 detail 源数据清洗（评注剥离/统计去除/序号去除/引号清理）；build 脚本 add() 保留防御性清理
- **结果**: 背诵句 350/350 全部为原文子串（归一化后）

### A5. 背诵句个别字错配
- **证据**: 十五从军征「春谷」vs 原文「舂谷」；小石潭记 key_sentences「佁然」vs 原文「怡然」
- **修复**: raw 修正为与原文一致（春→舂、佁→怡）
- **说明**: 小石潭记 佁然/怡然 为教材版本差异（部编版为「佁然」，教辅 OCR 用「怡然」），本数据按原文统一

### A6. 原文注码残留（爱莲说）
- **证据**: 爱莲说原文含 OCR 圈码 ㉑㉒㉓㉔（教材注释引用标记误入正文）
- **修复**: 原文剥离 4 处圈码

### A7. 《茅屋为秋风所破歌》原文+译文截断
- **证据**: 原文止于「床头屋漏无干处，雨脚如」，译文止于「雨点不间断，像」；OCR 页 jiaocai_p166 本身截断
- **修复**: 按标准教材文本补齐原文尾部（麻未断绝…死亦足）与对应译文
- **说明**: OCR 层缺口，本次在数据层用标准文本补齐

### A8. 错别字
- **证据**: 望洞庭湖「波憾岳阳城」应为「波撼」（learning 原文+分析+考点、practice 原文、exam_point_rewrites 均错）；出师表「不求闻达于诸诸侯」重复字；醉翁亭记「游宴之乐与与民同乐」重复字
- **修复**: 全部修正

### A9. 练习源数据含生产注记
- **证据**: practice[7] 核舟记 original_text 尾部含「（注：此处原文OCR拼合了部分课外文言文内容…）」生产注记 + 「尝贻余核舟大」错字 + 中段 OCR 错乱
- **修复**: 移除注记、核舟大→核舟一；中段 OCR 错乱保留（不参与 runtime，仅源数据归档）
- **说明**: 该条目 original_text 不进 runtime，仅题目入库

### A10. 头部统计硬编码过期
- **证据**: App.tsx 硬编码「127 篇 · 2519 词义 · 1585 题」，runtime 实际 2011 题（exam-generated 合并后）；Home 用动态 counts → 两处不一致
- **修复**: App.tsx 改用 counts 动态计算（127 篇 · 2168 词义 · 2011 题）

### A11. 文章 questionIds 重复（61 篇）
- **证据**: 61 篇文章 questionIds 含重复 ID（exam-gen 合并时推入一次、最终循环再推一次），导致练习题重复、统计虚高（2437 而非 2011）
- **修复**: build-runtime-data.mjs 两处 push 均加去重判断；validate 新增 8.6 去重检查

### A12. exam-generated 合并题缺 origin 字段
- **证据**: 426 条合并题无 origin（CanonicalQuestion.origin 必需）
- **修复**: 合并处补 `origin: 'exam_gen'`；types.ts 联合类型增加 exam_gen

### A13. 段落序号【N】渲染不一致（用户投诉「每个句子前有序号」）
- **证据**: 44 篇全文带【N】、83 篇无、3 篇部分（228/564 段）；学习页原文前渲染 superscript 序号
- **决策**: 用户确认隐藏。ArticleReader 移除 para-num 渲染；CSS 规则停用；数据保留 number 供分析文本交叉引用

### A14. browser-test.mjs 全面过时
- **证据**: 测试针对旧版 UI（grade-card/5 tab/复习中心 hub/背诵页），选择器全部失效
- **修复**: 按当前 UI 重写（3 导航/6 年级 tab/3 标签/搜索/练习/复习错题/题集/字词卡/旧链接/移动端），40/40 通过

### A15. 旧版深链接失效
- **证据**: `#/learning/:title`、`#/practice/:title` 路由不存在（落到 * → 首页）
- **修复**: App.tsx 新增 LegacyArticleRedirect 兼容跳转

### A16. PROJECT_STRUCTURE.md 过时
- **证据**: 文档列出不存在的 LearningPage/ZhentiPage/Recite/ErrorBookPage；数字过期（1584 题）
- **修复**: 按当前实际结构重写（3 页面 + 3 tab、2011 题、exam-generated 说明）

## B. 观察项（未修改，记录备查）

### B1. 词条分类体系
- `实词(251)/虚词(54)` 为 global 词（综合字词卡），不参与文章内标注；ArticleReader 只标注 article-scoped 词（课文注释/重点实词/文言虚词等）。与旧版「点单字聚合全库实虚词」行为不同 — 属 React 重构的设计取舍，未改动
- `重点虚词(1)/炼字(2)` 分类不在 EXAM_CATEGORIES 高亮集合中（数量极少）

### B2. 邹忌「谤议」vs 教材「谤讥」
- 原文/背诵句统一用「谤议于市朝」，与部编版「谤讥」不同 — 教材版本差异，未改动

### B3. 14 段无分析无译文
- 左迁至蓝关/关雎/十五从军征等少数段落无分析无译文（数据设计空缺，非损坏）

### B4. 段落编号覆盖不齐（39 全/83 无/5 部分）
- 数据层保留 number 字段，前端已隐藏；validate 8.4 仅观察

### B5. practice[7] 核舟记中段 OCR 错乱
- 未参与 runtime，源数据保留待后续 OCR 重校

### B6. footer「数据 v2.2」
- 为数据版本标注（非 package.json 应用版本），语义独立，未改动

## C. 校验能力新增（validate-data.mjs 第 8 节）

| 检查 | 说明 |
|---|---|
| 8.1 背诵句完整性 | 每条 star 归一化后必须是原文子串（允许逗号子句） |
| 8.2 英文残留 | 词边界白名单（and/the/of/vs 等），排除括号拼音 |
| 8.3 水印/广告 | 教辅公众号/全科AA/扫码关注 等模式 |
| 8.4 段落编号覆盖 | 观察性警告（前端已隐藏序号） |
| 8.5 exam-gen origin | 合并题必须有 origin 字段 |
| 8.6 引用 ID 去重 | 文章/题集 questionIds 无重复 |
| 8.7 原文尾部截断 | 原文结尾必须是句末标点 |

## D. 验证结果

```
npm run validate    → 0 错误, 6 观察性警告
npm run typecheck   → 通过
npm run check       → data:build + validate + typecheck + vite build + SSR 全部通过
node scripts/browser-test.mjs → 40/40 通过
```

## E. 文件变更清单

- `src/data/raw/learning.json` — 英文替换 18 + 错别字 3 + 名句 detail 清洗 74 + 注码剥离 + 茅屋补齐 + 背诵字错配 2
- `src/data/raw/practice.json` — the/can/vs 修复 + 水印清理 + [52] 错配题移除 + 核舟记注记清理
- `src/data/raw/exam_point_rewrites.json` — formally/孤立 f/波憾 修复
- `src/data/raw/zhenti.json` — 水印清理 + zt-124-14/15 归属修正（赤壁）
- `src/data/raw/zhenti_web.json` — vs → 对比 ×3
- `src/data/raw/handwritten.json` — 尾部孤立句点 ×13
- `src/data/runtime/exam-generated.json` — vs ×2
- `src/data/runtime/*.json` — 由 data:build 重建
- `scripts/validate-data.mjs` — 年级短名修复 + 新增 8.1-8.7 检查
- `scripts/build-runtime-data.mjs` — exam-gen origin 补齐 + questionIds 去重
- `scripts/browser-test.mjs` — 按当前 UI 重写
- `src/components/ArticleReader.tsx` — 移除 para-num 渲染
- `src/components/article.css` — .para-num 停用
- `src/App.tsx` — 头部统计动态化 + 旧路由兼容
- `src/types.ts` — origin 增加 exam_gen
- `PROJECT_STRUCTURE.md` — 按当前实际更新
