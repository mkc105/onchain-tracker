import type { CapacitorConfig } from '@capacitor/cli'

const config: CapacitorConfig = {
  appId: 'com.happyfamily.onchaintracker',
  appName: '코인 고래 레이더',
  webDir: 'dist',
  backgroundColor: '#0b0e14',
  plugins: {
    // 아이폰 앱: 앱이 켜져 있을 때도 알림 배너를 보여줌
    LocalNotifications: { presentationOptions: ['banner', 'list', 'sound'] },
    SystemBars: { insetsHandling: 'css', style: 'DARK', initialViewportFitValueHint: 'cover' },
  },
  android: {
    allowMixedContent: false,
  },
  ios: {
    // 화면은 노치·홈 바까지 꽉 채우고, 여백은 CSS(safe-area)로 처리
    contentInset: 'never',
    backgroundColor: '#0b0e14',
    scheme: 'App',
  },
}

export default config
