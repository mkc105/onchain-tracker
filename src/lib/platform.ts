/**
 * 플랫폼 차이를 한곳에 모은 어댑터.
 * - 안드로이드 앱 / 아이폰 앱(Capacitor): 네이티브 플러그인 사용
 * - 아이폰 홈 화면 웹앱(PWA) / 브라우저: 웹 표준 API 사용
 * 화면 코드는 이 파일의 함수만 쓰고, 어느 플랫폼인지 신경 쓰지 않는다.
 */
import { Capacitor } from '@capacitor/core'
import { App as CapApp } from '@capacitor/app'
import { LocalNotifications } from '@capacitor/local-notifications'

export const isNative = Capacitor.isNativePlatform()
export const isAndroid = Capacitor.getPlatform() === 'android'
const ua = typeof navigator !== 'undefined' ? navigator.userAgent : ''
/** 아이폰·아이패드 (네이티브 앱이든 웹이든) */
export const isIOS = Capacitor.getPlatform() === 'ios' || /iPhone|iPad|iPod/.test(ua) || (/Macintosh/.test(ua) && typeof navigator !== 'undefined' && navigator.maxTouchPoints > 1)
/** 홈 화면에 추가해서 앱처럼 실행 중인지 */
export const isStandalone = typeof window !== 'undefined' && (window.matchMedia?.('(display-mode: standalone)').matches || (navigator as { standalone?: boolean }).standalone === true)

export type NotifyState = 'granted' | 'denied' | 'default' | 'unsupported' | 'needs-install'

/** 지금 알림을 받을 수 있는 상태인지 */
export async function notifyState(): Promise<NotifyState> {
  if (isNative) {
    try {
      const p = await LocalNotifications.checkPermissions()
      return p.display === 'granted' ? 'granted' : p.display === 'denied' ? 'denied' : 'default'
    } catch { return 'unsupported' }
  }
  // 아이폰 사파리는 홈 화면에 추가한 웹앱(iOS 16.4+)에서만 알림을 지원
  if (!('Notification' in window) || !('serviceWorker' in navigator)) return isIOS && !isStandalone ? 'needs-install' : 'unsupported'
  return Notification.permission
}

/**
 * 알림 권한 요청. 아이폰 웹앱은 반드시 사용자가 버튼을 누른 직후에 호출해야 한다.
 * @param fromUserTap 사용자의 탭으로 호출됐는지 (아니면 웹에서는 묻지 않고 현재 상태만 확인)
 */
export async function requestNotify(fromUserTap = false): Promise<boolean> {
  if (isNative) {
    try {
      let p = await LocalNotifications.checkPermissions()
      if (p.display !== 'granted') p = await LocalNotifications.requestPermissions()
      return p.display === 'granted'
    } catch { return false }
  }
  if (!('Notification' in window)) return false
  if (Notification.permission === 'granted') return true
  if (!fromUserTap || Notification.permission === 'denied') return false
  try { return (await Notification.requestPermission()) === 'granted' } catch { return false }
}

let nid = Math.floor(Date.now() / 1000) % 100000

/** 휴대폰 알림 띄우기 (권한이 없으면 조용히 건너뜀) */
export async function showNotifications(items: { title: string; body: string }[]) {
  if (!items.length) return
  try {
    if (isNative) {
      if ((await LocalNotifications.checkPermissions()).display !== 'granted') return
      await LocalNotifications.schedule({ notifications: items.map((n) => ({ id: ++nid, title: n.title, body: n.body })) })
      return
    }
    if (!('Notification' in window) || Notification.permission !== 'granted' || !('serviceWorker' in navigator)) return
    // 아이폰 웹앱은 new Notification() 을 지원하지 않아 서비스 워커로 띄운다
    const reg = await navigator.serviceWorker.ready
    for (const n of items) await reg.showNotification(n.title, { body: n.body, icon: 'icons/icon-192.png', badge: 'icons/icon-192.png', tag: `n${++nid}` })
  } catch { /* 알림 실패는 무시 */ }
}

/** 앱이 다시 화면에 나타날 때 */
export function onResume(fn: () => void): () => void {
  if (isNative) {
    const sub = CapApp.addListener('appStateChange', ({ isActive }) => { if (isActive) fn() })
    return () => { sub.then((x) => x.remove()) }
  }
  const h = () => { if (document.visibilityState === 'visible') fn() }
  document.addEventListener('visibilitychange', h)
  return () => document.removeEventListener('visibilitychange', h)
}

/** 안드로이드 하드웨어 뒤로가기 버튼 */
export function onHardwareBack(fn: () => void): () => void {
  if (!isAndroid) return () => {}
  const sub = CapApp.addListener('backButton', fn)
  return () => { sub.then((x) => x.remove()) }
}

export function exitApp() {
  if (isNative) CapApp.exitApp()
  else window.close()
}

/** PWA 서비스 워커 등록 (오프라인에서도 앱 화면이 열리도록) */
export function registerServiceWorker() {
  if (isNative || !('serviceWorker' in navigator) || !import.meta.env.PROD) return
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('sw.js').catch(() => { /* 무시 */ })
  })
}
