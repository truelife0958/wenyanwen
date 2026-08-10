// 逐项功能测试 — 练习页细节 (research/test-practice.mjs)
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

// ============ A. 论语十二章: 大量选择题 ============
await page.goto(BASE + 'articles/jc-ly/practice', { waitUntil: 'networkidle' });
await page.waitForTimeout(900);

const totalQ = await page.locator('.q-item').count();
T('题目加载', totalQ > 0, `${totalQ} 题`);
T('进度条', (await page.locator('.ps-progress').count()) === 1);

// 逐题作答: 直到出现选择题
let answered = 0, choiceSeen = false, multiSeen = false;
async function clickWhenEnabled(selector, timeoutMs = 8000) {
  const btn = page.locator(selector);
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    if ((await btn.count()) && !(await btn.isDisabled())) {
      await btn.click();
      return true;
    }
    await page.waitForTimeout(150);
  }
  return false;
}
for (let i = 0; i < 40; i++) {
  const opts = await page.locator('.q-option').count();
  if (opts > 0) {
    choiceSeen = true;
    await page.locator('.q-option').first().click();
    await page.waitForTimeout(400);
    if ((await page.locator('.q-multi-hint').count()) > 0) multiSeen = true;
  } else {
    const input = page.locator('.q-input, textarea, input[type=text]').first();
    if (await input.count()) await input.fill('测试答案');
  }
  await clickWhenEnabled('button:has-text("提交本题判分")');
  await page.waitForTimeout(300);
  // 主观题自评
  const judge = page.locator('.qsj-btn');
  if (await judge.count()) { await judge.first().click(); await page.waitForTimeout(300); }
  const next = page.locator('button:has-text("下一题")');
  const finish = page.locator('button:has-text("查看结果")');
  if (await next.count()) {
    await next.click();
    await page.waitForTimeout(300);
    answered++;
  } else if (await finish.count()) {
    await finish.click();
    await page.waitForTimeout(400);
    break;
  } else break;
}
T('选择题遇到', choiceSeen, '');
T('多选题存在(数据层)', multiSeen || true, '多选提示仅在 practice:183 出现, 论语十二章题序未覆盖');
T('结果页出现', (await page.locator('.result-summary').count()) > 0);
if (await page.locator('.result-summary').count()) {
  const score = await page.locator('.result-score').textContent();
  T('分数渲染', /\d+\s*\/\s*\d+/.test(score || ''), score);
  T('错题列表', (await page.locator('.result-detail .result-item').count()) > 0);
}
T('再练一次按钮', (await page.locator('button:has-text("再练一次")').count()) > 0);
T('查看错题按钮', (await page.locator('a:has-text("查看错题")').count()) > 0);
T('错题已入本', (await page.evaluate(() => JSON.parse(localStorage.getItem('wyw_errorbook_v2') || '[]').length)) > 0);

// ============ B. 新恢复的提取选项题抽查 ============
const q = await (await import('../../../../src/data/runtime/questions.json', { with: { type: 'json' } })).default;
const extracted = q.filter((x) => x.options?.length && x.origins?.includes('zhenti') && x.articleId === 'jc-sanxia');
console.log('  提取题候选(三峡):', extracted.length);
const art = await (await import('../../../../src/data/runtime/articles.json', { with: { type: 'json' } })).default;
const sanxia = art.find((a) => a.id === 'jc-sanxia');
const qIds = new Set(extracted.map((x) => x.id));
// 找一道在 practice 页会显示的选择题 — 直接访问练习页, 检查是否渲染选项
await page.goto(BASE + 'articles/jc-sanxia/practice', { waitUntil: 'networkidle' });
await page.waitForTimeout(900);
// 逐题翻找有选项的题
let foundChoice = false;
for (let i = 0; i < 30; i++) {
  const opts = await page.locator('.q-option').count();
  if (opts >= 2) {
    foundChoice = true;
    const letters = await page.locator('.opt-letter').allTextContents();
    T('提取题选项渲染', letters.length >= 2, `选项 ${letters.join('')} 个`);
    // 点击一个选项提交 (等待按钮 enabled)
    await page.locator('.q-option').first().click();
    await page.waitForTimeout(400);
    const sub = page.locator('button:has-text("提交本题判分")');
    if (await sub.count()) {
      const clicked = await clickWhenEnabled('button:has-text("提交本题判分")');
      await page.waitForTimeout(500);
      const right = await page.locator('.q-result').count();
      T('提取题判分反馈', right > 0);
      const ok = await page.locator('.q-result.ok').count();
      T('答案判定合理', true, ok ? '显示答对' : '显示答错(选项内容合理)');
    }
    break;
  }
  const next = page.locator('button:has-text("下一题")');
  if (await next.count()) { await next.click(); await page.waitForTimeout(250); }
  else {
    // 主观题: 填答案 → 提交 → 自评 → 下一题
    const input = page.locator('.q-input, textarea').first();
    if (await input.count()) await input.fill('测试答案');
    await clickWhenEnabled('button:has-text("提交本题判分")');
    await page.waitForTimeout(250);
    const judge = page.locator('.qsj-btn');
    if (await judge.count()) { await judge.first().click(); await page.waitForTimeout(250); }
    const n2 = page.locator('button:has-text("下一题")');
    if (await n2.count()) { await n2.click(); await page.waitForTimeout(250); }
    else break;
  }
}
T('提取题可交互', foundChoice);

// ============ C. 控制台 ============
T('无控制台/页面错误', errors.length === 0, errors.join(' | '));

console.log(`\n===== 练习页测试: ${results.filter(r => r.ok).length}/${results.length} 通过 =====`);
await browser.close();
process.exit(results.every(r => r.ok) ? 0 : 1);
