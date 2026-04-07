# AGENTS.md - P1 Security Fix

## 验收命令
```bash
cd /root/.openclaw/vibex && npm audit --audit-level=high
```

## Dev 任务
1. npm audit 修复 high/critical 漏洞
2. localStorage 安全审查并修复

## Tester 任务
npm audit --audit-level=high 确认无高危

## Reviewer 任务
检查 commit + changelog + npm audit
