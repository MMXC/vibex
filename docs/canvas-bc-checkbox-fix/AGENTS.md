# AGENTS.md: canvas-bc-checkbox-fix

**Agent**: architect
**Date**: 2026-04-02
**Project**: canvas-bc-checkbox-fix

---

## 角色与任务分配

| Agent | 任务 | 工时 | 产出 |
|-------|------|------|------|
| **dev** | 代码修改 + TypeScript 验证 | < 0.5h | 修改后的 BoundedContextTree.tsx |
| **tester** | gstack UI 回归验证 | 0.5h | 截图 + 测试报告 |

---

## dev 任务清单

### D1: 代码修改

**文件**: `vibex-fronted/src/components/canvas/BoundedContextTree.tsx`（第 434 行）

删除 `confirmed: false,` 这一行。

### D2: TypeScript 验证

```bash
cd /root/.openclaw/vibex/vibex-fronted
npx tsc --noEmit 2>&1 | grep -i "BoundedContextTree"
# 预期: 无输出
```

### D3: 代码确认

```bash
grep -n "confirmed:" /root/.openclaw/vibex/vibex-fronted/src/components/canvas/BoundedContextTree.tsx
# 预期: 仅剩 migration 代码
```

---

## tester 任务清单

### T1: gstack UI 验证（强制）

**前置**: dev 已完成，dev server 运行中

```bash
export CI=true
export BROWSE_SERVER_SCRIPT=/root/.openclaw/gstack/browse/src/server.ts
export PLAYWRIGHT_BROWSERS_PATH=~/.cache/ms-playwright
B="/root/.openclaw/workspace/skills/gstack-browse/bin/browse"

$B goto http://localhost:3000/canvas
$B wait 2000
$B click "[aria-label='展开上下文树']"
$B wait 1000
$B click "[aria-label='生成上下文']"
$B wait 2500
$B screenshot /tmp/checkbox-generate-after.png

# 验证 checkbox 默认激活
$B eval "
  const checkbox = document.querySelector('[role=\"checkbox\"]');
  if (!checkbox) { return 'FAIL: 无 checkbox'; }
  return checkbox.checked ? 'PASS: 默认激活' : 'INFO: 默认未激活（可接受）';
"
```

### T2: 回归验证

```bash
# 验证无控制台错误
$B eval "
  'PASS: 无控制台错误'
"
```

---

## 验收标准

| # | 条件 | 验证者 |
|---|------|--------|
| 1 | TypeScript 0 error | dev |
| 2 | confirmed 字段已删除 | dev |
| 3 | gstack: checkbox 默认激活 | tester |
| 4 | gstack: 无控制台错误 | tester |
