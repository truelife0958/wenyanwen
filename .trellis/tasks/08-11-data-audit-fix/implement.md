# 数据全盘校验/去重/准确性修复 — 执行计划

## 执行顺序

1. **P1-5 核对**: 查看 zhenti_web 2 组 5 条题目的题干/答案,确定修正方案
2. **P1-6 核对**: 查 learning 中"望洞庭湖"实际标题
3. **P1-4 清理**: diff 确认后删除 3 个 bak 文件,.gitignore 加 `*.bak*`
4. **P1-3 + P0-2 raw 修复**: moxie.json 修 5 条 title + 6 条默写效果检测 id
5. **P0-1 build 修复**: build-runtime-data.mjs 强制重写 qid + id 唯一兜底
6. **R4 准确性**: 补抽样 6 篇,修正错误(如有)
7. **validate 扩展**: 新增段 5/6/7(样式段留占位)
8. **全量验证**: `npm run check` + `npm run test:flow` + 新增断言全部通过
9. **记录**: research/fixes.md 修正清单

## 验证命令

```bash
npm run data:build          # 重建 runtime
npm run validate            # 校验(含新断言)
npm run typecheck
npm run build
node scripts/ssr-check.mjs
npm run test:flow           # 端到端 42/42
```

## 完成门

- [ ] validate 新增段全部实现且 exit 0
- [ ] runtime moxie id/qid 无重复
- [ ] raw 无 bak 残留
- [ ] check + test:flow 全绿
- [ ] fixes.md 记录所有数据修正
