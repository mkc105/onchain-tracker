/* 코인 고래 레이더 — 서비스 워커 (아이폰 홈 화면 웹앱용)
 * - 앱 화면(HTML·JS·CSS·아이콘)을 저장해 두어 인터넷이 없어도 앱이 열린다.
 * - 시세·온체인 데이터는 앱이 기기에 저장해 둔 "마지막 데이터"를 보여준다(src/lib/api.ts).
 * - 알림을 누르면 앱을 연다.
 * 빌드 시 vite.config.ts 가 캐시 버전과 파일 목록을 채운다.
 */
const CACHE = 'whale-radar-__BUILD__'
const ASSETS = __ASSETS__

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(ASSETS)).then(() => self.skipWaiting()))
})

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k.startsWith('whale-radar-') && k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  )
})

self.addEventListener('fetch', (e) => {
  const req = e.request
  if (req.method !== 'GET') return
  const url = new URL(req.url)
  // 외부 API 요청은 건드리지 않음 (앱이 직접 마지막 데이터를 보관)
  if (url.origin !== self.location.origin) return

  // 화면 이동: 인터넷 먼저, 안 되면 저장된 앱 화면
  if (req.mode === 'navigate') {
    e.respondWith(
      fetch(req)
        .then((res) => { const copy = res.clone(); caches.open(CACHE).then((c) => c.put('./', copy)); return res })
        .catch(() => caches.match('./', { ignoreSearch: true })),
    )
    return
  }
  // 그 외 앱 파일: 저장본 먼저 (파일 이름에 버전이 들어 있어 안전)
  e.respondWith(
    caches.match(req, { ignoreSearch: true }).then((hit) => hit || fetch(req).then((res) => {
      if (res.ok) { const copy = res.clone(); caches.open(CACHE).then((c) => c.put(req, copy)) }
      return res
    })),
  )
})

self.addEventListener('notificationclick', (e) => {
  e.notification.close()
  e.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((list) => {
      for (const c of list) if ('focus' in c) return c.focus()
      return self.clients.openWindow('./')
    }),
  )
})
