// 数据审核脚本 — 全量程序化扫描 (只读, 不修改数据)
// 检查项 A1-A12 见 design.md
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..', '..', '..', '..');
const R = (p) => JSON.parse(readFileSync(join(root, p), 'utf8'));

const articles = R('src/data/runtime/articles.json');
const words = R('src/data/runtime/words.json');
const questions = R('src/data/runtime/questions.json');
const collections = R('src/data/runtime/collections.json');

let errors = 0, warns = 0;
const E = (cat, detail) => { errors++; console.log(`  ✗ [${cat}] ${detail}`); };
const W = (cat, detail) => { warns++; console.log(`  ⚠ [${cat}] ${detail}`); };
const ok = (cat, n) => console.log(`  ✓ [${cat}] ${n}`);

const norm = (s) => String(s || '').replace(/[\s，。、；：！？「」『』《》〈〉“”‘’（）()·,.;:!?]/g, '');

console.log('=== A1. 原文标点异常 ===');
let a1e = 0, a1w = 0;
for (const a of articles) {
  const orig = a.reading?.original || '';
  // 连续相同标点
  const dup = orig.match(/([，。、；：！？])\1{1,}/g);
  if (dup) { dup.forEach(d => E('A1连续标点', `${a.id}: "${d}"`)); a1e++; }
  // 半角逗号/句号混入中文
  if (/[a-zA-Z0-9]*,/.test(orig) === false && /，/.test(orig)) {
    const half = orig.match(/[^，。；：！？\n]{2,}[,\.]/g);
    if (half && half.length > 2) { W('A1半角标点', `${a.id}: ${half.slice(0,3).join(' | ')}`); a1w++; }
  }
  // 无句读长段
  for (const p of a.reading?.paragraphs || []) {
    const text = (typeof p.original === 'string' ? p.original : '') || '';
    const noPunct = text.replace(/[，。、；：！？…—・·]/g, '');
    if (noPunct.length > 80 && text.length > 80) { W('A1无句读长段', `${a.id}: "${text.slice(0,30)}..."`); a1w++; }
  }
}
ok('A1', `异常 ${a1e} 警告 ${a1w}`);

console.log('\n=== A2. 译文覆盖(整体 translation vs original) ===');
let a2w = 0;
for (const a of articles) {
  const orig = (a.reading?.original || '').replace(/\s/g, '');
  const trans = (a.reading?.translation || '').replace(/\s/g, '');
  if (!trans) { W('A2无译文', a.id); a2w++; continue; }
  // 文言文译文通常比原文长(或接近); 若译文 < 原文 40% 高度疑似漏译
  const ratio = trans.length / Math.max(1, orig.length);
  if (ratio < 0.4) { W('A2译文过短', `${a.id}: 原文${orig.length}字/译文${trans.length}字 (${(ratio*100).toFixed(0)}%)`); a2w++; }
}
ok('A2', `警告 ${a2w}`);
console.log('\n=== A3. 译文残留(译文与原文字符重叠) ===');
let a3w = 0;
for (const a of articles) {
  const paras = a.reading?.paragraphs || [];
  for (const p of paras) {
    const o = norm(p.original || '');
    const t = norm(p.translation || '');
    if (!o || !t || t.length < 10) continue;
    // 原文中的连续片段(>=6字)出现在译文中 → 疑似未翻译
    for (let i = 0; i <= o.length - 6; i++) {
      const seg = o.slice(i, i + 6);
      if (t.includes(seg)) { W('A3译文残留', `${a.id}: 译文含原文片段 "${seg}"`); a3w++; break; }
    }
  }
}
if (!a3w) ok('A3', '无残留');
else console.log(`  ⚠ [A3] ${a3w} 处`);

console.log('\n=== A4. 背诵句定位 ===');
let a4e = 0;
for (const a of articles) {
  const stars = a.recitation?.stars || [];
  const orig = norm(a.reading?.original || '');
  for (const s of stars) {
    if (!s?.sentence) continue;
    const sn = norm(s.sentence);
    if (sn.length < 4) { E('A4背诵句过短', `${a.id}: "${s.sentence}"`); a4e++; continue; }
    // 允许 95% 匹配: 取前 90% 长度子串查原文
    const probe = sn.slice(0, Math.floor(sn.length * 0.9));
    if (!orig.includes(probe)) { E('A4背诵句未定位', `${a.id}: "${s.sentence.slice(0,30)}..."`); a4e++; }
  }
}
ok('A4', a4e === 0 ? '全部定位' : `${a4e} 处未定位`);

console.log('\n=== A5. 义项质量 ===');
let a5w = 0, a5cnt = 0;
for (const w of words) {
  for (const m of w.meanings || []) {
    a5cnt++;
    const t = (m.text || '').trim();
    if (t.length > 0 && t.length < 2 && !/^(和|同|通|也|矣|乎|焉|哉|耳|邪|与)$/.test(t)) { W('A5义项过短', `${w.id}: "${t}"`); a5w++; }
    if (t.length > 120) { W('A5义项过长', `${w.id}: ${t.length}字`); a5w++; }
    if (t.includes('……') && !t.includes('……此处')) { W('A5义项截断', `${w.id}: "${t.slice(0,30)}..."`); a5w++; }
  }
}
ok('A5', `义项 ${a5cnt} 条, 警告 ${a5w}`);

console.log('\n=== A6. category 枚举 ===');
const VALID = new Set(['课文注释', '重点实词', '实词', '文言虚词', '一词多义', '虚词', '词类活用', '通假字', '古今异义', '炼字', '重点虚词']);
let a6e = 0;
const cats = new Set();
for (const w of words) for (const m of w.meanings || []) cats.add(m.category);
for (const c of cats) if (!VALID.has(c)) { E('A6非法category', c); a6e++; }
ok('A6', `共 ${cats.size} 类, 非法 ${a6e}`);

console.log('\n=== A7. example 定位(抽样 50) ===');
const byArticle = new Map(articles.map((a) => [a.id, norm(a.reading?.original || '')]));
let a7tested = 0, a7miss = 0, a7skip = 0;
for (const w of words) {
  if (a7tested >= 50) break;
  if (!w.articleId) { a7skip++; continue; }
  for (const m of w.meanings || []) {
    if (a7tested >= 50) break;
    if (!m.example) continue;
    a7tested++;
    const ex = norm(m.example);
    const orig = byArticle.get(w.articleId) || '';
    if (ex.length >= 4 && !orig.includes(ex.slice(0, Math.max(3, Math.floor(ex.length * 0.7))))) {
      W('A7例句未定位', `${w.id}: "${m.example.slice(0, 25)}..."`); a7miss++;
    }
  }
}
ok('A7', `抽样 ${a7tested} 条, 未定位 ${a7miss}`);

console.log('\n=== A8. 题干泄漏 ===');
let a8e = 0;
for (const q of questions) {
  const stem = norm(q.stem || '');
  const ans = norm(Array.isArray(q.answer) ? q.answer.join('') : q.answer || '');
  if (stem.length > 10 && ans.length >= 6 && stem.includes(ans)) {
    E('A8题干含答案', `${q.id}: 题干包含答案 "${ans.slice(0,20)}..."`); a8e++;
  }
}
ok('A8', a8e === 0 ? '无泄漏' : `${a8e} 处`);

console.log('\n=== A9. 选择题选项合法性 ===');
let a9e = 0, a9ok = 0;
for (const q of questions) {
  const opts = q.options || [];
  if (!opts.length) continue;
  a9ok++;
  if (opts.length < 2 || opts.length > 6) { E('A9选项数异常', `${q.id}: ${opts.length} 个选项`); a9e++; continue; }
  const ans = String(q.answer || '').trim();
  // 单字母答案必须在 [A..F] 范围; 多选如 ABD
  if (!/^[A-F]{1,4}$/.test(ans)) { E('A9答案格式异常', `${q.id}: answer="${ans}"`); a9e++; continue; }
  for (const ch of ans) {
    const idx = ch.charCodeAt(0) - 65;
    if (idx >= opts.length) { E('A9答案超出选项', `${q.id}: "${ch}" 超出 ${opts.length} 个选项`); a9e++; break; }
  }
}
ok('A9', `选择题 ${a9ok}, 异常 ${a9e}`);

console.log('\n=== A10. type 一致性 ===');
let a10w = 0;
for (const q of questions) {
  const hasOpts = (q.options || []).length > 0;
  if (hasOpts && !['choice', 'blank', 'punct', 'punctuate'].includes(q.type)) { W('A10有选项非选择类', `${q.id}: type=${q.type}`); a10w++; }
  if (!hasOpts && q.type === 'choice') { W('A10无选项却是choice', q.id); a10w++; }
}
ok('A10', `警告 ${a10w}`);

console.log('\n=== A11. 真题年份 ===');
let a11w = 0, ztCount = 0;
for (const q of questions) {
  if (q.origin !== 'zhenti' && !(q.origins || []).includes('zhenti')) continue;
  ztCount++;
  if (q.year && !/^\d{4}$/.test(q.year)) { W('A11年份格式', `${q.id}: year="${q.year}"`); a11w++; }
}
ok('A11', `真题 ${ztCount}, 警告 ${a11w}`);

console.log('\n=== A12. 空白残留 ===');
let a12w = 0;
const scan = (s, loc) => {
  if (!s) return;
  if (/\u00a0|\t|\u3000/.test(s)) { W('A12特殊空白', `${loc}: ${JSON.stringify(s.slice(0, 40))}`); a12w++; }
};
for (const a of articles) {
  scan(a.title, `${a.id}.title`);
  scan(a.reading?.original, `${a.id}.original`);
  scan(a.reading?.translation, `${a.id}.translation`);
}
for (const q of questions) scan(q.stem, `${q.id}.stem`);
ok('A12', `警告 ${a12w}`);

console.log(`\n========== 审核结果: ${errors} ERROR / ${warns} WARN ==========`);
process.exit(errors > 0 ? 2 : 0);
