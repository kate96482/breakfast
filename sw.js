// 離線快取：沒網路也能打開網頁。只管這個網站自己的檔案；店家資料和照片照舊走網路（資料另外有存在手機裡）
const CACHE = 'breakfast-shell-v2';
const SHELL = ['./', 'index.html', 'manifest.webmanifest'];

// 安裝時，把首頁用到的樣式、程式、圖示一起存起來。
// （第一次載入網頁的時候，離線快取還沒接手，這些檔案不會自己進快取，所以要在這裡主動存）
self.addEventListener('install', (e) => {
    e.waitUntil((async () => {
        const cache = await caches.open(CACHE);
        const res = await fetch('index.html', { cache: 'reload' });
        const html = await res.clone().text();
        const assets = [...html.matchAll(/(?:href|src)="([^"#]+?\.(?:css|js|png|webmanifest)(?:\?[^"]*)?)"/g)]
            .map((m) => m[1])
            .filter((u) => !/^(?:[a-z]+:)?\/\//i.test(u));
        await cache.put('index.html', res);
        await Promise.all([...new Set([...SHELL.filter((u) => u !== 'index.html'), ...assets])].map((u) => cache.add(u)));
        await self.skipWaiting();
    })());
});

self.addEventListener('activate', (e) => {
    e.waitUntil(
        caches.keys()
            .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
            .then(() => self.clients.claim()),
    );
});

// 存進快取，並把同一個檔案的舊版本（?v= 不同）清掉
async function save(req, res) {
    if (!res || !res.ok || res.type === 'opaque') return;
    const cache = await caches.open(CACHE);
    const path = new URL(req.url).pathname;
    const keys = await cache.keys();
    await Promise.all(keys.filter((k) => new URL(k.url).pathname === path && k.url !== req.url).map((k) => cache.delete(k)));
    await cache.put(req, res.clone());
}

// 網頁本身：有網路就用最新的（最多等 4 秒），沒網路就用存起來的。
// 注意：「導覽」的請求不能再附帶其他設定，不然瀏覽器會丟錯，所以這裡改用網址重新抓
async function networkFirst(req) {
    try {
        const ctl = new AbortController();
        const timer = setTimeout(() => ctl.abort(), 4000);
        const res = await fetch(req.url, { signal: ctl.signal, credentials: 'same-origin' });
        clearTimeout(timer);
        save(req, res);
        return res;
    } catch (err) {
        return (await caches.match(req, { ignoreSearch: true })) || (await caches.match('./')) || (await caches.match('index.html')) || Response.error();
    }
}

// 樣式、程式、圖示：網址有版本號，存起來的直接用；沒有的才去抓
async function cacheFirst(req) {
    const hit = await caches.match(req);
    if (hit) return hit;
    const res = await fetch(req);
    save(req, res);
    return res;
}

self.addEventListener('fetch', (e) => {
    const req = e.request;
    if (req.method !== 'GET') return;
    const url = new URL(req.url);
    if (url.origin !== self.location.origin) return;
    e.respondWith(req.mode === 'navigate' ? networkFirst(req) : cacheFirst(req));
});
