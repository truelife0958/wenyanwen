# 数据修复修正清单 (08-11-data-audit-fix)

## 已修复问题

### P0-1: moxie qid 全局不唯一 → 唯一化
- **根因**: raw qid `moxie:{title}:{序号}` 缺题型(section)序号,同一 qid 指向最多 4 道不同题目;build 脚本 `it.qid || 兜底` 因 raw 已有 qid 不生效。
- **修复**:
  - `scripts/build-runtime-data.mjs`: 强制重写 qid 为 `${artId}:${si}:${ii}`(篇目:题型序号:题序号)。
  - raw `moxie.json`(1651 题)+ `moxie-legacy.json`(1081 题)qid 同步重写,文件内唯一。
  - 前端适配: `Home.tsx` / `MoxieErrors.tsx` 的 `startsWith('moxie:')` → `startsWith('moxie')`(新 qid 前缀 `moxie-`)。
- **结果**: runtime 2695 题 qid 全部唯一;`validate` 段 8/10 断言可证明。
- **进度影响**: 旧 qid(`moxie:观沧海:0`)与新手写(`moxie-观沧海:0:0`)不兼容;旧进度本身错乱(1 qid 对多题),无法迁移,已重置。发布时需在说明中注明。

### P0-2: moxie 篇目顶层 id 重复(10 条)→ 唯一化
- **修复**:
  - raw `moxie.json`: 6 条"默写效果检测" id → `moxie-默写效果检测-{book_page}`(15/32/57/76/88/110)。
  - book title 剥离考频后缀后,legacy "约客"/"渡荆门送别" 正确合并,不再重复 push。
  - build 脚本防御: 合并后 id 仍重复则追加 `-{idx}` 并 warn。
- **结果**: runtime 151 篇 id 全部唯一;`MoxieHome` key/路由正确。

### P1-3: moxie-book title 混入考频标注(5 条)→ 剥离
- `约客 3年9考`→`约客`;`渡荆门送别 3年21考`→`渡荆门送别`;`过松源晨炊漆公店(其五) 3年3考`→`过松源晨炊漆公店(其五)`;`《孟子》三章 得道多助,失道寡助 (3年7考)`→`《孟子》三章 得道多助,失道寡助`;`过零丁洋(3年45考)`→`过零丁洋`。

### P1-4: raw 备份残留 → 删除
- 删除 `learning.json.bak3`(127 项,与主文件不同的旧版本)、`zhenti_web.json.bak`(140 项)、`zhenti_web.json.bak2`(221 项)。
- `.gitignore` 追加 `*.bak*`。

### P1-5: zhenti_web 同题不同答案 → **误报关闭**
- 详细核对: 2 组 5 条(web-bg-049/056/077/101/108)实为**不同篇目**的同模板题干(省/市/题型/题干相同但 title 不同),非重复题。
- validate 段 9 新增"完全重复(含篇目)"断言 + "同题干不同答案"警告,当前 0 组。

### P1-6: 望洞庭湖篇目错字 → 修正 16 处
- 权威篇名《望洞庭湖**赠**张丞相》(learning 原正确)。
- 修正: `practice.json` 5 处(title 1 + 题干 4)、`moxie-legacy.json` 6 处(id + title + 题干 4)、`learning.json` 4 处(题干)、`exam-tags.ts` 1 处(key)。
- **影响**: practice 该篇 5 题此前因标题匹配失败丢失,现正确挂回篇目;考试标签生效。

### 年级长名规范化(126+126+126 条)
- `learning.json` / `practice.json` / `moxie-legacy.json` 长名(`七年级上册`等)→ 短名(`七上`等);`九年级`(课外篇目无册别)→ `附录`。
- validate 段 8 断言: 年级短名规范。

## 准确性抽样结果(R4, 无修正项)

| 抽样对象 | 结果 |
|---|---|
| learning 原文 7 篇 14+ 名句(岳阳楼记/醉翁亭记/曹刿论战/三峡/出师表/桃花源记/爱莲说) | 全部正确(2 处为标点差异,非错误) |
| 竹里馆译文(46 字) | 完整("独自闲坐在幽深的竹林里,一边弹琴一边高歌长啸。在幽深的竹林中无人知晓,(唯有)明月来陪伴我。") |
| zhenti 答案 3 条 + zhenti_web 答案 2 条 | 内容完整合理 |
| exam_point_rewrites 127 篇 | 全部有重写内容,结构规范 |

## 其他

- `full-flow-test.mjs` 深链访问改为模拟 404.html 兜底流程(静态托管形态;preview 环境直访深链会资源 404,基线验证为既有问题,非本次回归)。
- validate-data.mjs 新增段 8(raw 唯一性)/9(真题重复)/10(runtime moxie 一致性)/11(样式硬编码,占位,由 style-unify 填充)。

## 验证

- `npm run check`: 0 错误(data:build + validate + typecheck + build + SSR 全绿)
- `npm run test:flow`: 42/42 通过
