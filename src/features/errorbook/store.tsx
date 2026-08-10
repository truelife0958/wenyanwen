import { createContext, useContext, useEffect, useMemo, useState, ReactNode } from 'react';
import { useLocation } from 'react-router-dom';
import { loadLS, saveLS } from '../../shared/lib/utils';
import { findLearningArticle } from '../../data/article-links';

export interface ErrorEntry {
  articleId?: string;
  title: string;
  qid: string;
  type: string;
  stem: string;
  answer: string;
  userAnswer?: string;
  ts: number;
}

export interface ErrorBookState {
  items: ErrorEntry[];
  addWrong: (article: string | { id?: string; title: string }, entries: Array<Omit<ErrorEntry, 'articleId' | 'title' | 'ts'>>) => void;
  removeEntry: (title: string, qid: string) => void;
  removeTitle: (title: string) => void;
  removeTitles: (titles: string[]) => void;
  clear: () => void;
  importItems: (items: ErrorEntry[]) => void;
  exportItems: () => ErrorEntry[];
  /** 按篇目分组 */
  groupByTitle: () => Map<string, ErrorEntry[]>;
}

const KEY = 'wyw_errorbook_v2';
/** 错题本容量上限 (E1: 防 localStorage 溢出) */
const MAX_ERROR_ITEMS = 600;

function readStoredItems(): ErrorEntry[] {
  const stored = loadLS<ErrorEntry[]>(KEY, []);
  if (!Array.isArray(stored)) return [];
  const migrated = stored.map((entry) => ({
    ...entry,
    articleId: entry.articleId || findLearningArticle(entry.title)?.id,
  }));
  if (migrated.some((entry, index) => entry.articleId !== stored[index]?.articleId)) saveLS(KEY, migrated);
  return migrated;
}

/**
 * Context 单例: 挂到 globalThis, 跨 Vite HMR 模块实例共享同一个 Context 对象,
 * 避免多次热更新后 Provider 与 useErrorBook 引用不同实例导致失配。
 */
const GLOBAL_CTX_KEY = '__WYW_ERRORBOOK_CTX__';
const g = globalThis as Record<string, unknown>;
const Ctx: React.Context<ErrorBookState | null> =
  (g[GLOBAL_CTX_KEY] as React.Context<ErrorBookState | null> | undefined) ||
  createContext<ErrorBookState | null>(null);
g[GLOBAL_CTX_KEY] = Ctx;

export function ErrorBookProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<ErrorEntry[]>(readStoredItems);

  // 监听一次 (跨 Tab 同步), 不依赖路由路径 (M3)
  useEffect(() => {
    const sync = () => {
      const next = readStoredItems();
      setItems((current) => (JSON.stringify(current) === JSON.stringify(next) ? current : next));
    };
    sync();
    window.addEventListener('storage', sync);
    return () => window.removeEventListener('storage', sync);
  }, []);

  const save = (next: ErrorEntry[]) => {
    setItems(next);
    saveLS(KEY, next);
  };

  /** 函数式更新: 基于最新 items 变更并持久化 (消除闭包竞态, 多 Tab 经 storage 事件同步后合并) */
  const mutate = (fn: (prev: ErrorEntry[]) => ErrorEntry[]) => {
    setItems((prev) => {
      let next = fn(prev);
      // 容量保护: 错题本上限 600 条 (E1), 超出保留最新, 防 localStorage 溢出
      if (next.length > MAX_ERROR_ITEMS) next = next.slice(-MAX_ERROR_ITEMS);
      if (next !== prev) saveLS(KEY, next);
      return next;
    });
  };

  const value = useMemo<ErrorBookState>(
    () => ({
      items,
      addWrong: (article, entries) => {
        const title = typeof article === 'string' ? article : article.title;
        const articleId = typeof article === 'string' ? findLearningArticle(article)?.id : article.id;
        const stamped: ErrorEntry[] = entries
          .filter((e) => e.qid)
          .map((e) => ({ ...e, title, articleId, ts: Date.now() }));
        if (!stamped.length) return;
        mutate((prev) => {
          const existing = new Set(prev.map((e) => e.qid)); // qid 全局唯一 (E2)
          const fresh = stamped.filter((e) => !existing.has(`${e.articleId || e.title}:${e.qid}`));
          return fresh.length ? [...prev, ...fresh] : prev;
        });
      },
      removeEntry: (title, qid) => {
        mutate((prev) => prev.filter((e) => !(e.title === title && e.qid === qid)));
      },
      removeTitle: (title) => {
        mutate((prev) => prev.filter((e) => e.title !== title));
      },
      removeTitles: (titles) => {
        const selected = new Set(titles);
        mutate((prev) => prev.filter((e) => !selected.has(e.title)));
      },
      clear: () => mutate(() => []),
      importItems: (incoming) => {
        const clean = incoming
          .filter((e) => e && e.qid)
          .map((e) => ({ ...e, articleId: e.articleId || findLearningArticle(e.title)?.id, ts: e.ts || Date.now() }))
          .slice(0, 2000);
        mutate((prev) => {
          const existing = new Set(prev.map((e) => e.qid)); // qid 全局唯一 (E2)
          const fresh = clean.filter((e) => !existing.has(`${e.articleId || e.title}:${e.qid}`));
          return fresh.length ? [...prev, ...fresh] : prev;
        });
      },
      exportItems: () => items,
      groupByTitle: () => {
        const m = new Map<string, ErrorEntry[]>();
        items.forEach((e) => {
          if (!m.has(e.title)) m.set(e.title, []);
          m.get(e.title)!.push(e);
        });
        return m;
      },
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [items]
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

/**
 * 无 Provider 时的兜底存储: 避免 HMR 双实例 / SSR 直接渲染导致崩溃。
 * 正常应用流(ErrorBookProvider 包裹)行为不变。
 */
const NOOP_STORE: ErrorBookState = {
  items: [],
  addWrong: () => {},
  removeEntry: () => {},
  removeTitle: () => {},
  removeTitles: () => {},
  clear: () => {},
  importItems: () => {},
  exportItems: () => [],
  groupByTitle: () => new Map(),
};

let warnedOnce = false;
export function useErrorBook(): ErrorBookState {
  const ctx = useContext(Ctx);
  if (!ctx) {
    if (import.meta.env.DEV && !warnedOnce) {
      warnedOnce = true;
      console.warn('[errorbook] useErrorBook 在 Provider 外使用, 返回空存储 (仅提示一次)');
    }
    return NOOP_STORE;
  }
  return ctx;
}
