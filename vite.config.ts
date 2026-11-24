import react from '@vitejs/plugin-react'
import { readFileSync } from 'node:fs'
import { defineConfig, type Plugin } from 'vite'

/**
 * 빌드할 때 src/sw.js 를 dist/sw.js 로 내보내면서 버전 표시(__BUILD__)와 미리 저장할 파일 목록(__ASSETS__)을 채운다.
 * 새 버전을 배포하면 캐시 이름이 바뀌어 아이폰 웹앱도 새 화면으로 업데이트된다.
 */
function serviceWorker(): Plugin {
  return {
    name: 'sw-manifest',
    apply: 'build',
    generateBundle(_, bundle) {
      const files = Object.keys(bundle).filter((f) => !f.endsWith('.map'))
      const pub = ['manifest.webmanifest', 'icon.png', 'icons/icon-180.png', 'icons/icon-192.png', 'icons/icon-512.png']
      const source = readFileSync(new URL('./src/sw.js', import.meta.url), 'utf8')
        .replace('__BUILD__', Date.now().toString(36))
        .replace('__ASSETS__', JSON.stringify(['./', ...files, ...pub]))
      this.emitFile({ type: 'asset', fileName: 'sw.js', source })
    },
  }
}

// https://vite.dev/config/
export default defineConfig({
  // 상대 경로: 안드로이드/아이폰 앱과 GitHub Pages(하위 폴더) 모두에서 그대로 동작
  base: './',
  plugins: [react(), serviceWorker()],
})
