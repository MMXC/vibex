/**
 * Service Worker — E05 Canvas 离线模式 + F1.3-U1 离线写入队列 + S62-E5 画布数据缓存
 * Workbox 缓存策略:
 * - cacheFirst: 静态资源（JS/CSS/图片）
 * - networkFirst: API 数据
 * - Offline Queue: 非 GET 请求离线缓存，重放
 * - App Shell 预缓存
 * - E5 Canvas Cache: GET /api/canvas/* responses cached (last 5, 7-day TTL)
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
  // P005-E2: Language pack precache
  '/i18n/messages/en.json',
  '/i18n/messages/zh.json',
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

// E5-D5.5: Canvas data caching constants
const CANVAS_CACHE_NAME = 'vibex-canvas-cache-v1';
const CANVAS_DB_NAME = 'vibex-canvas-cache';
const CANVAS_DB_VERSION = 1;
const CANVAS_STORE_NAME = 'canvas-responses';
const MAX_CACHED_CANVASES = 5;
const CACHE_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

// E5-D5.5: Canvas IndexedDB helpers
function openCanvasDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(CANVAS_DB_NAME, CANVAS_DB_VERSION);
    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains(CANVAS_STORE_NAME)) {
        const store = db.createObjectStore(CANVAS_STORE_NAME, { keyPath: 'url' });
        store.createIndex('cachedAt', 'cachedAt', { unique: false });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function cacheCanvasResponse(url, responseClone) {
  const db = await openCanvasDB();
  const tx = db.transaction(CANVAS_STORE_NAME, 'readwrite');
  const store = tx.objectStore(CANVAS_STORE_NAME);

  const now = Date.now();
  const body = await responseClone.text();
  const entry = {
    url,
    body,
    status: responseClone.status,
    headers: Object.fromEntries(responseClone.headers.entries()),
    cachedAt: now,
    expiresAt: now + CACHE_TTL_MS,
  };

  return new Promise((resolve, reject) => {
    const req = store.put(entry);
    req.onsuccess = async () => {
      // Evict oldest if > MAX_CACHED_CANVASES
      await evictOldestCanvasEntries(store);
      resolve();
    };
    req.onerror = () => reject(req.error);
  });
}

async function evictOldestCanvasEntries(store) {
  return new Promise((resolve) => {
    const getAllReq = store.index('cachedAt').getAll();
    getAllReq.onsuccess = () => {
      const all = getAllReq.result;
      if (all.length <= MAX_CACHED_CANVASES) { resolve(); return; }
      const toEvict = all.sort((a, b) => a.cachedAt - b.cachedAt)
        .slice(0, all.length - MAX_CACHED_CANVASES);
      let pending = toEvict.length;
      if (pending === 0) { resolve(); return; }
      for (const item of toEvict) {
        const delReq = store.delete(item.url);
        delReq.onsuccess = () => { if (--pending === 0) resolve(); };
        delReq.onerror = () => { if (--pending === 0) resolve(); };
      }
    };
    getAllReq.onerror = () => resolve();
  });
}

async function getCachedCanvasResponse(url) {
  const db = await openCanvasDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(CANVAS_STORE_NAME, 'readonly');
    const store = tx.objectStore(CANVAS_STORE_NAME);
    const req = store.get(url);
    req.onsuccess = () => {
      const entry = req.result;
      if (!entry) { resolve(null); return; }
      if (Date.now() > entry.expiresAt) {
        // Expired — delete and return null
        const delTx = db.transaction(CANVAS_STORE_NAME, 'readwrite');
        delTx.objectStore(CANVAS_STORE_NAME).delete(url);
        resolve(null);
      } else {
        resolve(entry);
      }
    };
    req.onerror = () => reject(req.error);
  });
}

// E5-D5.5: Canvas API data cache handler
async function handleCanvasAPI(request) {
  const url = request.url;

  // Try network first
  try {
    const response = await fetch(request);
    if (response.ok) {
      // Cache the response
      cacheCanvasResponse(url, response.clone()).catch(() => {});
    }
    return response;
  } catch {
    // Network failed — try canvas cache
    const cached = await getCachedCanvasResponse(url);
    if (cached) {
      return new Response(cached.body, {
        status: cached.status,
        headers: cached.headers,
      });
    }
    // No cache — return offline error
    return new Response(
      JSON.stringify({ error: 'OFFLINE', message: '离线模式，画布数据不可用' }),
      { status: 503, headers: { 'Content-Type': 'application/json' } }
    );
  }
}

// ==================== Fetch Handler ====================

self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // E5-D5.5: Canvas API data caching (last 5 canvases, 7-day TTL)
  if (request.method === 'GET' && (
    url.pathname.startsWith('/api/canvas/') ||
    url.pathname.startsWith('/api/dds/canvas/')
  )) {
    event.respondWith(handleCanvasAPI(request));
    return;
  }

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
