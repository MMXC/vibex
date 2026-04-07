---
name: retry-loops
category: api-integration
severity: medium
confidence: 75
signatures:
  - pattern: "while\s*\([^)]*retry[^)]*\)"
    description: "存在重试循环"
  - pattern: "for\s*\([^)]*attempt[^)]*\)\s*{[^}]*fetch[^}]*}"
    description: "手动重试循环调用 API"
fix_suggestions:
  - "使用指数退避算法实现重试"
  - "考虑使用 axios-retry 或 retrier 等库"
  - "设置最大重试次数避免无限循环"
---
# 重试循环检测

## 问题描述

不正确的重试实现可能导致：
- 对失败的服务造成更大压力
- 无限重试导致应用卡死
- 没有指数退避，请求堆积

## 正确做法

```bash
# 使用指数退避
retry_with_backoff() {
  local max_attempts=3
  local delay=1
  for i in $(seq 1 $max_attempts); do
    if curl -s "$1" > /dev/null; then
      return 0
    fi
    sleep $delay
    delay=$((delay * 2))
  done
  return 1
}
```
