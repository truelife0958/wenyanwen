/** 默写模块数据层: 加载 runtime/moxie.json + 进度/查询工具 */
import moxieRaw from './runtime/moxie.json';
import type { MoxieArticle, MoxieSection, MoxieItem } from '../types';
import { articleKey } from './article-links';

export const moxieArticles = moxieRaw as MoxieArticle[];

export const moxieCount = moxieArticles.length;

/** 各题型统计 */
export function moxieSectionStats() {
  const stats: Record<string, number> = {};
  for (const art of moxieArticles) {
    for (const s of art.sections) stats[s.type] = (stats[s.type] || 0) + (s.items?.length || 0);
  }
  return stats;
}

/** 按标题查找默写篇目 (归一化, 支持带书名号/序号) */
export function findMoxieArticle(idOrTitle?: string): MoxieArticle | null {
  if (!idOrTitle) return null;
  const value = String(idOrTitle);
  const exact = moxieArticles.find((a) => a.id === value || a.title === value);
  if (exact) return exact;
  const key = articleKey(value);
  return moxieArticles.find((a) => articleKey(a.title) === key) || null;
}

/** 按学习 articleId 查找默写篇目 (学练联动: 学习页 → 默写) */
export function findMoxieByArticleId(articleId?: string | null): MoxieArticle | null {
  if (!articleId) return null;
  return moxieArticles.find((a) => a.articleId === articleId) || null;
}

/** 学习篇目标题 → 默写篇目 (标题匹配兜底) */
export function findMoxieByArticleTitle(title?: string): MoxieArticle | null {
  if (!title) return null;
  const key = articleKey(title);
  return moxieArticles.find((a) => articleKey(a.title) === key) || null;
}

/** 展开某篇全部题目 */
export function flattenItems(article: MoxieArticle): Array<{ section: MoxieSection; item: MoxieItem }> {
  const out: Array<{ section: MoxieSection; item: MoxieItem }> = [];
  for (const s of article.sections) {
    for (const it of s.items || []) out.push({ section: s, item: it });
  }
  return out;
}

/** ===== 进度存储 (localStorage) ===== */
export const MOXIE_PROGRESS_KEY = 'wyw_moxie_progress_v1';

export interface MoxieProgressEntry {
  qid: string;
  pass: boolean;
  ts: number;
}

export function loadMoxieProgress(): Record<string, MoxieProgressEntry> {
  try {
    const raw = localStorage.getItem(MOXIE_PROGRESS_KEY);
    return raw ? (JSON.parse(raw) as Record<string, MoxieProgressEntry>) : {};
  } catch {
    return {};
  }
}

export function saveMoxieResult(qid: string, pass: boolean) {
  try {
    const all = loadMoxieProgress();
    all[qid] = { qid, pass, ts: Date.now() };
    localStorage.setItem(MOXIE_PROGRESS_KEY, JSON.stringify(all));
  } catch { /* localStorage 满则忽略 */ }
}

/** 篇目完成度: 已答(首次) / 全对 */
export function articleProgress(article: MoxieArticle): { done: number; total: number; passed: number } {
  const all = flattenItems(article);
  const prog = loadMoxieProgress();
  let done = 0, passed = 0;
  for (const { item } of all) {
    const e = prog[item.qid];
    if (e) { done++; if (e.pass) passed++; }
  }
  return { done, total: all.length, passed };
}
