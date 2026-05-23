#!/bin/bash
# 배포 스크립트 — EC2에서 실행
# 매 배포 시: ./deploy/deploy.sh

set -e

APP_DIR="/var/www/cinderellachat"
LOG_DIR="/var/log/cinderellachat"

echo "▶ [1/6] 최신 코드 pull"
cd $APP_DIR
git pull origin main

echo "▶ [2/6] 서버 의존성 설치"
cd $APP_DIR/server
npm install --omit=dev

echo "▶ [3/6] 클라이언트 빌드"
cd $APP_DIR/client
npm install --omit=dev
npm run build

echo "▶ [4/6] 로그 디렉토리 확인"
mkdir -p $LOG_DIR

echo "▶ [5/6] PM2 재시작"
cd $APP_DIR
pm2 startOrReload deploy/ecosystem.config.js --env production
pm2 save

echo "▶ [6/6] Nginx 리로드"
sudo nginx -t && sudo systemctl reload nginx

echo ""
echo "✅ 배포 완료 — $(date '+%Y-%m-%d %H:%M:%S')"
pm2 status
