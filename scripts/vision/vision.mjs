#!/usr/bin/env node
/** VisionProbe CLI — 本地视觉大模型封装 (弥补 DeepSeek 多模态缺陷)
 *
 * 用法:
 *   node scripts/vision/vision.mjs <url>                       # UI 审查 (默认桌面)
 *   node scripts/vision/vision.mjs <url> --mobile              # 移动端视口
 *   node scripts/vision/vision.mjs <url> --mode describe       # 视觉描述 (供文本模型理解)
 *   node scripts/vision/vision.mjs <file.png>                  # 分析已有截图
 *   node scripts/vision/vision.mjs <url> --all                 # 桌面+移动 双视口审查
 *
 * 环境变量: VISION_PROVIDER / VISION_MODEL / VISION_BASE_URL / VISION_API_KEY
 */
import { runVision, analyzeImage, imageToDataUrl, DEFAULT_PROVIDER } from './lib.mjs';

const args = process.argv.slice(2);
const target = args.find((a) => !a.startsWith('--'));
const opts = {
  mobile: args.includes('--mobile'),
  mode: args.includes('--describe') ? 'describe' : args.includes('--mode')
    ? args[args.indexOf('--mode') + 1] || 'ui-review' : 'ui-review',
  all: args.includes('--all'),
};

if (!target) {
  console.error('用法: node scripts/vision/vision.mjs <url 或 截图文件> [--mobile] [--mode ui-review|describe] [--all]');
  process.exit(1);
}

console.log(`🔍 VisionProbe: ${target} (视口=${opts.all ? '桌面+移动' : opts.mobile ? '移动' : '桌面'}, 模式=${opts.mode})`);

try {
  if (opts.all) {
    for (const vp of ['desktop', 'mobile']) {
      console.log(`\n=== ${vp} ===`);
      const r = await runVision({ url: target, viewport: vp, mode: opts.mode });
      console.log(`截图: ${r.shot.file}`);
      console.log(r.report.split('\n').slice(0, 6).join('\n'));
      console.log(`\n完整报告: ${r.reportFile}`);
    }
  } else if (/\.(png|jpe?g|webp)$/i.test(target)) {
    // 分析已有截图
    const analysis = await analyzeImage(imageToDataUrl(target), opts.mode === 'describe'
      ? (await import('./lib.mjs')).DESCRIBE_PROMPT
      : (await import('./lib.mjs')).UI_REVIEW_PROMPT);
    console.log('\n' + analysis);
  } else {
    const r = await runVision({ url: target, viewport: opts.mobile ? 'mobile' : 'desktop', mode: opts.mode });
    console.log(`截图: ${r.shot.file} | 页面错误: ${r.shot.errs.length ? r.shot.errs.join('; ') : '无'}`);
    console.log('\n' + analysisTail(r.report));
    console.log(`\n完整报告: ${r.reportFile}`);
  }
  console.log(`\nVLM: ${DEFAULT_PROVIDER.name}/${DEFAULT_PROVIDER.model}`);
} catch (e) {
  console.error(`✗ VisionProbe 失败: ${e.message}`);
  process.exit(1);
}

function analysisTail(report) {
  const idx = report.indexOf('## 1.');
  return idx >= 0 ? report.slice(idx) : report;
}
