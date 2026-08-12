#!/usr/bin/env node
/**
 * Build the compact runtime data layer from the preserved source JSON files.
 * The source files stay readable and reproducible; the app only imports runtime/*.json.
 */
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { expandKeyTerm } from './lib/word-expand.mjs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const RAW = resolve(ROOT, 'src/data/raw');
const OUT = resolve(ROOT, 'src/data/runtime');

const readJson = async (name) => JSON.parse(await readFile(resolve(RAW, name), 'utf8'));
const text = (value) => String(value == null ? '' : value).trim();
const compact = (value) => text(value).replace(/\s+/g, ' ');
const norm = (value) => text(value)
  .replace(/[\s\p{P}\p{S}0-9]/gu, '')
  .toLowerCase();

function titleKey(value) {
  return text(value)
    .replace(/^[一二三四五六七八九十]+、/, '')
    .replace(/[《》]/g, '')
    .replace(/[（(][^）)]*[）)]/g, '')
    .replace(/[\s，,。！？；：、·・_—-]/g, '')
    .toLowerCase();
}

function slug(value) {
  const result = titleKey(value).replace(/[^a-z0-9\u4e00-\u9fff]+/gi, '-').replace(/^-|-$/g, '');
  return result || 'untitled';
}

function grade(value) {
  // 保持短名以适配 UI GRADE_ORDER; 若已是全称则归一为短名
  const fullMap = { '七年级上册':'七上', '七年级下册':'七下', '八年级上册':'八上', '八年级下册':'八下', '九年级上册':'九上', '九年级下册':'九下' };
  if (fullMap[value]) return fullMap[value];
  return text(value) || '未分类';
}

function articleMatch(title, articleEntries) {
  // 优先原始 title 精确匹配 (区分括号内副标题: 浣溪沙（一曲新词酒一杯）vs 浣溪沙(漠漠轻寒))
  const raw = articleEntries.find((article) => article.title === title);
  if (raw) return raw;
  const key = titleKey(title);
  const exact = articleEntries.find((article) => titleKey(article.title) === key);
  if (exact) return exact;
  return articleEntries.find((article) => {
    const candidate = titleKey(article.title);
    return candidate.length >= 2 && (key.startsWith(candidate) || candidate.startsWith(key));
  }) || null;
}

function inferZhentiType(stem) {
  const value = text(stem);
  if (/解释|加点词|下列加点|补写出|默写|空缺/.test(value)) return 'gloss';
  if (/翻译|译成|用现代汉语|把.+译/.test(value)) return 'translate';
  if (/断句|用["“'/／]|停顿/.test(value)) return 'punct';
  if (/下列|不正确|正确的一项|意思相同|有误的一项|（\s*）|\(\s*\)/.test(value)) return 'choice';
  if (/谈谈|理解|分析|如何|怎样|为什么|特点|表达了|作用|用意|启示/.test(value)) return 'understand';
  return 'open';
}

function cultureOf(value) {
  if (!value) return {};
  if (typeof value === 'string') return { text: compact(value) };
  return {
    authorIntro: compact(value.author_intro),
    background: compact(value.background),
    theme: compact(value.theme),
  };
}

function sameMeaning(a, b) {
  const left = norm(a);
  const right = norm(b);
  return Boolean(left && right && (left === right || left.includes(right) || right.includes(left)));
}

function sentenceStars(article) {
  const result = [];
  const seen = new Set();
  const add = (sentence, kind, translation = '') => {
    const value = compact(sentence);
    const key = norm(value);
    if (!key || key.length < 4 || seen.has(key)) return;
    seen.add(key);
    result.push({ sentence: value, kind, ...(translation ? { translation: compact(translation) } : {}) });
  };
  for (const item of article.key_sentences || []) {
    add(typeof item === 'string' ? item : item?.sentence || item?.text, '重点句', typeof item === 'object' ? item?.translation : '');
  }
  for (const point of article.exam_points || []) {
    if (typeof point !== 'object' || point?.point !== '名句默写') continue;
    for (const line of text(point.detail).split('\n')) {
      const clean = line
        .replace(/(?:直接|理解|综合|课内|课外)?\s*\d+\s*考/g, '')
        .replace(/^\s*[①②③④⑤⑥⑦⑧⑨⑩]+\s*/, '')
        .trim();
      for (const sentence of clean.split(/(?<=[。！？])/).map((item) => item.trim()).filter(Boolean)) {
        if (/[一-鿿]/.test(sentence)) add(sentence, '名句默写');
      }
    }
  }
  // 缺译文的背诵句: 原文行→译文行索引对齐补齐
  const origLines = text(article.original_text || '').split('\n').filter((l) => l.trim());
  const transLines = text(article.translation || '').split('\n').filter((l) => l.trim());
  const needT = text(star => text(star.sentence));
  const normT = (t) => text(t);
  for (const star of result) {
    if (star.translation) continue;
    const need = normT(star.sentence);
    const idx = origLines.findIndex((l) => normT(l).includes(need) || need.includes(normT(l)));
    if (idx >= 0 && transLines[idx]) star.translation = compact(transLines[idx]);
  }
  return result;
}

function alignTranslations(original, translation, count) {
  if (!count) return [];
  const lines = text(original).split('\n').filter((line) => line.trim());
  const translatedLines = text(translation).split('\n').filter((line) => line.trim());
  let sentences = text(translation).split(/(?<=[。！？；])/).map((line) => line.trim()).filter(Boolean);
  if (sentences.length < count) {
    sentences = text(translation).split(/(?<=[。！？；，、,])/).map((line) => line.trim()).filter(Boolean);
  }
  if (translatedLines.length === count) return translatedLines;
  if (!sentences.length) return [text(translation)];
  return Array.from({ length: count }, (_, index) => {
    const start = Math.floor((index * sentences.length) / count);
    const end = Math.floor(((index + 1) * sentences.length) / count);
    return sentences.slice(start, end).join('');
  });
}


// 兼容匹配: 统一全角/半角标点、跳过换行符后定位
function findCompat(haystack, needle, fromIndex) {
  // 归一化: 去除所有空白/标点/符号, 只保留汉字 + 字母数字
  const norm = (s) => Array.from(s)
    .filter(c => /[\u4e00-\u9fff\u3400-\u4dbfa-zA-Z0-9]/.test(c))
    .join('').toLowerCase();
  const hay = norm(haystack);
  const need = norm(needle);
  if (!need) return -1;
  // 把 fromIndex 转换为归一化后的索引
  let normFrom = 0;
  for (let i = 0; i < fromIndex && i < haystack.length; i++) {
    if (/[\u4e00-\u9fff\u3400-\u4dbfa-zA-Z0-9]/.test(haystack[i])) normFrom += 1;
  }
  if (normFrom > hay.length) normFrom = Math.max(0, hay.length - need.length);
  const rawIndex = hay.indexOf(need, normFrom);
  if (rawIndex < 0) return -1;
  // 转换回原始索引: 停在第 rawIndex 个归一化字符处 (修正: 匹配串前有书名号/标点时不再偏移)
  let originalIndex = 0;
  let normIndex = 0;
  for (const ch of haystack) {
    if (/[\u4e00-\u9fff\u3400-\u4dbfa-zA-Z0-9]/.test(ch) && normIndex === rawIndex) break;
    if (/[\u4e00-\u9fff\u3400-\u4dbfa-zA-Z0-9]/.test(ch)) {
      normIndex += 1;
    }
    originalIndex += 1;
  }
  // 转换得到的索引可能因"前段吞了尾标点"而早于 cursor,
  // 此时不能跨越 cursor 回退，下一段的起点至少应从前段结尾开始。
  return Math.max(originalIndex, fromIndex);
}

function paragraphRows(article) {
  const original = text(article.original_text);
  const raw = Array.isArray(article.paragraph_analysis) ? article.paragraph_analysis : [];
  const objects = raw.map((row) => {
    if (typeof row === 'string') return { analysis: compact(row) };
    return {
      original: compact(row?.original || row?.content),
      analysis: compact(row?.analysis),
      number: text(row?.number),
      translation: compact(row?.paraphrase || row?.translation),
    };
  }).filter((row) => row.original || row.analysis);
  const matched = [];
  const unmatched = [];
  let cursor = 0;
  for (const row of objects) {
    if (row.original) {
      const start = findCompat(original, row.original, cursor);
      if (start >= 0) {
        // end = start 后数 normLen 个汉字/字母, 再吞尾随标点/引号(避免标点被推到下一段)
        const normLen = Array.from(row.original).filter(c => /[\u4e00-\u9fff\u3400-\u4dbfa-zA-Z0-9]/.test(c)).length;
        let end = start;
        let counted = 0;
        while (counted < normLen && end < original.length) {
          if (/[\u4e00-\u9fff\u3400-\u4dbfa-zA-Z0-9]/.test(original[end])) counted += 1;
          end += 1;
        }
        // 吞掉尾随的非汉字(标点/引号/空白), 直到遇到汉字或换行
        while (end < original.length && !/\n/.test(original[end]) && !/[\u4e00-\u9fff\u3400-\u4dbfa-zA-Z0-9]/.test(original[end])) {
          end += 1;
          // 不吞换行后的内容
          if (end < original.length && /\n/.test(original[end])) break;
        }
        matched.push({ ...row, start, end });
        cursor = end;
      } else {
        unmatched.push({ ...row, fallbackText: row.original });
      }
    } else unmatched.push(row);
  }

  const segments = [];
  const addGap = (start, end) => {
    let position = start;
    while (position < end) {
      const newline = original.indexOf('\n', position);
      const segmentEnd = newline >= 0 && newline < end ? newline : end;
      if (original.slice(position, segmentEnd).trim()) segments.push({ start: position, end: segmentEnd });
      position = segmentEnd + (newline >= 0 && newline < end ? 1 : 0);
    }
  };
  cursor = 0;
  for (const row of matched) {
    addGap(cursor, row.start);
    segments.push(row);
    cursor = row.end;
  }
  addGap(cursor, original.length);
  segments.push(...unmatched);

  // 后处理: 把"残句段"(纯标点/引号/空白, 长度<=3) 并入相邻匹配段, 消除独立成行的渲染 bug
  const FRAG_RE = /^[\s。，；！？、．：“”‘’《》【】.\,!?;:\.\.\s]*$/;
  const isFrag = (row) =>
    Number.isInteger(row.start) &&
    (row.end - row.start) <= 3 &&
    FRAG_RE.test(original.slice(row.start, row.end));
for (let i = segments.length - 1; i >= 1; i--) {
    if (isFrag(segments[i]) && !segments[i].analysis && !segments[i].number) {
      const prev = segments[i - 1];
      if (Number.isInteger(prev.start)) prev.end = segments[i].end;
      segments.splice(i, 1);
    }
  }

  const aligned = alignTranslations(original, article.translation, segments.length);
  return segments.map((row, index) => {
    const result = {
      ...(row.analysis ? { analysis: row.analysis } : {}),
      ...(row.number ? { number: row.number } : {}),
      ...(Number.isInteger(row.start) ? { start: row.start, end: row.end } : {}),
      ...(row.fallbackText ? { fallbackText: row.fallbackText } : {}),
    };
    // Keep only translations that cannot be recovered from the article-level translation.
    if (row.translation && norm(row.translation) !== norm(aligned[index] || '')) result.translation = row.translation;
    return result;
  });
}

function wordRecord(articleId, word, meaning, category, source, extra = {}) {
  const value = compact(word);
  if (!value || !compact(meaning)) return null;
  return {
    id: `word:${articleId}:${slug(value)}`,
    scope: 'article',
    articleId,
    word: value,
    meanings: [{ text: compact(meaning), category: compact(category) || '重点词', source, ...extra }],
  };
}

/** 考试相关类别优先级: 越靠前越具体, 合并时优先保留 */
const WORD_CATEGORY_PRIORITY = [
  '通假字', '词类活用', '古今异义', '一词多义', '文言虚词', '重点虚词', '重点实词',
  '实词', '虚词', '课文注释', '炼字', '重点词',
];
const categoryPriority = (category) => {
  const index = WORD_CATEGORY_PRIORITY.indexOf(category);
  return index === -1 ? WORD_CATEGORY_PRIORITY.length : index;
};

/**
 * 按归一化文本去重合并词条释义。
 * - 判重只看文本 (忽略类别), 消除 notes 与 key_terms 的同义重复
 * - 重复时保留先到 (课文注释优先) 的文本; 类别取更具体的考试类别
 * - 合并 legacyIds 与 numbers
 */
function mergeWords(records) {
  const map = new Map();
  for (const record of records) {
    if (!record) continue;
    const key = `${record.articleId}:${norm(record.word)}`;
    const current = map.get(key);
    if (!current) {
      map.set(key, record);
      continue;
    }
    const meanings = [...current.meanings];
    for (const meaning of record.meanings) {
      const duplicate = meanings.find((item) => norm(item.text) === norm(meaning.text));
      if (duplicate) {
        // 文本完全相同: 保留先到的文本, 升级为更具体的考试类别
        mergeMeaning(duplicate, meaning);
        continue;
      }
      // 包含合并: 一义项文本包含另一义项(最短侧 >=2 字), 保留更长更具体的
      // 仅限篇内词条; 全局 glossary 词汇 (无 articleId) 不参与, 保留原义项
      const near = !record.articleId ? undefined : meanings.find((item) => {
        const a = norm(item.text);
        const b = norm(meaning.text);
        if (a.length < 2 || b.length < 2) return false;
        return a.includes(b) || b.includes(a);
      });
      if (near) {
        if (norm(meaning.text).length > norm(near.text).length) near.text = meaning.text;
        mergeMeaning(near, meaning);
        continue;
      }
      meanings.push(meaning);
    }
    current.meanings = meanings;
  }
  return [...map.values()];
}

/** 把新义项合并进已有义项: 升级类别、合并 legacyIds/numbers/example */
function mergeMeaning(target, source) {
  if (categoryPriority(source.category) < categoryPriority(target.category)) {
    target.category = source.category;
  }
  if (source.legacyIds?.length) {
    target.legacyIds = [...new Set([...(target.legacyIds || []), ...source.legacyIds])];
  }
  if (source.numbers?.length) {
    target.numbers = [...new Set([...(target.numbers || []), ...source.numbers])];
  }
  if (source.example && !target.example) target.example = source.example;
}


function uniqueRecordIds(records) {
  const seen = new Map();
  return records.map((record) => {
    const count = (seen.get(record.id) || 0) + 1;
    seen.set(record.id, count);
    return count === 1 ? record : { ...record, id: `${record.id}:${count}` };
  });
}

function questionType(value) {
  const valid = new Set(['blank', 'choice', 'discuss', 'explain', 'passage', 'punctuate', 'short', 'translate', 'gloss', 'punct', 'understand', 'open']);
  return valid.has(value) ? value : 'short';
}

function questionKey(question) {
  // 真题跨篇去重: 带省/市/卷标记的真题按 题干+答案 全局去重 (不挂 articleId 维度, 归一标点/省份前缀)
  if (question.fromZhenti) {
    const answer = Array.isArray(question.answer) ? question.answer.join('；') : question.answer;
    return `z:${normKey(question.stem)}:${normKey(answer)}`;
  }
  const scope = question.articleId ? `a:${question.articleId}` : `c:${question.collectionId || 'unassigned'}`;
  const answer = Array.isArray(question.answer) ? question.answer.join('；') : question.answer;
  return `${scope}:${norm(question.stem)}:${norm(answer)}`;
}

/** 真题去重键归一: 去省份卷前缀, 全角标点转半角 */
function normKey(value) {
  const full2half = { '，': ',', '。': '.', '？': '?', '！': '!', '；': ';', '：': ':', '“': '"', '”': '"', '‘': "'", '’': "'", '（': '(', '）': ')' };
  return norm(String(value || '').replace(/^（[^（）]*?(?:省|市|卷)[^（）]*?）/, '').replace(/[，。？！；：“”‘’（）]/g, (m) => full2half[m] || m));
}

/**
 * 清理题目文本中的 OCR/来源残留:
 * - 上标"¹考""²"等考频标记
 * - "1考""(4考)"等考频数字标记
 * - 答案前缀的【答案】/【解析】
 * 保留〔〕(加点字标记, 语义有效)。
 */
function cleanArtifacts(value) {
  return compact(value)
    .replace(/[¹²³⁴⁵⁶⁷⁸⁹⁰]+(?:考)?/g, '')
    .replace(/[（(]?\d+考[）)]?/g, '')
    .replace(/^【答案】\s*/g, '')
    .replace(/^【解析】\s*/g, '')
    .replace(/\s+/g, ' ');
}

/** 答案文本清理: 在 cleanArtifacts 基础上剥离【参考答案】前缀与【解析】内容 */
function cleanAnswerText(value) {
  return cleanArtifacts(value)
    .replace(/^[\s/]*【参考答案】\s*/g, '')
    .replace(/【解析】.*$/s, '').trim();
}

/** 从题干提取选择题选项 (A. xxx / 甲:xxx 等内嵌格式) — 用于 raw 缺 options 字段的题 */
function extractOptionsFromStem(stem) {
  const s = String(stem || '');
  // 甲乙丙丁格式: 甲:xxx 乙:xxx 丙:xxx
  const jyb = s.match(/(甲|乙|丙|丁)[:：、.]\s*([^甲乙丙丁]+?)(?=\s*(?:乙|丙|丁)[:：、.]|$)/g);
  if (jyb && jyb.length >= 2) {
    const opts = jyb
      .map((seg) => seg.match(/^(甲|乙|丙|丁)[:：、.]\s*(.+)$/)?.[2]?.trim())
      .filter(Boolean);
    if (opts.length >= 2) return opts;
  }
  // A-D 格式 (支持 )A. 空格A. 句号A. 等边界; 选项内容通常不含 A-D 字母)
  const parts = [];
  const re = /(?:^|[\s（(）)。；])([A-D])[.、．]\s*([^A-D]+?)(?=[\s（(）)。；]?[A-D][.、．]|$)/g;
  let m;
  while ((m = re.exec(s))) {
    const idx = m[1].charCodeAt(0) - 65;
    parts[idx] = m[2].trim();
  }
  const filled = parts.filter(Boolean);
  if (filled.length >= 2) return filled;
  return null;
}

/** 答案字母规范化: "A。解析" → "A"、"丙。" → "C" (与 options 提取配套) */
function normalizeChoiceAnswer(answer) {
  const a = String(answer || '').trim();
  const m = a.match(/^([A-D])[.、．。]?/);
  if (m) return m[1];
  const jyb = { 甲: 'A', 乙: 'B', 丙: 'C', 丁: 'D' };
  const jm = a.match(/^([甲乙丙丁])[.、．。]?/);
  if (jm && jyb[jm[1]]) return jyb[jm[1]];
  return a;
}

function cleanQuestion(question, source, target, index, extra = {}) {
  const stem = cleanArtifacts(question?.stem || question?.q);
  const rawAnswer = question?.answer ?? question?.a ?? '';
  const answer = Array.isArray(rawAnswer) ? rawAnswer.map(cleanAnswerText) : cleanAnswerText(rawAnswer);
  if (!stem || answer === '' || answer == null) return null;
  const type = questionType(question.type);
  // choice 缺 options 时从题干提取 (内嵌 A./甲: 格式), 并规范化答案字母
  let options = Array.isArray(question.options) ? question.options : null;
  let finalAnswer = answer;
  if (type === 'choice' && (!options || !options.length)) {
    const extracted = extractOptionsFromStem(stem);
    if (extracted) {
      options = extracted;
      finalAnswer = normalizeChoiceAnswer(Array.isArray(answer) ? answer[0] : answer);
    }
  }
  // 真题识别: 题干带省/市/卷标记的 (如 （青海省卷）/【云南】/ 河南卷:) 即使来源非 zhenti 也标记为真题
  const ZHENTI_MARK = /（\s*[^（）]*?(?:省|市|卷)[^（）]*?）|【\s*[^】]*?(?:省|市|卷)[^】]*?】/;
  const isZhenti = source === 'zhenti' || ZHENTI_MARK.test(stem);
  return {
    id: `${source}:${target.id}:${index}`,
    scope: target.articleId ? 'article' : 'collection',
    ...(target.articleId ? { articleId: target.articleId } : { collectionId: target.collectionId }),
    origin: isZhenti ? 'zhenti' : source,
    origins: isZhenti ? ['zhenti', source] : [source],
    type,
    stem,
    answer: finalAnswer,
    ...(options && options.length
      ? { options: options.map((opt) => String(opt).replace(/^\s*[A-D][.、．]\s*/, '')) }
      : {}),
    ...(question.answerNote ? { answerNote: compact(question.answerNote) } : {}),
    ...(question.explanation || question.analysis ? { explanation: compact(question.explanation || question.analysis) } : {}),
    ...(question.key_points ? { key_points: question.key_points } : {}),
    ...(question.province ? { province: compact(question.province) } : {}),
    ...(question.year ? { year: compact(question.year) } : {}),
    ...(question.source ? { source: question.source } : {}),
    ...(question.material ? { material: question.material } : {}),
    ...(isZhenti ? { fromZhenti: true } : {}),
    ...extra,
  };
}

function mergeQuestions(records) {
  const precedence = { practice: 5, zhenti: 4, related: 3, exam_point: 2, handwritten: 1 };
  const map = new Map();
  const zhentiIndex = new Map(); // 归一化内容键 → map key, 用于回溯合并同题变体 (全源)
  // 第一遍: 预注册全部记录的内容键 (否则先处理的 practice 无法命中后注册的 zhenti, 产生内容重复)
  for (const record of records) {
    if (!record) continue;
    const cKey = `c:${normKey(record.stem)}:${normKey(Array.isArray(record.answer) ? record.answer.join('；') : record.answer)}`;
    if (!zhentiIndex.has(cKey)) zhentiIndex.set(cKey, questionKey(record));
  }
  for (const record of records) {
    if (!record) continue;
    const key = questionKey(record);
    // 同题回溯: 与任意来源已收录题同题干同答案 (归一化后) 合并 (practice/related 优先, 内容只保留一份)
    let targetKey = key;
    const cKey = `c:${normKey(record.stem)}:${normKey(Array.isArray(record.answer) ? record.answer.join('；') : record.answer)}`;
    const hit = zhentiIndex.get(cKey);
    if (hit) targetKey = hit;
    const current = map.get(targetKey);
    if (!current) {
      map.set(targetKey, { ...record, origin: record.fromZhenti ? 'zhenti' : record.origin });
      continue;
    }
    const preferred = (precedence[record.origin] || 0) > (precedence[current.origin] || 0) ? record : current;
    const merged = { ...preferred };
    for (const field of ['options', 'answerNote', 'explanation', 'key_points', 'province', 'year', 'source', 'material']) {
      if (!merged[field] && current[field]) merged[field] = current[field];
      if (!merged[field] && record[field]) merged[field] = record[field];
    }
    merged.origins = [...new Set([...(current.origins || [current.origin]), ...(record.origins || [record.origin])])];
    map.set(targetKey, merged);
  }
  return [...map.values()].map((question, index) => ({ ...question, id: `${question.origin}:${index + 1}` }));
}

const [learningRaw, practiceRaw, handwritten, zhentiRaw, zhentiWebRaw] = await Promise.all([
  readJson('learning.json'),
  readJson('practice.json'),
  readJson('handwritten.json'),
  readJson('zhenti.json'),
  readJson('zhenti_web.json'),
]);

// 考点题重写产物 (可选): 缺失时回退到自动生成
let examRewrites = {};
try {
  examRewrites = JSON.parse(await readFile(resolve(RAW, 'exam_point_rewrites.json'), 'utf8'));
} catch {
  examRewrites = {};
}
const sourceArticles = learningRaw.filter((article) => article.type !== 'glossary');
const articles = sourceArticles.map((source, index) => {
  const id = source.id || `article-${slug(source.title)}-${index + 1}`;
  const culture = cultureOf(source.literary_culture);
  const theme = compact(source.theme_idea) || culture.theme;
  const cultureTheme = culture.theme && !sameMeaning(theme, culture.theme) ? culture.theme : '';
  return {
    id,
    title: compact(source.title),
    grade: grade(source.grade),
    ...(source.author ? { author: compact(source.author) } : {}),
    ...(source.dynasty ? { dynasty: compact(source.dynasty) } : {}),
    ...(source.origin ? { origin: compact(source.origin) } : {}),
    ...(source.source ? { source: compact(source.source) } : {}),
    reading: {
      original: text(source.original_text),
      translation: text(source.translation),
      paragraphs: paragraphRows(source),
    },
    analysis: {
      ...(theme ? { theme } : {}),
      ...(source.content_outline ? { outline: text(source.content_outline) } : {}),
      ...(source.writing_features ? { writing: text(source.writing_features) } : {}),
      culture: {
        ...(culture.text ? { text: culture.text } : {}),
        ...(culture.authorIntro ? { authorIntro: culture.authorIntro } : {}),
        ...(culture.background ? { background: culture.background } : {}),
        ...(cultureTheme ? { theme: cultureTheme } : {}),
      },
    },
    recitation: { stars: sentenceStars(source) },
    examPoints: (source.exam_points || [])
      .filter((p) => p && typeof p === 'object' && p.point && p.detail)
      .map((p) => ({ point: String(p.point).trim(), detail: String(p.detail).trim() })),
    wordIds: [],
    questionIds: [],
  };
});

const articleById = new Map(articles.map((article) => [article.id, article]));
const sourceToCanonical = new Map(sourceArticles.map((source, index) => [source, articles[index]]));
const articleForTitle = (title) => articleMatch(title, articles);
const collections = new Map();
const ensureCollection = (title, source = 'practice', gradeValue = '') => {
  const key = `${source}:${titleKey(title)}`;
  if (!collections.has(key)) {
    const id = `collection:${source}:${slug(title)}`;
    collections.set(key, { id, title: compact(title), grade: grade(gradeValue), source, questionIds: [] });
  }
  return collections.get(key);
};
const targetFor = (title, source, gradeValue = '') => {
  const article = articleForTitle(title);
  if (article) return { articleId: article.id };
  return { collectionId: ensureCollection(title, source, gradeValue).id };
};

const wordRecords = [];
for (const source of sourceArticles) {
  const article = sourceToCanonical.get(source);
  for (const [noteIndex, note] of (source.notes || []).entries()) {
    wordRecords.push(wordRecord(article.id, note.char, note.text, '课文注释', 'note', {
      ...(note.number ? { numbers: [note.number] } : {}),
      legacyIds: [`note:${article.id}:${noteIndex}`],
    }));
  }
  for (const [groupIndex, group] of (source.key_terms || []).entries()) {
    for (const [itemIndex, item] of (group?.items || []).entries()) {
      for (const expanded of expandKeyTerm(group, item)) {
        wordRecords.push(wordRecord(article.id, item.word, expanded.meaning, expanded.category, 'key_term', {
          ...(expanded.example ? { example: expanded.example } : {}),
          legacyIds: [`kt:${article.id}:${groupIndex}:${itemIndex}`],
        }));
      }
    }
  }
}
const glossary = learningRaw.find((article) => article.type === 'glossary');
for (const [entryIndex, entry] of (glossary?.shici || []).entries()) {
  for (const [index, sense] of (entry.senses || []).entries()) {
    const word = compact(entry.char);
    const meaning = compact(sense.sense);
    if (word && meaning) wordRecords.push({ id: `glossary:shici:${slug(entry.char)}:${index}`, scope: 'global', word, meanings: [{ text: meaning, category: '实词', source: 'glossary', legacyIds: [`shici:${entryIndex}:${index}`], ...(sense.example ? { example: sense.example } : {}), ...(sense.origin ? { origin: sense.origin } : {}) }] });
  }
}
for (const [entryIndex, entry] of (glossary?.xuci || []).entries()) {
  for (const [index, usage] of (entry.usage || []).entries()) {
    const word = compact(entry.char);
    // 兼容两种 usage 格式: {category,subtype} 与 {usage:"..."}
    const meaning = compact(usage.subtype || usage.category || usage.usage);
    if (word && meaning) wordRecords.push({ id: `glossary:xuci:${slug(entry.char)}:${index}`, scope: 'global', word, meanings: [{ text: meaning, category: '虚词', source: 'glossary', legacyIds: [`xuci:${entryIndex}:${index}`], ...(usage.example ? { example: usage.example } : {}), ...(usage.origin ? { origin: usage.origin } : {}) }] });
  }
}
const words = uniqueRecordIds(mergeWords(wordRecords));

const rawQuestions = [];
let sourceQuestionRecords = 0;
let invalidQuestionRecords = 0;
const collectQuestion = (question, source, target, index, extra) => {
  sourceQuestionRecords += 1;
  const cleaned = cleanQuestion(question, source, target, index, extra);
  if (cleaned) rawQuestions.push(cleaned);
  else invalidQuestionRecords += 1;
};
const addQuestions = (items, source, sourceLabel = source) => {
  for (const item of items || []) {
    const target = targetFor(item.title, sourceLabel, item.grade);
    for (const [index, question] of (item.questions || []).entries()) {
      collectQuestion(question, source, target, index);
    }
  }
};
addQuestions(practiceRaw, 'practice');
for (const category of ['annotation', 'passage', 'extra', 'exam']) addQuestions(handwritten[category], 'handwritten', category === 'passage' ? 'handwritten' : category);

for (const [index, item] of [...zhentiRaw, ...zhentiWebRaw].entries()) {
  const target = targetFor(item.title, 'zhenti');
  const question = {
    ...item,
    type: item.type || inferZhentiType(item.stem),
    explanation: item.analysis,
  };
  collectQuestion(question, 'zhenti', target, index, { fromZhenti: true });
}

for (const source of sourceArticles) {
  const article = sourceToCanonical.get(source);
  for (const [index, question] of (source.related_questions || []).entries()) {
    collectQuestion(question, 'related', { articleId: article.id }, index);
  }
  // 考点复习题: 优先使用模型重写产物 (exam_point_rewrites.json); 未重写的篇目回退到自动生成
  const rewrites = examRewrites[article.id];
  if (rewrites?.length) {
    for (const [index, rewrite] of rewrites.entries()) {
      collectQuestion({ type: 'short', stem: rewrite.stem, answer: rewrite.answer, explanation: rewrite.point || '考点复习' }, 'exam_point', { articleId: article.id }, index);
    }
  } else {
    for (const point of source.exam_points || []) {
      if (typeof point !== 'object') continue;
      const label = compact(point.point);
      const detail = compact(point.detail);
      if (!label || !detail || label === '名句默写' || /实词|虚词|通假|活用|异义|多义|炼字/.test(label)) continue;
      collectQuestion({ type: 'short', stem: `【考点复习】${label}`, answer: detail, explanation: label }, 'exam_point', { articleId: article.id }, 0);
    }
  }
}

const questions = mergeQuestions(rawQuestions);

// 合并 AI 生成的中考真题 (必考+核心篇目)
try {
  const genExam = JSON.parse(readFileSync(resolve(ROOT, 'src/data/runtime/exam-generated.json'), 'utf8'));
  if (Array.isArray(genExam)) {
    for (const q of genExam) {
      if (!q || !q.id || !q.stem) continue;
      if (!questions.find(x => x.id === q.id)) {
        questions.push({
          id: q.id, scope: 'article', origin: 'exam_gen',
          articleId: q.articleId || '', articleTitle: q.articleTitle || '',
          type: q.type || 'short', stem: q.stem,
          options: Array.isArray(q.options)
            ? q.options.map((o) => String(o).replace(/^\s*[A-D][.、．]\s*/, ''))
            : [],
          answer: q.answer || '',
          analysis: q.analysis || '', points: q.points || [],
          origins: [q.origin || 'exam-gen'],
        });
        const a = q.articleId && articleById.get(q.articleId);
        if (a && !a.questionIds.includes(q.id)) a.questionIds.push(q.id);
      }
    }
    console.log(`合并 AI 生成中考题: ${genExam.length} 题`);
  }
} catch (e) { console.warn('跳过 exam-generated 合并:', e.message); }

// 综合题集题目按《篇名》归属单篇 (砍独立页后并入单篇练习)
const normTitle = (t) => String(t || '').replace(/[《》·（）()\s]/g, '');
const titleToArticle = new Map(articles.map((a) => [normTitle(a.title), a]));
for (const question of questions) {
  if (question.articleId || !question.collectionId) continue;
  const stem = question.stem || '';
  const quoted = /《([^》]{2,12})》/.exec(stem);
  let target = quoted ? titleToArticle.get(normTitle(quoted[1])) : null;
  if (!target) {
    target = [...titleToArticle.values()].find((a) => stem.includes(a.title) && a.title.length >= 2);
  }
  if (target) {
    question.articleId = target.id;
    question.collectionId = undefined;
    target.questionIds.push(question.id);
  }
}
for (const question of questions) {
  const article = question.articleId ? articleById.get(question.articleId) : null;
  if (article && !article.questionIds.includes(question.id)) article.questionIds.push(question.id);
  else if (question.collectionId) {
    const collection = [...collections.values()].find((item) => item.id === question.collectionId);
    if (collection && !collection.questionIds.includes(question.id)) collection.questionIds.push(question.id);
  }
}
// 组集合补全: 子文章题已归入单篇后集合变空 → 按组定义把子文章题挂回集合 (唐诗三首/《诗经》二首/短文两篇)
const GROUP_COLLECTIONS = {
  '唐诗三首': ['望岳', '春望', '石壕吏'],
  '《诗经》二首': ['关雎', '蒹葭'],
  '短文两篇': ['陋室铭', '爱莲说'],
};
for (const [group, members] of Object.entries(GROUP_COLLECTIONS)) {
  const collection = [...collections.values()].find((item) => item.title === group);
  if (!collection || collection.questionIds.length) continue;
  const ids = new Set(collection.questionIds);
  for (const member of members) {
    const article = titleToArticle.get(normTitle(member));
    if (article) for (const qid of article.questionIds) ids.add(qid);
  }
  collection.questionIds = [...ids];
}
for (const word of words) {
  if (word.articleId) articleById.get(word.articleId)?.wordIds.push(word.id);
}

await mkdir(OUT, { recursive: true });
const output = async (name, value) => writeFile(resolve(OUT, name), `${JSON.stringify(value, null, 2)}\n`, 'utf8');
await output('articles.json', articles);
await output('words.json', words);
await output('questions.json', questions);
await output('collections.json', [...collections.values()]);
// 默写题库: moxie 书 + legacy 转换合并 (book 优先, 同篇合并)
const moxieBookPath = resolve(RAW, 'moxie.json');
const moxieLegacyPath = resolve(RAW, 'moxie-legacy.json');
let moxie = [];
if (existsSync(moxieBookPath)) {
  const book = JSON.parse(await readFile(moxieBookPath, 'utf8'));
  moxie = [...book];
  // legacy 合并: 同篇合并 sections, book 已有的题不重复
  if (existsSync(moxieLegacyPath)) {
    const legacy = JSON.parse(await readFile(moxieLegacyPath, 'utf8'));
    for (const l of legacy) {
      const lk = titleKey(l.title);
      const target = moxie.find((m) => {
        const mk = titleKey(m.title);
        return mk === lk || (lk.length >= 4 && mk.length >= 4 && (mk.endsWith(lk) || lk.endsWith(mk)) && Math.abs(mk.length - lk.length) <= 6);
      });
      if (!target) {
        moxie.push(l);
        continue;
      }
      for (const ls of l.sections || []) {
        const ts = target.sections.find((s) => s.type === ls.type);
        if (!ts) target.sections.push({ ...ls });
        else {
          // 原文默写题型: book 已重写覆盖全篇 (每句挖一半), legacy 的零散题丢弃, 避免"2空"连续空
          if (ls.type === '原文默写' && (ts.items || []).length > 0) continue;
          // 按题干归一化去重
          const existing = new Set((ts.items || []).map((it) => norm(it.q)));
          for (const it of ls.items || []) {
            if (!existing.has(norm(it.q))) { ts.items.push(it); existing.add(norm(it.q)); }
          }
        }
      }
    }
  }
  const VALID_GRADES = new Set(['七上', '七下', '八上', '八下', '九上', '九下']);
  const seenIds = new Set();
  moxie = moxie.map((m, idx) => {
    const g = grade(m.grade);
    let artId = m.id || `moxie-${slug(m.title)}-${idx}`;
    // id 唯一兜底: 同名篇目(如 legacy 合并遗漏)追加序号, 避免路由/key 冲突
    if (seenIds.has(artId)) {
      console.warn(`⚠ moxie 篇目 id 重复, 追加序号: ${artId} → ${artId}-${idx}`);
      artId = `${artId}-${idx}`;
    }
    seenIds.add(artId);
    return {
      ...m,
      id: artId,
      grade: VALID_GRADES.has(g) ? g : '附录',
      // 强制重写 qid: 篇目+题型序号+题序号 (raw 旧 qid 缺题型序号, 导致同一 qid 指向多道题)
      sections: (() => {
        // 题型固定排序: 原文默写 → 理解性默写 → 词义默写 → 译文默写 → 其他(按原相对顺序)
        const TYPE_ORDER = ['原文默写', '理解性默写', '词义默写', '译文默写'];
        const sects = [...(m.sections || [])].sort((a, b) => {
          const ia = TYPE_ORDER.indexOf(a.type);
          const ib = TYPE_ORDER.indexOf(b.type);
          return (ia === -1 ? TYPE_ORDER.length : ia) - (ib === -1 ? TYPE_ORDER.length : ib);
        });
        return sects.map((sec, si) => ({
          ...sec,
          // 题号重编号: 仅对有数字前缀的题(如"4.  秋风…")按题型内顺序重排,
          // 解决 legacy 合并追加的题与 book 题号冲突(如两个"4"); 无编号题(原文默写整段/鉴赏)保持原样
          items: (sec.items || []).map((it, ii) => {
            const q = String(it.q || '');
            const m2 = /^\s*(\d+)[.、]\s*/.exec(q);
            if (!m2) return { ...it, qid: `${artId}:${si}:${ii}` };
            const body = q.slice(m2[0].length).trimStart();
            return { ...it, qid: `${artId}:${si}:${ii}`, q: `${ii + 1}.${body}` };
          }),
        }));
      })(),
    };
  });
}
await output('moxie.json', moxie);
// 轻量元数据: 首页/导航只依赖此文件, 避免首屏加载全量 articles/words/questions
await output('article-meta.json', {
  articles: articles.map((a) => {
    const zhentiCount = a.questionIds.filter((id) => {
      const q = questions.find((item) => item.id === id);
      return q?.fromZhenti || q?.origins?.includes('zhenti');
    }).length;
    return {
      id: a.id, title: a.title, grade: a.grade, author: a.author, dynasty: a.dynasty,
      origin: a.origin, source: a.source,
      reciteCount: a.recitation?.stars?.length || 0,
      questionCount: a.questionIds.length,
      zhentiCount,
      wordCount: a.wordIds.length,
    };
  }),
  counts: {
    learning: articles.length,
    recite: articles.reduce((t, a) => t + (a.recitation?.stars?.length || 0), 0),
    cards: words.length,
    globalWords: words.filter((w) => w.scope === 'global').length,
    senses: words.reduce((t, w) => t + w.meanings.length, 0),
    totalQuestions: questions.length,
    zhenti: questions.filter((q) => q.fromZhenti).length,
    collections: collections.size,
    moxieArticles: moxie.length,
    moxieQuestions: moxie.reduce((t, a) => t + a.sections.reduce((x, s) => x + (s.items?.length || 0), 0), 0),
  },
});
const runtimeMeaningRecords = words.reduce((total, word) => total + word.meanings.length, 0);
const report = {
  schemaVersion: 1,
  source: {
    articles: sourceArticles.length,
    wordMeanings: wordRecords.filter(Boolean).length,
    questions: sourceQuestionRecords,
  },
  runtime: {
    articles: articles.length,
    words: words.length,
    wordMeanings: runtimeMeaningRecords,
    questions: questions.length,
    collections: collections.size,
  },
  transformed: {
    deduplicatedWordMeanings: wordRecords.filter(Boolean).length - runtimeMeaningRecords,
    deduplicatedQuestions: rawQuestions.length - questions.length,
    invalidQuestions: invalidQuestionRecords,
  },
};
await output('build-report.json', report);
console.log(JSON.stringify(report, null, 2));
