import { analyzeImage, imageToDataUrl } from './vision/lib.mjs';
import { readdirSync } from 'fs';
const DIR = '.trellis/tasks/08-11-visual-audit-fix/research/shots';
const OUT = '.trellis/tasks/08-11-visual-audit-fix/research/reviews';
import { mkdirSync, writeFileSync } from 'fs';
mkdirSync(OUT, { recursive: true });
const files = readdirSync(DIR).filter((f) => f.endsWith('.png') && !f.includes('desk-home'));
const PROMPT = `你是资深 UI 审查专家。请对这张文言文闯关游戏页面截图做详细审查:
1. 总体印象
2. 布局与层级(对齐/留白/信息层级)
3. 色彩与质感(协调性/对比度/突兀颜色)
4. 视觉问题清单(逐条: 位置+问题+严重度 高/中/低)
5. 改进建议
用中文回答, 尽量具体, 标注元素在页面上的大致位置。`;
for (const f of files) {
  try {
    const dataUrl = imageToDataUrl(`${DIR}/${f}`);
    const report = await analyzeImage(dataUrl, PROMPT);
    writeFileSync(`${OUT}/${f.replace('.png', '.md')}`, report);
    console.log(`✓ ${f} (${report.length} 字)`);
  } catch (e) {
    console.log(`✗ ${f}: ${e.message?.slice(0, 80)}`);
    await new Promise((r) => setTimeout(r, 5000));
  }
  await new Promise((r) => setTimeout(r, 2000));
}
console.log('批量审查完成');
