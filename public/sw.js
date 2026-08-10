/* 武汉中考文言文 App — Service Worker (React 版)
 * 策略: 应用壳预缓存 + 运行时 stale-while-revalidate
 *  - install: 缓存 index.html / manifest / 图标, 并解析 index.html 中
 *    引用的 hash 资源 (js/css/icons) 一并预缓存 — 首次访问后即可离线
 *  - 导航请求: 网络优先, 离线回退到缓存的 index.html
 *  - 同源静态资源: 缓存优先 + 后台更新
 */
var CACHE_PREFIX = 'wyw-shell-';
var CACHE = CACHE_PREFIX + 'v5';
var CORE = [
  './',
  './index.html',
  './manifest.webmanifest',
  './icons/icon-192.png',
  './icons/icon-512.png',
];

function absolute(u) {
  // 用 SW scope 而非 origin 解析, 支持子路径部署 (如 GitHub Pages 项目页 /repo/)
  return new URL(u, self.registration.scope).href;
}

/** 从 index.html 提取资源 URL (assets/ 与 icons/) */
function assetUrlsFrom(html) {
  var re = /(?:src|href)="([^"]+)"/g;
  var m, out = [];
  while ((m = re.exec(html))) {
    var u = m[1];
    if (!u || u.startsWith('http') || u.startsWith('#') || u.startsWith('data:')) continue;
    if (u.indexOf('assets/') >= 0 || u.indexOf('icons/') >= 0) out.push(absolute(u));
  }
  return out;
}

function fetchAndCache(cache, url) {
  return fetch(new Request(url, { cache: 'reload' })).then(function (res) {
    if (res.ok) cache.put(url, res);
    return res;
  });
}

self.addEventListener('install', function (event) {
  event.waitUntil(
    caches.open(CACHE).then(function (cache) {
      // 1) 核心壳资源
      var corePromise = Promise.all(
        CORE.map(function (url) {
          return fetchAndCache(cache, url).catch(function () { return null; });
        })
      );
      // 2) 解析 index.html 资源并预缓存
      var assetsPromise = fetch(new Request('./index.html', { cache: 'reload' }))
        .then(function (res) {
          if (!res.ok) return [];
          return res.clone().text().then(function (html) {
            var urls = assetUrlsFrom(html);
            return Promise.all(
              urls.map(function (u) { return fetchAndCache(cache, u).catch(function () { return null; }); })
            );
          });
        })
        .catch(function () { return []; });
      return Promise.all([corePromise, assetsPromise]);
    }).then(function () { return self.skipWaiting(); })
  );
});

self.addEventListener('activate', function (event) {
  event.waitUntil(
    caches.keys().then(function (keys) {
      return Promise.all(
        keys
          .filter(function (k) { return k.indexOf(CACHE_PREFIX) === 0 && k !== CACHE; })
          .map(function (k) { return caches.delete(k); })
      );
    }).then(function () { return self.clients.claim(); })
  );
});

function putCache(request, response) {
  if (!response || !response.ok || response.type === 'opaque') return Promise.resolve();
  var copy = response.clone();
  return caches.open(CACHE).then(function (cache) { return cache.put(request, copy); });
}

function offlineResponse() {
  return new Response('当前离线，请联网后再试。', {
    status: 503,
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  });
}

self.addEventListener('fetch', function (event) {
  var request = event.request;
  if (request.method !== 'GET') return;
  var url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  // 页面导航: 网络优先 → 缓存回退; 同时解析 HTML 把新资源预缓存 (后台更新)
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then(function (res) {
          var htmlCopy = res.clone();
          putCache('./index.html', htmlCopy);
          event.waitUntil(
            htmlCopy.text().then(function (html) {
              var urls = assetUrlsFrom(html);
              return caches.open(CACHE).then(function (cache) {
                return Promise.all(
                  urls.map(function (u) {
                    // 增量缓存: 已有资源跳过, 只抓新 hash 资源 (M2)
                    return cache.match(u).then(function (cached) {
                      if (cached) return null;
                      return fetchAndCache(cache, u).catch(function () { return null; });
                    });
                  })
                );
              });
            }).catch(function () {})
          );
          return res;
        })
        .catch(function () {
          return caches.match('./index.html', { ignoreVary: true }).then(function (cached) {
            return cached || offlineResponse();
          });
        })
    );
    return;
  }

  // 静态资源: 缓存优先 + 后台更新
  var cacheable = ['script', 'style', 'image', 'font', 'manifest'].indexOf(request.destination) >= 0;
  if (!cacheable) return;

  event.respondWith(
    caches.match(request, { ignoreVary: true }).then(function (cached) {
      var network = fetch(request)
        .then(function (res) {
          putCache(request, res.clone());
          return res;
        })
        .catch(function () { return null; });
      if (cached) {
        event.waitUntil(network.then(function (r) { return r && putCache(request, r); }).catch(function () {}));
        return cached;
      }
      return network.then(function (r) { return r || offlineResponse(); });
    })
  );
});
