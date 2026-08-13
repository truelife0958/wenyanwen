# 全站 3D 水墨粒子重构 + 五段式动画讲解（three.js）

## Goal

用 **three.js** 做**全站 3D 水墨粒子风**：1) 全站页面（地图/成就/关卡页/讲解模式）共享 3D 水墨粒子沉浸背景；2) 讲解模式扩为**五段式完整流程**（逐句原文译文 → 重点字词 → 重点句 → 鉴赏 → 随堂练习），全部在 3D 场景中呈现；3) 移动端/无 WebGL 环境自动降级（2D 墨韵背景），性能可控。

## 背景

- 现状：讲解模式（LectureMode）仅"逐句原文 + 段译文 + TTS"；地图/成就为 2D 墨青背景；无 three.js
- 数据源（已确认 142 关通用）：
  - 重点字词：moxie 词义默写题的 `word` + `answers`（每关 17 题左右）
  - 重点句：`article.recitation.stars`（背诵默诵句 + kind + translation）
  - 鉴赏：`article.reading.paragraphs[].analysis`（段赏析）
  - 练习题：moxie sections（原文/理解/词义/译文 各题型）
- 已确认决策：
  - **全站 3D**（地图/成就/讲解/关卡页统一 3D 水墨粒子）
  - **水墨粒子风**（墨滴/笔触粒子 + 哑金/青瓷光，贴合新中式）
  - **五段式完整流程**（讲解模式内容扩充）
  - 创建 Trellis 任务
- 环境：React 19 + Vite 8 + TypeScript；headless Chromium 支持 WebGL（软渲染）；three.js 需安装（~150KB gzip，须懒加载）

## 需求

### R1. three.js 集成层（全站 3D 基础）
- **R1.1** 安装 three.js + @types/three；**动态 import 懒加载**（主 chunk 不含 three）
- **R1.2** 通用 `InkScene` 3D 场景组件：canvas 全屏/容器内，水墨粒子系统（漂浮墨滴 + 流动），哑金/青瓷色调，相机缓慢飘移
- **R1.3** **WebGL 检测与降级**：无 WebGL（旧设备/某些环境）→ 渲染 2D CSS 墨韵背景（现有 .gx-sky 渐变 + 伪元素墨点），功能不退化
- **R1.4** 生命周期：mount 创建 renderer/scene/camera/particles，unmount 释放（dispose 几何体/材质/渲染器）；resize 适配
- **R1.5** 性能：粒子数按设备分级（桌面 ~1600 / 移动 ~500）；`powerPreference: 'low-power'`；`devicePixelRatio` 上限 2；`requestAnimationFrame` 暂停（页面不可见时）
- **R1.6** React 集成：组件 props（密度/色板/是否交互）；全局单例共享（多页面复用同一场景不重复创建）

### R2. 全站 3D 背景接入
- **R2.1** 地图首页：InkScene 作为背景（粒子墨韵），DOM 节点/路径叠加在 3D 之上（交互/布局不变）
- **R2.2** 成就墙、关卡页（历练/鉴赏/考点/注释/默诵 tab）、默诵列表：共享 3D 粒子背景
- **R2.3** 讲解模式：3D 场景 + 内容卡粒子特效（字词/重点句卡片出现时粒子聚拢动画）
- **R2.4** 深色页面统一：3D 粒子背景与现有墨青底无缝融合（半透明 canvas 叠加）

### R3. 讲解模式五段式流程（内容扩充）
- **R3.1** 数据编排：LectureMode 句子流中按位置插入内容卡——
  - **重点字词卡**：当前句涉及词义题（题干/word 匹配句子）→ 显示 `word`（大字）+ `answers`（释义）+ 例句
  - **重点句卡**：句子命中 `recitation.stars` → 高亮 + "重点句" 徽章 + translation 讲解
  - **鉴赏卡**：段结束 → 该段 `analysis` 赏析展示
  - **随堂练习卡**：流程末尾 → 本关 moxie 真题（逐题可答、自动判分、答案展示）
- **R3.2** 流程顺序：逐句原文+译文 →（句中遇重点字词/重点句插入）→（段后鉴赏）→ 全部句子后随堂练习 → "本关讲解完毕"
- **R3.3** 3D 呈现：内容卡出现时粒子聚拢/墨点扩散动画（three.js 粒子 + CSS 过渡结合）；卡片水墨描边、金色强调
- **R3.4** 控制条适配：进度条显示总步骤（句子+内容卡）；可跳过练习卡；TTS 对字词/重点句也可朗读
- **R3.5** 无数据降级：某关无词义题/无背诵句 → 自动跳过对应卡（数据驱动不空转）

### R4. 性能与降级
- **R4.1** three.js 仅懒加载（进入地图/讲解时动态 import）
- **R4.2** 无 WebGL：2D 墨韵背景（CSS 动画墨点），讲解内容照常（五段式不依赖 3D）
- **R4.3** 移动端粒子降级 + 关闭高成本特效
- **R4.4** 首屏 chunk 检查：主 chunk 不含 three

### R5. 测试与验证
- **R5.1** 回归全绿：typecheck + validate + browser-test + page-scan + full-flow-test
- **R5.2** 新增断言：3D canvas 容器存在（或 2D fallback）、五段式内容卡（字词/重点句/鉴赏/练习）出现、练习可判分、讲解流程可推进
- **R5.3** 截图目检：地图 3D 粒子背景、讲解模式内容卡 + 3D 场景
- **R5.4** validate 段 11 CSS hex gate（新增 CSS 走令牌）

## 验收标准

1. 全站页面有 3D 水墨粒子背景（WebGL 可用时），无 WebGL 时优雅降级 2D 墨韵
2. three.js 懒加载，首屏主 chunk 不含 three
3. 讲解模式五段式：逐句 → 重点字词（word+释义）→ 重点句（背诵句+讲解）→ 鉴赏（analysis）→ 随堂练习（真题判分）
4. 内容卡有 3D 粒子/墨韵动画呈现，水墨粒子风格与新中式一致
5. 移动端/无 WebGL 性能可控（粒子降级/2D fallback）
6. 回归全绿（typecheck/validate/80/101/48）+ build + ssr
7. 部署 Vercel 后线上验证
