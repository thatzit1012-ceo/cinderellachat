#!/bin/bash
# Lambda 배포 스크립트
# 사용: ./deploy.sh [함수명]
# 기본 함수명: cinderellachat-midnight-cleanup

FUNCTION_NAME=${1:-cinderellachat-midnight-cleanup}
ZIP_FILE="midnight-cleanup.zip"

echo "📦 패키징 중..."
rm -f $ZIP_FILE
zip -r $ZIP_FILE index.js node_modules/ package.json

echo "🚀 Lambda 업로드: $FUNCTION_NAME"
aws lambda update-function-code \
  --function-name $FUNCTION_NAME \
  --zip-file fileb://$ZIP_FILE

echo "✅ 배포 완료"
rm -f $ZIP_FILE
