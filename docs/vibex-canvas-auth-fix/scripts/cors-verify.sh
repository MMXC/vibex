#!/bin/bash
# F11.3: CORS 预检验证脚本
# 验证 OPTIONS /v1/canvas/snapshots 返回 204 + Authorization header
#
# 使用方法: bash scripts/cors-verify.sh
#
# 期望结果:
#   HTTP 204 ✅
#   access-control-allow-origin: * 或 https://vibex-app.pages.dev ✅
#   access-control-allow-headers 含 Authorization ✅

URL="${1:-https://api.vibex.top/api/v1/canvas/snapshots}"
ORIGIN="${2:-https://vibex-app.pages.dev}"

echo "=== F11.3 CORS Pre-flight Verification ==="
echo "URL: $URL"
echo "Origin: $ORIGIN"
echo ""

RESPONSE=$(curl -X OPTIONS "$URL" \
  -H "Origin: $ORIGIN" \
  -H "Access-Control-Request-Method: GET" \
  -H "Access-Control-Request-Headers: authorization,content-type" \
  -i -s -w "\n---HTTP_STATUS:%{http_code}---")

HTTP_CODE=$(echo "$RESPONSE" | grep -oP 'HTTP_STATUS:\K[0-9]+')
CORS_ORIGIN=$(echo "$RESPONSE" | grep -i "^access-control-allow-origin:" | tr -d '\r')
CORS_HEADERS=$(echo "$RESPONSE" | grep -i "^access-control-allow-headers:" | tr -d '\r')
CORS_METHODS=$(echo "$RESPONSE" | grep -i "^access-control-allow-methods:" | tr -d '\r')

echo "HTTP Status: $HTTP_CODE"
echo "$CORS_ORIGIN"
echo "$CORS_HEADERS"
echo "$CORS_METHODS"
echo ""

# Validation
PASS=0
if [ "$HTTP_CODE" = "204" ]; then
  echo "✅ HTTP 204 No Content"
  ((PASS++))
else
  echo "❌ HTTP $HTTP_CODE (expected 204)"
fi

if echo "$CORS_ORIGIN" | grep -qi "access-control-allow-origin"; then
  echo "✅ CORS Access-Control-Allow-Origin present"
  ((PASS++))
else
  echo "❌ Missing Access-Control-Allow-Origin"
fi

if echo "$CORS_HEADERS" | grep -qi "authorization"; then
  echo "✅ Access-Control-Allow-Headers includes Authorization"
  ((PASS++))
else
  echo "❌ Access-Control-Allow-Headers missing Authorization"
fi

echo ""
echo "Result: $PASS/3 checks passed"
if [ $PASS -eq 3 ]; then
  echo "✅ F11.3 CORS verification PASSED"
  exit 0
else
  echo "❌ F11.3 CORS verification FAILED"
  exit 1
fi
