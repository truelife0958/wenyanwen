# 数据深度清洗 · 实施计划

## 阶段 0: 基线
- [ ] data:build + validate 基线绿
- [ ] 记录当前 build-report 基线

## 阶段 1: 自动化审计（主模型）
- [ ] related_questions 跨篇错挂清单（223 条）+ 转移/删除决策
- [ ] 跨源完全重复清单（28 组重复题干）
- [ ] 低频词义清单（出现 1 次且非考点词）
- [ ] zhenti_web 无法独立作答清单
- [ ] moxie/legacy 题目质量初筛
- [ ] 产出第一版复核清单

## 阶段 2: gemini-2.5-pro 逐条复核
- [ ] learning key_terms 低频词义逐条复核
- [ ] related_questions 逐条判定（转移/删除/保留）
- [ ] 重复题干逐组判定（保留哪个源）
- [ ] zhenti_web 逐条判定
- [ ] moxie/legacy 题目质量抽查
- [ ] 复核结果落盘 + 主模型裁定

## 阶段 3: 删除执行
- [ ] 按裁定清单逐批删除/转移
- [ ] 每批 data:build + validate 全绿
- [ ] grep 确认无消费破坏

## 阶段 4: 回归
- [ ] npm run check 全绿
- [ ] browser-test 67 / page-scan 85 / full-flow 44
- [ ] 更新 README 数据规模 + build-report 说明

## 阶段 5: 收尾
- [ ] 复核报告落盘
- [ ] spec 更新（清洗约定）
- [ ] 分阶段 git commit
- [ ] task.py archive
