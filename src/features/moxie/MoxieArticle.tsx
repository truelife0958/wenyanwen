/** 默诵篇目页 (独立入口薄壳): 头部 + 共享训练主体 MoxieTrainer。
 *  主入口为关卡页默诵 tab (/articles/:id/moxie); 本页保留作旧链接/深链降级路径。 */
import { useMemo } from 'react';
import { Link, useParams } from 'react-router-dom';
import { findMoxieArticle } from '../../data/moxie';
import { g } from '../../shared/lib/game-terms';
import { findLearningArticle, articleHref } from '../../data/article-links';
import PageHeader from '../../shared/ui/PageHeader';
import MoxieTrainer from './MoxieTrainer';
import './moxie.css';

export default function MoxieArticle() {
  const { id } = useParams();
  const article = findMoxieArticle(id);

  const learning = useMemo(() => {
    if (!article) return null;
    if (article.articleId) return findLearningArticle(article.articleId);
    return findLearningArticle(article.title);
  }, [article]);

  if (!article) {
    return (
      <div className="not-found view-enter">
        <h2>未找到该默诵篇目</h2>
        <Link className="btn btn-primary" to="/moxie">返回默诵列表</Link>
      </div>
    );
  }

  return (
    <div className="moxie-article view-enter">
      <PageHeader
        backTo="/moxie"
        backLabel="← 返回默诵列表"
        title={g(article.title)}
        badge={learning ? (
          <Link className="moxie-to-learn" to={articleHref(learning)}>📖 看课文 →</Link>
        ) : undefined}
        meta={`${article.grade} · ${article.source === 'legacy-converted' ? '真题转换' : `默诵书 p${article.book_page}`} · ${article.sections.length} 题型`}
      />
      <MoxieTrainer article={article} />
    </div>
  );
}
