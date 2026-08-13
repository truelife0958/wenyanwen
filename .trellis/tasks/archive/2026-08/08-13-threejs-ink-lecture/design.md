# 设计: three.js 水墨粒子全站 3D + 五段式讲解

## 1. 架构

### 1.1 three.js 依赖
```bash
npm i three
npm i -D @types/three
```
- 版本：three ~0.16x（React 19 兼容，无特殊集成需求，直接命令式 API）
- 懒加载：所有 three 相关 `import()` 动态加载 → 独立 chunk `three`（Vite 自动 code-split）

### 1.2 集成层 `InkScene`（src/features/ink/InkScene.tsx）
```
InkScene (React 组件)
  ├ 容器 div.ink-scene (absolute, z-index 背景层)
  ├ dynamic import('three') → 初始化 InkRenderer
  └ WebGL 不可用 → render 2D 墨韵 (CSS 伪元素墨点 + .gx-sky 渐变)
```

**InkRenderer 核心**（命令式类，脱离 React 生命周期）：
```ts
class InkRenderer {
  constructor(canvas) {
    scene = new Scene(); camera = new PerspectiveCamera(60, w/h, 0.1, 100);
    renderer = new WebGLRenderer({ canvas, alpha: true, antialias: false, powerPreference: 'low-power' });
    // 粒子系统: BufferGeometry + PointsMaterial (墨滴: 半透明深灰金)
    // 双粒子层: 远景墨点(大/慢/淡) + 近景金尘(小/快/亮)
  }
  setDensity(n); resize(); start(); stop(); dispose();
}
```

**粒子视觉**（水墨粒子风）：
- 墨滴粒子：`PointsMaterial({ size, transparent, opacity: 0.25, color: #8a7440 哑金褐 / #4a8f84 青瓷 / #ece4d2 米白 })`，随机颜色混合
- 运动：`onBeforeRender` 中更新 position（缓慢漂浮 + 旋转 + 视差）
- 相机：`camera.position.z` 缓慢呼吸 + 水平微飘移

### 1.3 WebGL 检测
```ts
function webglOK(): boolean {
  try { const c = document.createElement('canvas'); return !!(c.getContext('webgl2') || c.getContext('webgl')); } catch { return false; }
}
```
- false → 组件渲染 `.ink-fallback`（CSS 动画墨点：多个 radial-gradient 圆点漂浮）

### 1.4 性能分级
```ts
const isMobile = matchMedia('(max-width: 768px)').matches || navigator.maxTouchPoints > 1;
density = isMobile ? 500 : 1600;
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
visibilitychange → stop/start rAF
```

### 1.5 全局单例
- `InkScene` 挂载时若已有实例（module 级），复用之；多页面切换（React Router）不重建 → 减少 GC/卡顿
- 页面不可见时 rAF 暂停

## 2. 全站接入

| 页面 | 接入方式 |
|---|---|
| 地图首页 `/` | InkScene 背景层 + 现有 DOM 节点/路径叠加（z-index: ink 0 / map 1） |
| 成就墙 /achievements | InkScene 背景 |
| 关卡页五 tab | InkScene 背景（容器 .workspace 相对定位） |
| 讲解模式 | InkScene（全屏覆盖层内）+ 内容卡粒子特效 |
| 默诵列表 /moxie | InkScene 背景 |

- 背景层：`.ink-scene { position: fixed/absolute; inset: 0; z-index: 0; pointer-events: none; }`
- 内容层 `z-index: 1+`；页面保持 `overflow-x: hidden`（canvas 不撑破）
- 半透明 canvas + 墨青渐变底 → 无缝融合

## 3. 讲解模式五段式

### 3.1 数据编排（LectureMode 内）
```
steps = 句子流（现有 splitSentences）+ 内容卡
为每个句子附加 content:
  - wordCard: 词义题 (moxie 词义默写 items) 匹配当前句
     匹配规则: 词义题的 q 题干包含该句的【字】(word) 或题干文本与该句重叠
  - keySentence: 句子命中 recitation.stars (归一化匹配)
每段结束 → analysisCard (该段 analysis)
全部句子后 → practiceCard (本关 moxie 题列表)
```
- 匹配：词义题 `q` 含 `【xxx】`，若 `word` 出现在句子文本 → 关联
- 词义题从 moxie data 取：`findMoxieArticle(articleId).sections` 找 `词义默写`

### 3.2 内容卡渲染
- **重点字词卡** `.ink-word-card`：`word` 大字（金色衬线）+ 释义 answers + 原文例句
- **重点句卡** `.ink-key-card`：句文本 + "重点句" 朱砂徽章 + translation + 讲解说明
- **鉴赏卡** `.ink-analysis-card`：段赏析 analysis（金色左边线 + 水墨背景）
- **练习卡** `.ink-practice-card`：逐题（题干 + 输入 + 对答案 + 判分展示），复用判分逻辑（normAnswer/matchAnswer）

### 3.3 3D 特效
- 内容卡出现：粒子聚拢动画——InkRenderer 提供 `burst(x, y)`（临时生成一圈粒子向中心聚拢扩散）；CSS 卡片 `ink-pop` 淡入 + scale
- 水墨描边：卡片 `border` 半透明哑金 + `::before` 墨点纹理（radial-gradient）

### 3.4 控制与进度
- 进度条：`step` 总数 = 句子数 + 内容卡数；`n/总` 更新
- 控制条：播放/暂停/⏮⏭/进度 range/语速 + 练习卡"跳过"按钮
- TTS：句子朗读照旧；重点字词卡朗读 word，重点句卡朗读句子（speak）

## 4. 性能与降级

| 场景 | 策略 |
|---|---|
| 桌面 WebGL | 1600 粒子 + 双粒子层 + 相机飘移 |
| 移动 WebGL | 500 粒子 + 单粒子层 + 低 DPR |
| 无 WebGL | 2D CSS 墨点背景（.ink-fallback）+ 内容照常 |
| 讲解模式 | 粒子 + burst 特效（移动端关闭 burst） |
| 页面隐藏 | rAF 暂停 |

- 首屏：InkScene 动态 import three → 主 chunk 不含 three（构建后检查）

## 5. 文件清单

| 文件 | 内容 |
|---|---|
| `src/features/ink/InkScene.tsx` | InkScene 组件 + InkRenderer 类（动态 import three） |
| `src/features/ink/ink.css` | .ink-scene/.ink-fallback/墨点动画 + 内容卡样式 |
| `src/features/game/LevelMap.tsx` | 接入 InkScene 背景 |
| `src/features/game/Achievements.tsx` | 接入背景 |
| `src/App.tsx` 或全局布局 | 全站背景接入（app-shell 内一层 InkScene） |
| `src/features/learning/LectureMode.tsx` | 五段式数据编排 + 内容卡渲染 + 3D 特效 |
| `src/features/learning/article.css` | 内容卡样式（.ink-*） |

## 6. 风险与对策

| 风险 | 对策 |
|---|---|
| three 包体大 | 动态 import 懒加载（独立 chunk）；首屏检查 |
| WebGL 不可用 | webglOK() 检测 → 2D 墨韵 fallback |
| 全站粒子性能 | 设备分级 + DPR 上限 + 隐藏暂停 + 全局单例 |
| 五段式匹配不准 | 词义题按 word 归一化匹配句子；无匹配自动跳过 |
| headless 测试 | WebGL 软渲染可用；断言 canvas/fallback 容器存在，不断言具体渲染 |
| validate hex gate | 新增 CSS 全部令牌/已存色值 |
