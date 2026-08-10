# 执行计划：仓库地毯式清理 + Bug 排查 + 满强度测试

## 顺序

WS1 清理 → WS2 满强度测试脚本 → WS3 修复循环 → WS4 文档收尾

## 步骤

### Step 1: 仓库清理
- [ ] 备份待删目录到 /tmp/wyw-purge-backup/（tar）
- [ ] grep 验证 data/ ocr/ 无代码引用
- [ ] 删除: data/ ocr/ logs/ test-results/ scripts/oneoff-archive/ scripts/_fix-origins.py scripts/_scan.mjs _dbg4.mjs
- [ ] 裁剪 scripts/build.sh（去掉 ocr 依赖）
- [ ] package.json 增加 `test:flow` 脚本
- [ ] `npm run dev` 起服务验证正常

### Step 2: 满强度测试脚本
- [ ] 写 scripts/full-flow-test.mjs（10 环节用户流，见 PRD）
- [ ] 运行，收集失败项（预期暴露 BUG）

### Step 3: BUG 修复循环
- [ ] 按失败项定位修复（PracticeSession/CollectionsPage/Flashcards/TTS 等）
- [ ] 重跑 full-flow-test 直至全过
- [ ] 修复遵循共享组件与既有规范

### Step 4: 文档与收尾
- [ ] README.md 重写（简介/快速开始/数据模型/测试）
- [ ] PROJECT_STRUCTURE.md 重写（与 README 分工）
- [ ] `npm run check` 全链路
- [ ] 清理前后 du 对比
- [ ] BUG 清单落盘 scan-findings
- [ ] journal + 归档

## 验证命令

```bash
npm run dev
node scripts/full-flow-test.mjs   # 满强度全过
npm run check
```

## 回滚

- 待删目录已备份 /tmp/wyw-purge-backup/
- 测试脚本发现问题逐一修复，不批量盲改
