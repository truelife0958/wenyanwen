# 设计：初三向 UI 动效重构 + 依赖激进升级

## 设计原则

1. **升级先行、回归兜底**：先升依赖并全量回归，确认零破坏后再做 UI/动效，避免叠加变量
2. **动效只动画合成属性**（transform/opacity），时长 ≤300ms，统一 easing 令牌；`prefers-reduced-motion` 全降级
3. **组件复用优先**：先抽组件再改页面，页面只消费共享组件
4. **备考专注**：动效服务于反馈与节奏，不做装饰性动画

## WS1 依赖升级（先行）

| 包 | 目标版本 | 关键适配点 |
|---|---|---|
| react / react-dom | 19.2.8 | createRoot 已用；useRef 带参；无 ReactDOM.render 调用 |
| @types/react / @types/react-dom | 19.2.x | JSX 命名空间变化（React.JSX）、children 类型 |
| vite | 8.2.1 | Node 24 ✓；config 兼容；manualChunks 保留 |
| @vitejs/plugin-react | 6.0.5 | Vite 8 配套 |
| react-router-dom | 7.18.2 | v7 薄壳 re-export react-router；NavLink className 回调签名兼容；HashRouter 保留 |
| typescript | 5.9.3 保持 | |

适配关注：
- ssr-check.mjs 用 react-dom/server renderToString → v19 保留
- MemoryRouter/Routes/Route/NavLink/useParams/useNavigate/useLocation 均在 RR7 可用
- plugin-react 6 的 fastRefresh 行为（dev 模式）

## WS2 动效系统（global.css 统一）

新增动画令牌与工具类：
- `--dur-press: 0.12s` / `--dur-move: 0.22s` / `--dur-enter: 0.3s`
- `.btn:active { transform: scale(0.96); }`（按压）
- `.card-lift:hover { transform: translateY(-2px); }`（悬浮，transform-only）
- `.view-enter` 增强 + `.stagger > *`（子元素依次入场，nth-child 延迟）
- `.progress-anim`（进度条宽度过渡）
- 翻卡/评分按钮反馈
- `@media (prefers-reduced-motion: reduce)`：全部 animation/transition 时长归零或禁用位移

## WS3 加载速度

- App.tsx 中 Flashcards 改为 lazy 加载（首屏只留 Home）
- vite build.target: 'es2022'（现代浏览器，压缩率略升）
- 保持 manualChunks；确认产物 gzip 对比

## WS4 可复用组件

| 组件 | 内容 | 消费方 |
|---|---|---|
| `components/ui/PageHeader.tsx` | breadcrumb + 标题 + 徽章 + 元信息行 + 右侧操作区 | ArticlePage、CollectionsPage |
| `components/ui/EmptyState.tsx` | 图标/标题/说明/操作按钮 | Home、ReviewTab、Collections、Practice |
| `components/ui/TagChip.tsx` | 徽章/题型/状态标签（pill 统一） | ReviewTab、PracticeSession、ArticlePage |
| `components/QuestionCard.tsx` | 题干 + 答案折叠 + 标记错题（抽取自 ReviewTab） | ReviewTab（未来 Practice 复用题干渲染） |

## WS5 页面细节（初三向）

- 学习页：原文行高 2.0、重点词下点线、段落 hover 提示译文按钮微动
- 练习页：选项选中→提交→正确/错误反馈动效（scale + 色变）；提交按钮 disabled 态
- 首页：搜索聚焦 ring、进度条动画、卡片 hover 悬浮
- 字词卡：翻面过渡（rotateY 或 fade）、评分按钮按压
- 全局：`:focus-visible` 统一 outline；reduced-motion 降级

## 验证

- 升级回归：`npm run check` + page-scan + browser-test（升级后立即跑）
- 动效验证：browser-test 新增「按钮 active 有 transform」「reduced-motion 时 view-enter 无动画」断言
- 产物对比：记录升级前后 dist gzip 总量
- 手工 smoke：dev server 打开各页确认动效流畅

## 回滚

- `/tmp/wyw-backup-pre-upgrade/project.tar.gz`（含 package.json/package-lock 与源码）
- 依赖问题：`npm install <old versions>` 或解包备份
- 动效/组件改动：逐文件 replace undo
