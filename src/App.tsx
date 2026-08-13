import { lazy, Suspense } from 'react';
import { useEffect } from 'react';
import { Navigate, Route, Routes, useNavigate } from 'react-router-dom';
import TabBar from './features/home/TabBar';
import ErrorBoundary from './shared/ui/ErrorBoundary';
import { ErrorBookProvider } from './features/errorbook/store';
import { GameProvider } from './features/game/store';
import GameFx from './features/game/GameFx';
import { counts, loadCore } from './data';
import { articleHref, findLearningArticle } from './data/article-links';
import { useParams } from 'react-router-dom';

const ArticlePage = lazy(() => import('./features/learning/ArticlePage'));
const MoxieHome = lazy(() => import('./features/moxie/MoxieHome'));
const MoxieRedirect = lazy(() => import('./features/moxie/MoxieRedirect'));
const MoxieErrors = lazy(() => import('./features/moxie/MoxieErrors'));
const LevelMap = lazy(() => import('./features/game/LevelMap'));
const Achievements = lazy(() => import('./features/game/Achievements'));

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
/** 空闲预加载全量数据: 首屏不下载, 用户浏览首页时后台拉取, 进入历练/练习页秒开 */
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
      <GameProvider>
      <div className="app-shell">
        <DeepLinkRestore />
        <PreloadCore />
        <header className="app-header">
          <h1>文言文闯关</h1>
          <span className="app-header-info">{counts.learning} 篇篇章 · {counts.moxieArticles} 篇默诵</span>
        </header>

        <main className="app-main">
          <Suspense fallback={<PageLoader />}>
            <ErrorBoundary>
              <Routes>
                <Route path="/" element={<LevelMap />} />
                <Route path="/articles/:id" element={<ArticlePage />} />
                <Route path="/articles/:id/:tab" element={<ArticlePage />} />
                <Route path="/moxie" element={<MoxieHome />} />
                <Route path="/moxie/:id" element={<MoxieRedirect />} />
                <Route path="/moxie/errors" element={<MoxieErrors />} />
                <Route path="/map" element={<Navigate replace to="/" />} />
                <Route path="/achievements" element={<Achievements />} />
                <Route path="/errors" element={<Navigate replace to="/moxie/errors" />} />
                <Route path="/learning/:title" element={<LegacyArticleRedirect />} />

                <Route path="*" element={<Navigate replace to="/" />} />
              </Routes>
            </ErrorBoundary>
          </Suspense>
        </main>

        <TabBar />
        <GameFx />
        <footer className="app-footer">
          <p>武汉中考文言文 · 历练 + 默诵</p>
        </footer>
      </div>
      </GameProvider>
    </ErrorBookProvider>
  );
}
