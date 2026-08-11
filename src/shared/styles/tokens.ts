/** 设计令牌 — 书卷纸墨视觉系统单一事实源。
 *  key 即 CSS 变量名 (与 global.css 完全一致), 分组以注释组织。
 *  - global.css / 页面样式通过注入的 CSS 变量引用 (--bg 等)
 *  - 组件代码可直接 import 本模块取 JS 侧值 (阴影/动画/颜色)
 *  - 扩展主题: 定义 TokenValues 覆盖后注入 (见 injectTheme)
 */

// 定义可被覆盖的主题值类型: 变量名 → 值
export type TokenValues = { [K in TokenName]: string | number };

const tokens = {
  // ── 色彩 (米纸底 · 暖白卡 · 印章红 · 古铜金 · 墨色三阶) ──
  'bg': '#faf7f0',
  'bg-soft': '#f2ece0',
  'card-bg': '#ffffff',
  'primary': '#c4453c',
  'primary-dark': '#a8352e',
  'primary-soft': '#fbeae7',
  'ink': '#2d2822',
  'ink-2': '#4d4539',
  'ink-light': '#7a7162',
  'muted': '#a39a88',
  'accent': '#d4a855',
  'accent-light': '#e8c97a',
  'accent-soft': '#faf0dc',
  'accent-brown': '#a5803a',
  'bronze': '#8a6d3b',
  'bronze-deep': '#8a6420',
  'success': '#3a8a5f',
  'success-dark': '#2e6b4f',
  'success-soft': '#edf7f1',
  'success-border': '#bfe0cd',
  'success-mid': '#7fb39a',
  'error': '#c05252',
  'error-soft': '#fdf0ec',
  'info': '#428bca',
  'info-soft': '#d8edf8',
  'accent-dark': '#a9842f',
  'gold': '#e6a817',
  'primary-darker': '#8f2525',
  'ai-purple': '#7a4fb0',
  'must-orange': '#d9480f',
  'moss': '#6b7f5e',
  'moss-dark': '#55684a',
  // ── 半透明修饰色 (量化命名: 色-透明度%) ──
  'ink-4': 'rgba(43, 36, 28, 0.04)',
  'ink-25': 'rgba(43, 36, 28, 0.25)',
  'ink-35': 'rgba(43, 36, 28, 0.35)',
  'ink-38': 'rgba(43, 36, 28, 0.38)',
  'red-10': 'rgba(156, 42, 42, 0.1)',
  'red-22': 'rgba(156, 42, 42, 0.22)',
  'red-25': 'rgba(176, 49, 43, 0.25)',
  'red-32': 'rgba(156, 42, 42, 0.32)',
  'red-deep-22': 'rgba(124, 31, 31, 0.22)',
  'red-primary-25': 'rgba(196, 69, 60, 0.25)',
  'gold-8': 'rgba(201, 169, 110, 0.08)',
  'gold-12': 'rgba(201, 169, 110, 0.12)',
  'gold-14': 'rgba(201, 169, 110, 0.14)',
  'gold-15': 'rgba(201, 169, 110, 0.15)',
  'gold-18': 'rgba(201, 169, 110, 0.18)',
  'gold-30': 'rgba(201, 169, 110, 0.3)',
  'gold-35': 'rgba(201, 169, 110, 0.35)',
  'gold-deep-18': 'rgba(120, 90, 40, 0.18)',
  'gold-deep-6': 'rgba(156, 120, 60, 0.06)',
  'gold-bright-35': 'rgba(230, 168, 23, 0.35)',
  'success-8': 'rgba(58, 138, 95, 0.08)',
  'success-12': 'rgba(46, 125, 79, 0.12)',
  'success-30': 'rgba(46, 125, 79, 0.3)',
  'error-8': 'rgba(192, 82, 82, 0.08)',
  'error-40': 'rgba(192, 82, 82, 0.4)',
  'blue-14': 'rgba(85, 168, 196, 0.14)',
  'white-25': 'rgba(255, 255, 255, 0.25)',
  'white-92': 'rgba(255, 255, 255, 0.92)',
  'black-4': 'rgba(0, 0, 0, 0.04)',
  'black-5': 'rgba(0, 0, 0, 0.05)',
  'black-10': 'rgba(0, 0, 0, 0.10)',
  'black-12': 'rgba(0, 0, 0, 0.12)',
  'black-18': 'rgba(0, 0, 0, 0.18)',
  'moss-28': 'rgba(85, 104, 74, 0.28)',
  'border': '#e5ddd0',
  'border-soft': '#f0e9dd',
  'seal-red': '#c4453c',
  'paper-border': '#e8dfd0',

  // ── 字体 ──
  'f-family': '"Noto Serif SC", "Songti SC", "STSong", "SimSun", serif',
  'f-serif-latin': "'Georgia', 'Noto Serif SC', serif",
  'f-kaiti': "'STKaiti', 'KaiTi', '楷体', serif",
  'f-size-xs': '0.72rem',
  'f-size-sm': '0.85rem',
  'f-size-base': '0.95rem',
  'f-size-md': '1.05rem',
  'f-size-lg': '1.4rem',
  'f-size-xl': '1.28rem',
  'f-line-body': 1.75,
  'f-line-para': 2.1,

  // ── 间距 (4px 基准) ──
  'sp-xs': '4px',
  'sp-sm': '8px',
  'sp-md': '12px',
  'sp-lg': '16px',
  'sp-xl': '24px',

  // ── 圆角 ──
  'r-2xs': '6px',
  'r-xs': '8px',
  'r-sm': '10px',
  'r-md': '14px',
  'r-lg': '20px',
  'r-pill': '999px',
  'radius': '14px',
  'radius-lg': '20px',

  // ── 阴影 (分层) ──
  'shadow': '0 1px 2px rgba(45,40,34,0.04), 0 4px 12px rgba(45,40,34,0.04)',
  'shadow-lg': '0 4px 12px rgba(45,40,34,0.06), 0 16px 32px rgba(45,40,34,0.08)',

  // ── 动效 ──
  'dur-fast': '0.15s',
  'dur-base': '0.28s',
  'dur-slow': '0.45s',
  'ease-out': 'cubic-bezier(0.16, 1, 0.3, 1)',
  'ease-in-out': 'cubic-bezier(0.65, 0, 0.35, 1)',
  'ease-spring': 'cubic-bezier(0.34, 1.56, 0.64, 1)',
} as const;

export type TokenName = keyof typeof tokens;
export type ThemeTokens = { [K in TokenName]: string | number };

/** 令牌 → CSS 变量字符串 (:root { --xxx: val; ... }) */
export function toCssVars(theme: ThemeTokens = tokens): string {
  const lines = Object.entries(theme).map(([k, v]) => `--${k}: ${v};`);
  return `:root {\n  ${lines.join('\n  ')}\n}`;
}

/** 注入设计令牌 CSS 变量到文档 (幂等, 单一事实源运行时生效) */
export function injectTheme(theme: ThemeTokens = tokens, id = 'wyw-tokens'): void {
  if (typeof document === 'undefined') return;
  let el = document.getElementById(id) as HTMLStyleElement | null;
  if (!el) {
    el = document.createElement('style');
    el.id = id;
    document.head.appendChild(el);
  }
  el.textContent = toCssVars(theme);
}

/** 便捷访问: tokens['primary'] / tokens.durBase 等 */
export const theme = tokens as Record<TokenName, string | number>;

/** 夜间主题 (墨夜纸): 覆盖核心色彩令牌 */
export const darkTheme: ThemeTokens = {
  ...tokens,
  'bg': '#1c1a17',
  'bg-soft': '#26221d',
  'card-bg': '#242019',
  'primary': '#d96a5f',
  'primary-dark': '#e07a6f',
  'primary-soft': '#3a2623',
  'ink': '#e8e0d2',
  'ink-2': '#c4baa8',
  'ink-light': '#9a8f7c',
  'muted': '#7d7463',
  'accent': '#c9a45c',
  'accent-soft': '#3a3122',
  'accent-brown': '#d0ab63',
  'success': '#5cae82',
  'error': '#d17474',
  'border': '#3a342b',
  'border-soft': '#322d25',
  'paper-border': '#3a342b',
};

export const THEME_KEY = 'wyw_theme';
export const THEME_DARK = 'dark';

/** 切换主题并持久化 (初始化在 main.tsx 调用 initTheme) */
export function applyTheme(themeName: string): void {
  const isDark = themeName === THEME_DARK;
  try { localStorage.setItem(THEME_KEY, themeName); } catch { /* ignore */ }
  injectTheme(isDark ? darkTheme : tokens);
}

export function initTheme(): void {
  let name = 'light';
  try { name = localStorage.getItem(THEME_KEY) || 'light'; } catch { /* ignore */ }
  applyTheme(name);
}
