# Architecture: vibex-selfcheck-path-normalization

**Project**: 自检报告路径规范化
**Agent**: architect
**Date**: 2026-03-31
**Analysis**: /root/.openclaw/vibex/docs/selfcheck-path-normalization/analysis.md

---

## 1. 规范路径

```
/root/.openclaw/workspace-{agent}/proposals/YYYYMMDD/{agent}.md
```

示例：
- `/root/.openclaw/workspace-architect/proposals/20260331/architect-proposals.md`
- `/root/.openclaw/workspace-dev/proposals/20260331/dev-proposals.md`

---

## 2. 验证脚本

```bash
#!/bin/bash
# scripts/validate-proposal-paths.sh
PATTERN='^/root/.openclaw/workspace-[a-z]+/proposals/[0-9]{8}/[a-z]+-proposals\.md$'
INVALID=0

for f in $(find /root/.openclaw/workspace-* -name "*-proposals.md" 2>/dev/null); do
  if ! echo "$f" | grep -qE "$PATTERN"; then
    echo "INVALID: $f"
    INVALID=$((INVALID + 1))
  fi
done

if [ $INVALID -gt 0 ]; then
  echo "Paths invalid: $INVALID files"
  exit 1
fi
echo "All paths valid"
```

---

## 3. 迁移现有报告

```bash
# 迁移脚本
for agent in architect dev analyst pm tester reviewer; do
  # 找到不合规的报告
  find /root/.openclaw -name "${agent}-proposals.md" 2>/dev/null | while read f; do
    if ! echo "$f" | grep -qE "workspace-${agent}/proposals"; then
      date=$(echo "$f" | grep -oE '[0-9]{8}' | tail -1)
      target="/root/.openclaw/workspace-${agent}/proposals/${date}/${agent}-proposals.md"
      mkdir -p "$(dirname "$target")"
      cp "$f" "$target"
      echo "Migrated: $f → $target"
    fi
  done
done
```

---

## 4. HEARTBEAT.md 更新

每个 agent 的 HEARTBEAT.md 中添加：
```bash
REPORT_DIR="/root/.openclaw/workspace-architect/proposals/$(date +%Y%m%d)"
REPORT_FILE="${REPORT_DIR}/architect-proposals.md"
```

---

*Architect 产出物 | 2026-03-31*
