# 全面诊断 — 执行计划

## 执行顺序

诊断按「先命令证据、后代码审查」推进。命令输出先落盘(结果保存在本任务目录 `research/` 下),再人工分析。

## Step 1 — 数据层诊断 (R1)

1. 运行 `npm run validate`,完整输出存 `research/validate-full.txt`。
2. 提取 9 个警告条目,逐个定性(对照项目 memory #249/#270/#300、历史记录)。
3. 读 `scripts/build-runtime-data.mjs`,理解管道处理逻辑与统计口径。
4. 写一次性 node 脚本(放 `research/`)做数据质量抽查:
   - 重复 id(文章/题目/字词/题集)
   - OCR/英文/水印残留扫描
   - 引用悬空(article.questionIds、collection.questionIds、word 引用)
   - 必填字段空值
   - README 数字声明 vs runtime 实际值对比
5. 检查死数据入口:annotation/extra/exam 在首页与数据中的现状。
6. **验收**: 9 个警告全部定性;抽查脚本输出存 research/;漂移清单完成。

## Step 2 — 前端代码质量 (R2)

1. `npm run typecheck`(已有通过记录,重跑确认)。
2. 死代码扫描: `rg "type-grid|two-cards|features.js|annotation|exam-tags" src/`。
3. 人工审查(读文件,记录行号证据):
   - `src/features/learning/ArticleReader.tsx`(最大组件)
   - `src/features/practice/PracticeSession.tsx` + `SelfJudge.tsx`
   - `src/features/cards/Flashcards.tsx` + `card-progress.ts` + `src/data/card-progress.ts`
   - `src/features/recite/*`(三模式)
   - `src/shared/lib/ls.ts`(localStorage 兜底)
   - `src/features/errorbook/store.tsx`
4. 定向 grep: `addEventListener|setInterval|setTimeout` 在 useEffect 中的清理;`.map(` 的 key(抽查)。
5. **验收**: 高风险文件全部审查,发现清单带文件:行号证据。

## Step 3 — 构建与部署链路 (R3)

1. `npm run check` 全链路,记录每步耗时与结果,输出存 `research/check-full.txt`。
2. PWA: 读 `public/` 全部文件,审查 manifest 字段、sw.js 预缓存策略(重点: 构建哈希文件名是否被正确引用)、图标。
3. 深链: 读 `public/404.html` + App 中 DeepLinkRestore 实现;确认 DEPLOY.md 描述与实现一致。
4. 产物分析: `du -sh dist/*`,JS/CSS 大小排序,检查 chunk 拆分与超大包。
5. **验收**: check 全链路通过(或记录失败点);PWA/深链/产物分析完成。

## Step 4 — 功能行为测试 (R4)

1. 验证 Playwright chromium 路径存在: `ls /home/truel/.cache/ms-playwright/chromium-1234/chrome-linux64/chrome`。
2. 启动 dev server(后台),运行 `npm run test:flow`,完整输出存 `research/flow-test.txt`。
3. 分析失败项与收集的 console/page errors。
4. 深链恢复专项: 用 curl/playwright 验证 404.html 逻辑(静态服务器场景)。
5. SW/PWA: 检查 sw.js 注册与预缓存逻辑(代码级),离线验证如有可行手段则做。
6. **验收**: test:flow 结果完整记录;所有 pageerror/console error 列出。

## Step 5 — 报告撰写与收尾

1. 汇总四维度发现,写 `diagnosis-report.md`(按 design.md 模板)。
2. 问题清单 P0/P1/P2 分级,每个问题含: 等级、证据、影响、修复建议。
3. 对照 PRD Acceptance Criteria 逐条自检。
4. 归档研究产物与报告,提交 commit。

## 验证命令速查

```bash
npm run validate            # 数据校验
npm run typecheck           # TS 检查
npm run check               # 全链路
npm run test:flow           # Playwright 全流程
ls /home/truel/.cache/ms-playwright/chromium-1234/chrome-linux64/chrome  # chromium 存在性
```

## 回滚点

- 本次为纯诊断任务,不修改代码与数据 → 无回滚需求。
- 若诊断中发现阻塞性问题且用户要求修复,先更新 PRD 并创建独立修复任务,再动手。
