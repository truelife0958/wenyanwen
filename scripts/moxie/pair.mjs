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
    .replace(/\[[^\]]*\]/g, '')      // [唐]王湾
    .replace(/[（(][^）)]*[）)]/g, '') // (一曲新词酒一杯) 副标题 → 保留主名? 这里去掉括号内容
    .replace(/[\s，,。！？；：、·_—\-—–-]+/g, '')
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
const mainPages = mainFiles.map((f) => JSON.parse(readFileSync(resolve(RAW, f), 'utf8')));
const ansPages = ansFiles.map((f) => JSON.parse(readFileSync(resolve(RAW, f), 'utf8')));

// ---- 答案按篇目聚合 ----
const ansByNorm = new Map(); // normTitle → { title, answers: [] }
for (const page of ansPages) {
  for (const art of page.articles || []) {
    const key = normTitle(art.title);
    if (!key) continue;
    if (!ansByNorm.has(key)) ansByNorm.set(key, { title: art.title, answers: [] });
    ansByNorm.get(key).answers.push(...(art.answers || []));
  }
}

// ---- learning 篇目索引 (articleId 对齐) ----
const learningPath = resolve(ROOT, 'src/data/raw/learning.json');
let learningById = new Map(); let learningByTitle = new Map();
if (existsSync(learningPath)) {
  const learning = JSON.parse(readFileSync(learningPath, 'utf8'));
  for (const art of learning) {
    learningByTitle.set(normTitle(art.title), art.id);
  }
}

// ---- 配对 ----
const articles = [];
const report = { mainPages: mainPages.length, ansPages: ansPages.length, articles: [], unmatchedAns: [], emptySections: [] };

for (const page of mainPages) {
  const title = page.title || '未知篇目';
  const key = normTitle(title);
  const ansGroup = ansByNorm.get(key);
  const sections = [];
  const secReport = { title, key, sections: {}, notes: [] };

  for (const sec of page.sections || []) {
    const type = sec.type || '未知题型';
    const items = [];
    // 该题型对应的答案 (按答案 q 的题型描述过滤; 无描述时按顺序)
    const typeAns = (ansGroup?.answers || []).filter((a) => !typeKey(a.q) || typeKey(a.q) === type);
    const ordered = [...typeAns].sort((a, b) => {
      const ia = itemIndex(a.q); const ib = itemIndex(b.q);
      if (ia != null && ib != null) return ia - ib;
      return 0;
    });
    let matched = 0;
    for (let i = 0; i < (sec.items || []).length; i++) {
      const it = sec.items[i];
      const q = it.q || '';
      const blank = blankCount(q);
      const ans = ordered[matched];
      let answers = [];
      let extra = [];
      if (ans) {
        const parts = String(ans.a || '').split('|').map((s) => s.trim()).filter(Boolean);
        if (parts.length >= blank && blank > 0) {
          answers = parts.slice(0, blank);
          extra = parts.slice(blank);
        } else {
          answers = parts;
        }
        matched++;
      }
      const word = q.match(/【([^】]+)】/);
      items.push({
        qid: `moxie:${normTitle(title).replace(/[^a-z0-9\u4e00-\u9fff]/gi, '-') || 'untitled'}:${i}`,
        q,
        blanks: blank,
        answers,
        ...(word ? { word: word[1] } : {}),
        ...(extra.length ? { extra } : {}),
      });
    }
    if (matched < (ansGroup?.answers || []).filter((a) => !typeKey(a.q) || typeKey(a.q) === type).length) {
      secReport.notes.push(`${type}: 主书 ${sec.items?.length || 0} 题 vs 答案 ${typeAns.length} 条, 配对 ${matched}`);
    }
    secReport.sections[type] = { items: sec.items?.length || 0, matched };
    sections.push({ type, items });
  }

  if (!sections.length) report.emptySections.push(title);
  articles.push({
    id: `moxie-${normTitle(title).replace(/[^a-z0-9\u4e00-\u9fff]/gi, '-') || 'untitled'}`,
    title: title.replace(/\[[^\]]*\]/g, '').trim(),
    grade: gradeShort(page.grade),
    book_page: Number(page.book_page) || 0,
    source: 'moxie-book',
    articleId: learningByTitle.get(key) || null,
    sections,
  });
  report.articles.push(secReport);
}

// 未配对的答案组
for (const [key, group] of ansByNorm) {
  if (!mainPages.some((p) => normTitle(p.title) === key)) {
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
