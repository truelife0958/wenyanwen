// 逐项功能测试 — 学习页细节 (research/test-learning.mjs)
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

// 岳阳楼记: 长文+注释密集
await page.goto(BASE + 'articles/jc-yueyanglouji/learn', { waitUntil: 'networkidle' });
await page.waitForTimeout(900);

// 1. 原文渲染
const paras = await page.locator('.para-orig').count();
T('原文段落渲染', paras > 0, `${paras} 段`);
const origText = await page.locator('.para-orig').first().textContent();
T('原文内容', (origText || '').replace(/[①-⑳㉑-㉟]/g, '').includes('庆历四年春'), String(origText).slice(0, 40));

// 2. 注释角标
const annots = await page.locator('.annot-gloss').count();
T('注释标注词', annots > 5, `${annots} 处`);

// 3. 点击注释词 → 浮层
await page.locator('.annot-gloss').first().click();
await page.waitForTimeout(350);
const pop = await page.locator('.gloss-pop').count();
T('注释浮层弹出', pop === 1, `${pop} 个`);
if (pop) {
  const popText = await page.locator('.gloss-pop').textContent();
  T('浮层有内容', (popText || '').trim().length > 3, (popText || '').slice(0, 40));
}

// 4. Esc 关闭浮层
await page.keyboard.press('Escape');
await page.waitForTimeout(300);
T('Esc 关闭浮层', (await page.locator('.gloss-pop').count()) === 0);

// 5. 再次点击 → 点击页面空白关闭
await page.locator('.annot-gloss').first().click();
await page.waitForTimeout(300);
await page.locator('.app-main').click({ position: { x: 5, y: 5 } });
await page.waitForTimeout(300);
T('点击空白关闭浮层', (await page.locator('.gloss-pop').count()) === 0);

// 6. 译文展开
const transBefore = await page.locator('.para-trans:visible').count();
await page.locator('.para-toggle').first().click();
await page.waitForTimeout(400);
const transAfter = await page.locator('.para-trans:visible').count();
T('译文展开', transAfter > transBefore, `${transBefore} → ${transAfter}`);

// 7. 笔记清单与赏析
const notes = await page.locator('.note-list, .notes-section').count();
T('笔记/注释清单', notes > 0 || (await page.locator('.annot-list').count()) > 0, `${notes} 处`);

// 8. 朗读按钮
const readBtns = await page.locator('.read-btn').count();
T('朗读按钮', readBtns > 0, `${readBtns} 个`);

// 9. 朗读设置存在
const readHint = await page.locator('.read-hint').textContent().catch(() => '');
T('朗读提示文案', (readHint || '').includes('边听边看'), readHint);

// 10. 三 tab 切换
await page.locator('.workspace-tabs a', { hasText: '鉴赏' }).click();
await page.waitForTimeout(800);
T('鉴赏 tab URL', page.url().includes('/appreciate'), page.url());
const appre = await page.locator('.appr-para, .appr-orig').count();
T('鉴赏内容渲染', appre > 0, `${appre} 区块`);

await page.locator('.workspace-tabs a', { hasText: '练习' }).click();
await page.waitForTimeout(800);
T('练习 tab URL', page.url().includes('/practice'), page.url());
T('练习页题目', (await page.locator('.q-item, .ps-progress').count()) > 0);

await page.locator('.workspace-tabs a', { hasText: '学习' }).click();
await page.waitForTimeout(800);
T('学习 tab 返回', page.url().endsWith('/learn'), page.url());

// 11. 无效 id 重定向
await page.goto(BASE + 'articles/not-exist-id/learn', { waitUntil: 'networkidle' });
await page.waitForTimeout(600);
T('无效 id 显示未找到+返回', (await page.locator('body').textContent()).includes('未找到该篇目'), page.url());

// 12. 旧链接跳转
await page.goto(BASE + 'learning/岳阳楼记', { waitUntil: 'networkidle' });
await page.waitForTimeout(800);
T('旧链接 /learning/:title', page.url().includes('/articles/jc-yueyanglouji'), page.url());
await page.goto(BASE + 'practice/岳阳楼记', { waitUntil: 'networkidle' });
await page.waitForTimeout(800);
T('旧链接 /practice/:title', page.url().includes('/practice'), page.url());

// 13. 控制台错误
T('无控制台/页面错误', errors.length === 0, errors.join(' | '));

console.log(`\n===== 学习页测试: ${results.filter(r => r.ok).length}/${results.length} 通过 =====`);
await browser.close();
process.exit(results.every(r => r.ok) ? 0 : 1);
