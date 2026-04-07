# AGENTS.md - Auth E2E Flaky Fix

## 验收命令
```bash
cd /root/.openclaw/vibex && npm test -- --grep "auth\|login" --count 5
```

## Dev 任务
1. 分析 flaky 根因（timeout? race? mock 数据不稳定?）
2. 修复并确保 5 次连续通过

## Tester 任务
运行 npm test -- --grep "auth\|login" 连续 5 次验证

## Reviewer 任务
检查 commit + changelog + npm audit
