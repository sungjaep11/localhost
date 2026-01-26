#!/bin/bash

echo "1. 최신 코드 당겨오기 (Git Pull)"
git pull origin main

echo "2. 변경된 부분만 빠르게 다시 빌드 (Smart Rebuild)"

docker compose up -d --build

echo "3. 찌꺼기 청소"
docker image prune -f

echo "배포 완료!"
