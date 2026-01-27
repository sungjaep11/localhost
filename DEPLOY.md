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

3. 로그 확인:
```bash
docker-compose logs -f
```

4. 데이터베이스 마이그레이션 (스키마 변경 시):
```bash
# 실행 중인 backend 컨테이너에서 마이그레이션 적용
docker-compose exec backend npx prisma migrate deploy
```

## 주의사항

- `.env` 파일은 `.gitignore`에 포함되어 있어 Git에 커밋되지 않습니다.
- 서버마다 다른 IP 주소를 사용해야 하므로 각 서버에서 `.env` 파일을 별도로 생성해야 합니다.
- EC2 보안 그룹에서 포트 3001이 열려 있는지 확인하세요.
