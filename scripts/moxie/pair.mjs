#!/usr/bin/env node
/** 配对: 主书题目 × 答案册答案 → src/data/raw/moxie.json
 *  用法: node scripts/moxie/pair.mjs
 *  逻辑: title 归一化匹配 → 同题型按序配对 → 多空答案 | 拆分 → articleId 对齐 learning
 */
import { readdirSync, readFileSync, writeFileSync, existsSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const RAW = resolve(ROOT, 'ocr/moxie/raw');
const OUT = resolve(ROOT, 'src/data/raw');
const REPORT = resolve(ROOT, 'ocr/moxie/pair-report.json');

/** 标题归一化: 去作者/朝代后缀、《》、序数、空白 */
function normTitle(t) {
  return String(t || '')
    .replace(/^[一二三四五六七八九十]+、/, '')
    .replace(/《|》/g, '')
    .replace(/\[[^\]]*\]\s*[\u4e00-\u9fff]{1,4}(?=\s*$)/g, '') // 行尾 [唐]王湾 作者后缀
    .replace(/\[[^\]]*\]/g, '')      // 其余 [唐]
    .replace(/[（(]?\d+\s*年\s*\d+\s*考[）)]?/g, '') // 3年21考 考频标签
    .replace(/[（(][^）)]*[）)]/g, '') // (一曲新词酒一杯) 副标题 → 保留主名? 这里去掉括号内容
    .replace(/[\s，,。！？；：、·・_—\-—–-]+/g, '')
    .replace(/[，,。！？；：、]+/g, '')
    .toLowerCase();
}
/** 内容标题归一化(去括号副标题) */
function normTitleKeepParen(t) {
  return normTitle(t);
}

/** 题型短名映射: 答案 q 描述 → 主书题型 */
function typeKey(q) {
  const s = String(q || '');
  if (/原文默写/.test(s)) return '原文默写';
  if (/理解性默写/.test(s)) return '理解性默写';
  if (/词义默写/.test(s)) return '词义默写';
  if (/译文默写/.test(s)) return '译文默写';
  return '';
}
/** 从答案 q 提取序号 (第N题 / N.) */
function itemIndex(q) {
  const s = String(q || '');
  const m = s.match(/第\s*(\d+)\s*题/) || s.match(/(?:^|\s)(\d+)\s*[.、]/);
  return m ? Number(m[1]) : null;
}

function gradeShort(g) {
  const map = { '七年级上册': '七上', '七年级下册': '七下', '八年级上册': '八上', '八年级下册': '八下', '九年级上册': '九上', '九年级下册': '九下' };
  return map[String(g || '').trim()] || '附录';
}

/** 提取题干中的填空数 */
function blankCount(q) {
  return (String(q || '').match(/_{3,}/g) || []).length;
}

// ---- 载入 ----
const mainFiles = readdirSync(RAW).filter((f) => f.startsWith('main_p') && f.endsWith('.json')).sort();
const ansFiles = readdirSync(RAW).filter((f) => f.startsWith('ans_p') && f.endsWith('.json')).sort();
/** 兼容两种抽取格式: 新版 {articles:[...]} 与旧版 {title,sections} */
function pageArticles(page) {
  if (Array.isArray(page.articles) && page.articles.length) return page.articles;
  return [{ title: page.title, grade: page.grade, book_page: page.book_page, sections: page.sections || [] }];
}
const mainArticles = mainFiles.flatMap((f) => pageArticles(JSON.parse(readFileSync(resolve(RAW, f), 'utf8'))));
const ansPages = ansFiles.map((f) => JSON.parse(readFileSync(resolve(RAW, f), 'utf8')));

// ---- 答案按篇目聚合 ----
const ansByNorm = new Map(); // normTitle → { title, answers: [] }
const isDetect = (t) => /默写效果检测|综合练习/.test(String(t || ''));
let detectAnsIdx = 0;
let currentDetectKey = null;
for (const page of ansPages) {
  for (const art of page.articles || []) {
    // 检测/综合练习类: 按答案册页序分组为检测卷 (连续条目合并), 与主书检测卷位置配对
    if (isDetect(art.title)) {
      if (!currentDetectKey) {
        currentDetectKey = `__detect_${detectAnsIdx++}`;
        ansByNorm.set(currentDetectKey, { title: art.title, answers: [] });
      }
      ansByNorm.get(currentDetectKey).answers.push(...(art.answers || []));
      continue;
    }
    currentDetectKey = null; // 非检测条目打断分组
    const key = normTitle(art.title);
    if (!key) continue;
    if (!ansByNorm.has(key)) ansByNorm.set(key, { title: art.title, answers: [] });
    ansByNorm.get(key).answers.push(...(art.answers || []));
  }
}

// ---- learning 篇目索引 (articleId 对齐) ----
const learningPath = resolve(ROOT, 'src/data/raw/learning.json');
let learningById = new Map(); let learningByTitle = new Map(); const learningGradeByTitle = new Map();
if (existsSync(learningPath)) {
  const learning = JSON.parse(readFileSync(learningPath, 'utf8'));
  for (const art of learning) {
    learningByTitle.set(normTitle(art.title), art.id);
    learningGradeByTitle.set(normTitle(art.title), art.grade);
  }
}

// ---- 合并同标题 (跨页), 检测卷按连续页分组 ----
const mergedByKey = new Map();
let detectGroup = null; // 当前检测卷组 (连续检测页合并为一卷, 如 p015+p016)
let detectMainIdx = 0;
for (const page of mainArticles) {
  const title = page.title || '';
  if (isDetect(title)) {
    if (!detectGroup) {
      detectGroup = { key: `__detect_${detectMainIdx++}`, page: { ...page, _detectKey: `__detect_${detectMainIdx - 1}`, sections: [] } };
      mergedByKey.set(detectGroup.key, detectGroup.page);
    }
    const target = detectGroup.page;
    for (const sec of page.sections || []) {
      const ts = target.sections.find((s) => s.type === sec.type);
      if (ts) ts.items.push(...(sec.items || []));
      else target.sections.push({ ...sec });
    }
    continue;
  }
  detectGroup = null; // 非检测页打断分组
  const key = normTitle(title);
  if (!key) continue;
  if (!mergedByKey.has(key)) mergedByKey.set(key, { ...page, sections: [] });
  const target = mergedByKey.get(key);
  for (const sec of page.sections || []) {
    const ts = target.sections.find((s) => s.type === sec.type);
    if (ts) {
      // 跨页合并时重写 qid, 避免同 section 内 key 重复
      const base = ts.items.length;
      ts.items.push(...(sec.items || []).map((it, i) => ({ ...it, qid: it.qid.replace(/:\d+$/, `:${base + i}`) })));
    }
    else target.sections.push({ ...sec });
  }
}
const mainMerged = [...mergedByKey.values()];

// ---- 配对 ----
const articles = [];
const report = { mainPages: mainMerged.length, ansPages: ansPages.length, articles: [], unmatchedAns: [], emptySections: [] };

for (const page of mainMerged) {
  const title = page.title || '未知篇目';
  // 检测卷用合并时的编号 key 配对
  const key = page._detectKey || normTitle(title);
  // 答案匹配: 精确 → 一方包含另一方 (如"世说新语二则咏雪" 匹配 "咏雪") → 末尾匹配
  let ansGroup = ansByNorm.get(key);
  if (!ansGroup) {
    const cand = [...ansByNorm.keys()].find((k) => k.length >= 2 && (k.endsWith(key) || key.endsWith(k)));
    if (cand) ansGroup = ansByNorm.get(cand);
  }
  const sections = [];
  const secReport = { title, key, sections: {}, notes: [] };

  const isDetectKey = key.startsWith('__detect');
  // 检测卷答案池: 全部答案条目按序拆片段 (答案册把词义/活用/古今答案都标为"词义默写", 需全局顺序分配)
  const detectPool = (ansGroup?.answers || []).map((a) => String(a.a || '').split('|').map((s) => s.trim()).filter(Boolean)).flat();
  let detectCursor = 0;

  for (const sec of page.sections || []) {
    const type = sec.type || '未知题型';
    const items = [];
    const sectionItems = sec.items || [];
    let assigned = 0;
    for (let i = 0; i < sectionItems.length; i++) {
      const it = sectionItems[i];
      const q = it.q || '';
      const blank = blankCount(q);
      let answers = [];
      if (isDetectKey) {
        // 检测卷: 全局顺序分配
        const take = Math.max(blank, 1);
        answers = detectPool.slice(detectCursor, detectCursor + take);
        detectCursor += answers.length;
      } else {
        // 普通篇目: 该题型对应的答案条目 (按答案 q 的题型描述过滤; 无描述时按顺序)
        const typeAns = (ansGroup?.answers || []).filter((a) => !typeKey(a.q) || typeKey(a.q) === type);
        const ordered = [...typeAns].sort((a, b) => {
          const ia = itemIndex(a.q); const ib = itemIndex(b.q);
          if (ia != null && ib != null) return ia - ib;
          return 0;
        });
        // 答案条目 (每条可能是 1 题完整答案(多空 | 分隔), 或同题型多题合并答案如"词义默写1-6")
        const fragments = ordered.map((ans) => String(ans.a || '').split('|').map((s) => s.trim()).filter(Boolean));
        const flatPool = fragments.flat();
        let poolCursor = 0;
        const assignByEntry = fragments.length >= sectionItems.length;
        const frag = assignByEntry ? (fragments[i] || []) : flatPool.slice(poolCursor, poolCursor + Math.max(blank, 1));
        if (assignByEntry) {
          answers = blank > 0 ? frag.slice(0, blank) : frag;
        } else {
          answers = frag;
        }
      }
      if (answers.length) assigned++;
      const word = q.match(/【([^】]+)】/);
      items.push({
        qid: `moxie:${normTitle(title).replace(/[^a-z0-9\u4e00-\u9fff]/gi, '-') || 'untitled'}:${i}`,
        q,
        blanks: blank,
        answers,
        ...(word ? { word: word[1] } : {}),
      });
    }
    if (assigned < sectionItems.length) {
      secReport.notes.push(`${type}: 主书 ${sectionItems.length} 题 vs 答案 ${isDetectKey ? detectPool.length : 'N/A'}, 配对 ${assigned}`);
    }
    secReport.sections[type] = { items: sectionItems.length, matched: assigned };
    sections.push({ type, items });
  }

  if (!sections.length) report.emptySections.push(title);
  articles.push({
    id: `moxie-${normTitle(title).replace(/[^a-z0-9\u4e00-\u9fff]/gi, '-') || 'untitled'}`,
    title: title.replace(/\[[^\]]*\]/g, '').trim(),
    grade: (() => {
      const g = learningGradeByTitle.get(key) || (() => {
        const lk = [...learningGradeByTitle.keys()].find((k) => key.length >= 3 && (k.endsWith(key) || key.endsWith(k)));
        return lk ? learningGradeByTitle.get(lk) : null;
      })();
      return g ? gradeShort(g) : gradeShort(page.grade);
    })(),
    book_page: Number(page.book_page) || 0,
    source: 'moxie-book',
    articleId: (() => {
      const direct = learningByTitle.get(key);
      if (direct) return direct;
      const lk = [...learningByTitle.keys()].find((k) => key.length >= 3 && (k.endsWith(key) || key.endsWith(k)));
      return lk ? learningByTitle.get(lk) : null;
    })(),
    sections,
  });
  report.articles.push(secReport);
}

// 未配对的答案组
// 未配对的答案组 (与配对逻辑一致: 精确或包含匹配都算配对)
for (const [key, group] of ansByNorm) {
  if (key.startsWith('__detect_')) continue; // 检测类按位置配对, 跳过标题匹配
  const matched = mainMerged.some((p) => {
    const pk = normTitle(p.title);
    return pk === key || (pk.length >= 2 && (pk.endsWith(key) || key.endsWith(pk)));
  });
  if (!matched) {
    report.unmatchedAns.push({ title: group.title, answers: group.answers.length });
  }
}

writeFileSync(resolve(OUT, 'moxie.json'), JSON.stringify(articles, null, 2));
writeFileSync(REPORT, JSON.stringify(report, null, 2));
console.log(`✅ 配对完成: ${articles.length} 篇 → src/data/raw/moxie.json`);
console.log(`   答案未匹配组: ${report.unmatchedAns.length} | 空题型篇目: ${report.emptySections.length}`);
const badNotes = report.articles.filter((r) => r.notes.length);
console.log(`   配对异常篇目: ${badNotes.length}`);
for (const b of badNotes.slice(0, 5)) console.log('   ⚠', b.title, b.notes.join('; '));
