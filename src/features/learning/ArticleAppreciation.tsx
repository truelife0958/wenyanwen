/**
 * 本篇鉴赏 — 独立标签页 (学习/鉴赏/练习 三 tab 之一)。
 * 逐段: 原文 + 译文对照 + 段落赏析; 底部: 整篇主旨/结构/写法/文化背景。
 */
import { useMemo } from 'react';
import type { CanonicalArticle } from '../../types';
import { alignLines } from '../../shared/lib/utils';
import ArticleAnalysis from './ArticleAnalysis';
import './article.css';

interface ApprRow {
  orig: string;
  trans: string;
  analysis: string;
  number?: string;
}

export default function ArticleAppreciation({ article }: { article: CanonicalArticle }) {
  const original = article.reading.original;
  const rows = useMemo<ApprRow[]>(() => {
    const source = article.reading.paragraphs || [];
    const originals = source.map((row) => {
      if (typeof row.start === 'number' && typeof row.end === 'number') return original.slice(row.start, row.end);
      return row.fallbackText || '';
    });
    const aligned = alignLines(originals.join('\n'), article.reading.translation);
    let list = source
      .map((row, index) => ({
        orig: originals[index],
        trans: row.translation || aligned[index]?.trans || '',
        analysis: row.analysis || '',
        number: row.number,
      }))
      .filter((row) => row.orig || row.analysis);
    // 分句均匀化: 丢弃完全重复段, 合并残句
    const merged: ApprRow[] = [];
    const seen = new Set<string>();
    for (const row of list) {
      const key = row.orig.trim();
      if (!key || seen.has(key)) continue;
      seen.add(key);
      if (merged.length) {
        const prev = merged[merged.length - 1];
        if (!prev.analysis && !row.analysis && /[,;，；：:]$/.test(prev.orig.trim())) {
          prev.orig = prev.orig + row.orig;
          prev.trans = (prev.trans + row.trans).trim();
          continue;
        }
      }
      merged.push({ ...row });
    }
    return merged;
  }, [article.reading.paragraphs, article.reading.translation, original]);

  return (
    <div className="appreciation-tab view-enter">
      {/* 逐段: 原文 + 译文对照 + 段落赏析 */}
      {rows.length > 0 && (
        <section className="appr-paras">
          <h3 className="appr-title">逐段赏析</h3>
          {rows.map((row, index) => (
            <div className="appr-para" key={index}>
              {row.number && <span className="appr-num">{row.number}</span>}
              <div className="appr-orig">{row.orig}</div>
              {row.trans && <div className="appr-trans">{row.trans}</div>}
              {row.analysis && <div className="appr-ana">{row.analysis}</div>}
            </div>
          ))}
        </section>
      )}

      {/* 整篇鉴赏: 主旨/结构/写法/文化 */}
      <section className="appr-whole">
        <h3 className="appr-title">整篇鉴赏</h3>
        <ArticleAnalysis article={article} />
      </section>
    </div>
  );
}
