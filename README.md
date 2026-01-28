# Localhost - 멀티플레이어 뮤직 퀴즈 게임

Next.js, Express, Socket.io, Three.js로 만든 실시간 멀티플레이어 뮤직 퀴즈 게임입니다. 노래 맞추기, 사투리 가사 맞추기 등을 즐기고 3D 인터랙티브 환경에서 플레이할 수 있습니다.

**프로덕션:** [http://l0calh0st.cloud:3000](http://l0calh0st.cloud:3000) (도메인 적용 시)

### [Localhost](http://Localhost) 이름의 의미

- **Local** (사투리/지역) + **Host** (주최자/DJ)
- *"사투리와 음악을 주최하는 사람들"*
- 개발자들에게 익숙한 **localhost**라는 이름을 쓰면, 서비스 이름만 봐도 친숙하게 느껴지도록 하려는 의미도 담겨 있습니다.

## 🎮 주요 기능

- **멀티플레이어 게임방**: 친구와 함께 방을 만들거나 참가
- **노래 맞추기**: 음원을 듣고 제목 맞추기
- **사투리 가사 맞추기**: 사투리 가사를 듣고 노래 맞추기
- **3D 인터랙티브 환경**: Three.js 기반 3D 게임 경험
- **회원 인증**: 카카오, 구글, 이메일/비밀번호 로그인 지원
- **상점**: 게임 내 화폐(Beats)로 스킨, 이펙트, 이모지 구매
- **유저 프로필**: 레벨, 비트, 게임 통계 확인
- **실시간 채팅**: 게임 중 다른 플레이어와 대화

## 🛠️ 기술 스택

### 프론트엔드
- **Next.js 16** - App Router 기반 React 프레임워크
- **React 19** - UI 라이브러리
- **Three.js** - 3D 그래픽 및 렌더링
- **React Three Fiber** - Three.js용 React 렌더러
- **Socket.io Client** - 실시간 통신
- **Tailwind CSS** - 스타일링
- **TypeScript** - 타입 안정성

### 백엔드
- **Express.js** - 웹 서버 프레임워크
- **Socket.io** - 실시간 양방향 통신
- **Prisma** - DB ORM
- **PostgreSQL** - 메인 데이터베이스
- **Redis** - 세션 및 실시간 상태 관리
- **TypeScript** - 타입 안정성

### 인프라
- **Docker** - 컨테이너화
- **Docker Compose** - 멀티 컨테이너 오케스트레이션

## 📋 필요 환경

- **Node.js** 20 이상, npm
- **Docker**, **Docker Compose**
- **PostgreSQL** 15 이상 (Docker 사용 가능)
- **Redis** (Docker 사용 가능)
- **FFmpeg** (MP3 처리용)
- **yt-dlp** (노래 다운로드용)

## 🚀 시작하기

### 1. 저장소 클론

```bash
git clone <저장소-url>
cd localhost
```

### 2. 환경 변수 설정

프로젝트 루트에 `.env` 파일을 만들고 아래 내용을 참고해 설정합니다 (`.env.example`이 있으면 복사 후 수정):

```bash
cp .env.example .env
```

`.env` 예시:

```env
# 브라우저에서 백엔드/소켓 연결용
NEXT_PUBLIC_BACKEND_URL=http://localhost:3001
NEXT_PUBLIC_SOCKET_URL=http://localhost:3001

# 사투리 TTS용 ElevenLabs API 키
ELEVENLABS_API_KEY=your_api_key_here
```

### 3. 백엔드 설정

백엔드 디렉터리로 이동:

```bash
cd backend
npm install
```

데이터베이스 설정:

```bash
# Prisma 클라이언트 생성
npm run prisma:generate

# DB 마이그레이션 실행
npm run prisma:migrate

# (선택) 초기 데이터 시드
npm run seed:songs
```

`backend` 디렉터리에 `.env` 파일 생성:

```env
DATABASE_URL="postgresql://admin:1234@localhost:5432/localhost_db"
PORT=3001
NODE_ENV=development
```

### 4. 프론트엔드 설정

프론트엔드 디렉터리로 이동:

```bash
cd frontend
npm install
```

`frontend` 디렉터리에 `.env.local` 파일 생성:

```env
NEXT_PUBLIC_BACKEND_URL=http://localhost:3001
NEXT_PUBLIC_SOCKET_URL=http://localhost:3001
ELEVENLABS_API_KEY=your_api_key_here
```

### 5. 노래 다운로드 (선택)

노래 맞추기 게임을 쓰려면 MP3 파일이 필요합니다:

```bash
cd backend
npm run download:songs
```

노래는 장르별로 `backend/songs` 디렉터리에 저장됩니다.

## 🏃 로컬 실행

### 방법 1: Docker Compose (권장)

Docker로 전체 서비스 실행:

```bash
# 프로젝트 루트에서
docker-compose up --build
```

실행되는 서비스:
- PostgreSQL: `5432`
- Redis: `6379`
- 백엔드 API: `3001`
- 프론트엔드: `3000`

### 방법 2: 수동 실행

#### DB 서비스만 실행

```bash
# PostgreSQL, Redis만 Docker로 실행
docker-compose up postgres redis -d
```

#### 백엔드 실행

```bash
cd backend
npm run dev
```

백엔드: `http://localhost:3001`

#### 프론트엔드 실행

```bash
cd frontend
npm run dev
```

프론트엔드: `http://localhost:3000`

## 🐳 Docker 배포

운영 배포 방법은 [DEPLOY.md](./DEPLOY.md)를 참고하세요.

간단 배포:

```bash
# 환경 변수 설정
cp .env.example .env
# .env에서 EC2 IP 등 수정

# 빌드 후 컨테이너 실행
docker-compose up --build -d

# 로그 확인
docker-compose logs -f
```

## 📁 프로젝트 구조

```
localhost/
├── backend/                 # Express.js 백엔드 서버
│   ├── prisma/             # DB 스키마 및 마이그레이션
│   ├── songs/              # 장르별 MP3 파일
│   ├── server.ts           # 메인 서버 진입점
│   └── package.json
├── frontend/               # Next.js 프론트엔드
│   ├── app/                # Next.js App Router 페이지
│   │   ├── auth/           # 로그인·회원가입
│   │   ├── game/           # 게임 (노래 맞추기, 사투리 퀴즈)
│   │   ├── main/           # 로비, 상점, 마이페이지 등
│   │   └── page.tsx        # 루트 페이지
│   └── package.json
├── docker-compose.yml      # Docker 서비스 설정
├── .env.example            # 환경 변수 예시 (없으면 README 내용 참고)
└── README.md
```

## 🎯 사용 가능한 스크립트

### 백엔드

```bash
npm run dev              # 개발 서버 (핫 리로드)
npm run start            # 프로덕션 서버
npm run prisma:generate  # Prisma 클라이언트 생성
npm run prisma:migrate   # DB 마이그레이션
npm run prisma:studio    # Prisma Studio (DB GUI)
npm run seed:songs       # 노래 데이터 시드
npm run download:songs  # 게임용 MP3 다운로드
```

### 프론트엔드

```bash
npm run dev              # 개발 서버
npm run build            # 프로덕션 빌드
npm run start            # 프로덕션 서버
npm run lint             # ESLint 실행
```

## 🔧 설정

### 데이터베이스

PostgreSQL + Prisma ORM 사용. 스키마는 `backend/prisma/schema.prisma`에 정의되어 있습니다.

### Socket.io

실시간 기능은 Socket.io로 클라이언트–서버 양방향 통신을 합니다.

### MP3 파일

노래는 `backend/songs/` 아래에 장르별로 저장됩니다. Docker 배포 시 컨테이너 내부 `/app/songs`에 해당 디렉터리를 마운트하면 됩니다.

## 🎨 게임 모드

1. **노래 맞추기**: 음원을 듣고 제목 맞추기
2. **사투리 가사 맞추기**: TTS로 사투리 가사를 듣고 노래 맞추기

## 👥 유저 시스템

- **인증**: 카카오·구글 OAuth 또는 이메일/비밀번호
- **화폐**: Beats (게임 플레이로 획득)
- **레벨**: 경험치 획득 후 레벨업
- **인벤토리**: 스킨, 이펙트, 이모지 구매 및 장착
- **게임 기록**: 결과 및 통계 확인

## 🐛 문제 해결

### 백엔드 연결 안 됨

1. PostgreSQL 실행 여부: `docker ps`
2. `backend/.env`의 DB URL 확인
3. 백엔드 로그: `docker-compose logs backend`
4. **3001 포트 사용 중**: 다른 프로세스가 3001을 쓰고 있으면 백엔드가 안 뜹니다. `lsof -i :3001`로 확인 후 종료하거나 포트 변경.
5. **Prisma 오류**: `npm run prisma:generate` 후 `npm run prisma:migrate` 실행했는지 확인. DB가 비어 있으면 마이그레이션부터 필요합니다.

### 노래가 재생되지 않음

1. `backend/songs/<장르>/`에 MP3 파일이 있는지 확인
2. Docker 사용 시: `docker-compose.yml`에서 songs 볼륨 마운트 확인
3. 백엔드 로그에서 파일 접근 오류 확인

### 프론트엔드가 백엔드에 연결 안 됨

1. `frontend/.env.local`의 `NEXT_PUBLIC_BACKEND_URL` 확인
2. 백엔드가 3001 포트에서 떠 있는지 확인
3. CORS 설정 확인

### 프론트엔드에서 자주 겪는 상황

1. **환경 변수 변경했는데 반영 안 됨**  
   `NEXT_PUBLIC_*` 값은 **빌드 시점**에 코드에 박힙니다. `.env.local` 수정 후에는 `npm run dev`를 다시 켜거나, 배포 시에는 `docker-compose up --build`로 프론트를 다시 빌드해야 합니다.

2. **실시간 기능(방 참가·채팅·곡 동기화)이 안 됨**  
   소켓 연결이 백엔드로 안 되는 경우입니다. `NEXT_PUBLIC_SOCKET_URL`이 백엔드 주소와 같게 설정돼 있는지 확인하고, 브라우저 개발자 도구 → Network에서 WS(WebSocket) 연결이 성공했는지 봅니다.

3. **로그인/방 참가 후 곧바로 끊기거나 "세션 만료"**  
   로그인 정보는 브라우저 localStorage 등에 저장됩니다. 시크릿 모드, 다른 도메인, 저장소 삭제 시 풀립니다. DB를 초기화했다면 해당 사이트의 localStorage를 지운 뒤 다시 로그인해야 합니다.

4. **3D 캐릭터(GLB)가 안 보이거나 깨짐**  
   `public/` 아래 GLB 경로가 맞는지 확인. 파일명에 공백·괄호가 있으면 일부 환경에서 문제가 될 수 있어, 참조하는 경로와 실제 파일명이 일치하는지 봅니다.

5. **사투리 퀴즈에서 TTS(음성)가 안 나옴**  
   ElevenLabs API를 쓰는 경우, `ELEVENLABS_API_KEY`가 프론트에서 호출하는 API 라우트(`/api/tts`) 쪽에 전달돼 있는지 확인. 키가 없거나 만료되면 브라우저 기본 TTS로 대체될 수 있습니다.

6. **Hydration 오류 (서버와 클라이언트 HTML 불일치)**  
   `window`, `localStorage`, 소켓 등 클라이언트 전용 코드는 `useEffect` 안에서 쓰거나, 조건부 렌더링으로 클라이언트에서만 그리도록 하면 완화됩니다.

자세한 점검 방법은 [DEPLOY.md](./DEPLOY.md)를 참고하세요.

## 👥 제작

- **프론트엔드** — 배서연
- **백엔드** — 박성재
