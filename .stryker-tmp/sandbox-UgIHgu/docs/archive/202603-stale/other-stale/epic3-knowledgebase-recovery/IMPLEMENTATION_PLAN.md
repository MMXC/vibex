# Implementation Plan: Epic3 KnowledgeBase 虚假完成修复

**Project**: `epic3-knowledgebase-recovery-fakefix`

---

## Dev Checklist

### Step 1: Create AGENTS.md
**Output**: `docs/epic3-knowledgebase-recovery/AGENTS.md`
✅ 已创建（见上）

### Step 2: Create verification-guide.md
**Output**: `docs/epic3-knowledgebase-recovery/specs/verification-guide.md`

```bash
mkdir -p /root/.openclaw/vibex/docs/epic3-knowledgebase-recovery/specs/
cat > specs/verification-guide.md << 'EOF'
# Verification Guide: Document Project Validation

## Overview
Document projects (no `package.json`) use file-based verification, not `npm test`.

## Verification Commands

### Basic Files
```bash
test -f docs/epic3-knowledgebase-recovery/AGENTS.md && echo "✅" || echo "❌"
test -f docs/epic3-knowledgebase-recovery/IMPLEMENTATION_PLAN.md && echo "✅" || echo "❌"
test -d docs/epic3-knowledgebase-recovery/specs/ && echo "✅" || echo "❌"
```

### Knowledge Base Content
```bash
# patterns ≥ 4
[ "$(ls docs/knowledge/patterns/*.md 2>/dev/null | wc -l)" -ge 4 ] && echo "✅" || echo "❌"

# templates ≥ 3
[ "$(ls docs/knowledge/templates/*.md 2>/dev/null | wc -l)" -ge 3 ] && echo "✅" || echo "❌"
```

### Non-Empty Files
```bash
for f in docs/knowledge/patterns/*.md docs/knowledge/templates/*.md; do
    [ -s "$f" ] && echo "✅ $(basename $f)" || echo "❌ $(basename $f) EMPTY"
done
```

## Root Cause: Why npm test Fails

- `vibex/package.json` has no `test` script
- Document projects have no `package.json` at all
- Correct approach: filesystem verification (see above)

## Anti-Fake-Completion Rules

1. Always verify in the **correct project directory**, not parent repo root
2. Check **file location** matches `expected-location` in PRD
3. Use `test -f` / `ls | wc -l` for document projects
4. `npm test` is only for projects with `package.json` and a `test` script
EOF
```

### Step 3: Create IMPLEMENTATION_PLAN.md
**Output**: `docs/epic3-knowledgebase-recovery/IMPLEMENTATION_PLAN.md`
✅ 已创建（本文档）

### Step 4: Verify
```bash
bash /root/.openclaw/vibex/docs/epic3-knowledgebase-recovery/specs/verify-doc-project.sh
# OR manual:
test -f /root/.openclaw/vibex/docs/epic3-knowledgebase-recovery/AGENTS.md && echo "✅"
test -f /root/.openclaw/vibex/docs/epic3-knowledgebase-recovery/IMPLEMENTATION_PLAN.md && echo "✅"
```

---

## Completion Criteria

| Check | Command | Expected |
|-------|---------|----------|
| AGENTS.md exists | `test -f .../AGENTS.md` | 0 |
| IMPLEMENTATION_PLAN.md exists | `test -f .../IMPLEMENTATION_PLAN.md` | 0 |
| specs/ directory exists | `test -d .../specs/` | 0 |
| verification-guide.md exists | `test -f .../specs/verification-guide.md` | 0 |
| patterns ≥ 4 | `ls .../patterns/*.md \| wc -l` | ≥ 4 |
| templates ≥ 3 | `ls .../templates/*.md \| wc -l` | ≥ 3 |

---

## Anti-Fake-Completion Lessons

| Problem | Prevention |
|---------|-----------|
| File in wrong directory | Always check `workspace` constraint |
| npm test on doc project | Use `test -f` instead |
| Verification skips empty files | Always add `-s` non-empty check |
| Expected-location unknown | PRD must include `expected-location` field |
