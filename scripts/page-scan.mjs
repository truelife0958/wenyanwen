#!/usr/bin/env node
/** 全页面扫描: 逐页访问所有路由, 检查 JS 错误/横向溢出/内容渲染/布局一致性。
 *  用法: node scripts/page-scan.mjs [baseURL] */
import { chromium } from 'playwright-core';

const EXE = '/home/truel/.cache/ms-playwright/chromium-1234/chrome-linux64/chrome';
const BASE = process.argv[2] || 'http://localhost:8765/';
const browser = await chromium.launch({ executablePath: EXE, headless: true });

const issues = [];
let passed = 0;

function report(page, label, ok, detail = '') {
  if (ok) {
    passed++;
  } else {
    issues.push({ page: label, detail });
    console.log(`  ✗ [${label}] ${detail}`);
  }
}

async function scanPage(page, label, path) {
  const pageErrors = [];
  page.on('pageerror', (e) => pageErrors.push(e.message));
  page.on('console', (m) => { if (m.type() === 'error') pageErrors.push(m.text()); });
  await page.goto(BASE.replace(/\/$/, '') + path, { waitUntil: 'networkidle' });
  await page.waitForTimeout(700);
  const state = await page.evaluate(() => ({
    scrollW: document.documentElement.scrollWidth,
    innerW: window.innerWidth,
    mainText: (document.querySelector('.app-main')?.textContent || '').trim().length,
    h2: document.querySelector('.app-main h1, .app-main h2, .app-main h3, .app-main .page-title, .app-main .section-title, .app-main .hero-title')?.textContent?.slice(0, 20) || '',
    empty: document.querySelector('.app-main')?.textContent?.includes('加载中') || false,
  }));
  const realErrors = pageErrors.filter((e) => !e.includes('favicon') && !e.includes('net::ERR'));
  report(page, label, realErrors.length === 0, `JS错误: ${realErrors.slice(0, 2).join(' | ')}`);
  report(page, label, state.scrollW <= state.innerW + 2, `横向溢出: ${state.scrollW} > ${state.innerW}`);
  report(page, label, state.mainText > 20 && !state.empty, `内容为空或加载失败 (文本 ${state.mainText} 字)`);
  report(page, label, !!state.h2, `无页面标题`);
  return state;
}

const desktop = await browser.newPage({ viewport: { width: 1280, height: 900 } });
const mobile = await browser.newPage({ viewport: { width: 375, height: 812 } });

console.log('=== 桌面端核心页面 ===');
const coreRoutes = [
  ['首页', '/'],
  ['默写列表', '/moxie'],
  ['默写错题本', '/moxie/errors'],
  ['闯关地图', '/map'],
  ['成就墙', '/achievements'],
  ['旧学习深链', '/learning/' + encodeURIComponent('岳阳楼记')],
];
for (const [label, path] of coreRoutes) await scanPage(desktop, label, path);

console.log('=== 篇目工作区 (2 篇 × 5 tab) ===');
const sampleArticles = ['jc-yueyanglouji', 'jc-ly'];
for (const id of sampleArticles) {
  for (const tab of ['learn', 'appreciate', 'exam', 'notes', 'moxie']) {
    await scanPage(desktop, `${id}/${tab}`, `/articles/${id}/${tab}`);
  }
}


console.log('=== 移动端关键页 (375px) ===');
for (const [label, path] of [
  ['移动-首页', '/'],
  ['移动-学习', '/articles/jc-yueyanglouji/learn'],
  ['移动-鉴赏', '/articles/jc-yueyanglouji/appreciate'],
  ['移动-考点', '/articles/jc-yueyanglouji/exam'],
  ['移动-注释', '/articles/jc-yueyanglouji/notes'],
  ['移动-默写列表', '/moxie'],
  ['移动-默写错题本', '/moxie/errors'],
  ['移动-闯关地图', '/map'],
  ['移动-成就墙', '/achievements'],
]) {
  await scanPage(mobile, label, path);
}

console.log('=== 布局一致性抽查 ===');
await desktop.goto(BASE, { waitUntil: 'networkidle' });
await desktop.waitForTimeout(400);
const shared = await desktop.evaluate(() => {
  const hasTitle = !!document.querySelector('.page-title, .section-title, .home-hero .hero-title, .today-title');
  const chipRadius = document.querySelector('.chip, .cat-chip, .pf-chips .chip') ? getComputedStyle(document.querySelector('.chip, .cat-chip, .pf-chips .chip')).borderRadius : null;
  return { hasTitle, chipRadius };
});
report(desktop, '共享类', shared.hasTitle, '首页应有 section-title/page-title 之一');
console.log(`  共享类抽查: chip 圆角 = ${shared.chipRadius}`);

await browser.close();
console.log(`\n===== 扫描结果: ${passed} 项通过 / ${issues.length} 项问题 =====`);
if (issues.length) {
  console.log('问题清单:');
  for (const item of issues) console.log(`  - ${item.page}: ${item.detail}`);
  process.exit(1);
}
