# Verification Guide: Document Project Validation

**Project**: `epic3-knowledgebase-recovery-fakefix`  
**Purpose**: Standard verification commands for document projects (no `package.json`)

---

## Root Cause

`npm test` fails on document projects because:
1. Document projects have no `package.json`
2. `vibex/package.json` has no `test` script
3. **Solution**: Use filesystem verification instead

---

## Verification Commands

### 1. Project Document Files

```bash
# Basic files (all must return exit code 0)
test -f /root/.openclaw/vibex/docs/epic3-knowledgebase-recovery/AGENTS.md      && echo "✅ AGENTS.md" || echo "❌ AGENTS.md"
test -f /root/.openclaw/vibex/docs/epic3-knowledgebase-recovery/IMPLEMENTATION_PLAN.md && echo "✅ IMPLEMENTATION_PLAN.md" || echo "❌ IMPLEMENTATION_PLAN.md"
test -d /root/.openclaw/vibex/docs/epic3-knowledgebase-recovery/specs/        && echo "✅ specs/" || echo "❌ specs/"
test -f /root/.openclaw/vibex/docs/epic3-knowledgebase-recovery/specs/verification-guide.md && echo "✅ verification-guide.md" || echo "❌ verification-guide.md"
```

### 2. Knowledge Base Content

```bash
# Patterns count (must be ≥ 4)
PATTERNS=$(ls /root/.openclaw/vibex/docs/knowledge/patterns/*.md 2>/dev/null | wc -l)
[ "$PATTERNS" -ge 4 ] && echo "✅ patterns: $PATTERNS ≥ 4" || echo "❌ patterns: $PATTERNS < 4"

# Templates count (must be ≥ 3)
TEMPLATES=$(ls /root/.openclaw/vibex/docs/knowledge/templates/*.md 2>/dev/null | wc -l)
[ "$TEMPLATES" -ge 3 ] && echo "✅ templates: $TEMPLATES ≥ 3" || echo "❌ templates: $TEMPLATES < 3"
```

### 3. Non-Empty File Check

```bash
# All .md files must be non-empty
echo "=== Non-empty check ==="
for f in /root/.openclaw/vibex/docs/knowledge/patterns/*.md /root/.openclaw/vibex/docs/knowledge/templates/*.md; do
    if [ -f "$f" ]; then
        if [ -s "$f" ]; then
            echo "✅ $(basename $f) ($(wc -c < "$f") bytes)"
        else
            echo "❌ $(basename $f) EMPTY"
        fi
    fi
done
```

### 4. Automated Script

```bash
#!/bin/bash
set -e
echo "=== Document Project Verification ==="

# Check project files
for f in AGENTS.md IMPLEMENTATION_PLAN.md; do
    [ -f "/root/.openclaw/vibex/docs/epic3-knowledgebase-recovery/$f" ] && echo "✅ $f" || { echo "❌ $f"; exit 1; }
done
[ -d "/root/.openclaw/vibex/docs/epic3-knowledgebase-recovery/specs/" ] && echo "✅ specs/" || { echo "❌ specs/"; exit 1; }

# Check knowledge base
[ "$(ls /root/.openclaw/vibex/docs/knowledge/patterns/*.md 2>/dev/null | wc -l)" -ge 4 ] && echo "✅ patterns≥4" || { echo "❌ patterns<4"; exit 1; }
[ "$(ls /root/.openclaw/vibex/docs/knowledge/templates/*.md 2>/dev/null | wc -l)" -ge 3 ] && echo "✅ templates≥3" || { echo "❌ templates<3"; exit 1; }

echo "=== All checks passed ==="
```

---

## Anti-Fake-Completion Rules

| Rule | Why |
|------|-----|
| Use `test -f` for doc projects | `npm test` requires `package.json` + `test` script |
| Check file location (workspace) | Files in wrong directory = fake completion |
| Verify non-empty (`-s`) | Empty files pass `test -f` but are invalid |
| Check counts (`ls \| wc -l`) | Directory might exist but be empty |
| expected-location in PRD | Prevents ambiguity about where files go |

---

## Decision: npm test vs test -f

| Scenario | Command |
|----------|---------|
| Code project with `package.json` + `test` script | `npm test` |
| Document project (no `package.json`) | `test -f <path>` |
| Mixed project | Both (run in order) |

> ⚠️ **Never** run `npm test` on a project without a `test` script. It will fail with "Missing script: test".
