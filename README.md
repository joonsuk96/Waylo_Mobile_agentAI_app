# Waylo

**여행 조건을 입력하면 AI가 나만의 일정을 만들어주는 Android 여행 계획 앱입니다.**

유튜브 튜토리얼을 따라 시작한 프로젝트로, 화면 만들기부터 로그인, AI 연동, 데이터 저장, 실제 폰 설치까지 연결하며 개발했습니다.

## 주요 기능

- Google 계정으로 로그인
- 목적지, 여행 날짜, 인원, 예산, 관심사에 맞는 AI 여행 일정 생성
- 날짜별 일정, 예상 예산, 여행 사진과 지도 확인
- 생성한 여행을 저장하고 내 여행 목록에서 다시 보기
- AI 채팅으로 여행 관련 질문하기

## 어떻게 만들었나요?

1. **앱 화면 만들기** — TypeScript로 코드를 작성하고, React Native와 Expo로 홈·여행 입력·상세·채팅 화면을 만들었습니다.
2. **로그인 연결하기** — Clerk를 연결해 Google 계정으로 로그인하고 로그인 상태를 유지하도록 했습니다.
3. **여행 정보 저장하기** — Neon의 PostgreSQL 데이터베이스에 사용자와 여행 정보를 저장했습니다.
4. **AI 일정 만들기** — 앱의 요청을 받는 서버 API를 만들고 OpenAI와 연결했습니다. Inngest는 생성 작업을 단계별로 관리하고 오류가 나면 재시도합니다.
5. **사진과 지도 붙이기** — Unsplash에서 여행 사진을 가져오고, Photon으로 장소 좌표를 찾아 Google 지도에 표시했습니다.
6. **실제 폰에서 사용하기** — 서버를 EAS Hosting에 배포하고 Inngest Cloud를 연결했습니다. EAS Build로 설치용 APK를 만들어 컴퓨터를 꺼도 사용할 수 있도록 구성했습니다.

## 앱이 동작하는 흐름

```text
Google 로그인 → 여행 조건 입력 → AI 일정 생성 → 결과 저장 → 일정·예산·지도 확인
```

## 주요 기술

| 역할 | 사용 기술 |
|---|---|
| 언어·모바일 화면 | TypeScript, React, React Native, Expo, Expo Router |
| 화면 디자인 | NativeWind, Tailwind CSS, React Native StyleSheet |
| 로그인·데이터 저장 | Clerk, Neon PostgreSQL, Drizzle ORM |
| AI·작업 관리 | OpenAI API, Inngest, Zod |
| 지도·사진 | react-native-maps, Google Maps, Photon, Unsplash, ImageKit |
| 서버 배포·APK 제작 | EAS Hosting, EAS Build |

## 개발 환경 실행

`npm ci`로 패키지를 설치한 뒤 `.env.example`을 `.env`로 복사하고 각 서비스의 키를 설정합니다. Android SDK·JDK 등 개발 도구와 데이터베이스 설정도 필요합니다.

- 첫 Android 실행: `npm run android`
- 이후 개발 서버 실행: `npm run android:dev`
- 로컬 작업 처리 서버 실행: 별도 터미널에서 `npm run inngest`

서비스별 설정은 프로젝트의 설정 문서를 참고하세요. 실제 비밀키가 들어 있는 `.env`는 GitHub에 올리지 않습니다.

> AI 일정과 비용은 참고용 제안입니다. 실제 장소 정보와 가격은 방문 전에 확인해주세요.
