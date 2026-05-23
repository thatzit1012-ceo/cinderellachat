#!/bin/bash
# AWS EventBridge 규칙 설정
# 매일 15:00 UTC = 00:00 KST 에 Lambda 트리거
# 사전 조건: aws cli 로그인, Lambda 함수 배포 완료

FUNCTION_NAME="cinderellachat-midnight-cleanup"
RULE_NAME="cinderellachat-midnight-rule"
AWS_REGION=${AWS_REGION:-ap-northeast-2}  # 서울 리전

echo "📅 EventBridge 규칙 생성: 매일 15:00 UTC (= 00:00 KST)"

# 1. EventBridge 규칙 생성
RULE_ARN=$(aws events put-rule \
  --name $RULE_NAME \
  --schedule-expression "cron(0 15 * * ? *)" \
  --state ENABLED \
  --region $AWS_REGION \
  --query 'RuleArn' \
  --output text)

echo "✅ Rule ARN: $RULE_ARN"

# 2. Lambda 함수 ARN 조회
LAMBDA_ARN=$(aws lambda get-function \
  --function-name $FUNCTION_NAME \
  --region $AWS_REGION \
  --query 'Configuration.FunctionArn' \
  --output text)

echo "✅ Lambda ARN: $LAMBDA_ARN"

# 3. EventBridge → Lambda 권한 추가
aws lambda add-permission \
  --function-name $FUNCTION_NAME \
  --statement-id "EventBridgeMidnight" \
  --action "lambda:InvokeFunction" \
  --principal "events.amazonaws.com" \
  --source-arn $RULE_ARN \
  --region $AWS_REGION 2>/dev/null || echo "(권한 이미 존재)"

# 4. Lambda를 EventBridge 타겟으로 등록
aws events put-targets \
  --rule $RULE_NAME \
  --targets "Id=1,Arn=$LAMBDA_ARN" \
  --region $AWS_REGION

echo "🎉 EventBridge 설정 완료"
echo "   규칙: $RULE_NAME"
echo "   스케줄: 매일 00:00 KST (15:00 UTC)"
echo "   타겟: $FUNCTION_NAME"
