# 部署说明 (深链/路由 fallback)

本项目是纯前端 SPA (React Router BrowserRouter) + PWA。**深链直访**（如直接打开 `/cards`、`/articles/jc-xxx/learn`）需要服务器把未知路径回退到 `index.html`，否则会 404。

## 推荐: 服务器 history fallback

### nginx
```nginx
location / {
  try_files $uri $uri/ /index.html;
}
```

### Vercel / Netlify
- Vercel: 项目根加 `vercel.json`
  ```json
  { "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }] }
  ```
- Netlify: `public/_redirects`（或根目录 `_redirects`）加一行
  ```
  /*  /index.html  200
  ```

## 兜底方案: public/404.html（已内置，自动生效）

当服务器**没有** history fallback 时（如 GitHub Pages 仅托静态、`python -m http.server` 等），
直接访问深链会命中 404。项目已内置 `public/404.html`：

1. 服务器返回 404.html → 脚本把目标路径存入 `localStorage.wyw_deep_link` 并跳回 `/`。
2. App 启动时 `DeepLinkRestore` 读取该值并 `navigate` 到原深链。

**无需额外配置**，`vite build` 会自动把 `404.html` 打进 `dist/`。
唯一限制: 需要先成功访问过站点一次（否则 localStorage 无该域），首次深链会落到首页。

## 构建与发布

```bash
npm run build        # 产出 dist/
npx serve dist       # 本地预览 (自带 SPA fallback)
```

> 配合 Service Worker: SW 安装后 `sw.js` 对 navigate 请求网络优先 → 缓存回退，
> 已安装 PWA 用户即使服务器无 fallback 也能正常深链（首访例外，见上）。
