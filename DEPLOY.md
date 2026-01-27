# 서버 배포 가이드

## 환경 변수 설정

서버에서 배포하기 전에 `.env` 파일을 생성하세요:

```bash
cp .env.example .env
```

`.env` 파일을 열어서 EC2 서버의 **공인 IP**를 넣으세요:

```env
# 브라우저에서 소켓/백엔드 연결용 (프론트 빌드·실행 시 반드시 필요)
NEXT_PUBLIC_BACKEND_URL=http://YOUR_EC2_IP:3001
NEXT_PUBLIC_SOCKET_URL=http://YOUR_EC2_IP:3001
```

예시:
```env
NEXT_PUBLIC_BACKEND_URL=http://43.201.101.191:3001
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

## 백엔드 연결이 안 될 때 점검 (EC2 + Docker)

| 항목 | 확인 방법 |
|------|-----------|
| **1. EC2 보안 그룹** | 인바운드에 **3001**(백엔드), **3000**(프론트) TCP 허용 여부 |
| **2. 백엔드 컨테이너** | `docker ps`로 `localhost_backend`가 **Up** 상태인지 |
| **3. 백엔드 로그** | `docker-compose logs backend` 에러·재시작 반복 여부 |
| **4. 바인딩** | 백엔드는 `0.0.0.0:3001`로 리스닝해야 함 (코드에서 `HOST=0.0.0.0` 사용) |
| **5. .env on EC2** | EC2 서버의 프로젝트 루트에 `.env` 존재 여부, `NEXT_PUBLIC_BACKEND_URL=http://<EC2공인IP>:3001` 로 설정했는지 |
| **6. 프론트 재빌드** | `.env`나 `NEXT_PUBLIC_*` 변경 후에는 `docker-compose up --build -d` 로 **프론트까지 재빌드** 필요 |
| **7. EC2 내부 연결 테스트** | EC2 SSH 접속 후 `curl -s http://localhost:3001` → `{"message":"Backend API Server"}` 나오는지 |

연결 테스트 (로컬 터미널):
```bash
curl -s http://YOUR_EC2_IP:3001
# 정상이면 {"message":"Backend API Server"} 출력
```

## 주의사항

- `.env` 파일은 `.gitignore`에 포함되어 있어 Git에 커밋되지 않습니다.
- 서버마다 다른 IP를 쓸 수 있으므로, **각 EC2 인스턴스에서** `.env`를 따로 만들어 두세요.
- EC2 보안 그룹에서 **3000, 3001** 포트가 열려 있어야 합니다.
- `NEXT_PUBLIC_BACKEND_URL` / `NEXT_PUBLIC_SOCKET_URL` 은 **프론트 빌드 시** 코드에 박히므로, EC2에서는 프로젝트 루트에 `.env`를 둔 뒤 **같은 디렉터리에서** `docker-compose up --build -d`를 실행해야 합니다.
