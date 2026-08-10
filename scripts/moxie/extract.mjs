#!/usr/bin/env node
/** VLM 逐页抽取 → ocr/moxie/raw/{main,ans}_pNNN.json
 *  用法: node scripts/moxie/extract.mjs <main|ans>
 *  特性: 并发 (MOXIE_CONCURRENCY 默认 4), 断点续跑 (已有且可解析跳过), 失败重试 1 次, failed.txt 记录
 */
import { readdirSync, readFileSync, existsSync, mkdirSync, writeFileSync, appendFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { analyzeImage, imageToDataUrl, DEFAULT_PROVIDER } from '../vision/lib.mjs';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const IMG = resolve(ROOT, 'ocr/moxie/img');
const RAW = resolve(ROOT, 'ocr/moxie/raw');
const FAILED = resolve(RAW, 'failed.txt');
mkdirSync(RAW, { recursive: true });

const role = process.argv[2];
if (!['main', 'ans'].includes(role)) { console.error('用法: node scripts/moxie/extract.mjs <main|ans>'); process.exit(1); }
const CONCURRENCY = Number(process.env.MOXIE_CONCURRENCY || 3);

const PROMPTS = {
  main: `你是古籍数据录入员。这是一本初中语文《必背文言文+古诗默写》练习册的扫描页，内容是一篇或多篇课文的默写练习。
请将这一页上的【全部】题目逐字抽取为 JSON，不得遗漏任何一题、任何一空。
注意: 一页可能包含多篇课文(如两首短诗), 每篇一个 articles 元素。
JSON 结构:
{
  "articles": [
    {
      "title": "课文标题(页面上标注的)",
      "grade": "年级学期(如 七年级上册)",
      "book_page": "页面上可见的页码数字",
      "sections": [
        { "type": "原文默写", "items": [ { "q": "题目文本, 填空处用 ___ 表示" } ] },
        { "type": "理解性默写", "items": [ { "q": "题干文本" } ] },
        { "type": "词义默写", "items": [ { "q": "词义题文本, 加点字用【】括起" } ] },
        { "type": "译文默写", "items": [ { "q": "翻译题文本" } ] }
      ]
    }
  ]
}
规则:
- 页面有几篇课文就输出几个 articles 元素, 按出现顺序
- 四种题型按页面上实际出现的顺序与分组放入 sections (可能有其他题型如 文学常识/易错识记, 也要保留为对应 type)
- 填空处统一用 ___ 表示, 一空一个 ___
- 加点/加粗/划线字用【】括起
- 选项 A/B/C/D 与中考来源标注(如(四川绵阳中考))保留
- 只输出 JSON, 不要任何解释文字`,

  ans: `你是古籍数据录入员。这是一本《必背文言文+古诗默写》练习册【答案册】的扫描页，包含多篇课文的默写答案。
请将答案按篇目分组抽取为 JSON，不得遗漏任何一条答案。
JSON 结构:
{
  "articles": [
    {
      "title": "课文标题",
      "answers": [ { "q": "与该题对应的题目特征(题型+序号或题干开头几个字)", "a": "答案文本" } ]
    }
  ]
}
规则:
- 按页面上篇目分组的实际顺序排列 articles
- q 字段写清题目归属(如 原文默写/理解性默写第2题/词义默写:水何澹澹/译文默写第1题), 便于与主书题目配对
- 多空题合并为一条 answer, 各空用 | 分隔
- 只输出 JSON, 不要任何解释文字`,
};

/** 从 VLM 文本提取 JSON (strip ```json 包裹与前后杂讯; 容错: 逐行裁剪尾部直到可解析) */
function parseJson(text) {
  let t = text.trim();
  const fence = t.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (fence) t = fence[1].trim();
  const start = t.indexOf('{');
  const end = t.lastIndexOf('}');
  if (start >= 0 && end > start) t = t.slice(start, end + 1);
  try {
    return JSON.parse(t);
  } catch {
    // 容错: 去掉尾部的非 JSON 行 (VLM 偶发在 JSON 后附加文字/截断行)
    const lines = t.split('\n');
    for (let cut = 1; cut < Math.min(8, lines.length); cut++) {
      try { return JSON.parse(lines.slice(0, lines.length - cut).join('\n')); } catch { /* 继续裁 */ }
    }
    throw new Error('JSON 解析失败');
  }
}

async function extractOne(file) {
  const name = file.replace(/\.png$/, '.json');
  const out = resolve(RAW, name);
  if (existsSync(out)) {
    try { JSON.parse(readFileSync(out, 'utf8')); return { file, ok: true, skipped: true }; }
    catch { /* 损坏则重抽 */ }
  }
  const dataUrl = imageToDataUrl(resolve(IMG, file));
  let lastErr;
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const text = await analyzeImage(dataUrl, PROMPTS[role], DEFAULT_PROVIDER);
      const parsed = parseJson(text);
      if (role === 'main' && !parsed.articles) throw new Error('缺少 articles');
      if (role === 'ans' && !parsed.articles) throw new Error('缺少 articles');
      writeFileSync(out, JSON.stringify(parsed, null, 2));
      return { file, ok: true, skipped: false };
    } catch (e) {
      lastErr = e;
      // 429 限速: 等待 60s 再重试; 其他错误 5s/10s 退避
      const wait = /429/.test(String(e?.message)) ? 60000 : 5000 * (attempt + 1);
      await new Promise((r) => setTimeout(r, wait));
    }
  }
  appendFileSync(FAILED, `${role} ${file}: ${lastErr?.message}\n`);
  return { file, ok: false, error: lastErr?.message };
}

/** 简单并发池 */
async function pool(items, worker, size) {
  let cursor = 0, done = 0, okCount = 0, failCount = 0;
  const t0 = Date.now();
  const runners = Array.from({ length: Math.min(size, items.length) }, async () => {
    while (cursor < items.length) {
      const item = items[cursor++];
      const r = await worker(item);
      done++;
      if (r.ok) okCount++; else failCount++;
      if (done % 5 === 0 || done === items.length) {
        const el = ((Date.now() - t0) / 1000 / 60).toFixed(1);
        console.log(`  [${done}/${items.length}] 成功 ${okCount} 失败 ${failCount} (${el}min)`);
      }
    }
  });
  await Promise.all(runners);
  return { okCount, failCount, minutes: ((Date.now() - t0) / 1000 / 60).toFixed(1) };
}

const files = readdirSync(IMG)
  .filter((f) => f.startsWith(`${role}_p`) && f.endsWith('.png'))
  .sort();
const limit = Number(process.env.MOXIE_LIMIT || 0);
if (limit > 0) files.length = Math.min(files.length, limit);
if (!files.length) { console.error(`没有找到 ${role}_p*.png, 先运行 convert.mjs`); process.exit(1); }

console.log(`🔍 抽取 ${role} 共 ${files.length} 页 (并发 ${CONCURRENCY}) …`);
const { okCount, failCount, minutes } = await pool(files, extractOne, CONCURRENCY);
console.log(`✅ 完成: 成功 ${okCount} / 失败 ${failCount} / 耗时 ${minutes}min`);
if (failCount > 0) console.log(`⚠️ 失败页见 ocr/moxie/raw/failed.txt, 修好后重跑本脚本续抽`);
