# AGENTS.md - Console Log Sanitize

## 验收命令
```bash
grep -r "console.log" /root/.openclaw/vibex/src --include="*.ts" --include="*.tsx" | grep -v "\.d\.ts"
```

## Dev 任务
1. 扫描所有 console.log
2. 脱敏/移除敏感信息
3. 使用环境变量控制调试输出

## Tester 任务
检查生产构建后无敏感日志

## Reviewer 任务
检查 commit + changelog
