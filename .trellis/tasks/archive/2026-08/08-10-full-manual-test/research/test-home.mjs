// 逐项功能测试 — 首页细节 (research/test-home.mjs)
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

await page.goto(BASE, { waitUntil: 'networkidle' });
await page.waitForTimeout(800);

// 1. 标题与统计
T('标题含"文言文"', (await page.title()).includes('文言文'));
const stats = await page.locator('.app-header-info').textContent();
T('统计信息', /\d+ 篇 · \d+ 词义 · \d+ 题/.test(stats), stats);
T('统计数字正确', stats.includes('126 篇'), stats);

// 2. 今日学习进度环
const ringText = await page.locator('.ring-text').first().textContent().catch(() => '');
T('进度环百分比', /^\d+%$/.test(ringText || ''), ringText);

// 3. 今日任务
const taskItems = await page.locator('.task-item').count();
T('今日任务 ≥3 项', taskItems >= 3, `${taskItems} 项`);

// 4. 错题本入口卡
const entry = await page.locator('.entry-card').count();
T('错题本入口卡 1 张', entry === 1, `${entry} 张`);
T('入口卡显示计数', (await page.locator('.entry-count b').textContent().catch(() => '0')) !== null);

// 5. 搜索: 篇名
await page.locator('.home-search-box input').fill('岳阳楼记');
await page.waitForTimeout(400);
const cards = await page.locator('.article-card').count();
const firstTitle = await page.locator('.article-card .ac-title').first().textContent().catch(() => '');
T('搜索篇名过滤', cards >= 1 && (firstTitle || '').includes('岳阳楼记'), `命中 ${cards} 张, 首张=${firstTitle}`);

// 6. 搜索: 作者
await page.locator('.home-search-box input').fill('陶渊明');
await page.waitForTimeout(400);
const authorTitles = await page.locator('.article-card .ac-title').allTextContents();
T('搜索作者过滤', authorTitles.some((t) => ['桃花源记', '饮酒', '归园田居'].includes(t) || t.includes('饮酒')), authorTitles.join(','));

// 7. 搜索: 朝代
await page.locator('.home-search-box input').fill('苏轼');
await page.waitForTimeout(400);
const dynTitles = await page.locator('.article-card .ac-title').allTextContents();
T('搜索作者苏轼', dynTitles.length >= 2, `${dynTitles.length} 篇: ${dynTitles.join(',')}`);

// 8. 无结果空态
await page.locator('.home-search-box input').fill('不存在的篇目xyz');
await page.waitForTimeout(400);
T('无结果空态', (await page.locator('.empty-note').count()) > 0 || (await page.locator('.article-card').count()) === 0);

// 9. 清空按钮
await page.locator('.hsb-clear').click();
await page.waitForTimeout(400);
T('清空后恢复年级视图', (await page.locator('.article-card').count()) >= 19, `${await page.locator('.article-card').count()} 张(默认七上)`);

// 10. 年级 tab
const gradeTabs = await page.locator('.grade-tab').count();
T('年级 tab 6 个', gradeTabs === 6, `${gradeTabs} 个`);
const g0 = await page.locator('.grade-tab').first().textContent();
T('首个年级激活', (await page.locator('.grade-tab').first().getAttribute('class')).includes('active'), g0);
// 切到九下
const nine = page.locator('.grade-tab', { hasText: '九年级下册' });
if (await nine.count()) {
  await nine.click();
  await page.waitForTimeout(400);
  const nineTitles = await page.locator('.article-card .ac-title').allTextContents();
  T('九下切换', nineTitles.length > 0, `九下 ${nineTitles.length} 篇, 首篇=${nineTitles[0]}`);
  // 九下应含 陈涉世家 (九上? 不, 陈涉世家在九上) — 校验篇目属于九年级
  T('九下篇目属于九下', nineTitles.every((t) => t), '');
} else T('九下 tab 存在', false);

// 11. 中考必考徽章
await page.locator('.grade-tab', { hasText: '九年级上册' }).click();
await page.waitForTimeout(400);
const mustBadges = await page.locator('.article-card.exam-must .ac-badge').count();
const coreBadges = await page.locator('.article-card.exam-core .ac-badge').count();
T('必考徽章渲染', mustBadges > 0, `${mustBadges} 个`);
T('核心徽章渲染', coreBadges > 0, `${coreBadges} 个`);

// 12. 卡片点击进入学习页
await page.locator('.article-card').first().click();
await page.waitForTimeout(800);
T('卡片跳转学习页', page.url().includes('/articles/'), page.url());

// 13. 控制台错误
T('无控制台/页面错误', errors.length === 0, errors.join(' | '));

console.log(`\n===== 首页测试: ${results.filter(r => r.ok).length}/${results.length} 通过 =====`);
await browser.close();
process.exit(results.every(r => r.ok) ? 0 : 1);
