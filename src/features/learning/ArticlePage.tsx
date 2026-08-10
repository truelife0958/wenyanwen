import { Link, Navigate, NavLink, useParams } from 'react-router-dom';
import { useEffect } from 'react';
import ArticleReader from './ArticleReader';
import ArticleAppreciation from './ArticleAppreciation';
import { examTagFor } from '../../data/exam-tags';
import PageHeader from '../../shared/ui/PageHeader';
import { ArticlePractice } from '../practice/PracticePage';
import { useCore } from '../../data';
import EmptyState from '../../shared/ui/EmptyState';
import { articleHref, findArticleMeta, findPracticeArticle } from '../../data/article-links';
import './article-page.css';

const TABS = [
  { key: 'learn', label: '学习' },
  { key: 'appreciate', label: '鉴赏' },
  { key: 'practice', label: '练习' },
] as const;

export default function ArticlePage() {
  const { id, tab = 'learn' } = useParams();
  const core = useCore();
  const metaArticle = findArticleMeta(id);
  const article = metaArticle && core ? core.articleById.get(metaArticle.id) : undefined;

  // 记录最近学习, 供首页"继续学习"使用
  useEffect(() => {
    if (article) {
      try { localStorage.setItem('wyw_last_article', JSON.stringify({ id: article.id, title: article.title, at: Date.now() })); } catch { /* ignore */ }
    }
  }, [article]);
  if (metaArticle && !core) {
    // 全量数据加载中 (articles/words/questions 按需加载)
    return <div className="page-loader">加载中...</div>;
  }
  if (!article) {
    return (
      <div className="not-found view-enter">
        <h2>未找到该篇目</h2>
        <Link className="btn btn-primary" to="/">返回篇目列表</Link>
      </div>
    );
  }
  if (!TABS.some((item) => item.key === tab)) return <Navigate replace to={articleHref(article)} />;

  const practice = findPracticeArticle(article);
  const meta = [article.dynasty, article.author, article.grade].filter(Boolean).join(' · ');

  return (
    <div className="article-workspace view-enter">
      <PageHeader
        backTo="/"
        backLabel="← 返回篇目列表"
        title={article.title}
        badge={examTagFor(article.title) && <span className={`ac-badge ac-badge-${examTagFor(article.title)}`}>{examTagFor(article.title) === 'must' ? '中考必考' : '核心考点'}</span>}
        meta={meta}
        right={<span className="workspace-progress">三步学习</span>}
      />
      <nav className="workspace-tabs" aria-label="篇目学习功能">
        {TABS.map((item) => (
          <NavLink key={item.key} to={articleHref(article, item.key)} className={tab === item.key ? 'active' : ''}>
            {item.label}
          </NavLink>
        ))}
      </nav>
      <main className="workspace-content">
        {tab === 'learn' && <ArticleReader key={article.id || article.title} article={article} compact />}
        {tab === 'appreciate' && <ArticleAppreciation key={article.id || article.title} article={article} />}
        {tab === 'practice' && (
          practice ? (
            <ArticlePractice key={article.id || article.title} article={practice} errorHref="/errors" />
          ) : (
            <EmptyState title="本篇暂无练习" hint="可以先完成课文学习。" />
          )
        )}
      </main>
    </div>
  );
}