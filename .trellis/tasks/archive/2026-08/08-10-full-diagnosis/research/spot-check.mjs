// 数据质量抽查脚本 — 一次性诊断工具(不修改任何数据)
// 检查: 重复 id / OCR 残留 / 截断 / 悬空引用 / 必填空值
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

let issues = 0;
const report = (label, detail) => { console.log(`  ✗ ${label} — ${detail}`); issues++; };
const info = (label, detail = '') => console.log(`  · ${label}${detail ? ': ' + detail : ''}`);

console.log('=== A. 重复检测 ===');
const dup = (arr, keyFn, label) => {
  const seen = new Map();
  for (const x of arr) {
    const k = keyFn(x);
    if (seen.has(k)) report(`${label} 重复`, `${k} (${seen.get(k)} / ${arr.indexOf(x)})`);
    seen.set(k, x.id || k);
  }
};
dup(articles, (x) => x.id, '文章 id');
dup(words, (x) => x.id, '字词 id');
dup(questions, (x) => x.id, '题目 id');
dup(collections, (x) => x.id, '题集 id');
// 字词同 (word, articleId) 重复
const wseen = new Set();
for (const w of words) {
  const k = `${w.word}|${w.scope === 'global' ? 'global' : w.articleId}`;
  if (wseen.has(k)) report('字词(word+article)重复', k);
  wseen.add(k);
}
info('字词(word+article)唯一', `${wseen.size}/${words.length}`);

console.log('\n=== B. OCR乱码扫描(□/◇/watermark等;英文残留以validate为准) ===');
const residue = (s) => /[□◇◆▢]|【OCR|【图片|\[图片|image_\d|watermark|undefined|null|NaN/i.test(s || '');
let residueCount = 0;
for (const a of articles) {
  const texts = [
    a.title, a.author, a.origin, a.source,
    a.reading?.original, a.reading?.translation,
    a.analysis?.theme, a.analysis?.outline, a.analysis?.writing,
    a.analysis?.culture?.text, a.analysis?.culture?.authorIntro, a.analysis?.culture?.background,
  ].filter(Boolean);
  for (const t of texts) {
    if (residue(t)) { report('OCR乱码残留', `${a.id}: ${String(t).slice(0, 60)}`); residueCount++; break; }
  }
}
for (const w of words) {
  for (const m of w.meanings || []) {
    if (residue(m.text) || residue(m.example)) { report('字词乱码残留', `${w.id}: ${m.text}`); residueCount++; break; }
  }
}
info('乱码残留', `${residueCount} 条`);
console.log('\n=== C. 必填字段空值 ===');
for (const a of articles) {
  if (!a.title) report('文章缺 title', a.id);
  if (!a.author) report('文章缺 author', a.id);
  if (!a.grade) report('文章缺 grade', a.id);
  if (!a.reading?.original) report('文章缺原文', a.id);
  if (!a.analysis?.theme) report('文章缺 theme 分析', a.id);
}
for (const q of questions) {
  if (!q.stem) report('题目缺题干', q.id);
  if (q.answer === undefined || q.answer === null || q.answer === '') report('题目缺答案', q.id);
}
for (const c of collections) if (!c.title) report('题集缺标题', c.id);

console.log('\n=== D. 悬空引用 ===');
const aIds = new Set(articles.map((x) => x.id));
const qIds = new Set(questions.map((x) => x.id));
const wIds = new Set(words.map((x) => x.id));
for (const a of articles) {
  for (const qid of a.questionIds || []) if (!qIds.has(qid)) report('文章→题目悬空', `${a.id} -> ${qid}`);
  for (const wid of a.wordIds || []) if (!wIds.has(wid)) report('文章→字词悬空', `${a.id} -> ${wid}`);
}
for (const c of collections) {
  for (const qid of c.questionIds || []) if (!qIds.has(qid)) report('题集→题目悬空', `${c.id} -> ${qid}`);
}
for (const q of questions) {
  if (q.articleId && !aIds.has(q.articleId)) report('题目→文章悬空', `${q.id} -> ${q.articleId}`);
  if (q.collectionId && !new Set(collections.map((x) => x.id)).has(q.collectionId)) report('题目→题集悬空', `${q.id} -> ${q.collectionId}`);
}
for (const w of words) {
  if (w.articleId && !aIds.has(w.articleId)) report('字词→文章悬空', `${w.id} -> ${w.articleId}`);
}

console.log('\n=== E. 截断检测 ===');
const trunc = (s) => /[，、。；：？！]?[\u4e00-\u9fff]{0,3}$/.test(s) === false;
// 标题不以常见结尾符号结束的(纯观察)
let truncTitles = 0;
for (const a of articles) if (!a.title) continue;
for (const q of questions) {
  const stem = q.stem || '';
  // 长题干结尾不含任何中文标点且末字为"的/了/吗/呢"之外的
  if (stem.length > 20 && !/[。？!！?…]$/.test(stem) && !/^\d+[.、]/.test(stem) && /[a-z]$/i.test(stem.slice(-1))) {
    report('题干可能截断', `${q.id}: ...${stem.slice(-30)}`);
    truncTitles++;
  }
}
info('题干末字符英文(可疑)', `${truncTitles} 条`);

console.log('\n=== F. 统计核对 ===');
const aTotalQ = articles.reduce((s, x) => s + (x.questionIds?.length || 0), 0);
const cTotalQ = collections.reduce((s, x) => s + (x.questionIds?.length || 0), 0);
const orphanQ = questions.filter((q) => !q.articleId && !q.collectionId);
info('文章 questionIds 总数', String(aTotalQ));
info('题集 questionIds 总数', String(cTotalQ));
info('无归属题目', String(orphanQ.length));
if (orphanQ.length) orphanQ.slice(0, 5).forEach((q) => report('孤立题目', q.id));

console.log(`\n=== 结果: ${issues} 个问题 ===`);
