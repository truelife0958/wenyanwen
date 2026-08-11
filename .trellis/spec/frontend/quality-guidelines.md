# Quality Guidelines

> Code quality standards for this project (v3.0 双模块版).

---

## 验证命令链 (改数据/前端后必跑)

```bash
npm run check        # data:build + validate + typecheck + vite build + ssr-check
npm run test:flow    # playwright 端到端 (42 项: 首页/学习/默写/错题/移动端/深链)
node scripts/moxie/validate.mjs   # 默写抽取完整性 (页覆盖/篇目/配对率) → ocr/moxie/report.md
node scripts/vision/vision.mjs <url> --mobile --mode describe   # UI 视觉验收
npm run validate   # 含段 8 raw 唯一性 / 段 9 真题重复 / 段 10 runtime 一致性 / 段 11 样式硬编码 gate
```

## 数据约定

- **默写数据**：`src/data/raw/moxie.json`（书抽取）+ `moxie-legacy.json`（旧题转换），`build-runtime-data.mjs` 合并去重 → `runtime/moxie.json`；**qid 必须全局唯一**（build 强制重写为 `{artId}:{secIdx}:{itemIdx}`，artId=`moxie-{title}`；raw 文件内 qid 亦须唯一，validate 段 8/10 断言）。
- **抽取管道**（scripts/moxie/）：VLM (gemini-2.5-pro-1m @ bohe) 逐页抽取；**API 限速 25 req/5min**，并发默认 3、429 等待 60s；断点续跑（输出文件存在且可解析即跳过）。
- **标题归一化**（pair.mjs normTitle）：去 `[唐]王湾` 行尾作者、`3年21考` 考频标签、全角中点 `・`；匹配策略：精确 → 包含/后缀。**一页两篇**页必须拆分为 `articles` 数组输出。
- **检测卷**（默写效果检测/综合练习）：答案册条目按页序与主书连续页分组配对（`__detect_N` key），卷内答案**全局顺序分配**（答案册把词义/活用/古今答案都标为"词义默写"）。
- **grade**：优先从 learning.json 对齐，其次页面标注；非法值归 `附录`（检测卷/主题默写所在）。
- **错题本**：moxie 错题 qid 前缀 `moxie`（旧格式 `moxie:` 与新格式 `moxie-` 均匹配，`startsWith('moxie')`），`/moxie/errors` 过滤展示。
- **qid 历史变更**：2026-08-11 从 `moxie:{title}:{i}`（缺题型序号, 361 个重复）改为 `moxie-{title}:{sec}:{i}`；旧进度不兼容, 已重置。

## 前端约定

- TabBar 固定 2 tab（学习/默写）；新功能入口不新增 tab。
- 主题切换走 `tokens.ts` 的 `applyTheme/initTheme`（localStorage `wyw_theme`），不要散落 CSS 覆盖。
- `localStorage` 读取要处理 `null`（`Number(null)=0` 陷阱，见 ArticleReader loadSetting）。
- 阅读工具条（语速/字号/主题）状态持久化 key：`wyw_tts_rate` / `wyw_font_scale`。
