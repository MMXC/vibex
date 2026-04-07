# Architecture: vibex-reviewer-proposals-20260331_060315

**Project**: Reviewer 自检提案 — 报告路径规范 + SOP 文档化 + 通知过滤
**Agent**: architect
**Date**: 2026-03-31
**PRD**: docs/vibex-reviewer-proposals-20260331_060315/prd.md

---

## 1. Epic 1: 自检报告路径规范化

### 规范路径
```
/root/.openclaw/workspace-{agent}/proposals/YYYYMMDD/{agent}-proposals.md
```

### 验证脚本
```bash
#!/bin/bash
# scripts/validate-proposal-paths.sh
PATTERN='^/root/.openclaw/workspace-[a-z]+/proposals/[0-9]{8}/[a-z]+-proposals\.md$'
for f in $(find /root/.openclaw/workspace-* -name "*-proposals.md" 2>/dev/null); do
  if ! echo "$f" | grep -qE "$PATTERN"; then
    echo "INVALID: $f"
    exit 1
  fi
done
echo "All paths valid"
```

### 迁移清单
| Agent | 当前路径 | 规范路径 |
|-------|---------|---------|
| analyst | vibex-analyst-proposals-*/ | workspace-analyst/proposals/YYYYMMDD/analyst-proposals.md |
| architect | vibex-architect-proposals-*/ | workspace-architect/proposals/YYYYMMDD/architect-proposals.md |
| dev | vibex-dev-proposals-*/ | workspace-dev/proposals/YYYYMMDD/dev-proposals.md |
| pm | vibex-pm-proposals-*/ | workspace-pm/proposals/YYYYMMDD/pm-proposals.md |
| reviewer | vibex-reviewer-proposals-*/ | workspace-reviewer/proposals/YYYYMMDD/reviewer-proposals.md |
| tester | vibex-tester-proposals-*/ | workspace-tester/proposals/YYYYMMDD/tester-proposals.md |

---

## 2. Epic 2: 两阶段审查 SOP

### SOP 文档位置
`/root/.openclaw/vibex/docs/REVIEWER_SOP.md`

### 两阶段清单

**阶段一（Pre-Merge）**：
1. TypeScript 类型检查通过（`tsc --noEmit`）
2. ESLint 0 warnings 或在阈值内
3. 单元测试 100% 通过
4. 安全检查（无 secrets 泄露）
5. API 契约测试通过

**阶段二（Post-Merge）**：
1. CI pipeline 绿色
2. gstack canary 检查通过
3. E2E 测试全部通过
4. 代码风格与现有代码一致

---

## 3. Epic 3: 重复通知过滤

### 去重机制
```python
# state_change_tracker.py
import json, time
from pathlib import Path

STATE_FILE = Path("/root/.openclaw/.state_change_cache.json")

def should_notify(project: str, stage: str, status: str) -> bool:
    cache = json.loads(STATE_FILE.read_text()) if STATE_FILE.exists() else {}
    key = f"{project}:{stage}"
    last = cache.get(key, {})
    last_time = last.get("time", 0)
    last_status = last.get("status", "")

    # 5分钟内同一任务同一状态不重复通知
    if status == last_status and (time.time() - last_time) < 300:
        return False

    cache[key] = {"time": time.time(), "status": status}
    STATE_FILE.write_text(json.dumps(cache))
    return True
```

---

*Architect 产出物 | 2026-03-31*
