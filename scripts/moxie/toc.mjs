#!/usr/bin/env node
/** 篇目清单: 从正文抽取结果聚合 → ocr/moxie/toc.json (校验基准, 无需额外 VLM 调用)
 *  用法: node scripts/moxie/toc.mjs
 *  产物: ocr/moxie/toc.json { entries: [{title, grade, book_page}], count }
 */
import { readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const RAW = resolve(ROOT, 'ocr/moxie/raw');

const files = readdirSync(RAW).filter((f) => f.startsWith('main_p') && f.endsWith('.json')).sort();
const entries = [];
for (const f of files) {
  try {
    const d = JSON.parse(readFileSync(resolve(RAW, f), 'utf8'));
    const arts = Array.isArray(d.articles) && d.articles.length ? d.articles : [{ ...d }];
    for (const a of arts) {
      entries.push({
        file: f,
        title: String(a.title || '').replace(/\[[^\]]*\]/g, '').trim(),
        grade: a.grade || '',
        book_page: Number(a.book_page) || 0,
        sections: (a.sections || []).map((s) => s.type),
      });
    }
  } catch { /* 跳过损坏 */ }
}
writeFileSync(resolve(ROOT, 'ocr/moxie/toc.json'), JSON.stringify({ entries, count: entries.length }, null, 2));
console.log(`✅ toc.json: ${entries.length} 条目 (来自正文抽取)`);
// 打印年级分布
const byGrade = {};
for (const e of entries) byGrade[e.grade] = (byGrade[e.grade] || 0) + 1;
console.log(JSON.stringify(byGrade, null, 0));
