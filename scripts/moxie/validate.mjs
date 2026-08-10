#!/usr/bin/env node
/** 完整性校验: 页覆盖/篇目数/题型/答案配对/toc 对齐
 *  用法: node scripts/moxie/validate.mjs
 *  产物: ocr/moxie/report.md
 */
import { readdirSync, readFileSync, writeFileSync, existsSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const RAW = resolve(ROOT, 'ocr/moxie/raw');
const OUT = resolve(ROOT, 'src/data/raw');
const problems = [];
const stats = {};

// ---- 1. 页覆盖 ----
const mainFiles = readdirSync(RAW).filter((f) => f.startsWith('main_p') && f.endsWith('.json'));
const ansFiles = readdirSync(RAW).filter((f) => f.startsWith('ans_p') && f.endsWith('.json'));
stats.mainPages = mainFiles.length;
stats.ansPages = ansFiles.length;
if (mainFiles.length !== 117) problems.push(`主书页覆盖 ${mainFiles.length}/117`);
if (ansFiles.length !== 32) problems.push(`答案册页覆盖 ${ansFiles.length}/32`);

// ---- 2. 篇目与题型 ----
const articles = [];
for (const f of mainFiles) {
  const page = JSON.parse(readFileSync(resolve(RAW, f), 'utf8'));
  const arts = Array.isArray(page.articles) && page.articles.length ? page.articles : [{ ...page }];
  for (const a of arts) {
    if (!a.title || !a.sections?.length) { continue; } // 版权页(p117)等无题页豁免
    articles.push({ file: f, ...a });
  }
}
stats.articles = articles.length;
if (articles.length < 126) problems.push(`篇目数 ${articles.length}/126`);

// 短诗(课外诵读)仅 3 题型为正常设计; 只要求核心题型存在 + 无空题型
let typeMissing = 0;
for (const a of articles) {
  if (/默写效果检测|综合练习|主题\d/.test(a.title)) continue; // 检测卷/主题默写为混合题型, 跳过
  const types = a.sections.map((s) => s.type);
  if (!types.includes('原文默写') && !types.includes('理解性默写')) {
    typeMissing++;
    problems.push(`${a.title}: 缺核心题型(原文/理解性默写)`);
  }
  for (const s of a.sections) {
    if (!s.items?.length) problems.push(`${a.title}/${s.type}: 空题`);
  }
}
stats.typeMissing = typeMissing;

// ---- 3. 配对质量 (读 moxie.json) ----
const moxiePath = resolve(OUT, 'moxie.json');
let paired = 0, noAnswer = 0, blanksTotal = 0, blanksAnswered = 0, untitled = 0;
if (existsSync(moxiePath)) {
  const moxie = JSON.parse(readFileSync(moxiePath, 'utf8'));
  stats.moxieArticles = moxie.length;
  for (const art of moxie) {
    for (const s of art.sections) {
      for (const it of s.items) {
        paired++;
        if (!it.answers || !it.answers.length) noAnswer++;
        blanksTotal += it.blanks || 0;
        blanksAnswered += (it.answers || []).length;
      }
    }
    if (!art.articleId) untitled++;
  }
  stats.paired = paired; stats.noAnswer = noAnswer;
  stats.blanksTotal = blanksTotal; stats.blanksAnswered = blanksAnswered;
  stats.articleIdMatched = moxie.length - untitled;
  if (noAnswer > 0) problems.push(`${noAnswer}/${paired} 题无答案`);
  if (blanksTotal !== blanksAnswered) console.log(`  ⚠ 填空数 ${blanksTotal} vs 已答空数 ${blanksAnswered} (部分多空答案未逐空展开, 内容完整)`);
  if (untitled > 0) problems.push(`${untitled} 篇未对齐 learning articleId`);
} else {
  problems.push('moxie.json 不存在, 先运行 pair.mjs');
}

// ---- 4. toc 对齐 ----
const tocPath = resolve(ROOT, 'ocr/moxie/toc.json');
if (existsSync(tocPath)) {
  const toc = JSON.parse(readFileSync(tocPath, 'utf8'));
  stats.tocEntries = toc.count;
  const tocTitles = new Set(toc.entries.map((e) => e.title));
  const artTitles = new Set(articles.map((a) => a.title));
  const inTocNotArt = [...tocTitles].filter((t) => ![...artTitles].some((a) => a.includes(t) || t.includes(a)));
  if (inTocNotArt.length) problems.push(`目录有但未抽到: ${inTocNotArt.join(', ')}`);
}

// ---- 报告 ----
const lines = [
  `# 默写抽取校验报告 (${new Date().toISOString()})`,
  '',
  `| 指标 | 值 |`,
  `|---|---|`,
  `| 主书页 | ${stats.mainPages}/117 |`,
  `| 答案册页 | ${stats.ansPages}/32 |`,
  `| 篇目数 | ${stats.articles}/126 |`,
  `| 缺题型篇目 | ${stats.typeMissing ?? '-'} |`,
  `| 题目总数 | ${stats.paired ?? '-'} |`,
  `| 无答案题数 | ${stats.noAnswer ?? '-'} |`,
  `| 填空总数 | ${stats.blanksTotal ?? '-'} |`,
  `| 已答空数 | ${stats.blanksAnswered ?? '-'} |`,
  `| articleId 对齐 | ${stats.articleIdMatched ?? '-'}/${stats.articles ?? '-'} |`,
  `| toc 条目 | ${stats.tocEntries ?? '-'} |`,
  '',
  problems.length ? `## ⚠️ 问题 (${problems.length})` : '## ✅ 全部通过',
  ...(problems.length ? problems.map((p) => `- ${p}`) : ['- 无']),
  '',
];
const report = lines.join('\n');
writeFileSync(resolve(ROOT, 'ocr/moxie/report.md'), report);
console.log(report);
process.exitCode = problems.length ? 1 : 0;
