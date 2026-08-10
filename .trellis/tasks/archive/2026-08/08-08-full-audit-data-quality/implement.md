# 执行计划：全面体检修复

## 顺序

1. **WS1 数据修复**（先修源，后重建）
2. **WS2 校验增强**
3. **WS3 渲染层**
4. **WS4 文档/产物/验证**
5. 全链路验证 + 问题清单落盘

## 步骤清单

### Step 1: 精确定位待修数据（脚本辅助，只读）
- [ ] 脚本枚举所有英文残留的精确位置（article idx + 字段路径 + 上下文），导出待修清单
- [ ] 定位水印题在 raw 中全部出现处（zhenti.json idx 27、practice.json 对应条）
- [ ] 定位全部污染背诵句（评注/序号/引号垃圾）对应的 raw article 与 exam_points.detail
- [ ] 核对 zt-124-15 内容与《赤壁》篇关系（master_toc + runtime 赤壁原文），确认归属修正方案
- [ ] 核对「核舟记 can」「practice the」上下文确定正确中文

### Step 2: 修 raw 源数据（write 工具，逐文件）
- [ ] learning.json：~18 处英文替换 + 背诵句污染源 exam_points.detail 清理（评注剥离/序号去除/引号垃圾去除）
- [ ] practice.json：`the`、`can`（按 Step1 结论）、水印 stem 清理
- [ ] exam_point_rewrites.json：`formally`、孤立 `f`
- [ ] zhenti.json：水印 stem 清理 + zt-124-15 归属修正（标题/内容对齐赤壁或剔除）
- [ ] zhenti_web.json：`vs`→「对比」（如采纳）
- [ ] handwritten.json：孤立句点
- [ ] 每文件修改后用 Python 复核：无 [a-zA-Z]{2,} 残留（排除合法拼音/年份/选项）

### Step 3: 重建 runtime
- [ ] `npm run data:build`
- [ ] 复核 runtime：背诵句全部为原文子串（归一化）、无英文残留、无水印、题目数记录

### Step 4: 校验脚本增强（validate-data.mjs）
- [ ] 年级有效集合改短名（+反向检查长名不应出现）
- [ ] 题目基线 1585 → 与 build-report 交叉校验
- [ ] 新增 N1 背诵句完整性、N2 英文残留、N3 水印、N4 段落编号一致性 warn、N7 无分析段落 warn、N8 杂散字符
- [ ] `npm run validate` 0 error 验证

### Step 5: 渲染层修改
- [ ] ArticleReader.tsx 移除 para-num 渲染（row.number 不再渲染；rows 类型 number 字段可保留）
- [ ] article.css .para-num 样式清理（或保留注释说明已停用）
- [ ] App.tsx 头部统计动态化（用 counts）；footer 版本核对
- [ ] types.ts origin 联合类型 + build-runtime-data.mjs 合并 exam-gen 补 origin（C4/N6）
- [ ] `npm run typecheck` 通过

### Step 6: 文档与产物
- [ ] PROJECT_STRUCTURE.md 按当前实际更新
- [ ] `npm run check` 全链路（data:build + validate + typecheck + vite build + SSR）
- [ ] audit-findings.md：全部问题清单（编号/证据/状态/修复说明）落盘任务目录
- [ ] 抽查：dev server 学习页无序号、无英文；背诵卡数据干净

### Step 7: 收尾
- [ ] 回归：browser-test（如 dev server 可用）
- [ ] 完成 Phase 3.3 spec 更新（如有约定沉淀）与 Phase 3.4 提交（若 git 存在）

## 验证命令

```bash
npm run validate        # 0 error
npm run typecheck       # 通过
npm run check           # 全链路
python3 scripts/xxx     # 数据复核脚本（Step 2/3 临时）
```

## 回滚点

- 每个 raw 文件修改前记录原内容（git 不存在 → 用 cp 备份到任务目录 backup/）
- runtime 可随时由 `npm run data:build` 重建
- 渲染层改动小，undo_last_replace 可回退
