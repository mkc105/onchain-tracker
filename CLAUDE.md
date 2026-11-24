# 코인 고래 레이더 (구 온체인 트래커) — 작업 규칙
- 플레이스토어에 출시하는 앱이다. 패키지명 `com.happyfamily.onchaintracker` 은 절대 바꾸지 않는다.
- 빌드: `npm run build && npx cap sync android && cd android && ./gradlew bundleRelease assembleRelease`
  - 출시용: `android/app/build/outputs/bundle/release/app-release.aab` / 폰 테스트용: `.../apk/release/app-release.apk`
  - 업데이트할 때마다 `android/app/build.gradle` 의 versionCode 를 1씩 올리고, versionName 과 설정 화면 APP_VERSION 을 맞춘다.
  - 서명: `android/keystore.properties` + `android/upload-keystore.jks` (git 제외). 없으면 사용자에게 받는다. 새로 만들면 업데이트가 안 되니 절대 새로 만들지 않는다.
- 스토어 자료: `store/` (아이콘·그래픽·스크린샷·등록 문구)
- 앱 문구는 누구나 이해할 수 있는 쉬운 말로 쓴다. 어려운 용어는 `<Term>` 으로 설명을 붙인다.

## 아이폰판 (같은 코드 공유)
- 화면·데이터 코드(`src/`)는 안드로이드·아이폰이 함께 쓴다. 플랫폼마다 다른 부분(알림, 뒤로가기, 앱 상태)은 `src/lib/platform.ts` 에만 둔다.
- 아이폰 뒤로가기: `src/components/SwipeBack.tsx` (왼쪽 가장자리 스와이프 → 기존 `back.ts` 스택 사용). 안드로이드에서는 쓰지 않는다.
- 아이폰 웹앱(PWA): `public/manifest.webmanifest`, `public/icons/`, `src/sw.js`(빌드 시 `dist/sw.js` 로 생성). 배포: `DEPLOY_REMOTE=mine npm run deploy:pages` (내 포크 mkc105/onchain-tracker) → https://mkc105.github.io/onchain-tracker/
- 아이폰 앱(Capacitor, Xcode 필요): `ios/` 폴더. `npm run ios` 로 빌드·동기화 후 Xcode 열기. 설치 방법은 `IOS.md`.
- `vite.config.ts` 의 `base: './'` 는 Pages 하위 폴더와 앱 모두에서 동작하도록 한 것이므로 바꾸지 않는다.
