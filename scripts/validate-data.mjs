import { readFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');

function loadJSON(path) {
  const p = join(root, path);
  if (!existsSync(p)) {
    console.error(`  ✗ 文件不存在: ${path}`);
    return null;
  }
  return JSON.parse(readFileSync(p, 'utf-8'));
}

let errors = 0;
let warns = 0;

function check(desc, ok, detail = '') {
  if (ok) {
    console.log(`  ✓ ${desc}`);
  } else {
    errors++;
    console.log(`  ✗ ${desc}${detail ? ' — ' + detail : ''}`);
  }
}

function warn(desc, detail = '') {
  warns++;
  console.log(`  ⚠ ${desc}${detail ? ' — ' + detail : ''}`);
}

// ==================== 1. 文章层 ====================
console.log('\n=== 1. 文章完整性 ===');
const articles = loadJSON('src/data/runtime/articles.json');
if (articles) {
  check(`文章总数 ${articles.length}`, articles.length >= 125, '应有 127 篇');

  const requiredTop = ['id', 'title', 'author', 'dynasty', 'grade', 'reading'];
  const readingFields = ['original', 'translation', 'paragraphs'];

  let missingOrigin = 0;
  let missingNotes = 0;
  let emptyParagraph = 0;
  const noParaAna = [];
  let paraCount = 0;

  for (const a of articles) {
    const id = a.id || a.title || '?';
    for (const f of requiredTop) {
      check(`[${id}] 包含 ${f}`, a[f] !== undefined && a[f] !== null && a[f] !== '');
    }
    // origin/source 任一有值即可
    const hasOrigin = (a.origin && a.origin.trim()) || (a.source && a.source.trim());
    if (!hasOrigin) {
      missingOrigin++;
      if (missingOrigin <= 3) warn(`[${id}] 缺少 origin/source`);
    }
    if (a.reading) {
      for (const f of readingFields) {
        check(`[${id}] reading.${f} 存在`, a.reading[f] !== undefined);
      }
      if (a.reading.original) {
        check(`[${id}] 原文非空`, a.reading.original.trim().length > 0);
      }
      // 段落检查 (段落用 start/end 索引指向 original, 不用独立 original 字段)
      const paras = a.reading.paragraphs || [];
      paraCount += paras.length;
      for (const p of paras) {
        const segStart = typeof p.start === 'number' ? p.start : 0;
        const segEnd = typeof p.end === 'number' ? p.end : segStart;
        const seg = a.reading.original ? a.reading.original.substring(segStart, segEnd) : '';
        const hasFallback = p.fallbackText && p.fallbackText.trim() !== '';
        if (!seg || seg.trim() === '') {
          if (!hasFallback) emptyParagraph++;
        }
        const hasAna = p.analysis && p.analysis.trim() !== '';
        const hasTrans = p.translation && p.translation.trim() !== '';
        if (!hasAna && !hasTrans && noParaAna.length < 5) noParaAna.push(`${id}:${seg.substring(0, 15) || p.fallbackText?.substring(0, 15) || '?'}`);
      }
    }
    if (a.analysis) {
      for (const f of ['theme', 'outline', 'writing', 'culture']) {
        check(`[${id}] analysis.${f} 存在`, a.analysis[f] !== undefined);
      }
    } else {
      warn(`[${id}] 缺少 analysis 字段`);
    }
    // 年级约定为短名 (七上/七下/... 见 memory #243); 长名(七年级上册)已是过时形态
    const validGrades = ['七上','七下','八上','八下','九上','九下','附录','未分类'];
    if (a.grade) {
      check(`[${id}] 年级有效: ${a.grade}`, validGrades.includes(a.grade));
      if (/^[一二三四五六七八九十]+年级/.test(a.grade)) warn(`[${id}] 年级使用过时长名: ${a.grade}`, '应改为短名(七上等)');
    }
  }
  check(`段落总数 ${paraCount}`, paraCount > 0);
  check('无空段落原文', emptyParagraph === 0, `${emptyParagraph} 个空段落`);
  warn(`无注释段落(样本): ${noParaAna.length}`, noParaAna.join(', '));
}

// ==================== 2. 字词层 ====================
console.log('\n=== 2. 字词完整性 ===');
const words = loadJSON('src/data/runtime/words.json');
if (words) {
  check(`词条总数 ${words.length}`, words.length >= 1800, '应有 2168 词条');
  const categoryMap = {};
  let hasExample = 0, totalMeanings = 0, emptyWord = 0, emptyMeaning = 0, hasPinyin = 0;

  for (const w of words) {
    if (!w.word || w.word.trim() === '') emptyWord++;
    if (w.pinyin) hasPinyin++;
    const meanings = w.meanings || [];
    totalMeanings += meanings.length;
    for (const m of meanings) {
      if (!m.text || m.text.trim() === '') emptyMeaning++;
      if (m.example) hasExample++;
      if (m.category) categoryMap[m.category] = (categoryMap[m.category] || 0) + 1;
      else categoryMap['(无分类)'] = (categoryMap['(无分类)'] || 0) + 1;
    }
  }

  check('无空字词', emptyWord === 0, `${emptyWord} 个空字`);
  check(`义项总数 ${totalMeanings}`, totalMeanings >= 2000, '应有 2519 义项');
  check('无空义项', emptyMeaning === 0, `${emptyMeaning} 个空义项`);
  warn(`有拼音词条: ${hasPinyin}/${words.length}`, `(${Math.round(hasPinyin/words.length*100)}%)`);
  warn(`有例句义项: ${hasExample}/${totalMeanings}`, `(${Math.round(hasExample/totalMeanings*100)}%)`);
  console.log('  义项分类分布:');
  for (const [type, count] of Object.entries(categoryMap).sort((a,b) => b[1]-a[1])) {
    console.log(`    ${type}: ${count}`);
  }

  const articleIds = new Set(articles ? articles.map(a => a.id) : []);
  let orphanWords = 0;
  for (const w of words) {
    if (w.articleId && !articleIds.has(w.articleId)) {
      orphanWords++;
      if (orphanWords <= 3) warn(`词条 ${w.word} 引用不存在的文章: ${w.articleId}`);
    }
  }
  check(`无孤立词条引用`, orphanWords === 0, `${orphanWords} 个孤立的 articleId`);
}

// ==================== 3. 题目层 ====================
console.log('\n=== 3. 题目完整性 ===');
const questions = loadJSON('src/data/runtime/questions.json');
if (questions) {
  check(`题目总数 ${questions.length}`, questions.length >= 1900, '当前 2011 题 (含 exam-generated 合并); 低于 1900 需排查');
  const requiredQ = ['id', 'stem', 'answer', 'type'];
  let hasOptions = 0, noOptions = 0, emptyAnswer = 0, emptyStem = 0, truncated = 0;
  const typeDist = {};

  for (const q of questions) {
    for (const f of requiredQ) {
      if (!q[f]) check(`题目 ${q.id || '?'} 缺少 ${f}`, false);
    }
    if (!q.stem || q.stem.trim() === '') emptyStem++;
    if (!q.answer || (Array.isArray(q.answer) && q.answer.length === 0) || (typeof q.answer === 'string' && q.answer.trim() === '')) emptyAnswer++;
    if (q.options && q.options.length > 0) hasOptions++;
    else noOptions++;
    if (q.type) typeDist[q.type] = (typeDist[q.type] || 0) + 1;
    if (q.stem && (q.stem.endsWith('...') || q.stem.endsWith('……'))) {
      truncated++;
      if (truncated <= 3) warn(`题目可能截断: ${q.id} — ${q.stem.substring(0, 50)}`);
    }
  }

  check('无空题干', emptyStem === 0, `${emptyStem} 个空题干`);
  check('无空答案', emptyAnswer === 0, `${emptyAnswer} 个空答案`);
  check(`选择题 ${hasOptions} / 主观题 ${noOptions}`, hasOptions + noOptions === questions.length);
  check(`截断检测: ${truncated} 个可疑`, truncated === 0, `${truncated} 个可能截断`);
  console.log('  题型分布:');
  for (const [type, count] of Object.entries(typeDist).sort((a,b) => b[1]-a[1])) {
    console.log(`    ${type}: ${count}`);
  }

  const articleIds = new Set(articles ? articles.map(a => a.id) : []);
  const collectionsData = loadJSON('src/data/runtime/collections.json');
  const collectionIds = new Set(collectionsData ? collectionsData.map(c => c.id) : []);
  let orphanQ = 0, noRef = 0;
  for (const q of questions) {
    const hasArticle = q.articleId && articleIds.has(q.articleId);
    const hasCollection = q.collectionId && collectionIds.has(q.collectionId);
    if (q.articleId && !hasArticle) {
      orphanQ++;
      if (orphanQ <= 3) warn(`题目 ${q.id} 引用不存在的文章: ${q.articleId}`);
    }
    if (q.collectionId && !hasCollection) {
      orphanQ++;
      if (orphanQ <= 3) warn(`题目 ${q.id} 引用不存在的题集: ${q.collectionId}`);
    }
    if (!q.articleId && !q.collectionId) noRef++;
  }
  if (noRef > 0) warn(`无关联题目: ${noRef}`, '未关联任何文章或题集');
  else console.log(`  ✓ 无关联题目: ${noRef}`);
  check('无孤立题目引用', orphanQ === 0, `${orphanQ} 个孤立引用`);
}

// ==================== 4. 题集层 ====================
console.log('\n=== 4. 综合题集 ===');
const collections = loadJSON('src/data/runtime/collections.json');
if (collections) {
  check(`题集数量 ${collections.length}`, collections.length >= 15, '应有 16 题集');
  let orphanCollectionQ = 0;
  const questionIds = new Set(questions ? questions.map(q => q.id) : []);
  for (const c of collections) {
    check(`题集 ${c.id} 有标题`, !!c.title && c.title.trim() !== '');
    const qs = c.questionIds || [];
    // 题集题目已按篇名并入单篇(砍独立页): 空题集是预期, 降为警告
    if (qs.length === 0) warn(`题集 ${c.title} 已空(题目并入单篇)`);
    else check(`题集 ${c.title} 有题目 (${qs.length})`, true);
    for (const qid of qs) {
      if (!questionIds.has(qid)) {
        orphanCollectionQ++;
        if (orphanCollectionQ <= 3) warn(`题集 ${c.title} 引用不存在的题目: ${qid}`);
      }
    }
  }
  check('无孤立题集引用', orphanCollectionQ === 0, `${orphanCollectionQ} 个孤立题目引用`);
}

// ==================== 5. 文章-题目对应 ====================
console.log('\n=== 5. 文章-题目交叉引用 ===');
if (articles && questions) {
  const articleQuestionMap = {};
  for (const q of questions) {
    if (q.articleId) articleQuestionMap[q.articleId] = (articleQuestionMap[q.articleId] || 0) + 1;
  }
  let noQuestions = 0;
  const noQList = [];
  for (const a of articles) {
    const count = articleQuestionMap[a.id] || 0;
    if (count === 0) {
      noQuestions++;
      if (noQList.length < 8) noQList.push(`${a.title}(${a.id})`);
    }
  }
  if (noQuestions > 0) warn(`无题目文章: ${noQuestions}/${articles.length}`, noQList.length ? noQList.join(', ') : '');
  else console.log(`  ✓ 无题目文章: 0/${articles.length}`);
}

// ==================== 6. 数据一致性 ====================
console.log('\n=== 6. 数据一致性 ===');
if (articles) {
  const ids = articles.map(a => a.id);
  const dupIds = ids.filter((id, i) => ids.indexOf(id) !== i);
  check('文章 ID 唯一', dupIds.length === 0, `重复 ID: ${[...new Set(dupIds)].join(', ')}`);

  const titles = articles.map(a => a.title);
  const dupTitles = titles.filter((t, i) => titles.indexOf(t) !== i);
  if (dupTitles.length > 0) warn(`重复标题: ${[...new Set(dupTitles)].join(', ')}`);

  const gradeDist = {};
  for (const a of articles) gradeDist[a.grade] = (gradeDist[a.grade] || 0) + 1;
  console.log('  年级分布:');
  for (const [grade, count] of Object.entries(gradeDist).sort()) console.log(`    ${grade}: ${count} 篇`);
}

// ==================== 7. 练习题数据 ====================
console.log('\n=== 7. 练习题数据 ===');
const practice = loadJSON('src/data/raw/practice.json');
if (practice) {
  const groups = practice.groups || practice;
  const groupList = Array.isArray(groups) ? groups : [];
  check(`练习组总数 ${groupList.length}`, groupList.length >= 30, '应有 39 组');
  let totalQ = 0;
  for (const p of groupList) {
    const qCount = p.questions?.length || 0;
    totalQ += qCount;
    if (qCount === 0) warn(`练习组 ${p.title || p.id} 无题目`);
  }
  check(`练习总题数 ${totalQ}`, totalQ >= 300, '应有 323 题');
}

// ==================== 8. 数据质量增强检查 ====================
console.log('\n=== 8. 数据质量增强检查 ===');
// 8.1 背诵句完整性: 每条 star 标点/空白归一化后必须是原文子串(允许逗号子句)
if (articles) {
  const normText = (s) => String(s || '')
    .replace(/[\r\n\s\u3000]/g, '')
    .replace(/[，、；：？！]/g, (m) => ({ '，': ',', '、': ',', '；': ';', '：': ':', '？': '?', '！': '!' }[m] || m))
    .replace(/[""\'\'“”‘’]/g, '');
  let starBad = 0;
  let starTotal = 0;
  for (const a of articles) {
    const orig = normText(a.reading?.original);
    for (const s of a.recitation?.stars || []) {
      starTotal++;
      const t = normText(s.sentence);
      const core = t.replace(/[。！？!?.;；]+$/, '');
      if (core && core.length >= 2 && !orig.includes(t) && !orig.includes(core)) {
        starBad++;
        if (starBad <= 5) warn(`背诵句不在原文 [${a.title}]: ${s.sentence}`, '归一化后仍不匹配');
      }
    }
  }
  check(`背诵句完整性 ${starTotal - starBad}/${starTotal}`, starBad === 0, `${starBad} 条背诵句不在原文`);
}
// 8.2 英文残留: 中文字符串中的实际英文单词(词边界; 排除括号拼音)
const ENG_WORDS = ['and', 'the', 'of', 'vs', 'contrast', 'formally', 'can', 'is', 'are', 'was', 'were', 'be', 'to', 'for', 'with', 'at', 'from', 'not', 'but', 'or', 'as', 'by', 'it', 'this', 'that', 'in', 'on'];
let engCount = 0;
const engScan = (obj) => {
  if (typeof obj === 'string') {
    if (!/[\u4e00-\u9fff]/.test(obj)) return;
    // 先剔除括号内拼音注释, 避免 (zhǔ) 等误报
    const cleaned = obj.replace(/[（(][a-zA-Z\u00e0-\u00ff·]{1,12}[）)]/g, '');
    for (const w of ENG_WORDS) {
      const re = new RegExp(`[\\u4e00-\\u9fff，。、；：！？“”‘’（）()\\s]{0,6}\\b${w}\\b`, 'gi');
      for (const m of cleaned.matchAll(re)) {
        engCount++;
        if (engCount <= 5) warn(`英文残留: ${cleaned.substring(Math.max(0, m.index - 8), m.index + 12)}`, w);
      }
    }
  } else if (Array.isArray(obj)) {
    obj.forEach((v) => engScan(v));
  } else if (obj && typeof obj === 'object') {
    Object.values(obj).forEach((v) => engScan(v));
  }
};
if (articles) engScan(articles);
if (questions) engScan(questions);
check('无英文残留', engCount === 0, `${engCount} 处英文残留`);
// 8.3 水印/广告残留
const wmRe = /教辅公众号|全科AA|公众号★|加微信|扫码关注/;
let wmCount = 0;
const wmScan = (obj) => {
  if (typeof obj === 'string') {
    if (wmRe.test(obj)) { wmCount++; if (wmCount <= 3) warn(`水印残留: ${obj.substring(0, 40)}`); }
  } else if (Array.isArray(obj)) {
    obj.forEach((v) => wmScan(v));
  } else if (obj && typeof obj === 'object') {
    Object.values(obj).forEach((v) => wmScan(v));
  }
};
if (articles) wmScan(articles);
if (questions) wmScan(questions);
check('无水印残留', wmCount === 0, `${wmCount} 处水印残留`);
// 8.4 段落编号覆盖一致性(数据层观察, 渲染层已隐藏序号)
if (articles) {
  let withNum = 0, noNum = 0, partial = 0;
  for (const a of articles) {
    const paras = a.reading?.paragraphs || [];
    const n = paras.filter((p) => p.number).length;
    if (n === 0) noNum++;
    else if (n === paras.length) withNum++;
    else partial++;
  }
  warn(`段落编号覆盖: 全带号 ${withNum} 篇 / 无号 ${noNum} 篇 / 部分 ${partial} 篇`, '仅观察; 序号不在前端渲染');
}
// 8.5 exam-generated 合并题 origin 字段完整性
if (questions) {
  const genMissing = questions.filter((q) => (q.origins || []).includes('exam-gen') && !q.origin);
  if (genMissing.length > 0) warn(`exam-gen 合并题缺 origin 字段: ${genMissing.length}`, '建议在 build-runtime-data.mjs 合并处补 origin');
}
// 8.6 引用 ID 去重 (文章/题集 questionIds 不得重复)
if (articles) {
  const dupRefs = articles.filter((a) => a.questionIds && a.questionIds.length !== new Set(a.questionIds).size);
  check('文章 questionIds 无重复', dupRefs.length === 0, `${dupRefs.length} 篇含重复: ${dupRefs.slice(0, 3).map((a) => a.title).join(', ')}`);
}
if (collections) {
  const dupCollRefs = collections.filter((c) => c.questionIds && c.questionIds.length !== new Set(c.questionIds).size);
  check('题集 questionIds 无重复', dupCollRefs.length === 0, `${dupCollRefs.length} 个题集含重复`);
}
// 8.7 原文尾部截断(非句末标点结尾)
if (articles) {
  const truncatedOrigins = [];
  for (const a of articles) {
    const last = String(a.reading?.original || '').trim().replace(/["“”』」]+$/, '').slice(-1);
    if (last && !'。！？!?；;'.includes(last)) truncatedOrigins.push(a.title);
  }
  check('原文结尾无截断', truncatedOrigins.length === 0, `${truncatedOrigins.length} 篇: ${truncatedOrigins.slice(0, 5).join(', ')}`);
}

// ==================== 总结 ====================
console.log('\n=== 总结 ===');
console.log(`  错误: ${errors}`);
console.log(`  警告: ${warns}`);
if (errors === 0) {
  console.log('  ✅ 数据校验通过!');
} else {
  console.log(`  ❌ 发现 ${errors} 个错误, 需要修复`);
}
// ==================== 6. 默写数据层 ====================
console.log('\n=== 6. 默写数据完整性 ===');
const moxie = loadJSON('src/data/runtime/moxie.json');
if (moxie) {
  check(`默写篇目总数 ${moxie.length}`, moxie.length >= 120, '应为 126 篇');
  let items = 0, noAns = 0, noBlanks = 0, badGrade = 0;
  const TYPE_STD = ['原文默写', '理解性默写', '词义默写', '译文默写'];
  const typeCount = {};
  for (const art of moxie) {
    if (!art.title || !Array.isArray(art.sections) || !art.sections.length) {
      errors++; console.log(`  ✗ 篇目结构异常: ${art.title || art.id}`);
      continue;
    }
    if (!['七上','七下','八上','八下','九上','九下','附录'].includes(art.grade)) badGrade++;
    const types = art.sections.map((s) => s.type);
    for (const t of types) typeCount[t] = (typeCount[t] || 0) + 1;
    for (const s of art.sections) {
      for (const it of s.items || []) {
        items++;
        if (!it.answers || !it.answers.length) noAns++;
        if ((it.blanks || 0) > 0 && (it.answers || []).length !== it.blanks) noBlanks++;
      }
    }
  }
  check(`题目总数 ${items}`, items >= 1200, '应约 1400+ 题');
  check(`无答案题数 ${noAns}`, noAns <= 30, '少量鉴赏/检测卷题书本身无答案, 可接受');
  check(`填空数=答案数不符 ${noBlanks}`, noBlanks <= 200, '部分多空答案未逐空展开但内容完整');
  check(`年级非法 ${badGrade}`, badGrade === 0);
  for (const t of TYPE_STD) check(`题型「${t}」覆盖 ${typeCount[t] || 0} 篇`, (typeCount[t] || 0) >= 100, '四题型应基本全覆盖');
}

// ==================== 8. raw 数据源唯一性 ====================
console.log('\n=== 8. raw 数据源唯一性 ===');
{
  const rawSources = [
    { name: 'learning', path: 'src/data/raw/learning.json', idKey: 'id' },
    { name: 'practice', path: 'src/data/raw/practice.json', idKey: 'id' },
    { name: 'zhenti', path: 'src/data/raw/zhenti.json', idKey: 'id' },
    { name: 'zhenti_web', path: 'src/data/raw/zhenti_web.json', idKey: 'id' },
    { name: 'moxie', path: 'src/data/raw/moxie.json', idKey: 'id' },
    { name: 'moxie-legacy', path: 'src/data/raw/moxie-legacy.json', idKey: 'id' },
  ];
  for (const { name, path, idKey } of rawSources) {
    const data = loadJSON(path);
    if (!data) continue;
    const ids = data.map((x) => x[idKey]);
    const dup = ids.filter((id, i) => ids.indexOf(id) !== i);
    check(`[${name}] id 唯一`, dup.length === 0, `重复: ${[...new Set(dup)].join(', ')}`);
    const emptyTitle = data.filter((x) => !x.title || !String(x.title).trim());
    check(`[${name}] 标题非空`, emptyTitle.length === 0, `${emptyTitle.length} 条空标题`);
    const gradeOk = data.every((x) => !x.grade || /^(七|八|九)(上|下)|附录|未分类$/.test(String(x.grade)));
    check(`[${name}] 年级短名规范`, gradeOk, '存在长名/非法年级');
  }
  // 考频后缀残留检测 (P1-3 防线)
  const moxieRaw = loadJSON('src/data/raw/moxie.json');
  if (moxieRaw) {
    const freqTitles = moxieRaw.filter((x) => /\d+年\d+考/.test(x.title));
    check('moxie title 无考频后缀', freqTitles.length === 0, freqTitles.map((x) => x.title).join(', '));
  }
  // qid 唯一: 按文件内部检查 (moxie 与 moxie-legacy 同篇并存属设计, 合并时才去重)
  for (const n of ['moxie', 'moxie-legacy']) {
    const data = loadJSON(`src/data/raw/${n}.json`);
    if (!data) continue;
    const qids = [];
    for (const art of data) for (const s of art.sections || []) for (const it of s.items || []) {
      if (it.qid) qids.push(it.qid);
    }
    const dupQids = qids.filter((q, i) => qids.indexOf(q) !== i);
    check(`[${n}] qid 文件内唯一 (${qids.length} 题)`, dupQids.length === 0, `${new Set(dupQids).size} 个重复 qid`);
  }
}

// ==================== 9. zhenti_web 完全重复检测 ====================
console.log('\n=== 9. 真题重复检测 ===');
{
  const z = loadJSON('src/data/raw/zhenti_web.json');
  if (z) {
    const normZ = (v) => String(v || '').replace(/[^0-9A-Za-z\u4e00-\u9fff]/g, '');
    const keyOf = (x) => [x.province, x.year, x.type, normZ(x.title), normZ(x.stem), normZ(x.answer)].join('|');
    const seen = new Map();
    let dupGroups = 0;
    for (const x of z) {
      const k = keyOf(x);
      if (seen.has(k)) {
        dupGroups++;
        if (dupGroups <= 3) console.log(`  ✗ 完全重复: ${x.id} 与 ${seen.get(k)} (${x.province}/${x.year}/${x.type}/${x.title})`);
      } else seen.set(k, x.id);
    }
    check('zhenti_web 无完全重复题', dupGroups === 0, `${dupGroups} 组重复`);
    // 同题干不同答案 → 警告 (需人工核对)
    const stemKey = (x) => [x.province, x.year, x.type, normZ(x.title), normZ(x.stem)].join('|');
    const ansMap = new Map();
    let diffAns = 0;
    for (const x of z) {
      const k = stemKey(x);
      const prev = ansMap.get(k);
      if (prev && normZ(prev.answer) !== normZ(x.answer)) {
        diffAns++;
        if (diffAns <= 3) warn(`同题不同答案: ${prev.id} vs ${x.id} (${x.title})`);
      }
      ansMap.set(k, x);
    }
    check('无同题不同答案', diffAns === 0, `${diffAns} 组待人工核对`);
  }
}

// ==================== 10. runtime 默写产物一致性 ====================
console.log('\n=== 10. runtime 默写产物一致性 ===');
{
  const moxie = loadJSON('src/data/runtime/moxie.json');
  if (moxie) {
    const ids = moxie.map((a) => a.id);
    const dupIds = ids.filter((id, i) => ids.indexOf(id) !== i);
    check('runtime moxie 篇目 id 唯一', dupIds.length === 0, `重复: ${[...new Set(dupIds)].join(', ')}`);
    const qids = [];
    for (const art of moxie) for (const s of art.sections || []) for (const it of s.items || []) qids.push(it.qid);
    const dupQids = qids.filter((q, i) => qids.indexOf(q) !== i);
    check(`runtime moxie qid 全局唯一 (${qids.length} 题)`, dupQids.length === 0, `${new Set(dupQids).size} 个重复 qid`);
    // articleId 有效性
    const artIds = new Set((articles || []).map((a) => a.id));
    const badLink = moxie.filter((a) => a.articleId && !artIds.has(a.articleId));
    check('moxie articleId 全部有效', badLink.length === 0, badLink.map((a) => `${a.title}→${a.articleId}`).join(', '));
    // title 无考频残留 (build 产物防线)
    const freqTitles = moxie.filter((a) => /\d+年\d+考/.test(a.title));
    check('runtime moxie title 无考频后缀', freqTitles.length === 0, freqTitles.map((a) => a.title).join(', '));
  }
}

// ==================== 11. 样式硬编码扫描 (由 style-unify 填充) ====================
console.log('\n=== 11. 样式硬编码扫描 ===');
{
  const cssFiles = [
    'src/shared/styles/global.css',
    'src/features/home/home.css',
    'src/features/learning/article.css',
    'src/features/learning/article-page.css',
    'src/features/moxie/moxie.css',
  ];
  let hexCount = 0;
  for (const f of cssFiles) {
    const p = join(root, f);
    if (!existsSync(p)) continue;
    const css = readFileSync(p, 'utf8');
    const hexes = css.match(/#[0-9a-fA-F]{3,8}\b/g) || [];
    hexCount += hexes.length;
  }
  if (hexCount === 0) console.log('  ✓ 无硬编码颜色');
  else check(`CSS 无硬编码颜色 (${hexCount} 处)`, hexCount === 0, '全部应走 var(--*) 令牌');
}

if (errors > 0) {
  console.error(`\n❌ 校验失败: ${errors} 个错误, ${warns} 个警告`);
  process.exit(1);
}
console.log(`\n✅ 全部通过 (${warns} 个警告)`);

// ==================== 12. 原文默写题质量 ====================
console.log('\n=== 12. 原文默写题质量 ===');
{
  const moxie = loadJSON('src/data/raw/moxie.json');
  if (moxie) {
    const multiAns = [];
    const noFull = [];
    let total = 0;
    const hasFullSentence = (q) => {
      const toks = String(q || '').match(/_+|([^_，,。；;！？!?\s]+)|([，,。；;！？!?])/g) || [];
      let cur = [];
      for (const t of toks) {
        cur.push(t);
        if ('。；;！？!?'.includes(t)) {
          if (!cur.some((x) => /_+/.test(x))) return true;
          cur = [];
        }
      }
      return false;
    };
    for (const art of moxie) {
      const items = [];
      for (const s of art.sections || []) {
        if (s.type === '原文默写') items.push(...(s.items || []));
      }
      if (!items.length) continue;
      for (const it of items) {
        total++;
        const qn = (String(it.q).match(/_+/g) || []).length;
        for (const a of it.answers || []) {
          // 每空一个答案时, 答案内容含逗号是诗句原文标点, 合法; 仅当空数不匹配时视为双空残留
          if ((it.answers || []).length !== qn && /[\s，,；;]/.test(String(a)) && String(a).length > 2) {
            multiAns.push(`${art.title}: ${String(a).slice(0, 20)}`);
          }
        }
      }
      if (items.some((it) => !hasFullSentence(it.q) && !/\S/.test(String(it.q).replace(/[_，,。；;！？!?\s]/g, '')))) noFull.push(art.title);
    }
    check(`原文默写题总数 ${total}`, total >= 100);
    check('无多分句答案 (去2空)', multiAns.length === 0, multiAns.slice(0, 5).join(' | '));
    check('无全挖题 (每题含保留文字)', noFull.length === 0, noFull.slice(0, 8).join('、'));
  }
}

// ==================== 13. 默写数据质量 (去重/多小题/标点/空数) ====================
console.log('\n=== 13. 默写数据质量 ===');
{
  const moxie = loadJSON('src/data/raw/moxie.json');
  const legacy = loadJSON('src/data/raw/moxie-legacy.json');
  const normQ = (s) => String(s || '').replace(/[\s，,。；;！？!?：:()（）""''【】·・]/g, '');
  const qBlanks = (q) => (String(q || '').match(/_+/g) || []).length;

  let dupQ = 0, multiQ = 0, pipeA = 0, halfP = 0, blankMismatch = 0, emptyAns = 0;
  for (const data of [moxie, legacy]) {
    for (const art of data) {
      for (const s of art.sections || []) {
        const seen = new Set();
        for (const it of s.items || []) {
          const k = normQ(it.q) + '|' + normQ((it.answers || []).join(''));
          if (seen.has(k)) dupQ++;
          seen.add(k);
          if ((String(it.q).match(/\d+[\.．、]/g) || []).length > 1) multiQ++;
          for (const a of it.answers || []) if (String(a).includes('|')) pipeA++;
          const all = it.q + (it.answers || []).join('');
          if (/[,;:!?()"']/.test(all)) halfP++;
          const qn = qBlanks(it.q);
          if (qn && qn !== (it.answers || []).length && qn > (it.answers || []).length) blankMismatch++;
          if (qn && !(it.answers || []).length) emptyAns++;
        }
      }
    }
  }
  check('无完全重复题 (归一化 q+答案)', dupQ === 0, `${dupQ} 组重复`);
  check('无多小题 q (序号>1)', multiQ === 0, `${multiQ} 题`);
  check('| 等价答案组 ≤ 10', pipeA <= 10, `${pipeA} 个 (卖油翁/蒹葭等等价变体, 前端任一匹配)`);
  check('q/answers 无半角标点', halfP === 0, `${halfP} 处`);
  check('无 q 空数>答案数 (缺答案)', blankMismatch === 0, `${blankMismatch} 题`);
  check('无 q 有空但答案全空', emptyAns === 0, `${emptyAns} 题`);
}
