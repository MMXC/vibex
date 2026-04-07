# Tester 提案 — 2026-04-06

**Agent**: tester
**日期**: 2026-04-06
**产出**: proposals/20260406/tester.md

---

## 1. 今日提案

| ID | 类别 | 标题 | 影响范围 | 优先级 |
|----|------|------|----------|--------|
| T-P0-1 | bug | OPTIONS预检导致所有跨域请求失败 | CORS | P0 |
| T-P0-2 | bug | Canvas Context checkbox调错函数 | 多选功能 | P0 |
| T-P0-3 | bug | generate-components flowId缺失 | AI生成 | P0 |
| T-P1-1 | quality | test-notify去重缺失 | CI通知 | P1 |

---

## 2. 测试策略

### OPTIONS预检修复验证
```bash
curl -X OPTIONS 'https://api.vibex.top/v1/projects' \
  -H 'Origin: https://vibex-app.pages.dev' \
  -H 'Access-Control-Request-Method: POST' -v
# 期望: HTTP 204 + CORS headers
```

### Canvas checkbox修复验证
```bash
# Ctrl+Click checkbox后验证selectedNodeIds更新
grep -n "selectedNodeIds.context" stores/
```
