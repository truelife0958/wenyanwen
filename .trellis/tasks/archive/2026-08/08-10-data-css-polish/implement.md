# 数据审核与 CSS 精修 — 执行计划

## 执行顺序

数据审核与 CSS 精修并行推进,但**数据审核先行**(数据缺陷可能影响 CSS 展示内容),CSS 精修随后。验证链最后统一跑。

## Step 1 — 数据审核(程序化)

1. 写 `research/data-audit.mjs`(只读脚本),实现 design.md 的 A1-A12 检查项。
2. 运行,输出缺陷清单(ERROR/WARN 分级,带定位)。
3. 分析 ERROR 项:
   - 数据层可修(raw JSON 或管道清洗)→ 修复
   - OCR 级不可修 → 记录
4. 复跑确认修复生效。
5. 产出 `research/data-audit-report.md`(缺陷清单 + 定性 + 修复记录)。

## Step 2 — 人工抽审 6 篇

1. 读取 runtime 数据(jc-ly / jc-yueyanglouji / jc-chushibiao / jc-thyj / jc-sanxia / jc-chensheshejia)的完整原文/译文/注释/赏析。
2. 逐段核读,记录发现(错字/漏译/注释错误/赏析与原文不符)。
3. 发现的数据缺陷 → 修复(同 Step 1 策略)。
4. 结果并入 `data-audit-report.md`。

## Step 3 — CSS 现状盘点

1. 读 `src/shared/styles/tokens.ts` 全文。
2. 硬编码扫描: `rg -n "#[0-9a-fA-F]{3,8}|rgba?\(" src/ -g '*.css'`(排除 tokens/global 定义处)。
3. 动效现状扫描: `rg -n "transition|animation|@keyframes" src/ -g '*.css'`。
4. 输出盘点清单到 `research/css-inventory.md`。

## Step 4 — CSS 精修(逐文件)

按 design.md 2.2-2.4:
1. global.css: reduced-motion 兜底 + 按钮 press + 共享类统一。
2. tokens.ts: 补充缺失令牌(如有)。
3. home.css: 卡片悬浮/进度环/grade-tabs。
4. article.css: 原文排版微调/判分反馈。
5. practice.css: 选项态/结果页动效。
6. flashcard.css: 翻转动效/完成庆祝。
7. errorbook.css / exam-map.css: 列表节奏。
8. 每次文件改动后跑 `npm run typecheck`(CSS 不影响但 JSX 若有改动)+ 阶段性 page-scan。

## Step 5 — 验证链

```bash
npm run check                          # 全链路
(npm run dev &) + npm run test:flow    # 46 项
node scripts/page-scan.mjs             # 77 项
```

全部通过后:
- 截图对比(可选,vision 脚本),记录改善。
- 产出 `research/css-changes.md`(改动清单: 文件/改动点/目的)。

## Step 6 — 收尾

- 更新 PRD 验收清单。
- 报告落盘: data-audit-report.md + css-changes.md。
- journal 记录 + 任务归档。

## 回滚点

- 数据修复: 每次修改前记录原值;raw JSON 修改可手动回退。
- CSS: 逐文件小步提交;验证失败即回退该文件改动。
