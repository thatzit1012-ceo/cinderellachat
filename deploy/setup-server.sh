#!/bin/bash
# EC2 최초 1회 실행하는 서버 세팅 스크립트
# OS: Ubuntu 24.04 LTS
# 실행: chmod +x setup-server.sh && sudo ./setup-server.sh

set -e

echo "▶ 시스템 업데이트"
apt-get update -y && apt-get upgrade -y

echo "▶ Node.js 22 설치"
curl -fsSL https://deb.nodesource.com/setup_22.x | bash -
apt-get install -y nodejs

echo "▶ 필수 패키지 설치"
apt-get install -y git nginx certbot python3-certbot-nginx ufw

echo "▶ PM2 설치"
npm install -g pm2

echo "▶ 방화벽 설정 (SSH + HTTP + HTTPS)"
ufw allow OpenSSH
ufw allow 'Nginx Full'
ufw --force enable

echo "▶ 앱 디렉토리 생성"
mkdir -p /var/www/cinderellachat
chown -R ubuntu:ubuntu /var/www/cinderellachat

echo "▶ PM2 시스템 부팅 시 자동 시작 등록"
pm2 startup systemd -u ubuntu --hp /home/ubuntu | tail -1 | bash

echo "✅ 서버 기본 세팅 완료"
echo ""
echo "다음 단계:"
echo "  1. /var/www/cinderellachat 에 코드 배포"
echo "  2. sudo cp /var/www/cinderellachat/deploy/nginx.conf /etc/nginx/sites-available/cinderellachat"
echo "  3. sudo ln -s /etc/nginx/sites-available/cinderellachat /etc/nginx/sites-enabled/"
echo "  4. sudo certbot --nginx -d cinderellachat.com -d www.cinderellachat.com"
echo "  5. cd /var/www/cinderellachat && ./deploy/deploy.sh"
