import { articleMeta, getCore } from './index';
import type { ArticleMeta } from './index';
import type { CanonicalArticle, PracticeArticle } from '../types';

/** 跨模块关联键：忽略序号、书名号、标点和括号副题。 */
export function articleKey(value: string): string {
  return String(value || '')
    .replace(/^[一二三四五六七八九十]+、/, '')
    .replace(/[《》]/g, '')
    .replace(/[（(][^）)]*[）)]/g, '')
    .replace(/[\s，,。！？；：、·_—-]/g, '')
    .toLowerCase();
}

export function findLearningArticle(idOrTitle?: string): CanonicalArticle | null {
  if (!idOrTitle) return null;
  let value = String(idOrTitle);
  try {
    value = decodeURIComponent(value);
  } catch {
    // malformed legacy URLs should fall back to the raw route segment
  }
  const exact = articleMeta.find((article) => article.id === value || article.title === value);
  if (exact) return exact as unknown as CanonicalArticle;
  const key = articleKey(value);
  return (articleMeta.find((article) => articleKey(article.title) === key) as unknown as CanonicalArticle) || null;
}

/** 按 id/title 从 meta 查找 (返回轻量元数据, 不含 reading/wordIds) */
export function findArticleMeta(idOrTitle?: string): ArticleMeta | null {
  if (!idOrTitle) return null;
  let value = String(idOrTitle);
  try {
    value = decodeURIComponent(value);
  } catch {
    // ignore
  }
  const exact = articleMeta.find((article) => article.id === value || article.title === value);
  if (exact) return exact;
  const key = articleKey(value);
  return articleMeta.find((article) => articleKey(article.title) === key) || null;
}

export function findPracticeArticle(article: Pick<CanonicalArticle, 'title'>): PracticeArticle | null {
  const core = getCore();
  if (!core) return null;
  const key = articleKey(article.title);
  const exact = core.practiceArticles.find((item) => articleKey(item.title) === key);
  if (exact) return exact;
  return (
    core.practiceArticles.find((item) => {
      const candidate = articleKey(item.title);
      return candidate.length >= 2 && (candidate.startsWith(key) || key.startsWith(candidate));
    }) || null
  );
}

export function articleHref(article: Pick<CanonicalArticle, 'id' | 'title'> | ArticleMeta, tab = 'learn'): string {
  return `/articles/${encodeURIComponent(article.id)}/${tab}`;
}
