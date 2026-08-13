/**
 * 本篇鉴赏 — 独立标签页 (历练/鉴赏/练习 三 tab 之一)。
 * 逐段: 原文 + 译文对照 + 段落赏析; 底部: 整篇主旨/结构/写法/文化背景。
 */
import { useMemo } from 'react';
import type { CanonicalArticle } from '../../types';
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
  return (
    <div className="appreciation-tab view-enter">
      {/* 整篇鉴赏: 主旨/结构/写法/文化 (逐段赏析已并入原文阅读区 "查看赏析") */}
      <section className="appr-whole">
        <h3 className="appr-title">整篇鉴赏</h3>
        <ArticleAnalysis article={article} />
      </section>
    </div>
  );
}
