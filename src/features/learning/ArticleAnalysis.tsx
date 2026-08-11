/**
 * 本篇鉴赏 — 独立标签页,从 ArticleReader 右侧面板提取为完整页面。
 * 包含主旨、结构、写法、文化背景四大模块。
 */
import { useMemo } from 'react';
import { splitNumbered } from '../../shared/lib/utils';
import type { CanonicalArticle } from '../../types';

interface Props {
  article: CanonicalArticle;
}

export default function ArticleAnalysis({ article }: Props) {
  const { analysis } = article;
  const culture = analysis.culture;
  const hasCulture = useMemo(
    () => Boolean(culture.text || culture.authorIntro || culture.background || culture.theme),
    [culture]
  );

  return (
    <div className="analysis-tab view-enter">
      <section className="analysis-tab-intro">
        <p className="analysis-tab-sub">
          《{article.title}》· {[article.dynasty, article.author].filter(Boolean).join(' ')}
        </p>
      </section>

      {analysis.theme && (
        <section className="appr-para analysis-card">
          <h3 className="appr-orig analysis-card-title">
            <span className="act-icon">🎯</span> 主旨
          </h3>
          <div className="appr-ana analysis-card-body">
            <p>{analysis.theme}</p>
          </div>
        </section>
      )}

      {analysis.writing && (
        <section className="appr-para analysis-card">
          <h3 className="appr-orig analysis-card-title">
            <span className="act-icon">✏️</span> 写法
          </h3>
          <div className="appr-ana analysis-card-body">
            {splitNumbered(analysis.writing).map((seg, i) => (
              <p className="analysis-writing-item" key={i}>{seg}</p>
            ))}
          </div>
        </section>
      )}

      {analysis.outline && (
        <section className="appr-para analysis-card">
          <h3 className="appr-orig analysis-card-title">
            <span className="act-icon">📐</span> 结构
          </h3>
          <div className="appr-ana analysis-card-body">
            <p className="analysis-outline">{analysis.outline}</p>
          </div>
        </section>
      )}


      {hasCulture && (
        <section className="appr-para analysis-card analysis-card-culture">
          <h3 className="appr-orig analysis-card-title">
            <span className="act-icon">📚</span> 文化背景
          </h3>
          <div className="appr-ana analysis-card-body">
            {culture.authorIntro && (
              <div className="ac-culture-row">
                <span className="ac-culture-label">作者</span>
                <p>{culture.authorIntro}</p>
              </div>
            )}
            {culture.background && (
              <div className="ac-culture-row">
                <span className="ac-culture-label">背景</span>
                <p>{culture.background}</p>
              </div>
            )}
            {culture.theme && (
              <div className="ac-culture-row">
                <span className="ac-culture-label">主题</span>
                <p>{culture.theme}</p>
              </div>
            )}
            {culture.text && (
              <div className="ac-culture-row">
                <span className="ac-culture-label">常识</span>
                <p>{culture.text}</p>
              </div>
            )}
          </div>
        </section>
      )}

      {!analysis.theme && !analysis.outline && !analysis.writing && !hasCulture && (
        <div className="module-empty">
          <strong>本篇暂无鉴赏内容</strong>
          <span>鉴赏数据正在整理中。</span>
        </div>
      )}
    </div>
  );
}