# 仓库地毯式清理 + Bug 排查 + 满强度测试

## 背景

用户要求：地毯式无死角清理（激进重组、删历史产物/研发过程文件、只留运行必需）、全面排查 BUG、浏览器满强度用户流测试每个环节并修复、更新 README 与文档。

已确认决策：
- **删历史产物**：data/ ocr/ logs/ test-results/ 等；保留 .trellis/ 框架与任务归档
- **满强度用户流测试**：新增脚本完整走学习→练习→复习→错题→字词卡→题集→移动端
- 只保留 `npm run dev` / `npm run build` 能跑 + 真实数据生成（data:build）

## 清理边界（侦察确认）

| 路径 | 大小 | 内容 | 处置 |
|---|---|---|---|
| `data/` | 1.7M | 历史批次 batch_learning/practice/questions.js | **删**（无代码引用，追溯用） |
| `ocr/` | 3.9M / 569 文件 | OCR 中间产物 + 历史 merge 脚本 | **删**（build.sh 引用，裁剪后删） |
| `scripts/oneoff-archive/` | 7 文件 | 一次性修复脚本（extract_zhenti 等） | **删**（归档性质） |
| `scripts/_fix-origins.py` `_scan.mjs` | 2 文件 | 临时/调试脚本 | **删** |
| `_dbg4.mjs` | 根目录调试脚本 | **删** |
| `logs/` `test-results/` | 空/单文件 | **删** |
| `scripts/build.sh` | 引用 ocr 整条历史管线 | **裁剪**为 raw→runtime→validate |
| `src/` | 6M | raw+runtime+组件 | 保留（runtime 大 json 为 PWA 数据） |
| `.trellis/` | 3M | 项目框架+任务归档 | 保留 |
| `README.md` / `PROJECT_STRUCTURE.md` | 文档 | **重写**（当前 README 含过时信息） |
| `package.json` | scripts | 精简保留 dev/data:build/validate/build/typecheck/check；新增 `test:flow` |

## 满强度用户流测试（scripts/full-flow-test.mjs）

逐环节用户操作 + 断言：

1. **首屏**：标题/统计/3 导航/搜索可用
2. **学习流**：进文章→注释点击浮层→展开译文→笔记清单→朗读按钮存在
3. **练习流**：做题→选答案→提交判分→正确/错误反馈→结果页→错题自动入本
4. **复习流**：查看答案→标记错题→我的错题过滤
5. **错题本**：/collections 左栏错题区块→移除错题→清空
6. **字词卡**：翻卡→评分→统计变化
7. **综合题集**：选组→做题→判分
8. **深链**：旧 #/learning、#/practice 跳转
9. **移动端**：关键页 375px 无溢出
10. 全程 0 console error / 0 pageerror

## Bug 排查重点

- PracticeSession 选择→判分→结果全链路（含 q-option 交互）
- CollectionsPage 错题区块（新功能）
- Flashcards SM-2 评分与统计
- TTS 朗读按钮状态
- 懒加载 Suspense 边界
- SSR 与浏览器行为一致性

## 验收标准

1. 删除清单全部移除；`npm run dev` / `npm run build` / `data:build` / `validate` 正常
2. `npm run test:flow` 满强度测试全过（含修复的 BUG）
3. `npm run check` 全链路通过
4. README 重写为准确、简洁、用户视角（含数据管道与测试说明）
5. 清理后 `du -sh` 对比报告（node_modules/dist 外体积显著下降）
6. 发现并修复的 BUG 清单落盘

## 范围外

- 不动 src/ 数据内容（raw/runtime 由 data:build 生成）
- 不删 .trellis/ 框架
- 不做新功能

## 风险

- ocr/ 删除后历史回归不可复现 → 任务文档已记录历史数据出处（memory 可查）
- 误删被引用文件 → 删前 grep 引用确认
- 测试暴露大量 BUG → 分批修复，测试脚本先行（TDD 式）
