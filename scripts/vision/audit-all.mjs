#!/usr/bin/env node
/** 全站 VLM 视觉审查 — 遍历所有页面路由, 每页截屏 + VLM 专业审查, 汇总综合问题清单。
 *  用法: node scripts/vision/audit-all.mjs [--limit N] [--mobile] */
import { runVision, DEFAULT_PROVIDER } from './lib.mjs';
import { writeFileSync } from 'node:fs';

const BASE = (process.env.BASE_URL || 'http://localhost:8765/').replace(/\/$/, '');
const args = process.argv.slice(2);
const li = args.indexOf('--limit'); const limit = li >= 0 ? parseInt(args[li + 1] || '99', 10) : 99;
const onlyMobile = args.includes('--mobile');

// 页面清单 (与 page-scan 对齐: 核心页 + 代表篇目 tab + 题集 + 移动端)
const PAGES = [
  ['首页', '/'],
  ['字词卡', '/cards'],
  ['复习中心(题集)', '/collections'],
  ['篇目工作区-学习', '/articles/jc-yueyanglouji/learn'],
  ['篇目工作区-练习', '/articles/jc-yueyanglouji/practice'],
  ['篇目工作区-复习', '/articles/jc-yueyanglouji/review'],
  ['古诗-学习', '/articles/jc-ly/learn'],
  ['题集详情-古代诗歌四首', '/collections/collection:practice:古代诗歌四首'],
  ['错题本+题集页', '/collections'],
];

const MOBILE_PAGES = [
  ['移动-首页', '/'],
  ['移动-学习', '/articles/jc-yueyanglouji/learn'],
  ['移动-练习', '/articles/jc-yueyanglouji/practice'],
  ['移动-复习', '/articles/jc-yueyanglouji/review'],
  ['移动-题集', '/collections'],
  ['移动-字词卡', '/cards'],
];

const list = onlyMobile ? MOBILE_PAGES : PAGES;
const slice = list.slice(0, limit);

console.log(`🔍 全站 VLM 审查: ${slice.length} 页 (${onlyMobile ? '移动' : '桌面'}视口)`);
console.log(`VLM: ${DEFAULT_PROVIDER.name}/${DEFAULT_PROVIDER.model}\n`);

const results = [];
let fail = 0;

for (const [label, hash] of slice) {
  process.stdout.write(`● ${label} ... `);
  const t0 = Date.now();
  try {
    const r = await runVision({
      url: BASE + hash,
      outDir: 'vision-shots/audit',
      viewport: onlyMobile ? 'mobile' : 'desktop',
      mode: 'ui-review',
    });
    results.push({ label, url: hash, analysis: r.report, reportFile: r.reportFile });
    console.log(`✓ ${((Date.now() - t0) / 1000).toFixed(1)}s`);
  } catch (e) {
    fail++;
    console.log(`✗ ${e.message.slice(0, 60)}`);
  }
}

// 汇总报告
const out = [
  `# 全站 VLM 视觉审查报告 (${onlyMobile ? '移动' : '桌面'})`,
  ``,
  `- 日期: ${new Date().toISOString().slice(0, 19)}`,
  `- 页面数: ${results.length} | 失败: ${fail}`,
  `- VLM: ${DEFAULT_PROVIDER.name}/${DEFAULT_PROVIDER.model}`,
  ``,
  `## 各页审查`,
  ``,
];
for (const r of results) {
  out.push(`### ${r.label} (\`${r.url}\`)`);
  out.push('');
  out.push(r.analysis);
  out.push('');
}
writeFileSync('vision-shots/audit-master-report.md', out.join('\n'), 'utf8');
console.log(`\n✅ 综合报告: vision-shots/audit-master-report.md`);
console.log(`失败页: ${fail}`);
process.exit(fail ? 1 : 0);
