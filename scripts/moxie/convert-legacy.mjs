#!/usr/bin/env node
/** 旧非默写数据 AI 转换 → 固定 4 步题型 → src/data/raw/moxie-legacy.json
 *  用法: node scripts/moxie/convert-legacy.mjs
 *  输入: practice.json / zhenti.json / zhenti_web.json (按篇聚合)
 *  特性: 并发 (MOXIE_CONCURRENCY), 断点续跑 (ocr/moxie/legacy/*.json), 转换报告
 */
import { readdirSync, readFileSync, existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { DEFAULT_PROVIDER } from '../vision/lib.mjs';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const RAW = resolve(ROOT, 'src/data/raw');
const OUT_DIR = resolve(ROOT, 'ocr/moxie/legacy');
mkdirSync(OUT_DIR, { recursive: true });
const CONCURRENCY = Number(process.env.MOXIE_CONCURRENCY || 4);

const read = (name) => JSON.parse(readFileSync(resolve(RAW, name), 'utf8'));

/** 按篇聚合旧题 */
function buildBatches() {
  const batches = new Map(); // title → { title, grade, questions: [] }
  const push = (title, grade, q) => {
    const key = String(title || '').trim();
    if (!key) return;
    if (!batches.has(key)) batches.set(key, { title: key, grade: grade || '', questions: [] });
    batches.get(key).questions.push(q);
  };
  for (const art of read('practice.json')) {
    for (const q of art.questions || []) push(art.title, art.grade, { src: 'practice', ...q });
  }
  for (const z of read('zhenti.json')) push(z.title, z.grade || '', { src: 'zhenti', ...z });
  for (const z of read('zhenti_web.json')) push(z.title, '', { src: 'zhenti_web', ...z });
  const hw = read('handwritten.json');
  for (const cat of ['passage', 'extra', 'exam']) {
    for (const q of hw[cat] || []) push(q.title, q.grade || '', { src: `handwritten:${cat}`, ...q });
  }
  return batches;
}

const PROMPT = (batch) => `你是语文试题归类专家。以下是某篇课文的旧版练习题（来自一文一练/中考真题/手写题），请将每道题归类或改写为【默写题】的固定 4 步题型，输出 JSON。

输入题目:
${JSON.stringify(batch.questions, null, 1).slice(0, 12000)}

输出 JSON 结构:
{
  "title": "${batch.title}",
  "sections": [
    { "type": "原文默写", "items": [ { "q": "挖空题目(原文句子,空处___), 多空用多个___", "answers": ["各空答案"] } ] },
    { "type": "理解性默写", "items": [ { "q": "题干(带____填空), 保留中考来源标注", "answers": ["答案"] } ] },
    { "type": "词义默写", "items": [ { "q": "加点字题, 加点字用【】括起, 形如 1.某【字】词: ___", "answers": ["释义"] } ] },
    { "type": "译文默写", "items": [ { "q": "翻译题, 原文句子 + 译文: ___", "answers": ["译文"] } ] }
  ]
}

归类规则:
- 填空/默写类题 → 理解性默写 (题干保留)
- 加点词/词义解释 → 词义默写
- 翻译句子 → 译文默写
- 内容理解/写法/选择/简答 → 若含明确"表现…的句子是…"等可默写形式则改写为理解性默写; 否则丢弃
- 断句/标点/开放题 → 丢弃
- 原文本身 → 原文默写(整篇挖空, 约8-14空, 按原文句序)
- 只有 items 非空才保留该 section; 全无可丢则输出空 sections
- 答案用多空 | 分隔, 每题 answers 为数组
- 只输出 JSON`;

function parseJson(text) {
  let t = text.trim();
  const fence = t.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (fence) t = fence[1].trim();
  const start = t.indexOf('{');
  const end = t.lastIndexOf('}');
  if (start >= 0 && end > start) t = t.slice(start, end + 1);
  return JSON.parse(t);
}

function slug(title) {
  return String(title || '').replace(/[^a-z0-9\u4e00-\u9fff]/gi, '-').replace(/^-+|-+$/g, '') || 'untitled';
}

async function convertOne(batch) {
  const out = resolve(OUT_DIR, `${slug(batch.title)}.json`);
  if (existsSync(out)) {
    try { JSON.parse(readFileSync(out, 'utf8')); return { title: batch.title, ok: true, skipped: true, stats: null }; }
    catch { /* 损坏重抽 */ }
  }
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      // VLM 文本接口: 转成 data URL 不必要, 直接 analyzeImage 的文本版不可用 → 用 fetch 文本 chat
      const text = await chatText(PROMPT(batch));
      const parsed = parseJson(text);
      writeFileSync(out, JSON.stringify(parsed, null, 2));
      const total = (parsed.sections || []).reduce((t, s) => t + (s.items || []).length, 0);
      return { title: batch.title, ok: true, skipped: false, stats: { sections: (parsed.sections || []).map((s) => s.type), total } };
    } catch (e) {
      await new Promise((r) => setTimeout(r, 3000 * (attempt + 1)));
      if (attempt === 1) return { title: batch.title, ok: false, error: e.message };
    }
  }
}

/** 纯文本 chat 调用 (旧数据转换不需要图像) */
async function chatText(prompt) {
  const res = await fetch(`${DEFAULT_PROVIDER.baseUrl}/chat/completions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${DEFAULT_PROVIDER.apiKey}` },
    body: JSON.stringify({ model: DEFAULT_PROVIDER.model, messages: [{ role: 'user', content: prompt }], max_tokens: 8000 }),
  });
  if (!res.ok) throw new Error(`chat ${res.status}: ${(await res.text()).slice(0, 200)}`);
  const data = await res.json();
  const text = data?.choices?.[0]?.message?.content || '';
  if (!text) throw new Error('空响应');
  return text;
}

async function pool(items, worker, size) {
  let cursor = 0, done = 0, okCount = 0, failCount = 0, dropped = 0, kept = 0;
  const t0 = Date.now();
  const runners = Array.from({ length: Math.min(size, items.length) }, async () => {
    while (cursor < items.length) {
      const item = items[cursor++];
      const r = await worker(item);
      done++;
      if (r.ok) { okCount++; kept += r.stats?.total || 0; }
      else { failCount++; }
      if (done % 10 === 0 || done === items.length) {
        console.log(`  [${done}/${items.length}] 成功 ${okCount} 失败 ${failCount} 累计题数 ${kept} (${((Date.now() - t0) / 60000).toFixed(1)}min)`);
      }
    }
  });
  await Promise.all(runners);
  return { okCount, failCount, kept, minutes: ((Date.now() - t0) / 60000).toFixed(1) };
}

const batches = buildBatches();
console.log(`🔍 旧数据转换: ${batches.size} 篇 (并发 ${CONCURRENCY}) …`);
const { okCount, failCount, kept, minutes } = await pool([...batches.values()], convertOne, CONCURRENCY);
console.log(`✅ 转换完成: 成功 ${okCount} / 失败 ${failCount} / 产出题数 ${kept} / ${minutes}min`);

// 汇总 → moxie-legacy.json
const merged = [];
for (const f of readdirSync(OUT_DIR).filter((f) => f.endsWith('.json')).sort()) {
  try {
    const d = JSON.parse(readFileSync(resolve(OUT_DIR, f), 'utf8'));
    merged.push({ id: `moxie-${slug(d.title)}`, title: d.title, grade: '', book_page: 0, source: 'legacy-converted', articleId: null, sections: d.sections || [] });
  } catch { console.warn('跳过损坏:', f); }
}
writeFileSync(resolve(RAW, 'moxie-legacy.json'), JSON.stringify(merged, null, 2));
console.log(`✅ src/data/raw/moxie-legacy.json: ${merged.length} 篇`);
