# 设计：仓库地毯式清理 + Bug 排查 + 满强度测试

## 设计原则

1. **删除前验证引用**：每项删除先 grep 确认无代码/配置引用
2. **测试先行**：先写满强度测试脚本，暴露 BUG 后逐项修复（测试驱动）
3. **保留真实生成**：raw → runtime 管道（data:build）与校验（validate）必须保留
4. **文档同步**：README/PROJECT_STRUCTURE 与清理后仓库一致

## 实施分区

### WS1 仓库清理
删除（先 grep 引用验证）：
- `data/`（batch_*.js、questions.js — 历史追溯产物）
- `ocr/`（OCR 中间结果与历史 python 脚本）
- `scripts/oneoff-archive/`（一次性修复工具）
- `scripts/_fix-origins.py`、`scripts/_scan.mjs`
- `_dbg4.mjs`、`logs/`、`test-results/`
- 裁剪 `scripts/build.sh`：改为 raw→runtime→validate（去掉 ocr 依赖）
- package.json 增加 `test:flow`

### WS2 满强度测试脚本 scripts/full-flow-test.mjs
复用 browser-test 的 playwright 基础设施，扩展为用户流深测：
- 顺序执行 10 个环节（见 PRD），每环节独立断言 + 收集错误
- 关键交互细节断言：判分反馈（.q-option.right/.wrong 类出现）、错题 localStorage 变化、SM-2 统计变化
- 全程捕获 console/pageerror
- 退出码非零表示失败

### WS3 BUG 修复（测试驱动的循环）
- 运行 full-flow-test → 收集失败 → 定位修复 → 重跑
- 重点模块：PracticeSession 判分流、CollectionsPage 错题区块、Flashcards SM-2、TTS、懒加载边界
- 修复遵循：行为不改语义、样式走共享类

### WS4 文档与收尾
- README.md 重写：项目简介/快速开始（dev/build/data:build/test:flow/check）/数据模型/目录结构/测试说明
- PROJECT_STRUCTURE.md 重写或精简（与 README 分工）
- 清理后 du 对比报告
- BUG 清单落盘（scan-findings）

## 验证

- `npm run dev` 起服务，`node scripts/full-flow-test.mjs` 全过
- `npm run check` 全链路
- 清理后体积对比表

## 风险控制

- 删除前备份到 /tmp（tar）以便恢复误删
- ocr/data 删除前将关键出处信息写入任务文档（memory 已存 #240-281 等）
- 满强度测试若暴露系统性 BUG，按模块分批修，每批后重跑
