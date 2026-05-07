/**
 * Service Worker — E05 Canvas 离线模式
 * Workbox 缓存策略
 * - cacheFirst: 静态资源（JS/CSS/图片）
 * - networkFirst: API 数据
 * - App Shell 预缓存
 */

const CACHE_NAME = 'vibex-v1';
const OFFLINE_URL = '/offline.html';

// App Shell 需要预缓存的资源
const PRECACHE_ASSETS = [
  '/',
  '/offline.html',
];

// Workbox 注册（通过 importScripts 加载 Workbox）
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(PRECACHE_ASSETS);
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME)
          .map((name) => caches.delete(name))
      );
    })
  );
  self.clients.claim();
});

// 网络请求拦截
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // skip non-GET
  if (request.method !== 'GET') return;

  // API 请求 → networkFirst（优先网络，失败时用缓存）
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(
      fetch(request).catch(() => {
        return caches.match(request).then((cached) => {
          return cached || new Response(
            JSON.stringify({ error: 'OFFLINE', message: '离线模式，API 请求不可用' }),
            { status: 503, headers: { 'Content-Type': 'application/json' } }
          );
        });
      })
    );
    return;
  }

  // 静态资源（JS/CSS/图片）→ cacheFirst
  if (
    request.destination === 'script' ||
    request.destination === 'style' ||
    request.destination === 'image' ||
    request.destination === 'font'
  ) {
    event.respondWith(
      caches.match(request).then((cached) => {
        if (cached) return cached;
        return fetch(request).then((response) => {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
          return response;
        });
      })
    );
    return;
  }

  // HTML 页面 → networkFirst with offline fallback
  if (request.destination === 'document') {
    event.respondWith(
      fetch(request).catch(() => {
        return caches.match(request).then((cached) => {
          return cached || caches.match(OFFLINE_URL) || new Response(
            '<html><body><h1>离线模式</h1><p>请检查网络连接后刷新页面。</p></body></html>',
            { headers: { 'Content-Type': 'text/html' } }
          );
        });
      })
    );
    return;
  }

  // 其他资源 → stale-while-revalidate
  event.respondWith(
    caches.match(request).then((cached) => {
      const fetchPromise = fetch(request).then((response) => {
        const clone = response.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
        return response;
      });
      return cached || fetchPromise;
    })
  );
});
