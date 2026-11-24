import { useCallback, useEffect, useRef, useState } from 'react'
import { refreshKrwRate } from './lib/api'
import { checkAlerts, useAlerts } from './lib/alerts'
import { exitApp as quitApp, isAndroid, onHardwareBack, onResume, requestNotify } from './lib/platform'
import SwipeBack from './components/SwipeBack'
import { runTopBackHandler } from './lib/back'
import type { ChainId } from './lib/chains'
import { getSettings } from './lib/store'
import { Dialog } from './components/ui'
import Home from './screens/Home'
import ChainDetail from './screens/ChainDetail'
import Watchlist from './screens/Watchlist'
import Whales from './screens/Whales'
import Insights from './screens/Insights'
import AddressDetail from './screens/AddressDetail'
import Settings from './screens/Settings'
import Privacy from './screens/Privacy'
import Glossary from './screens/Glossary'
import { TermSheet } from './components/Term'

type Tab = 'home' | 'insight' | 'whale' | 'watch' | 'settings'
type Route =
  | { name: 'chain'; id: ChainId }
  | { name: 'address'; chain: 'bitcoin' | 'ethereum'; address: string }
  | { name: 'privacy' }
  | { name: 'glossary' }

export default function App() {
  const [tab, setTab] = useState<Tab>('home')
  const [stack, setStack] = useState<Route[]>([])
  const [exitAsk, setExitAsk] = useState(false)
  const unread = useAlerts().filter((a) => !a.read).length

  // 고래 → 거래소 입금 감시 (앱 실행 중 주기적으로)
  useEffect(() => {
    const s = getSettings()
    // 안드로이드·아이폰 앱은 바로 권한을 묻고, 웹앱은 설정 화면의 버튼으로 묻는다
    if (s.alertBtc || s.alertEth || s.alertWatch) requestNotify(false)
    const first = setTimeout(() => checkAlerts(), 4000)
    const id = setInterval(() => checkAlerts(), Math.max(60, getSettings().refreshSec) * 1000)
    const off = onResume(() => checkAlerts())
    return () => { clearTimeout(first); clearInterval(id); off() }
  }, [])

  const push = (r: Route) => { setStack((s) => [...s, r]); window.scrollTo(0, 0) }
  const pop = () => setStack((s) => s.slice(0, -1))

  // 뒤로가기: 열린 창/선택·수정 모드 → 이전 화면 → 홈 탭 → (안드로이드만) 종료 확인
  const state = useRef({ stack, tab, exitAsk })
  state.current = { stack, tab, exitAsk }
  const onBack = useCallback(() => {
    if (runTopBackHandler()) return
    const s = state.current
    if (s.stack.length) { pop(); return }
    if (s.tab !== 'home') { setTab('home'); return }
    if (isAndroid) setExitAsk(true) // 아이폰은 앱 종료 확인을 띄우지 않음
  }, [])

  useEffect(() => {
    if (getSettings().currency === 'KRW') refreshKrwRate()
    if (isAndroid) return onHardwareBack(onBack)
    // 웹·아이폰: Esc 키도 뒤로가기로 사용 (스와이프는 <SwipeBack>)
    const k = (e: KeyboardEvent) => { if (e.key === 'Escape') onBack() }
    window.addEventListener('keydown', k)
    return () => window.removeEventListener('keydown', k)
  }, [onBack])

  const exitApp = () => {
    setExitAsk(false)
    quitApp()
  }

  const goTab = (t: Tab) => { setStack([]); setTab(t); window.scrollTo(0, 0) }
  const top = stack[stack.length - 1]
  let screen
  if (top?.name === 'chain') screen = <ChainDetail key={top.id} id={top.id} onBack={pop} onAddress={(chain, address) => push({ name: 'address', chain, address })} />
  else if (top?.name === 'address') screen = <AddressDetail key={top.address} chain={top.chain} address={top.address} onBack={pop} />
  else if (top?.name === 'privacy') screen = <Privacy onBack={pop} />
  else if (top?.name === 'glossary') screen = <Glossary onBack={pop} />
  else if (tab === 'home') screen = <Home onOpen={(id) => push({ name: 'chain', id })} onInsights={() => goTab('insight')} />
  else if (tab === 'insight') screen = <Insights />
  else if (tab === 'whale') screen = <Whales onAddress={(chain, address) => push({ name: 'address', chain, address })} />
  else if (tab === 'watch') screen = <Watchlist onOpen={(w) => push({ name: 'address', chain: w.chain, address: w.address })} />
  else screen = <Settings onPrivacy={() => push({ name: 'privacy' })} onGlossary={() => push({ name: 'glossary' })} />

  return (
    <div className="app">
      <main>{screen}</main>
      {!isAndroid && <SwipeBack onBack={onBack} />}
      <TermSheet onGlossary={() => { if (top?.name !== 'glossary') push({ name: 'glossary' }) }} />
      {!top && (
        <nav className="tabbar">
          {([
            ['home', '홈', 'M3 11l9-7 9 7v9a1 1 0 0 1-1 1h-5v-6h-6v6H4a1 1 0 0 1-1-1z'],
            ['insight', '분석', 'M4 20V10M10 20V4M16 20v-7M22 20H2'],
            ['whale', '고래', 'M2 13c2-5 7-7 12-6 3 .6 5 2.4 6 4l2-3v8l-2-2c-1.5 3-5 5-10 4.5C6 18 3 16 2 13zM16 11h.01'],
            ['watch', '관심 주소', 'M12 17.3l-6.2 3.7 1.6-7L2 9.2l7.1-.6L12 2l2.9 6.6 7.1.6-5.4 4.8 1.6 7z'],
            ['settings', '설정', 'M12 15.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7zM19.4 13a7.6 7.6 0 0 0 0-2l2-1.6-2-3.4-2.4 1a7.4 7.4 0 0 0-1.7-1L15 3.5h-4l-.4 2.5a7.4 7.4 0 0 0-1.7 1l-2.4-1-2 3.4L6.6 11a7.6 7.6 0 0 0 0 2l-2 1.6 2 3.4 2.4-1a7.4 7.4 0 0 0 1.7 1l.3 2.5h4l.4-2.5a7.4 7.4 0 0 0 1.7-1l2.4 1 2-3.4z'],
          ] as const).map(([t, l, d]) => (
            <button key={t} className={tab === t ? 'on' : ''} onClick={() => goTab(t)}>
              <span className="tab-ico">
                <svg viewBox="0 0 24 24" width="22" height="22"><path d={d} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" /></svg>
                {t === 'whale' && unread > 0 && <span className="tab-badge">{unread > 99 ? '99+' : unread}</span>}
              </span>
              <span>{l}</span>
            </button>
          ))}
        </nav>
      )}
      <Dialog
        open={exitAsk}
        title="앱을 종료하겠습니까?"
        onClose={() => setExitAsk(false)}
        actions={<>
          <button className="text-btn" onClick={() => setExitAsk(false)}>아니오</button>
          <button className="text-btn primary" onClick={exitApp}>예</button>
        </>}
      />
    </div>
  )
}
