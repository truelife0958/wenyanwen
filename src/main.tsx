import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import './shared/styles/global.css';
import { injectTheme } from './shared/styles/tokens';

// 注入设计令牌 CSS 变量 (单一事实源 src/shared/styles/tokens.ts)
injectTheme();

// 启动清理: 移除已废弃的 SM-2 字词进度数据 (E10, 翻卡功能已移除)
try {
  ['wyw_cards_v2', 'wyw_cards_seen_v2', 'wyw_cards_seen_v1'].forEach((k) => localStorage.removeItem(k));
} catch { /* ignore */ }
ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>
);

// PWA 离线支持: 仅生产环境注册 (避免 dev HMR 干扰)
if (import.meta.env.PROD && 'serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./sw.js').catch(() => {});
  });
}
