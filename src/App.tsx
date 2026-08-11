import { lazy, Suspense } from 'react';
import { useEffect } from 'react';
import { Navigate, Route, Routes, useNavigate } from 'react-router-dom';
import Home from './features/home/Home';
import TabBar from './features/home/TabBar';
import ErrorBoundary from './shared/ui/ErrorBoundary';
import { ErrorBookProvider } from './features/errorbook/store';
import { counts, loadCore } from './data';
import { moxieCount } from './data/moxie';
import { articleHref, findLearningArticle } from './data/article-links';
import { useParams } from 'react-router-dom';

const ArticlePage = lazy(() => import('./features/learning/ArticlePage'));
const MoxieHome = lazy(() => import('./features/moxie/MoxieHome'));
const MoxieArticle = lazy(() => import('./features/moxie/MoxieArticle'));
const MoxieErrors = lazy(() => import('./features/moxie/MoxieErrors'));

/** 旧版路由 #/learning/:title → 新篇目工作区 */
function LegacyArticleRedirect() {
  const { title } = useParams();
  const target = title ? findLearningArticle(title) : null;
  if (!target) return <Navigate replace to="/" />;
  return <Navigate replace to={articleHref(target, 'learn')} />;
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
export default function App() {
  return (
    <ErrorBookProvider>
      <div className="app-shell">
        <DeepLinkRestore />
        <PreloadCore />
        <header className="app-header">
          <h1>文言文学习</h1>
          <span className="app-header-info">{counts.learning} 篇课文 · {moxieCount} 篇默写</span>
        </header>

        <main className="app-main">
          <Suspense fallback={<PageLoader />}>
            <ErrorBoundary>
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/articles/:id" element={<ArticlePage />} />
                <Route path="/articles/:id/:tab" element={<ArticlePage />} />
                <Route path="/moxie" element={<MoxieHome />} />
                <Route path="/moxie/:id" element={<MoxieArticle />} />
                <Route path="/moxie/errors" element={<MoxieErrors />} />
                <Route path="/errors" element={<Navigate replace to="/moxie/errors" />} />
                <Route path="/learning/:title" element={<LegacyArticleRedirect />} />

                <Route path="*" element={<Navigate replace to="/" />} />
              </Routes>
            </ErrorBoundary>
          </Suspense>
        </main>

        <TabBar />
        <footer className="app-footer">
          <p>武汉中考文言文 · 学习 + 默写练习</p>
        </footer>
      </div>
    </ErrorBookProvider>
  );
}
