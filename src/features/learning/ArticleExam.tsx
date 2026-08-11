/**
 * 核心考点 — 独立标签页 (学习/鉴赏/考点/默写 四 tab 之一)。
 * 中考必考/核心重点篇目显示: 考点列表, 每项可展开详情 (learning exam_points)。
 */
import { useMemo, useState } from 'react';
import type { CanonicalArticle } from '../../types';
import { examTagFor, examPoints } from '../../data/exam-tags';
import EmptyState from '../../shared/ui/EmptyState';
import './article.css';

interface ExamPoint {
  point: string;
  detail: string;
}

export default function ArticleExam({ article }: { article: CanonicalArticle }) {
  const examTag = useMemo(() => examTagFor(article.title), [article.title]);
  const examList = useMemo<ExamPoint[]>(() => {
    const rich = (article as { examPoints?: ExamPoint[] }).examPoints;
    if (rich?.length) return rich;
    return examPoints(article.title).map((p) => ({ point: p, detail: '' }));
  }, [article]);
  const [examOpen, setExamOpen] = useState<Set<number>>(() => new Set());

  if (!examTag) {
    return (
      <EmptyState
        title="本篇暂无考点标注"
        hint="非中考必考/核心重点篇目。可以继续学习课文，或切换其他标签。"
      />
    );
  }

  return (
    <div className="exam-tab view-enter">
      <section className="reader-exam-card exam-page-card">
        <div className="exam-card-head">
          <span className={`exam-card-badge ${examTag}`}>{examTag === 'must' ? '中考必考' : '中考核心'}</span>
          <span className="exam-card-title">核心考点 · 应知应会</span>
        </div>
        {examList.length ? (
          <ul className="exam-points">
            {examList.map((pt, idx) => (
              <li key={idx} className={examOpen.has(idx) ? 'open' : ''}>
                <button
                  type="button"
                  className={`ep-head${pt.detail ? ' has-detail' : ''}`}
                  onClick={() => pt.detail && setExamOpen((prev) => { const n = new Set(prev); n.has(idx) ? n.delete(idx) : n.add(idx); return n; })}
                  aria-expanded={pt.detail ? examOpen.has(idx) : undefined}
                >
                  <span className="ep-bullet">{pt.detail ? (examOpen.has(idx) ? '▾' : '▸') : '▸'}</span>
                  <span className="ep-name">{pt.point}</span>
                  {pt.detail && <span className="ep-toggle">{examOpen.has(idx) ? '收起' : '展开'}</span>}
                </button>
                {pt.detail && <p className="ep-detail">{pt.detail}</p>}
              </li>
            ))}
          </ul>
        ) : (
          <p className="ep-empty">本篇考点数据整理中,敬请期待。</p>
        )}
      </section>
    </div>
  );
}
