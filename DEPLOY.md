# 서버 배포 가이드

## 환경 변수 설정

서버에서 배포하기 전에 `.env` 파일을 생성하세요:

```bash
cp .env.example .env
```

`.env` 파일을 열어서 EC2 서버의 공인 IP 주소를 설정하세요:

```env
NEXT_PUBLIC_SOCKET_URL=http://YOUR_EC2_IP:3001
```

예시:
```env
NEXT_PUBLIC_SOCKET_URL=http://43.201.101.191:3001
```

## DB 마이그레이션 (스키마 변경 시)

스키마(`schema.prisma`)를 수정했거나 새 마이그레이션을 추가한 경우, **로컬**과 **배포 서버**에서 아래처럼 처리합니다.

### 로컬에서 마이그레이션 적용

로컬 Postgres가 Docker로 떠 있다면:

```bash
# 1. Postgres만 기동 (이미 띄워져 있으면 생략)
docker-compose up -d postgres

# 2. 백엔드 디렉터리로 이동 후 마이그레이션 적용
cd backend
npx prisma migrate deploy
```

로컬에서 **새 마이그레이션 파일을 만들 때**는:

```bash
cd backend
npx prisma migrate dev --name migration_name
```

이렇게 만들어진 `prisma/migrations/...` 폴더를 Git에 커밋해 두세요.

### 배포 서버(Docker)에서 DB 반영

Backend Dockerfile의 `CMD`에 이미 `npx prisma migrate deploy`가 들어 있습니다:

```dockerfile
CMD ["sh", "-c", "npx prisma migrate deploy && npm start"]
```

따라서 **배포 절차만 따라가면 DB 마이그레이션도 자동 적용**됩니다.

1. `backend/prisma/migrations/` 에 새 마이그레이션을 추가한 뒤 `git push`
2. 서버에서 `./update.sh` 또는 `docker-compose up --build -d` 실행
3. backend 컨테이너 기동 시 `prisma migrate deploy`가 실행되어 **서버 Postgres**에 마이그레이션 적용
4. 이어서 `npm start`로 API 서버 기동

마이그레이션만 따로 적용하고 싶다면:

```bash
docker-compose exec backend npx prisma migrate deploy
```

---

## 배포 방법

1. Git에서 최신 코드 가져오기:
```bash
git pull origin main  # 또는 해당 브랜치명
```

2. Docker 컨테이너 재빌드 및 시작:
```bash
docker-compose down
docker-compose up --build -d
```

또는 `update.sh` 사용:
```bash
./update.sh
```

3. 로그 확인:
```bash
docker-compose logs -f
```

## 주의사항

- `.env` 파일은 `.gitignore`에 포함되어 있어 Git에 커밋되지 않습니다.
- 서버마다 다른 IP 주소를 사용해야 하므로 각 서버에서 `.env` 파일을 별도로 생성해야 합니다.
- EC2 보안 그룹에서 포트 3001이 열려 있는지 확인하세요.
- **마이그레이션 파일**(`prisma/migrations/**`)은 Git에 반드시 커밋하고 푸시해야 서버 배포 시 DB에 반영됩니다.
