import { useEffect, useRef, useState } from 'react'

/**
 * 아이폰식 뒤로가기: 화면 왼쪽 가장자리에서 오른쪽으로 쓸면 onBack 호출.
 * 손가락을 따라 "‹" 표시가 나오고, 충분히 끌면 진해지며 손을 떼는 순간 동작한다.
 * (안드로이드는 시스템 뒤로가기 버튼을 쓰므로 App 에서 이 컴포넌트를 쓰지 않는다)
 */
const EDGE = 28 // 가장자리로 인정하는 폭(px)
const TRIGGER = 72 // 이만큼 끌면 뒤로가기

export default function SwipeBack({ onBack }: { onBack: () => void }) {
  const [drag, setDrag] = useState<{ x: number; y: number } | null>(null)
  const ref = useRef({ onBack, start: null as null | { x: number; y: number }, active: false })
  ref.current.onBack = onBack

  useEffect(() => {
    const r = ref.current
    const down = (e: TouchEvent) => {
      const t = e.touches[0]
      if (e.touches.length !== 1 || t.clientX > EDGE) { r.start = null; return }
      r.start = { x: t.clientX, y: t.clientY }
      r.active = false
    }
    const move = (e: TouchEvent) => {
      if (!r.start) return
      const t = e.touches[0]
      const dx = t.clientX - r.start.x
      const dy = t.clientY - r.start.y
      if (!r.active) {
        if (Math.abs(dy) > 12 && Math.abs(dy) > Math.abs(dx)) { r.start = null; return } // 세로 스크롤이면 포기
        if (dx > 10) r.active = true
      }
      if (r.active) {
        if (e.cancelable) e.preventDefault()
        setDrag({ x: Math.max(0, dx), y: t.clientY })
      }
    }
    const up = (e: TouchEvent) => {
      if (r.start && r.active) {
        const t = e.changedTouches[0]
        if (t.clientX - r.start.x >= TRIGGER) r.onBack()
      }
      r.start = null; r.active = false
      setDrag(null)
    }
    window.addEventListener('touchstart', down, { passive: true })
    window.addEventListener('touchmove', move, { passive: false })
    window.addEventListener('touchend', up)
    window.addEventListener('touchcancel', up)
    return () => {
      window.removeEventListener('touchstart', down)
      window.removeEventListener('touchmove', move)
      window.removeEventListener('touchend', up)
      window.removeEventListener('touchcancel', up)
    }
  }, [])

  if (!drag) return null
  const p = Math.min(1, drag.x / TRIGGER)
  return (
    <div
      className={'swipe-back' + (p >= 1 ? ' ready' : '')}
      style={{ top: drag.y - 22, transform: `translateX(${Math.min(drag.x, TRIGGER + 16) * 0.6 - 30}px)`, opacity: 0.35 + p * 0.65 }}
      aria-hidden="true"
    >‹</div>
  )
}
