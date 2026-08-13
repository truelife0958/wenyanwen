/** /moxie/:id 旧链接重定向 → 关卡页默诵 tab。
 *  懒加载组件: import data/moxie 打进独立 chunk, 避免首屏拉入 moxie.json (性能红线)。 */
import { Navigate, useParams } from 'react-router-dom';
import { findMoxieArticle } from '../../data/moxie';
import { findArticleMeta, articleHref } from '../../data/article-links';

export default function MoxieRedirect() {
  const { id } = useParams();
  const article = findMoxieArticle(id);
  const target = article
    ? (article.articleId ? findArticleMeta(article.articleId) : findArticleMeta(article.title))
    : null;
  if (!article || !target) return <Navigate replace to="/moxie" />;
  return <Navigate replace to={articleHref(target, 'moxie')} />;
}
