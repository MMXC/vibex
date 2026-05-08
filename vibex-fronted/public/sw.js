/**
 * Service Worker — E05 Canvas 离线模式 + F1.3-U1 离线写入队列
 * Workbox 缓存策略:
 * - cacheFirst: 静态资源（JS/CSS/图片）
 * - networkFirst: API 数据
 * - Offline Queue: 非 GET 请求离线缓存，重放
 * - App Shell 预缓存
 */

const CACHE_NAME = 'vibex-v1';
const OFFLINE_URL = '/offline.html';
const DB_NAME = 'vibex-offline';
const DB_VERSION = 1;
const STORE_NAME = 'request-queue';
const MAX_RETRIES = 3;

// App Shell 需要预缓存的资源
const PRECACHE_ASSETS = [
  '/',
  '/offline.html',
];

// ==================== IndexedDB Helpers (Service Worker) ====================

function openDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

function dbTransaction(mode) {
  return openDB().then((db) => {
    const tx = db.transaction(STORE_NAME, mode);
    return tx.objectStore(STORE_NAME);
  });
}

async function enqueueRequest(req) {
  const store = await dbTransaction('readwrite');
  const timestamp = Date.now();
  const id = `${timestamp}-${req.method}-${req.url}`;
  return new Promise((resolve, reject) => {
    const request = store.add({
      id,
      url: req.url,
      method: req.method,
      body: req.body,
      headers: req.headers,
      timestamp,
      retryCount: 0,
    });
    request.onsuccess = () => resolve(id);
    request.onerror = () => reject(request.error);
  });
}

async function dequeueRequest(id) {
  const store = await dbTransaction('readwrite');
  return new Promise((resolve, reject) => {
    const request = store.delete(id);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

async function getQueuedRequests() {
  const store = await dbTransaction('readonly');
  return new Promise((resolve, reject) => {
    const request = store.index('timestamp').getAll();
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function incrementRetryCount(id) {
  const store = await dbTransaction('readwrite');
  return new Promise((resolve, reject) => {
    const getReq = store.get(id);
    getReq.onsuccess = () => {
      const req = getReq.result;
      if (req) {
        req.retryCount += 1;
        const putReq = store.put(req);
        putReq.onsuccess = () => resolve();
        putReq.onerror = () => reject(putReq.error);
      } else {
        resolve();
      }
    };
    getReq.onerror = () => reject(getReq.error);
  });
}

// ==================== Install ====================

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

// ==================== Fetch Handler ====================

self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests — intercept for offline queue
  if (request.method !== 'GET') {
    const isEnabled = self.registration.active?.scriptURL?.includes('sw.js') !== false;
    if (!isEnabled) return;

    // Check if online; if offline, queue the request
    if (!navigator.onLine) {
      event.waitUntil(
        enqueueRequest({
          url: request.url,
          method: request.method,
          body: request.body ? JSON.stringify(request.body) : null,
          headers: Object.fromEntries(request.headers.entries()),
        }).then(() => {
          // Return 202 Accepted response to indicate queued
          return new Response(
            JSON.stringify({ queued: true, message: '请求已缓存，将在恢复网络后重放' }),
            {
              status: 202,
              headers: { 'Content-Type': 'application/json' },
            }
          );
        })
      );
      event.respondWith(Promise.resolve(
        new Response(
          JSON.stringify({ queued: true, message: '请求已缓存，将在恢复网络后重放' }),
          {
            status: 202,
            headers: { 'Content-Type': 'application/json' },
          }
        )
      ));
      return;
    }
    return;
  }

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

// ==================== Online Handler (Replay Queue) ====================

self.addEventListener('online', async () => {
  // Replay queued requests when coming back online
  const requests = await getQueuedRequests();
  if (!requests || requests.length === 0) return;

  for (const req of requests) {
    try {
      const response = await fetch(req.url, {
        method: req.method,
        headers: req.headers,
        body: req.body,
        cache: 'no-cache',
        credentials: 'include',
      });

      if (response.ok || response.status === 409) {
        // Success or already processed — dequeue
        await dequeueRequest(req.id);
      } else {
        // Retry
        if (req.retryCount < MAX_RETRIES) {
          await incrementRetryCount(req.id);
        } else {
          // Max retries reached — discard
          await dequeueRequest(req.id);
        }
      }
    } catch {
      // Network error — increment retry
      if (req.retryCount < MAX_RETRIES) {
        await incrementRetryCount(req.id);
      } else {
        await dequeueRequest(req.id);
      }
    }
  }

  // Notify clients of replay completion
  const clients = await self.clients.matchAll();
  clients.forEach((client) => {
    client.postMessage({ type: 'REPLAY_COMPLETE' });
  });
});
