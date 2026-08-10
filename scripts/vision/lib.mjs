/** VisionProbe 核心库: 截屏 + VLM 视觉分析 (OpenAI 兼容 API)。
 *  弥补 DeepSeek 无多模态: 任意页面截图 → VLM → 结构化视觉报告。
 *  用法见 vision.mjs CLI。 */
import { chromium } from 'playwright-core';
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dir = dirname(fileURLToPath(import.meta.url));

export const CHROME_EXE =
  process.env.PW_CHROME || '/home/truel/.cache/ms-playwright/chromium-1234/chrome-linux64/chrome';

export const DEFAULT_PROVIDER = {
  name: process.env.VISION_PROVIDER || 'bohe',
  model: process.env.VISION_MODEL || 'gemini-2.5-pro-1m',
  baseUrl: process.env.VISION_BASE_URL || 'https://x666.me/v1',
  apiKey: process.env.VISION_API_KEY || 'sk-1WENqq9ILJgH5eDtuaCHOzBWofPdrLzrFDBYF5ueOp20GGl8',
};

/** 页面截图 (desktop/mobile 双视口) → PNG 文件 */
export async function screenshot(url, outDir = 'vision-shots', viewport = 'desktop') {
  const browser = await chromium.launch({ executablePath: CHROME_EXE, headless: true });
  const page = await browser.newPage({
    viewport: viewport === 'mobile' ? { width: 375, height: 812 } : { width: 1280, height: 900 },
  });
  const errs = [];
  page.on('pageerror', (e) => errs.push(`PAGEERROR: ${e.message.split('\n')[0]}`));
  page.on('console', (m) => { if (m.type() === 'error') errs.push(`CONSOLE: ${m.text().split('\n')[0]}`); });
  await page.goto(url, { waitUntil: 'networkidle' });
  await page.waitForTimeout(700);
  mkdirSync(outDir, { recursive: true });
  const name = `${Date.now()}-${viewport}`;
  const file = resolve(outDir, `${name}.png`);
  await page.screenshot({ path: file, fullPage: false });
  const title = await page.title().catch(() => '');
  await browser.close();
  return { file, title, errs };
}

/** 读取图片 → base64 data URL */
export function imageToDataUrl(file) {
  const b64 = readFileSync(file).toString('base64');
  const mime = file.endsWith('.jpg') || file.endsWith('.jpeg') ? 'image/jpeg' : 'image/png';
  return `data:${mime};base64,${b64}`;
}

/** 调 VLM (OpenAI 兼容 chat/completions, 图片+文本) → 分析文本 */
export async function analyzeImage(imageDataUrl, prompt, provider = DEFAULT_PROVIDER) {
  const res = await fetch(`${provider.baseUrl}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${provider.apiKey}`,
    },
    body: JSON.stringify({
      model: provider.model,
      messages: [
        {
          role: 'user',
          content: [
            { type: 'text', text: prompt },
            { type: 'image_url', image_url: { url: imageDataUrl } },
          ],
        },
      ],
      max_tokens: 8192,
      temperature: 0.2,
    }),
  });
  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new Error(`VLM ${res.status}: ${body.slice(0, 300)}`);
  }
  const data = await res.json();
  const c = data?.choices?.[0]?.message?.content;
  if (Array.isArray(c)) return c.map((x) => x?.text || x?.content || '').join('');
  return String(c || '');
}

/** UI 审查提示词模板 */
export const UI_REVIEW_PROMPT = `你是一名资深 UI/UX 审查专家。请审查这张页面截图（中文学习应用），输出简洁的结构化审查报告：

## 1. 总体印象 (2-3句)
页面类型、整体观感（是否协调/精致/有风格）。

## 2. 布局与层级
- 是否存在对齐问题、元素重叠、留白不均
- 信息层级是否清晰（标题/正文/次要)

## 3. 色彩与质感
- 主色调/点缀色是否协调统一
- 对比度是否足够（文字可读性）
- 是否有刺眼或突兀的颜色

## 4. 视觉问题清单 (最重要)
列出具体问题，每条格式: 【位置】问题描述 (严重度: 高/中/低)
例如: 【顶部横幅】图标与标题间距过大，视觉松散 (低)

## 5. 改进建议 (3-5条)
优先级排序的具体优化建议。

要求：具体、可执行、基于截图实际所见，不要泛泛而谈。`;

/** 视觉描述提示词模板 (给 DeepSeek 等文本模型补充视觉上下文) */
export const DESCRIBE_PROMPT = `请详细描述这张 UI 页面截图（中文学习应用）：
- 页面结构（从上到下的区块与内容）
- 配色方案（主色/点缀色，用颜色名描述）
- 组件样式（卡片/按钮/标签的形状、圆角、阴影）
- 图标与装饰元素
- 文字排版（字号层级/字体风格）
- 整体设计风格判断

输出为结构化文本，供一个无法看图的语言模型理解该页面。`;

/** 完整流程: 截图 → VLM 分析 → 报告 */
export async function runVision({
  url,
  outDir = 'vision-shots',
  viewport = 'desktop',
  mode = 'ui-review',
  provider = DEFAULT_PROVIDER,
}) {
  const shot = await screenshot(url, outDir, viewport);
  const dataUrl = imageToDataUrl(shot.file);
  const prompt = mode === 'describe' ? DESCRIBE_PROMPT : UI_REVIEW_PROMPT;
  const analysis = await analyzeImage(dataUrl, prompt, provider);
  const meta = [
    `# VisionProbe 视觉报告`,
    ``,
    `- 页面: ${url}`,
    `- 截图: ${shot.file}`,
    `- 视口: ${viewport} | 模式: ${mode}`,
    `- VLM: ${provider.name}/${provider.model}`,
    `- 标题: ${shot.title || 'N/A'}`,
    shot.errs.length ? `- 页面错误: ${shot.errs.join('; ')}` : '- 页面错误: 无',
    ``,
    analysis,
    ``,
  ].join('\n');
  const reportFile = resolve(outDir, `${Date.now()}-report.md`);
  writeFileSync(reportFile, meta, 'utf8');
  return { report: meta, reportFile, shot };
}
