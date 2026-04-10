#!/bin/bash
# =============================================================================
# tester-entry.sh — E2E Pipeline Re-entry Guard
#
# 功能: tester 任务入口强制 git pull，确保测试最新代码
# 参照: PRD vibex-tester-proposals-20260410_111231 / E1.2
# =============================================================================

set -e

PROJECT_DIR="${PROJECT_DIR:-/root/.openclaw/vibex}"

cd "$PROJECT_DIR"

# Guard: ensure we're in a git repo
if [ ! -d ".git" ]; then
    echo "[tester-entry] ERROR: Not a git repository: $PROJECT_DIR"
    exit 1
fi

echo "[tester-entry] Fetching origin..."
if ! git fetch origin 2>&1; then
    echo "[tester-entry] WARNING: git fetch failed, continuing with local..."
fi

# Compare local HEAD vs tracking branch
LOCAL=$(git rev-parse @)
REMOTE=$(git rev-parse '@{u}' 2>/dev/null) || {
    echo "[tester-entry] WARNING: No upstream configured, skipping pull check"
    REMOTE="$LOCAL"
}

if [ "$LOCAL" != "$REMOTE" ]; then
    BRANCH=$(git rev-parse --abbrev-ref HEAD)
    echo "[tester-entry] Local behind remote ($BRANCH). Pulling..."
    if git pull --rebase origin "$BRANCH" 2>&1; then
        echo "[tester-entry] Pull successful."
    else
        echo "[tester-entry] WARNING: Pull failed or conflicted, continuing with local..."
    fi
else
    echo "[tester-entry] Local is up-to-date."
fi

echo "[tester-entry] Running: $@"
exec "$@"
