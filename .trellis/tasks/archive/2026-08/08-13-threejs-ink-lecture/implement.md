# 执行计划: three.js 水墨粒子全站 3D + 五段式讲解

## 前置
```bash
npm i three && npm i -D @types/three
npm run typecheck && npm run validate   # 基线
```

## 实施步骤

### Step 1: 3D 集成层（InkScene）
- 新建 `src/features/ink/InkScene.tsx`：InkRenderer 类（动态 import three）+ webglOK() 检测 + 2D fallback + 性能分级 + 全局单例
- 新建 `src/features/ink/ink.css`：.ink-scene/.ink-fallback 墨点动画
- 验证：页面出现 canvas（WebGL）或 .ink-fallback；主 chunk 无 three（构建检查）

### Step 2: 全站背景接入
- `App.tsx`（或 app-shell 内）挂一层 InkScene 作为全局背景（fixed 层）
- 内容 z-index 调整（现有页面内容在背景之上）
- 验证：地图/成就/关卡页/默诵列表均有 3D 背景，页面不溢出

### Step 3: 讲解模式五段式（内容扩充）
- `LectureMode.tsx`：
  - 数据编排：句子流 + 内容卡（重点字词/重点句/鉴赏/练习），词义题匹配句子 word
  - 渲染：.ink-word-card（word+释义）/ .ink-key-card（重点句+translation）/ .ink-analysis-card（analysis）/ .ink-practice-card（真题判分）
  - 进度条包含内容卡；跳过练习；TTS 朗读字词/重点句
- `article.css` 追加 .ink-* 内容卡样式（令牌色）
- 验证：讲解模式出现五段内容卡，练习可判分

### Step 4: 3D 特效
- InkRenderer 提供 burst()（粒子聚拢）
- 内容卡出现时 burst + CSS ink-pop 动画
- 验证：讲解模式内容卡有 3D 特效

### Step 5: 测试同步
- `browser-test.mjs`：
  - 首页 canvas/ink-scene 存在（或 fallback）
  - 讲解模式：字词卡/重点句卡/鉴赏卡/练习卡断言（岳阳楼记 有词义题+背诵句+鉴赏）
  - 练习可判分
- `full-flow-test.mjs`：讲解模式流程推进（跳过练习）
- `page-scan.mjs`：新路由无变化，移动端无溢出（canvas 固定层不撑破）
- `ssr-check.mjs`：three 动态 import 不破坏 SSR

### Step 6: 回归验证
```bash
npm run typecheck && npm run validate
node scripts/browser-test.mjs
node scripts/page-scan.mjs
node scripts/full-flow-test.mjs
npm run build   # 检查 three 独立 chunk, 主 chunk 无 three
```
- 截图目检：地图 3D 粒子、讲解模式内容卡 + 3D
- 移动端目检：粒子降级、无溢出

### Step 7: 部署
- commit + push + vercel --prod
- 生产验证

## 验证命令速查
- 基线：`npm run typecheck && npm run validate`
- 回归：`node scripts/browser-test.mjs` / `node scripts/page-scan.mjs` / `node scripts/full-flow-test.mjs`
- 构建：`npm run build`

## 回滚点
- Step 1-2 独立可验证（3D 背景）
- Step 3 独立可验证（五段式）
- 全完成一次 commit；线上异常 git revert（three 懒加载，回滚即恢复 2D）
