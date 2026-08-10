#!/usr/bin/env node
/** 内容深化: 补全 learning.json 缺失的文学文化字段 (authorIntro/background)
 *  用法: node scripts/moxie/enrich-learning.mjs
 *  特性: 断点续跑 (ocr/moxie/enrich/*.json), 仅补空字段, 不影响已有内容
 */
import { readFileSync, existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { DEFAULT_PROVIDER } from '../vision/lib.mjs';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const LEARNING = resolve(ROOT, 'src/data/raw/learning.json');
const OUT_DIR = resolve(ROOT, 'ocr/moxie/enrich');
mkdirSync(OUT_DIR, { recursive: true });

const articles = JSON.parse(readFileSync(LEARNING, 'utf8'));

const PROMPT = (a, missing) => `你是初中语文教材专家。请为下面这篇课文补写缺失的文学文化信息，输出 JSON。

课文: ${a.title} (${a.dynasty || ''} ${a.author || ''})
出处: ${a.origin || ''}
缺失字段: ${missing.join(', ')}

已有信息(参考, 不要重复):
- 作者简介: ${a.literary_culture?.author_intro || '（无）'}
- 创作背景: ${a.literary_culture?.background || '（无）'}
- 主题思想: ${a.theme_idea || ''}

输出 JSON 结构(只输出存在的字段):
${missing.includes('author_intro') ? '{ "author_intro": "作者简介(80-150字, 含字号/朝代/成就/地位)" }' : ''}
${missing.includes('background') ? '{ "background": "创作背景(80-200字, 交代写作时间/缘由/背景事件)" }' : ''}

规则:
- 内容须准确符合教材常识, 语言精炼
- 只输出 JSON, 不要解释`;

function parseJson(text) {
  let t = text.trim();
  const fence = t.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (fence) t = fence[1].trim();
  const start = t.indexOf('{');
  const end = t.lastIndexOf('}');
  if (start >= 0 && end > start) t = t.slice(start, end + 1);
  return JSON.parse(t);
}

async function chatText(prompt) {
  const res = await fetch(`${DEFAULT_PROVIDER.baseUrl}/chat/completions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${DEFAULT_PROVIDER.apiKey}` },
    body: JSON.stringify({ model: DEFAULT_PROVIDER.model, messages: [{ role: 'user', content: prompt }], max_tokens: 2000 }),
  });
  if (!res.ok) throw new Error(`chat ${res.status}`);
  const data = await res.json();
  const text = data?.choices?.[0]?.message?.content || '';
  if (!text) throw new Error('空响应');
  return text;
}

let updated = 0, skipped = 0, failed = 0;
for (const a of articles) {
  const lc = a.literary_culture || (a.literary_culture = {});
  const missing = [];
  if (!lc.author_intro) missing.push('author_intro');
  if (!lc.background) missing.push('background');
  if (!missing.length) { skipped++; continue; }

  const cache = resolve(OUT_DIR, `${a.id}.json`);
  let patch;
  if (existsSync(cache)) {
    try { patch = JSON.parse(readFileSync(cache, 'utf8')); } catch { /* 损坏重抽 */ }
  }
  if (!patch) {
    try {
      patch = parseJson(await chatText(PROMPT(a, missing)));
      writeFileSync(cache, JSON.stringify(patch, null, 2));
    } catch (e) {
      console.warn(`✗ ${a.title}: ${e.message}`);
      failed++;
      continue;
    }
  }
  if (patch.author_intro && !lc.author_intro) lc.author_intro = patch.author_intro;
  if (patch.background && !lc.background) lc.background = patch.background;
  updated++;
}

writeFileSync(LEARNING, JSON.stringify(articles, null, 2));
console.log(`✅ learning.json 补全完成: 更新 ${updated} / 跳过 ${skipped} / 失败 ${failed}`);
