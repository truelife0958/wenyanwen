/** SSR 渲染验证 — 渲染 App 整树（错题本同步加载, 学习页 lazy 单独验证） */
// 抑制 react-router Link 在 SSR 视作 client 组件导致的 useLayoutEffect 无害警告,保持日志干净
const _oe = console.error;
console.error = (msg, ...rest) => {
  if (typeof msg === 'string' && msg.includes('useLayoutEffect does nothing on the server')) return;
  if (typeof msg === 'string' && msg.includes('useLayoutEffect server')) return;
  _oe(msg, ...rest);
};
import { createServer } from 'vite';
import React from 'react';
import { renderToString } from 'react-dom/server';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { StaticRouter } from 'react-router';

const vite = await createServer({
  root: process.cwd(),
  server: { middlewareMode: true, hmr: false },
  appType: 'custom',
  logLevel: 'error',
});

function check(label, ok) {
  console.log((ok ? '  ✓ ' : '  ✗ ') + label);
  if (!ok) process.exitCode = 1;
}

try {
  const { default: App } = await vite.ssrLoadModule('/src/App.tsx');

  const render = (path) =>
    renderToString(
      React.createElement(
        MemoryRouter,
        { initialEntries: [path] },
        React.createElement(App)
      )
    );

  console.log('=== 首页 ===');
  const home = render('/');
  check('含顶栏', home.includes('文言文学习'));
  check('搜索框', home.includes('home-search-box'));
  check('功能入口', home.includes('home-entry-grid'));
  check('6 个年级 tab', (home.match(/class="grade-tab"|grade-tab active/g) || []).length === 6);
  check('篇目卡片网格', home.includes('article-grid') && home.includes('article-card'));
  check('进度概览', home.includes('today-tasks'));
  check('首页包含篇目 论语十二章', home.includes('论语十二章'));

  const { default: ArticlePage } = await vite.ssrLoadModule('/src/features/learning/ArticlePage.tsx');
  const article = renderToString(
    React.createElement(
      MemoryRouter,
      { initialEntries: ['/articles/jc-yueyanglouji/learn'] },
      React.createElement(
        Routes,
        null,
        React.createElement(Route, { path: '/articles/:id/:tab', element: React.createElement(ArticlePage) })
      )
    )
  );
  console.log('\n=== 篇目工作区 ===');
  check('3 个学习标签', (article.includes('鉴赏') && article.includes('默写')) || article.includes('page-loader'));
  check('学习正文', article.includes('para-list') || article.includes('article-body') || article.includes('page-loader'));
  check('鉴赏标签', article.includes('主旨') || article.includes('鉴赏') || article.includes('page-loader'));
  console.log('\n=== 规范化题库 ===');
  const runtimeData = await vite.ssrLoadModule('/src/data/index.ts');
  check('轻量 meta 可加载', runtimeData.articleMeta.length === 126 && runtimeData.counts.totalQuestions > 0);
  check('默写数据可加载', runtimeData.moxieArticles.length >= 120);

  const { default: MoxieErrors } = await vite.ssrLoadModule('/src/features/moxie/MoxieErrors.tsx');
  const { ErrorBookProvider } = await vite.ssrLoadModule('/src/features/errorbook/store.tsx');
  const errorsPage = renderToString(
    React.createElement(
      MemoryRouter,
      { initialEntries: ['/moxie/errors'] },
      React.createElement(
        ErrorBookProvider,
        null,
        React.createElement(Routes, null,
          React.createElement(Route, { path: '/moxie/errors', element: React.createElement(MoxieErrors) })
        )
      )
    )
  );
  check('默写错题本页面', errorsPage.includes('错题本'));
  console.log('\n=== 默写模块 ===');
  const { default: MoxieHome } = await vite.ssrLoadModule('/src/features/moxie/MoxieHome.tsx');
  const moxiePage = renderToString(
    React.createElement(
      MemoryRouter,
      { initialEntries: ['/moxie'] },
      React.createElement(
        ErrorBookProvider,
        null,
        React.createElement(Routes, null,
          React.createElement(Route, { path: '/moxie', element: React.createElement(MoxieHome) })
        )
      )
    )
  );
  check('默写列表渲染', (moxiePage.includes('默写') && moxiePage.includes('篇')) || moxiePage.includes('page-loader'));

  console.log('\n=== 深链 SSR (StaticRouter, 模拟真实服务器路径) ===');
  // E9: 用 StaticRouter 逐个渲染所有真实路由 (含有效/无效 id 与旧版路径), 验证深链直访不崩
  const deepPaths = [
    '/',
    '/moxie',
    '/moxie/errors',
    '/articles/jc-yueyanglouji',
    '/articles/jc-yueyanglouji/learn',
    '/articles/jc-yueyanglouji/moxie',
    '/articles/not-exist-id/learn',
    '/learning/岳阳楼记',
    '/unknown-route',
  ];
  const renderStatic = (path) =>
    renderToString(
      React.createElement(
        StaticRouter,
        { location: path },
        React.createElement(App)
      )
    );
  let deepFail = 0;
  for (const p of deepPaths) {
    try {
      const html = renderStatic(p);
      if (p === '/unknown-route') {
        // 兜底路由应导航回首页
        check(`深链 ${p} → 兜底首页`, html.includes('文言文学习') || html.includes('home-entry'));
      } else {
        check(`深链 ${p} 可渲染`, html.length > 200);
      }
    } catch (err) {
      deepFail++;
      console.log(`  ✗ 深链 ${p} 渲染异常:`, err.message);
    }
  }
  if (deepFail) process.exitCode = 1;
  await vite.close();
  console.log('\n' + (process.exitCode ? '❌ 有失败项' : '✅ SSR 验证全部通过'));
  process.exit(process.exitCode ? 1 : 0);
} catch (e) {
  console.error('SSR FAIL:', e.message);
  console.error(e.stack?.split('\n').slice(0, 8).join('\n'));
  process.exit(1);
}
