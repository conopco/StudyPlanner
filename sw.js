/* 学習プランナー：オフライン動作用 Service Worker */
const CACHE = "study-planner-v5";
const ASSETS = ["./", "./index.html", "./manual.html", "./manifest.webmanifest", "./icon-192.png", "./icon-512.png", "./icon-maskable-512.png", "./apple-touch-icon.png",
  "./lib/firebase-app-compat.js", "./lib/firebase-auth-compat.js", "./lib/firebase-firestore-compat.js"];
const FONT_HOSTS = ["fonts.googleapis.com", "fonts.gstatic.com"];
self.addEventListener("install", e => { e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS))); self.skipWaiting(); });
self.addEventListener("activate", e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k))))); self.clients.claim();
});
const networkFirst = (req, key) => fetch(req).then(r => { if (r && r.ok) { const c = r.clone(); caches.open(CACHE).then(x => x.put(key || req, c)); } return r; })
  .catch(() => caches.match(key || req));
self.addEventListener("fetch", e => {
  const req = e.request; if (req.method !== "GET") return;
  const url = new URL(req.url);
  if (url.origin === location.origin) {
    // 画面本体と設定ファイルは新しい版を優先し、通信できないときは保存済みの版を使う
    if (req.mode === "navigate") { e.respondWith(networkFirst(req, "./index.html")); return; }
    if (url.pathname.endsWith("/config.js") || url.pathname.endsWith("/manual.html")) { e.respondWith(networkFirst(req)); return; }
    e.respondWith(caches.match(req).then(hit => hit || networkFirst(req)));
    return;
  }
  // 外部はフォントだけをキャッシュする（Firebaseの通信には関与しない）
  if (FONT_HOSTS.includes(url.hostname)) {
    e.respondWith(caches.match(req).then(hit => hit || fetch(req).then(r => { const c = r.clone(); caches.open(CACHE).then(x => x.put(req, c)); return r; })));
  }
});
