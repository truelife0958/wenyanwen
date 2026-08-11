/**
 * 核心考点 — 独立标签页 (学习/鉴赏/考点/注释/默写 五 tab 之一)。
 * 中考必考/核心重点篇目显示: 考点列表, 每条一张卡片 (参照鉴赏 appr-para 样式), 全展开。
 */
import { useMemo } from 'react';
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
      <div className="appr-whole">
        <h3 className="appr-title">
          核心考点 · 应知应会
          {examTag && <span className={`exam-card-badge ${examTag}`}>{examTag === 'must' ? '中考必考' : '中考核心'}</span>}
        </h3>
        <div className="appr-paras">
          {examList.map((pt, idx) => (
            <div className="appr-para" key={idx}>
              <div className="appr-orig">{pt.point}</div>
              {pt.detail && <div className="appr-ana">{pt.detail}</div>}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
