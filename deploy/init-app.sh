#!/bin/bash
# EC2에서 최초 1회 실행 — 코드 클론 + 환경변수 설정
# setup-server.sh 실행 후 진행

set -e

APP_DIR="/var/www/cinderellachat"
REPO="https://github.com/thatzit1012-ceo/cinderellachat.git"

echo "▶ 코드 클론"
git clone $REPO $APP_DIR
cd $APP_DIR

echo "▶ 서버 환경변수 파일 생성"
cat > $APP_DIR/server/.env << 'EOF'
PORT=4000
CLIENT_URL=https://www.cinderellachat.com

# PostgreSQL (AWS RDS)
DB_HOST=YOUR_RDS_ENDPOINT
DB_PORT=5432
DB_NAME=cinderellachat
DB_USER=postgres
DB_PASSWORD=YOUR_DB_PASSWORD

# Redis (AWS ElastiCache)
REDIS_URL=redis://YOUR_ELASTICACHE_ENDPOINT:6379

# 관리자
ADMIN_PASSWORD=YOUR_ADMIN_PASSWORD
ADMIN_TOKEN_SECRET=YOUR_LONG_RANDOM_SECRET

# 번역 API
TRANSLATE_API_KEY=

# Claude API
ANTHROPIC_API_KEY=
EOF

echo "▶ Nginx 설정 등록"
sudo cp $APP_DIR/deploy/nginx.conf /etc/nginx/sites-available/cinderellachat
sudo ln -sf /etc/nginx/sites-available/cinderellachat /etc/nginx/sites-enabled/cinderellachat
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t

echo "▶ DB 스키마 적용"
echo "  psql -h YOUR_RDS_ENDPOINT -U postgres -d cinderellachat -f $APP_DIR/server/src/db/schema.sql"

echo ""
echo "⚠️  다음 작업을 수동으로 완료하세요:"
echo "  1. $APP_DIR/server/.env 파일에서 YOUR_* 값 실제 값으로 교체"
echo "  2. sudo certbot --nginx -d cinderellachat.com -d www.cinderellachat.com"
echo "  3. psql로 schema.sql 실행"
echo "  4. ./deploy/deploy.sh 실행"
