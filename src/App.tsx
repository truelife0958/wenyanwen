import { lazy, Suspense } from 'react';
import { useEffect } from 'react';
import { Navigate, Route, Routes, useNavigate } from 'react-router-dom';
import Home from './features/home/Home';
import TabBar from './features/home/TabBar';
// Flashcards 懒加载 (仅访问 /cards 时加载, 减小首屏)
const Flashcards = lazy(() => import('./features/cards/Flashcards'));
import ErrorBoundary from './shared/ui/ErrorBoundary';
import { ErrorBookProvider } from './features/errorbook/store';
import { counts, loadCore } from './data';
import { articleHref, findLearningArticle } from './data/article-links';
import { useParams } from 'react-router-dom';

const ArticlePage = lazy(() => import('./features/learning/ArticlePage'));
const ErrorBookPage = lazy(() => import('./features/errorbook/ErrorBookPage'));

/** 旧版路由 #/learning/:title、#/practice/:title → 新篇目工作区 */
function LegacyArticleRedirect({ tab }: { tab: 'learn' | 'practice' }) {
  const { title } = useParams();
  const target = title ? findLearningArticle(title) : null;
  if (!target) return <Navigate replace to="/" />;
  return <Navigate replace to={articleHref(target, tab)} />;
}

function PageLoader() {
  return <div className="page-loader">加载中...</div>;
}

/** S5: 恢复 404.html 记录的深链路径 (纯静态托管无 history fallback 时兜底) */
/** 空闲预加载全量数据: 首屏不下载, 用户浏览首页时后台拉取, 进入学习/练习页秒开 */
function PreloadCore() {
  useEffect(() => {
    const idle = (window as Window & { requestIdleCallback?: (cb: () => void) => number }).requestIdleCallback;
    if (idle) idle(() => { void loadCore(); });
    else setTimeout(() => { void loadCore(); }, 800);
  }, []);
  return null;
}

function DeepLinkRestore() {
  const navigate = useNavigate();
  useEffect(() => {
    try {
      const p = localStorage.getItem('wyw_deep_link');
      if (p) {
        localStorage.removeItem('wyw_deep_link');
        navigate(p, { replace: true });
      }
    } catch { /* ignore */ }
  }, [navigate]);
  return null;
}
const ExamMap = lazy(() => import('./features/map/ExamMap'));
export default function App() {
  return (
    <ErrorBookProvider>
      <div className="app-shell">
        <DeepLinkRestore />
        <PreloadCore />
        <header className="app-header">
          <h1>文言文学习</h1>
          <span className="app-header-info">{counts.learning} 篇 · {counts.senses} 词义 · {counts.totalQuestions} 题</span>
        </header>

        <main className="app-main">
          <Suspense fallback={<PageLoader />}>
            <ErrorBoundary>
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/articles/:id" element={<ArticlePage />} />
                <Route path="/articles/:id/:tab" element={<ArticlePage />} />
                <Route path="/errors" element={<ErrorBookPage />} />
                <Route path="/map" element={<ExamMap />} />
                <Route path="/cards" element={<Flashcards />} />
                <Route path="/learning/:title" element={<LegacyArticleRedirect tab="learn" />} />
                <Route path="/practice/:title" element={<LegacyArticleRedirect tab="practice" />} />

                <Route path="*" element={<Navigate replace to="/" />} />
              </Routes>
            </ErrorBoundary>
          </Suspense>
        </main>

        <TabBar />
        <footer className="app-footer">
          <p>武汉中考文言文 · 内置题库 · 数据 v2.2</p>
        </footer>
      </div>
    </ErrorBookProvider>
  );
}
