/** 规范化数据访问层。页面只读取 runtime/*.json，不直接消费 OCR/raw 字段。
 *  加载策略: 轻量 article-meta.json + collections.json 静态导入(首屏);
 *  articles/words/questions 全量数据按需 loadCore() 动态加载 (练习/字词/学习页进入时)。 */
import { useEffect, useState } from 'react';
import metaRaw from './runtime/article-meta.json';
import collectionRaw from './runtime/collections.json';
import { normGrade } from '../shared/lib/utils';
import type {
  CanonicalArticle,
  CanonicalCollection,
  CanonicalQuestion,
  CanonicalWord,
  GlossaryChar,
  PracticeArticle,
  PracticeQuestion,
  ZhentiItem,
} from '../types';

// ===== 静态轻量数据 (首屏) =====
export interface ArticleMeta {
  id: string;
  title: string;
  grade: string;
  author: string;
  dynasty: string;
  origin?: string;
  source?: string;
  reciteCount: number;
  questionCount: number;
  zhentiCount: number;
  wordCount: number;
}

export const articleMeta = metaRaw.articles as ArticleMeta[];
export const counts = metaRaw.counts as {
  learning: number; recite: number; cards: number; globalWords: number;
  senses: number; totalQuestions: number; zhenti: number; collections: number;
};
export const collections = collectionRaw as CanonicalCollection[];

/** 全量核心数据 (articles/words/questions + 全部派生) */
export interface Core {
  learningArticles: CanonicalArticle[];
  words: CanonicalWord[];
  questions: CanonicalQuestion[];
  articleById: Map<string, CanonicalArticle>;
  wordById: Map<string, CanonicalWord>;
  questionById: Map<string, CanonicalQuestion>;
  collectionById: Map<string, CanonicalCollection>;
  practiceArticles: PracticeArticle[];
  practiceCollections: PracticeArticle[];
  zhentiItems: ZhentiItem[];
  glossaryShici: GlossaryChar[];
  glossaryXuci: GlossaryChar[];
  globalWords: CanonicalWord[];
  articleWordsOf: (articleId: string) => CanonicalWord[];
}

let coreState: Core | null = null;
let corePromise: Promise<Core> | null = null;

export function getCore(): Core | null {
  return coreState;
}

/** 惰性加载全量数据 (结果缓存) */
export function loadCore(): Promise<Core> {
  if (coreState) return Promise.resolve(coreState);
  if (!corePromise) {
    corePromise = Promise.all([
      import('./runtime/articles.json'),
      import('./runtime/words.json'),
      import('./runtime/questions.json'),
    ]).then(([articleRaw, wordRaw, questionRaw]) => {
      // Vite 动态 import JSON 返回 { default: data } 命名空间
      const unwrap = <T,>(m: unknown): T => (m as { default: T }).default ?? (m as T);
      const learningArticles = unwrap<CanonicalArticle[]>(articleRaw);
      const words = unwrap<CanonicalWord[]>(wordRaw);
      const questions = unwrap<CanonicalQuestion[]>(questionRaw);
      const articleById = new Map(learningArticles.map((article) => [article.id, article]));
      const wordById = new Map(words.map((word) => [word.id, word]));
      const questionById = new Map(questions.map((question) => [question.id, question]));
      const collectionById = new Map(collections.map((collection) => [collection.id, collection]));
      const isQuestion = (q: unknown): q is CanonicalQuestion => Boolean(q);
      const toPracticeQuestion = (question: CanonicalQuestion): PracticeQuestion => ({
        id: question.id,
        type: question.type,
        stem: question.stem,
        answer: question.answer,
        options: question.options,
        answerNote: question.answerNote,
        explanation: question.explanation,
        key_points: question.key_points,
        province: question.province,
        year: question.year,
        source: question.source || question.origin,
        material: question.material,
        fromZhenti: question.fromZhenti || question.origin === 'zhenti' || (question.origins || []).includes('zhenti'),
        origin: question.origin,
        origins: question.origins,
        scope: question.scope,
        articleId: question.articleId,
        collectionId: question.collectionId,
      } as PracticeQuestion);
      const practiceArticles: PracticeArticle[] = learningArticles
        .filter((article) => article.questionIds.length > 0)
        .map((article) => ({
          id: article.id,
          title: article.title,
          author: article.author,
          dynasty: article.dynasty,
          grade: normGrade(article.grade),
          original_text: article.reading.original,
          translation: article.reading.translation,
          kind: 'yiwuyilian' as const,
          questions: article.questionIds.map((id) => questionById.get(id)).filter(isQuestion).map(toPracticeQuestion),
          zhentiCount: article.questionIds.filter((id) => questionById.get(id)?.fromZhenti).length,
        }));
      const practiceCollections: PracticeArticle[] = collections.map((collection) => ({
        id: collection.id,
        title: collection.title,
        grade: collection.grade,
        kind: 'zhenti' as const,
        questions: collection.questionIds.map((id) => questionById.get(id)).filter(isQuestion).map(toPracticeQuestion),
        zhentiCount: 0,
      }));
      const zhentiItems: ZhentiItem[] = questions
        .filter((question) => question.fromZhenti)
        .map((question) => ({
          id: question.id,
          page: 0,
          title: articleById.get(question.articleId || '')?.title || collectionById.get(question.collectionId || '')?.title || '',
          articleId: question.articleId || '',
          articleTitle: articleById.get(question.articleId || '')?.title || '',
          province: question.province || '',
          stem: question.stem,
          answer: Array.isArray(question.answer) ? question.answer.join('；') : String(question.answer || ''),
          source: (question.source === 'jiaocai' ? 'jiaocai' : 'web') as 'jiaocai' | 'web',
          year: question.year || undefined,
          material: question.material,
          type: question.type as ZhentiItem['type'],
          analysis: question.explanation,
          qid: question.id,
        }));
      const globalWords = words.filter((w) => w.scope === 'global');
      const glossaryShici: GlossaryChar[] = globalWords.map((w) => ({
        char: w.word,
        kind: '实词',
        senses: w.meanings.map((m) => ({ sense: m.text, example: m.example, origin: m.origin })),
      }));
      const glossaryXuci: GlossaryChar[] = globalWords.map((w) => ({
        char: w.word,
        kind: '虚词',
        senses: w.meanings.map((m) => ({ sense: m.text, example: m.example, origin: m.origin })),
      }));
      const articleWordsOf = (articleId: string): CanonicalWord[] => {
        const article = articleById.get(articleId);
        return (article?.wordIds || []).map((id) => wordById.get(id)).filter(Boolean) as CanonicalWord[];
      };
      coreState = {
        learningArticles, words, questions, articleById, wordById, questionById, collectionById,
        practiceArticles, practiceCollections, zhentiItems, glossaryShici, glossaryXuci,
        globalWords, articleWordsOf,
      };
      return coreState;
    });
  }
  return corePromise;
}

/** React hook: 组件内使用全量数据 (core 就绪前返回 null) */
export function useCore(): Core | null {
  const [core, setCore] = useState<Core | null>(() => getCore());
  useEffect(() => {
    let alive = true;
    loadCore().then((c) => { if (alive) setCore(c); });
    return () => { alive = false; };
  }, []);
  return core;
}

/** 标题去重键：去序号前缀、书名号。 */
export function normDedupTitle(title: string): string {
  return String(title || '')
    .replace(/^[一二三四五六七八九十]+、/, '')
    .replace(/《|》/g, '')
    .trim();
}

/** 更宽松的匹配键：再去掉括号副题和标点。 */
export function baseTitleKey(title: string): string {
  return normDedupTitle(title)
    .replace(/[（(][^）)]*[）)]/g, '')
    .replace(/[\s，,。！？；：、·_—-]/g, '')
    .trim()
    .toLowerCase();
}
/** 年级顺序 (首页分组) */
export const GRADE_ORDER = ['七上', '七下', '八上', '八下', '九上', '九下', '附录'] as const;

/** 按年级分组 (基于 meta) */
export function groupByGrade(list: ArticleMeta[]): Map<string, ArticleMeta[]> {
  const groups = new Map<string, ArticleMeta[]>();
  for (const item of list) {
    const key = item.grade || '附录';
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(item);
  }
  return groups;
}
