#!/usr/bin/env bash
# Proposal validator hook - runs on commit for proposals/ directory
REPO_ROOT="$(git rev-parse --show-toplevel)"
PROPOSALS_DIR="${REPO_ROOT}/proposals"
VALIDATOR="${REPO_ROOT}/scripts/proposal-validator.sh"

if [ -d "$PROPOSALS_DIR" ] && [ -f "$VALIDATOR" ]; then
    # Only check if there are staged .md files in proposals/
    STAGED=$(git diff --cached --name-only --diff-filter=ACM | grep '^proposals/.*\.md$' | head -10)
    if [ -n "$STAGED" ]; then
        echo "🔍 验证提案格式..."
        "$VALIDATOR" "$PROPOSALS_DIR" || {
            echo "❌ 提案格式验证失败，请修复后再提交"
            exit 1
        }
    fi
fi
