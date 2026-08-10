# 补充中考高频实词虚词卡片

## Goal

修复字词卡数据管道 bug(12 个存量虚词因 usage 格式不兼容从未入库),补充中考高频实词/虚词,使字词卡覆盖完整。

## 现状

- glossary 源数据: shici 80 实词 + xuci 18 虚词(learning.json type='glossary')
- runtime words.json: global 词条 86(80 实 + 6 虚)——12 个虚词(且/乃/则/也/焉/乎/与/因/遂/故/虽/然)因 usage 字段格式为 `{usage:...}` 而 build 脚本只认 `{category,subtype}` 被丢弃
- 实词缺教材附录词(OCR 丢失的 类/怜/名/明/难/平)及其他高频词

## Requirements

### R1 管道修复
- build-runtime-data.mjs 的 xuci 循环: `meaning = compact(usage.subtype || usage.category || usage.usage)` 兼容两种格式
- 重建后 18 个虚词全部进入 global 词表

### R2 虚词补充 (+4)
- 补 者、所、若、矣 → 虚词 22 个
- 每条含 2-5 义项,带例句 + 出处篇目

### R3 实词补充 (+30)
- 补: 类、怜、名、明、难、平(教材附录) + 比、鄙、兵、尝、敌、方、恨、惠、急、遣、强、请、入、少、适、汤、谓、悉、信、修、贻、益、造、致、置、逐、忠、竭(高频)
- 每条 1-4 义项,带例句 + 出处篇目(尽量用教材课文例句)

### R4 验证
- 重建后 global 词条 = 80+30 实词 + 22 虚词 = 132
- Flashcards 页面实词/虚词 tab 数量正确
- `npm run check` + `test:flow` + `page-scan` 无回归

## Acceptance Criteria

- [ ] 12 个存量虚词恢复(卡片 18 虚词)
- [ ] 虚词 22 个、实词 110 个
- [ ] 全部词条含例句与出处
- [ ] validate/check/flow 全过
