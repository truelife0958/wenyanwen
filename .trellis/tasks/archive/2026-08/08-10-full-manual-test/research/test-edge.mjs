// 逐项功能测试 — 移动端/PWA/边界 (research/test-edge.mjs)
import { chromium } from 'playwright-core';
const EXE = '/home/truel/.cache/ms-playwright/chromium-1234/chrome-linux64/chrome';
const BASE = 'http://localhost:8765/';
const browser = await chromium.launch({ executablePath: EXE, headless: true });
const results = [];
const T = (label, ok, detail = '') => { results.push({ label, ok, detail }); console.log(`${ok ? '  ✓' : '  ✗'} ${label}${detail ? ' — ' + detail : ''}`); };

// ============ 移动端 375px ============
const mob = await browser.newPage({ viewport: { width: 375, height: 812 } });
const mobErrors = [];
mob.on('pageerror', (e) => mobErrors.push(e.message));
mob.on('console', (m) => { if (m.type() === 'error') mobErrors.push(m.text()); });

async function checkOverflow(page, label) {
  const r = await page.evaluate(() => ({
    scrollW: document.documentElement.scrollWidth,
    innerW: window.innerWidth,
  }));
  T(`${label} 无横向溢出`, r.scrollW <= r.innerW + 2, `${r.scrollW} <= ${r.innerW}`);
}

for (const [label, path] of [
  ['移动-首页', '/'],
  ['移动-学习', '/articles/jc-yueyanglouji/learn'],
  ['移动-练习', '/articles/jc-yueyanglouji/practice'],
  ['移动-字词卡', '/cards'],
  ['移动-图谱', '/map'],
  ['移动-错题本', '/errors'],
]) {
  await mob.goto(BASE + path, { waitUntil: 'networkidle' });
  await mob.waitForTimeout(700);
  await checkOverflow(mob, label);
}
// 移动端 tab 切换
await mob.goto(BASE + '/', { waitUntil: 'networkidle' });
await mob.waitForTimeout(500);
T('移动端 TabBar 可见', (await mob.locator('.tab-bar').count()) > 0);
const tabs = await mob.locator('.tab-item').count();
T('移动端 3 tab', tabs === 3, `${tabs} 个`);
await mob.locator('.tab-item', { hasText: '字词' }).click();
await mob.waitForTimeout(700);
T('移动端 tab 跳转 /cards', mob.url().includes('/cards'), mob.url());
T('移动端无错误', mobErrors.length === 0, mobErrors.join(' | '));
await mob.close();

// ============ 边界: localStorage 损坏兜底 ============
const edge = await browser.newPage();
const edgeErrors = [];
edge.on('pageerror', (e) => edgeErrors.push(e.message));
edge.on('console', (m) => { if (m.type() === 'error') edgeErrors.push(m.text()); });
await edge.goto(BASE, { waitUntil: 'networkidle' });
// 注入损坏数据
await edge.evaluate(() => {
  localStorage.setItem('wyw_errorbook_v2', '{broken json!!');
  localStorage.setItem('wyw_progress_v1', 'not-json');
  localStorage.setItem('wyw_recite_progress_v2', 'null');
});
await edge.reload({ waitUntil: 'networkidle' });
await edge.waitForTimeout(800);
T('损坏 localStorage 不崩溃', (await edge.locator('.article-card').count()) > 0);
T('损坏数据无错误', !edgeErrors.some((e) => e.includes('localStorage') || e.includes('JSON')), edgeErrors.join(' | '));
// 恢复现场
await edge.evaluate(() => localStorage.clear());

// ============ 快速连点 ============
await edge.goto(BASE + 'articles/jc-yueyanglouji/learn', { waitUntil: 'networkidle' });
await edge.waitForTimeout(700);
// 连点注释词 10 次
for (let i = 0; i < 10; i++) {
  await edge.locator('.annot-gloss').first().click({ force: true }).catch(() => {});
}
await edge.waitForTimeout(400);
T('连点注释词不崩', (await edge.locator('body').textContent()).length > 100);
T('连点后无错误', edgeErrors.length === 0, edgeErrors.join(' | '));
// 连点 tab 切换
for (let i = 0; i < 5; i++) {
  await edge.locator('.workspace-tabs a', { hasText: '练习' }).click({ force: true }).catch(() => {});
  await edge.locator('.workspace-tabs a', { hasText: '学习' }).click({ force: true }).catch(() => {});
}
await edge.waitForTimeout(600);
T('连点 tab 不崩', edgeErrors.length === 0, edgeErrors.join(' | '));
await edge.close();

// ============ PWA: SW 注册(生产构建验证在 R3 已做, dev 下验证注册逻辑) ============
const pwa = await browser.newPage();
await pwa.goto(BASE, { waitUntil: 'networkidle' });
const swCount = await pwa.evaluate(() => (navigator.serviceWorker ? 1 : 0));
T('SW API 可用', swCount === 1);
await pwa.close();

console.log(`\n===== 移动端/边界测试: ${results.filter(r => r.ok).length}/${results.length} 通过 =====`);
await browser.close();
process.exit(results.every(r => r.ok) ? 0 : 1);
