#!/usr/bin/env node
/** 批量截图: 全路由 × 桌面/移动双视口 → vision-shots/regression-<ts>/
 * 用法: node scripts/vision/batch-shots.mjs [BASE]
 */
import { chromium } from 'playwright-core';
import { mkdirSync, writeFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dir = dirname(fileURLToPath(import.meta.url));
const BASE = (process.argv[2] || 'http://localhost:8765/').replace(/\/$/, '');
const CHROME = process.env.PW_CHROME || '/home/truel/.cache/ms-playwright/chromium-1234/chrome-linux64/chrome';

const ROUTES = [
  ['首页', '/'],
  ['默写列表', '/moxie'],
  ['默写错题本', '/moxie/errors'],
  ['旧学习深链', '/learning/' + encodeURIComponent('岳阳楼记')],
  ['篇目-岳阳楼记-学习', '/articles/jc-yueyanglouji/learn'],
  ['篇目-岳阳楼记-鉴赏', '/articles/jc-yueyanglouji/appreciate'],
  ['篇目-岳阳楼记-考点', '/articles/jc-yueyanglouji/exam'],
  ['篇目-岳阳楼记-注释', '/articles/jc-yueyanglouji/notes'],
  ['篇目-岳阳楼记-默写', '/articles/jc-yueyanglouji/moxie'],
  ['篇目-论语-学习', '/articles/jc-ly/learn'],
  ['篇目-论语-鉴赏', '/articles/jc-ly/appreciate'],
  ['篇目-论语-考点', '/articles/jc-ly/exam'],
  ['篇目-论语-注释', '/articles/jc-ly/notes'],
  ['篇目-论语-默写', '/articles/jc-ly/moxie'],
];

const outDir = resolve(__dir, '../../vision-shots/regression-' + Date.now());
mkdirSync(outDir, { recursive: true });

const browser = await chromium.launch({ executablePath: CHROME, headless: true });
const shots = [];

for (const vp of ['desktop', 'mobile']) {
  const page = await browser.newPage({
    viewport: vp === 'mobile' ? { width: 375, height: 812 } : { width: 1280, height: 900 },
  });
  const errs = [];
  page.on('pageerror', (e) => errs.push(`PAGEERROR: ${e.message.split('\n')[0]}`));
  page.on('console', (m) => { if (m.type() === 'error') errs.push(`CONSOLE: ${m.text().split('\n')[0]}`); });

  for (const [label, path] of ROUTES) {
    const url = `${BASE}${path}`;
    const pageErrs = [];
    const collect = (e) => pageErrs.push(e);
    page.on('pageerror', collect);
    page.on('console', (m) => { if (m.type() === 'error') pageErrs.push(`CONSOLE: ${m.text().split('\n')[0]}`); });
    try {
      await page.goto(url, { waitUntil: 'networkidle' });
      await page.waitForTimeout(600);
      const file = resolve(outDir, `${vp}-${label.replace(/[/\\?]/g, '_')}.png`);
      await page.screenshot({ path: file, fullPage: false });
      const title = await page.title().catch(() => '');
      shots.push({ vp, label, path, file, title, errs: pageErrs.slice(0, 3) });
      console.log(`✓ [${vp}] ${label} ${path} ${title ? `| ${title}` : ''}${pageErrs.length ? ` | ⚠ ${pageErrs.join('; ')}` : ''}`);
    } catch (e) {
      shots.push({ vp, label, path, file: '', title: '', errs: [`LOADFAIL: ${e.message.split('\n')[0]}`] });
      console.log(`✗ [${vp}] ${label} ${path}: ${e.message.split('\n')[0]}`);
    }
    page.removeListener('pageerror', collect);
  }
  await page.close();
}

await browser.close();
writeFileSync(resolve(outDir, 'manifest.json'), JSON.stringify(shots, null, 2), 'utf8');
console.log(`\n完成: ${shots.length} 张截图 → ${outDir}`);
console.log(`清单: ${outDir}/manifest.json`);
