// 全项目数据全面校验 — 重复/空值/悬空引用/OCR残留/数字对账
import { readFileSync } from 'fs';

const R = (p) => JSON.parse(readFileSync(p, 'utf8'));
const problems = [];
const ok = (msg) => console.log('✓', msg);
const bad = (msg) => { problems.push(msg); console.log('✗', msg); };

// ===== 1. 文章 =====
const arts = R('src/data/runtime/articles.json');
const ids = new Set(), dupIds = [];
for (const a of arts) { if (ids.has(a.id)) dupIds.push(a.id); ids.add(a.id); }
dupIds.length ? bad(`文章重复 id: ${dupIds.join(',')}`) : ok(`文章 ${arts.length} 条, 无重复 id`);
const emptyArts = arts.filter(a => !a.title || !a.reading?.original || !a.reading?.translation);
emptyArts.length ? bad(`缺字段文章: ${emptyArts.map(a=>a.title||a.id).join(',')}`) : ok('文章 title/reading 无缺失');
// 原文译文对齐 (reading.paragraphs)
const misalign = arts.filter(a => a.reading?.paragraphs && (a.reading.paragraphs.filter(p=>p.original).length !== a.reading.paragraphs.filter(p=>p.translation).length));
misalign.length ? bad(`原文译文段落数不一致 ${misalign.length} 篇: ${misalign.slice(0,5).map(a=>a.title).join(',')}`) : ok('原文/译文段落对齐');
// OCR 残留
const ocr = arts.filter(a => /[□■]{2,}|�|【OCR|page_?\d+|Image ?\d+/.test(JSON.stringify(a)));
ocr.length ? bad(`文章 OCR 残留: ${ocr.map(a=>a.title).join(',')}`) : ok('无 OCR 残留');

// ===== 2. 题目 =====
const qs = R('src/data/runtime/questions.json');
const qids = new Set(), dupQ = [];
for (const q of qs) { if (qids.has(q.id)) dupQ.push(q.id); qids.add(q.id); }
dupQ.length ? bad(`题目重复 id(${dupQ.length}): ${dupQ.slice(0,8).join(',')}`) : ok(`题目 ${qs.length} 条, 无重复 id`);
const emptyQ = qs.filter(q => !q.stem || (q.type === 'choice' && (!q.options || q.options.length < 2)));
emptyQ.length ? bad(`题目缺 stem/选项(${emptyQ.length}): ${emptyQ.slice(0,8).map(q=>q.id).join(',')}`) : ok('题目 stem/选项无缺失');
const noAns = qs.filter(q => !q.answer || (Array.isArray(q.answer) && !q.answer.length));
noAns.length ? bad(`无答案(${noAns.length}): ${noAns.slice(0,8).map(q=>q.id).join(',')}`) : ok('题目答案无缺失');
// choice answer 合法性
const badAns = qs.filter(q => q.type === 'choice' && q.options && q.options.length && !/^[A-D]$/.test(String(q.answer)));
badAns.length ? bad(`choice 答案非 A-D(${badAns.length}): ${badAns.slice(0,8).map(q=>q.id+':'+q.answer).join(',')}`) : ok('choice 答案全部合法');
// 悬空引用
const artIds = new Set(arts.map(a => a.id));
const dangling = qs.filter(q => q.articleId && !artIds.has(q.articleId));
dangling.length ? bad(`题目悬空 articleId(${dangling.length}): ${dangling.slice(0,5).map(q=>q.id).join(',')}`) : ok('题目 articleId 全部有效');

// ===== 3. 字词 =====
const words = R('src/data/runtime/words.json');
const wid = new Set(), dupW = [];
for (const w of words) { if (wid.has(w.id)) dupW.push(w.id); wid.add(w.id); }
dupW.length ? bad(`字词重复 id(${dupW.length}): ${dupW.slice(0,5).join(',')}`) : ok(`字词 ${words.length} 条, 无重复 id`);
const emptyW = words.filter(w => !w.word || !w.meanings.length || w.meanings.some(m => !m.text));
emptyW.length ? bad(`字词缺字段(${emptyW.length}): ${emptyW.slice(0,5).map(w=>w.id).join(',')}`) : ok('字词 word/meanings 无缺失');

// ===== 4. 集合 =====
const colls = R('src/data/runtime/collections.json');
const emptyColl = colls.filter(c => !c.questionIds?.length);
emptyColl.length ? bad(`空题集(${emptyColl.length}): ${emptyColl.slice(0,5).map(c=>c.title).join(',')}`) : ok(`题集 ${colls.length} 个, 无空集`);

// ===== 5. 重复题目内容 =====
const seen = new Map(), dupContent = [];
for (const q of qs) {
  const key = (q.stem || '').slice(0, 40) + '|' + String(q.answer || '').slice(0, 20);
  if (seen.has(key)) dupContent.push(`${seen.get(key)} == ${q.id}`);
  else seen.set(key, q.id);
}
dupContent.length ? bad(`题目内容疑似重复(${dupContent.length}): ${dupContent.slice(0,6).join('; ')}`) : ok('题目内容无重复');

// ===== 6. 数字对账 =====
const totalQ = qs.length;
const choiceQ = qs.filter(q => q.type === 'choice').length;
const senseCount = words.reduce((s, w) => s + w.meanings.length, 0);
console.log(`--- 数字对账 ---`);
console.log(`文章 ${arts.length} / 题目 ${totalQ} / 字词 ${words.length} / 词义 ${senseCount} / 选择题 ${choiceQ}`);
const home = readFileSync('src/features/home/Home.tsx', 'utf8');
const m = home.match(/(\d+)\s*篇/);
m && console.log(`首页文案: ${m[1]} 篇 (实际 ${arts.length}) ${+m[1] !== arts.length ? '❌ 漂移' : '✓'}`);

console.log(`\n===== 结果: ${problems.length ? problems.length + ' 个问题' : '全部通过'} =====`);
