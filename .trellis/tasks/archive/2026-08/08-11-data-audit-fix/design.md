# 数据全盘校验/去重/准确性修复 — 技术设计

## 1. 问题根因与修复方案

### P0-1 moxie qid 全局不唯一(361 个重复)
- **根因**: raw qid 格式 `moxie:{title}:{section内序号}`,缺 section 序号;build 脚本 `it.qid || ...` 因 raw 已有 qid 不重写。
- **方案**: `build-runtime-data.mjs` moxie 处理段**强制重写** qid 为 `${artId}:${si}:${ii}`(artId 已唯一化后,si=题型序号,ii=题序号)。删除 `it.qid ||` 逻辑。
- **进度兼容**: 旧 qid(`moxie:观沧海:0`)与新 qid(`moxie-观沧海:0:0`)不兼容;旧进度本身错乱(1 qid 对多题)无法迁移 → 接受进度重置,build-report 记录,发布说明注明。

### P0-2 moxie 顶层 id 重复(10 条)
- **根因**: ①"默写效果检测"OCR 抽取同 id 复用(6 条,page 15/32/57/76/88/110);②book title 带考频后缀致 legacy 同名篇目合并失败被 push(约客/渡荆门送别各 1 条)。
- **方案**:
  1. raw moxie.json:6 条"默写效果检测" id 改为 `moxie-默写效果检测-{page}`;5 条 title 剥离考频后缀(P1-3)→ 修复后约客/渡荆门送别 legacy 自动合并,不再 push。
  2. build 脚本防御:合并后若 id 仍重复,追加 `-{idx}` 后缀并 console.warn。
- **联动影响**: `MoxieHome` key/路由用 id,唯一化后路由 `/moxie/moxie-默写效果检测-15` 等独立可达,正确。

### P1-3 moxie-book title 混入考频标注(5 条)
- **方案**: raw 中 5 条 title 剥离 `\d+年\d+考` 后缀:
  - `约客 3年9考` → `约客`
  - `渡荆门送别 3年21考` → `渡荆门送别`
  - `过松源晨炊漆公店(其五) 3年3考` → `过松源晨炊漆公店(其五)`
  - `《孟子》三章 得道多助,失道寡助 (3年7考)` → `《孟子》三章 得道多助,失道寡助`
  - `过零丁洋(3年45考)` → `过零丁洋`
- 修复后验证:build 后 runtime moxie 无重复 id;title 与 learning articleKey 匹配率提升。

### P1-4 raw 备份残留(3 文件)
- **方案**: diff 确认 bak 与主文件关系后删除 `learning.json.bak3`、`zhenti_web.json.bak`、`zhenti_web.json.bak2`;`.gitignore` 追加 `*.bak*`。

### P1-5 zhenti_web 同题不同答案(2 组 5 条)
- **方案**: 逐条核对题干/答案/web-bg-049/056/077/101/108,合并或修正为权威答案;修复后 `questionKey` 自动去重,validate 断言无"同省+同年+同题型+同题干"组。

### P1-6 exam-tags 篇目失配
- **方案**: 查 learning 中实际标题(疑似"望洞庭湖赠张丞相"),统一 exam-tags key 与 learning 标题。

## 2. validate-data.mjs 扩展设计

新增校验段(全部为硬失败 error,不通过则 exit 1):

```
=== 5. raw 数据源唯一性 ===
  - 8 数据源 id 唯一(moxie/learning/practice/zhenti/zhenti_web/handwritten/exam_point_rewrites keys)
  - moxie qid 全局唯一(含 legacy)
  - title 无考频后缀残留(正则 \d+年\d+考)
=== 6. 真题重复检测 ===
  - zhenti_web 完全重复(同省+同年+同题型+同题干+同答案) → error
  - zhenti_web 同题干不同答案 → warn(人工核对)
=== 7. runtime 产物一致性 ===
  - runtime moxie 顶层 id 唯一 + qid 唯一
  - questions/words id 唯一(已有部分,补强)
  - moxie articleId 全部指向存在的 learning id
=== 8. 样式硬编码扫描(预留,由 style-unify 实现) ===
  - 扫描 4 feature CSS + global.css 中 #hex 颜色,error 提示
  - 本任务只留占位,style-unify 填充实现
```

## 3. 准确性修复(R4)

- 已抽样确认:岳阳楼记/醉翁亭记/曹刿论战/三峡 14 名句全部正确。
- 补抽样 6 篇:出师表/桃花源记/爱莲说(learning)+ 2 篇 zhenti 答案 + "竹里馆" 46 字译文完整性确认。
- 修正项记录到本任务 `research/fixes.md`,并同步 raw 数据。

## 4. 风险与回滚

- **进度重置**: 默写进度 qid 不兼容,旧进度悬空(可接受,见 P0-1)。
- **数据编辑风险**: raw JSON 编辑前先 git 快照(当前工作区干净,commit 已含原状)。
- **回滚**: 数据修复独立 commit;出问题 `git revert` 对应 commit 即可,构建管道(42/42)是回归闸门。
