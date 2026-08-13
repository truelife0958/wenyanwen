/**
 * 核心考点 — 独立标签页 (历练/鉴赏/考点/注释/默诵 五 tab 之一)。
 * 中考必考/核心重点篇目显示: 考点列表, 每条一张卡片 (参照鉴赏 appr-para 样式), 全展开。
 */
import { useMemo } from 'react';
import type { CanonicalArticle } from '../../types';
import { examTagFor, examPoints } from '../../data/exam-tags';
import { g } from '../../shared/lib/game-terms';
import EmptyState from '../../shared/ui/EmptyState';
import HighlightText from '../../shared/ui/HighlightText';
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
        hint="非中考必考/核心重点篇目。可以继续历练课文，或切换其他标签。"
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
          {examList.map((pt, idx) => {
            const isHard = /易|勿|注意|切忌|区别|比较|相反|陷阱|辨析/.test(pt.detail || '');
            return (
              <div className="appr-para" key={idx}>
                <div className="appr-orig ep-point-row">
                  <span>{g(pt.point)}</span>
                  <span className={`ep-level${isHard ? ' hard' : ''}`}>{isHard ? '难点' : '重点'}</span>
                </div>
                {pt.detail && (
                  <div className="appr-ana">
                    <HighlightText text={g(pt.detail)} numbered={pt.point.includes('默写')} />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
