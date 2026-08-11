# 执行计划: 4 类默写输入化 + 词义去重 + 数据全量排查

## 1. 数据修复脚本 (scripts/moxie/dedup-legacy-moxie.py)
- [ ] 1.1 legacy 多小题译文题拆分 (6 题): q 切分, answers 对应 (`|` 或数组), qid 加 `:sN` 后缀
- [ ] 1.2 词义默写按【词】去重: book 优先, legacy 同词丢弃 (记录去重清单)
- [ ] 1.3 legacy 全量半角标点 → 全角 (q/answers/extra, 排除 qid)
- [ ] 1.4 输出 fix-record.md (拆分/去重/标点统计)

## 2. build 脚本适配
- [ ] 2.1 确认合并逻辑: 词义默写 raw 层已去重, build 无需改 (验证即可)

## 3. 前端 4 类输入化
- [ ] 3.1 MoxieArticle.tsx: FillQuestionCard 覆盖全部题型 (词义【字】高亮 + 输入; 译文长答案自适应)
- [ ] 3.2 无 answers 题 → "答案待补" + 自评兜底
- [ ] 3.3 moxie.css: 输入框样式适配译文长答案

## 4. validate 段 13
- [ ] 4.1 词义同篇无重复【词】
- [ ] 4.2 无多小题 q / 无 `|` 答案 / 无半角标点
- [ ] 4.3 runtime 同篇同题型归一化无重复

## 5. 验证
- [ ] 5.1 npm run data:build + validate 全绿
- [ ] 5.2 npm run check 0 错误
- [ ] 5.3 npm run test:flow 42/42
- [ ] 5.4 浏览器实测: 论语十二章词义无重复 / 望岳译文拆分独立判分 / 观沧海 4 题型输入

## 回滚点
- 数据修复前: git checkout src/data/raw/moxie*.json
- 前端改造前: git checkout src/features/moxie/MoxieArticle.tsx moxie.css
