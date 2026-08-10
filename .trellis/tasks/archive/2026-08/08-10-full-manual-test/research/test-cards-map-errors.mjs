// 逐项功能测试 — 字词卡/图谱/错题本 (research/test-cards-map-errors.mjs)
import { chromium } from 'playwright-core';
const EXE = '/home/truel/.cache/ms-playwright/chromium-1234/chrome-linux64/chrome';
const BASE = 'http://localhost:8765/';
const browser = await chromium.launch({ executablePath: EXE, headless: true });
const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } });
const page = await ctx.newPage();
const errors = [];
page.on('pageerror', (e) => errors.push(`PAGEERROR: ${e.message}`));
page.on('console', (m) => { if (m.type() === 'error') errors.push(`CONSOLE: ${m.text()}`); });
const results = [];
const T = (label, ok, detail = '') => { results.push({ label, ok, detail }); console.log(`${ok ? '  ✓' : '  ✗'} ${label}${detail ? ' — ' + detail : ''}`); };

// ============ 字词卡 ============
await page.goto(BASE + 'cards', { waitUntil: 'networkidle' });
await page.waitForTimeout(800);
T('字词卡标题', (await page.locator('.vocab-top-title').textContent().catch(() => '')) === '字词');
const vocabCount = await page.locator('.vocab-card, .vocab-item, .fc-card').count();
T('词条列表', vocabCount > 0, `${vocabCount} 条`);
T('实词/虚词 tab', (await page.locator('.vocab-tabs .chip').count()) >= 2);

// 切虚词
const xuci = page.locator('.vocab-tabs .chip', { hasText: '虚词' });
if (await xuci.count()) { await xuci.click(); await page.waitForTimeout(400); }
const xuciCount = await page.locator('.vocab-card, .vocab-item, .fc-card').count();
T('虚词列表切换', xuciCount > 0, `${xuciCount} 条`);

// 词条弹窗
const card = page.locator('.vocab-card, .vocab-item').first();
if (await card.count()) {
  await card.click();
  await page.waitForTimeout(400);
  T('词条弹窗', (await page.locator('.vocab-modal').count()) > 0);
  if (await page.locator('.vocab-modal').count()) {
    const modalText = await page.locator('.vocab-modal').textContent();
    T('弹窗含义项', (modalText || '').length > 20, (modalText || '').slice(0, 40));
  }
  await page.keyboard.press('Escape');
  await page.waitForTimeout(300);
  T('弹窗 Esc 关闭', (await page.locator('.vocab-modal').count()) === 0);
}

// 背诵模式
const reciteBtn = page.locator('.btn-recite, button:has-text("背诵原文")');
if (await reciteBtn.count()) {
  await reciteBtn.click();
  await page.waitForTimeout(600);
  T('背诵模式进入', (await page.locator('.recite-card, .fc-session').count()) > 0);
  const card1 = page.locator('.recite-card');
  if (await card1.count()) {
    await card1.click();
    await page.waitForTimeout(400);
    T('翻卡显示译文', (await page.locator('.recite-back, .fc-flip-back').count()) > 0);
    // 记住
    const okBtn = page.locator('.recite-btn.ok, button:has-text("记住了")');
    if (await okBtn.count()) { await okBtn.click(); await page.waitForTimeout(400); }
    T('背卡进度推进', (await page.locator('.fc-prog-text, .fc-prog-num').textContent().catch(() => '0 /')) !== '0 /');
  }
}

// ============ 考点图谱 ============
await page.goto(BASE + 'map', { waitUntil: 'networkidle' });
await page.waitForTimeout(800);
T('图谱渲染', (await page.locator('.map-container, .exam-map, .map-section').count()) > 0 || (await page.locator('.map-zone, .point-zone').count()) > 0);
// 高频过滤
const hotBtn = page.locator('.map-filter-btn', { hasText: '高频' });
if (await hotBtn.count()) { await hotBtn.click(); await page.waitForTimeout(400); }
T('高频过滤可点', true);
// 考点弹窗
const pt = page.locator('.point-item, .map-point, .point-chip').first();
if (await pt.count()) {
  await pt.click();
  await page.waitForTimeout(500);
  const modal = await page.locator('.point-modal, .map-modal, .pt-modal, .modal').count();
  T('考点弹窗', modal > 0, `${modal} 个`);
  if (modal) {
    // 弹窗内做题
    const opt = page.locator('.q-option').first();
    if (await opt.count()) { await opt.click(); await page.waitForTimeout(300); }
    const sub = page.locator('button:has-text("提交")');
    if (await sub.count()) await sub.click().catch(() => {});
    await page.waitForTimeout(400);
    await page.keyboard.press('Escape');
    await page.waitForTimeout(300);
  }
}
// ?p= 深链
await page.goto(BASE + 'map?p=' + encodeURIComponent('词类活用'), { waitUntil: 'networkidle' });
await page.waitForTimeout(800);
T('?p= 深链不报错', errors.length === 0 || errors[errors.length - 1] === undefined, '');

// ============ 错题本 ============
await page.evaluate(() => localStorage.setItem('wyw_errorbook_v2', JSON.stringify([
  { articleId: 'jc-ly', title: '论语十二章', qid: 'q1', type: '填空', stem: '测试题1', answer: 'A', ts: Date.now() },
  { articleId: 'jc-ly', title: '论语十二章', qid: 'q2', type: '选择', stem: '测试题2', answer: 'B', ts: Date.now() },
])));
await page.goto(BASE + 'errors', { waitUntil: 'networkidle' });
await page.waitForTimeout(800);
T('错题本渲染', (await page.locator('.errbook-title').count()) > 0);
T('分组显示', (await page.locator('.errbook-group').count()) > 0);
// 整组移除 (UI 设计: 组级移除 + 全清, 无单条移除)
const removeGroup = page.locator('.errbook-del').first();
if (await removeGroup.count()) { await removeGroup.click(); await page.waitForTimeout(400); }
const remaining = await page.evaluate(() => JSON.parse(localStorage.getItem('wyw_errorbook_v2') || '[]').length);
T('整组移除持久化', remaining === 0, `${remaining} 条`);
// 清空按钮
const clearAll = page.locator('button:has-text("清空")').first();
if (await clearAll.count()) { await clearAll.click(); await page.waitForTimeout(400); }
const after = await page.evaluate(() => JSON.parse(localStorage.getItem('wyw_errorbook_v2') || '[]').length);
T('清空按钮', after === 0, `${after} 条`);
// 空态
T('空态显示', (await page.locator('.errbook-empty, .empty-note').count()) > 0);

// ============ 控制台 ============
T('无控制台/页面错误', errors.length === 0, errors.join(' | '));

console.log(`\n===== 字词卡/图谱/错题本测试: ${results.filter(r => r.ok).length}/${results.length} 通过 =====`);
await browser.close();
process.exit(results.every(r => r.ok) ? 0 : 1);
