// 试题/图谱/字词 全面排查脚本 (research/audit2.mjs)
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..', '..', '..', '..');
const R = (p) => JSON.parse(readFileSync(join(root, p), 'utf8'));

const questions = R('src/data/runtime/questions.json');
const articles = R('src/data/runtime/articles.json');
const words = R('src/data/runtime/words.json');
const collections = R('src/data/runtime/collections.json');

let issues = 0;
const report = (cat, detail) => { issues++; console.log(`  ✗ [${cat}] ${detail}`); };
const warn = (cat, detail) => console.log(`  ⚠ [${cat}] ${detail}`);
const info = (label, detail = '') => console.log(`  · ${label}${detail ? ': ' + detail : ''}`);

console.log('=== A. 题干残留格式符号 ===');
let a = 0;
for (const q of questions) {
  const s = q.stem || '';
  // markdown 残留
  if (/\*\*|\n\s*[-*] |`[^`]+`|^#{1,3} /.test(s)) { report('A格式残留', `${q.id}: ${s.slice(0, 50)}`); a++; }
  // 孤立 | 残留(未成表格)
  const pipes = (s.match(/\|/g) || []).length;
  if (pipes === 1 || pipes === 2) { warn('A孤立竖线', `${q.id}: ${pipes} 个 | → ${s.slice(0, 60)}`); a++; }
}
info('A检查完成', `${a} 处`);

console.log('\n=== B. 引用"表格/材料/示意图"但内容缺失 ===');
let b = 0;
for (const q of questions) {
  const s = q.stem || '';
  if (/表格|示意图|材料(一|二|三)?[：:]|阅读下面的/.test(s)) {
    // 表格类: 应有 | 或 表格 字后内容
    if (s.includes('表格') && !s.includes('|') && !/文言词句|加点词/.test(s)) {
      warn('B表格引用无表格内容', `${q.id}: ${s.slice(0, 60)}`);
      b++;
    }
    if (/下列对[^。]*材料的理解|材料[一二三][：:]/.test(s) && !s.includes('材料一') && !s.includes('材料二')) {
      warn('B材料引用检查', `${q.id}: ${s.slice(0, 60)}`);
      b++;
    }
  }
}
info('B检查完成', `${b} 条警告`);

console.log('\n=== C. 题干/答案异常 ===');
let c = 0;
for (const q of questions) {
  // 题干含答案字符 (选择题)
  if ((q.options || []).length && /^[A-H]{1,4}$/.test(String(q.answer || '').trim())) {
    // 答案字母对应选项内容出现在题干? 粗略: 选项文本与题干重叠
    const ansIdx = String(q.answer).trim().charCodeAt(0) - 65;
    const ansOpt = q.options[ansIdx] || '';
    const stemNorm = (q.stem || '').replace(/[，。、；：！？\s]/g, '');
    const optNorm = (ansOpt || '').replace(/[，。、；：！？\s]/g, '');
    if (optNorm.length >= 6 && stemNorm.includes(optNorm)) {
      warn('C题干泄漏选项', `${q.id}: 选项"${ansOpt.slice(0, 20)}"出现在题干`);
      c++;
    }
  }
  // 答案极短
  const ans = Array.isArray(q.answer) ? q.answer.join('') : String(q.answer || '');
  if (q.type === 'translate' && ans.length < 4) { warn('C翻译答案过短', `${q.id}: "${ans}"`); c++; }
}
info('C检查完成', `${c} 条警告`);

console.log('\n=== D. 图谱对账 (exam-map 规则 vs 数据) ===');
// 读 exam-map.ts 的规则近似: 用文章 title 的考点标签
const aIds = new Set(articles.map((x) => x.id));
const qByArticle = new Map();
for (const q of questions) {
  if (q.articleId && aIds.has(q.articleId)) {
    if (!qByArticle.has(q.articleId)) qByArticle.set(q.articleId, []);
    qByArticle.get(q.articleId).push(q);
  }
}
// 检查文章是否有真题
let noZt = 0;
for (const art of articles) {
  const qs = qByArticle.get(art.id) || [];
  if (!qs.some((q) => q.origin === 'zhenti' || (q.origins || []).includes('zhenti'))) noZt++;
}
info('无真题文章数', `${noZt}/${articles.length} (中考必考篇目应都有真题)`);
// 必考篇目抽查
const must = ['论语十二章', '岳阳楼记', '桃花源记', '出师表', '陈涉世家', '三峡', '爱莲说', '马说', '鱼我所欲也', '曹刿论战'];
for (const t of must) {
  const art = articles.find((x) => x.title.includes(t));
  if (art) {
    const qs = qByArticle.get(art.id) || [];
    const zt = qs.filter((q) => q.origin === 'zhenti' || (q.origins || []).includes('zhenti')).length;
    console.log(`  · ${t}: 共${qs.length}题, 真题${zt}`);
  }
}

console.log('\n=== E. 字词对账 (glossary vs runtime) ===');
const glossaryWords = words.filter((w) => w.scope === 'global');
info('全局字词(实虚词表)', `${glossaryWords.length} 条`);
const cats = {};
for (const w of glossaryWords) {
  const cat = w.meanings?.[0]?.category || '?';
  cats[cat] = (cats[cat] || 0) + 1;
}
info('全局字词分类', JSON.stringify(cats));
// 字词卡 buildCoreVocab 逻辑: 用 runtime words 全局词
const core = glossaryWords.filter((w) => w.meanings?.some((m) => m.category === '实词' || m.category === '虚词'));
info('字词卡候选(实词/虚词全局词)', `${core.length} 条`);
// 文章级字词引用完整性
let orphan = 0;
for (const w of words) {
  if (w.articleId && !aIds.has(w.articleId)) { report('E字词悬空', `${w.id} → ${w.articleId}`); orphan++; }
}
info('字词悬空', `${orphan} 条`);

console.log(`\n===== 排查结果: ${issues} ERROR / 其余为 WARN =====`);
process.exit(0);
