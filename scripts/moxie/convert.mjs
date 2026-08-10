#!/usr/bin/env node
/** 转换 PDF → PNG (主书正文 p004–p120, 答案册 p002–p033)
 *  用法: node scripts/moxie/convert.mjs
 *  产物: ocr/moxie/img/main_pNNN.png / ans_pNNN.png + manifest.json
 *  幂等: 已存在且大小>100KB 的图片跳过
 */
import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, readdirSync, writeFileSync, statSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const IMG = resolve(ROOT, 'ocr/moxie/img');
const ARCHIVE = '/home/truel/wuhan-wenyanwen-app_archive/初中语文《必背文言文+古诗默写》789年级（2026版）';
const MAIN_PDF = resolve(ARCHIVE, '2026《初中语文•一本必背文言文+古诗默写》7-9年级.pdf');
const ANS_PDF = resolve(ARCHIVE, '2026《初中语文•一本必背文言文+古诗默写》7-9年级答案册.pdf');
const DPI = 150;

mkdirSync(IMG, { recursive: true });

/** 转一个区间; 返回生成的文件名列表 */
/** 转一个区间; 返回生成的文件名列表 (pdftoppm 追加 -页号 后缀, 生成后重命名) */
function convert(pdf, first, last, prefix, pageOffset) {
  const files = [];
  for (let p = first; p <= last; p++) {
    const bookPage = p - pageOffset; // 书页号
    const name = `${prefix}_p${String(bookPage).padStart(3, '0')}.png`;
    const out = resolve(IMG, name);
    if (existsSync(out) && statSync(out).size > 100 * 1024) {
      files.push(name);
      continue; // 幂等跳过
    }
    const tmp = resolve(IMG, `.tmp-${name}`);
    execFileSync('pdftoppm', ['-png', '-r', String(DPI), '-f', String(p), '-l', String(p), pdf, tmp.replace(/\.png$/, '')]);
    // pdftoppm 追加 -<页号> 后缀, 宽度随文档总页数变化 (120页→3位, 33页→2位); 扫描目录找产出
    const produced = readdirSync(IMG).find((f) => f.startsWith(`.tmp-${name.replace(/\.png$/, '')}-`) && f.endsWith('.png'));
    if (!produced) throw new Error(`pdftoppm 未产出文件: ${name}`);
    execFileSync('mv', [resolve(IMG, produced), out]);
    files.push(name);
  }
  return files;
}

console.log('📄 转换主书 p004–p120 …');
const main = convert(MAIN_PDF, 4, 120, 'main', 3);
console.log(`  ✅ ${main.length} 页 (main_p001–main_p117)`);

console.log('📄 转换答案册 p002–p033 …');
const ans = convert(ANS_PDF, 2, 33, 'ans', 1);
console.log(`  ✅ ${ans.length} 页 (ans_p001–ans_p032)`);

writeFileSync(resolve(IMG, 'manifest.json'), JSON.stringify({ main, ans, dpi: DPI, generatedAt: new Date().toISOString() }, null, 2));
console.log('✅ manifest.json 已生成');
