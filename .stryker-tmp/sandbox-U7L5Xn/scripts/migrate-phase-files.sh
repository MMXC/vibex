#!/bin/bash
# migrate-phase-files.sh — 为现有 phase 文件添加 __FINAL__ 标记
# 用法: bash scripts/migrate-phase-files.sh
# 位置: /root/.openclaw/vibex/scripts/

set -e
cd "$(dirname "$0")/.."

PHASE_DIRS=(
    "/root/.openclaw/agents/architect/phases"
    "/root/.openclaw/agents/analyst/phases"
    "/root/.openclaw/agents/dev/phases"
    "/root/.openclaw/agents/reviewer/phases"
    "/root/.openclaw/agents/tester/phases"
    "/root/.openclaw/agents/pm/phases"
)

MIGRATION_DATE="2026-03-29T00:00:00+08:00"
count=0

for dir in "${PHASE_DIRS[@]}"; do
    [ -d "$dir" ] || continue
    for file in "$dir"/*.md; do
        [ -f "$file" ] || continue
        if ! grep -q "__FINAL__" "$file"; then
            echo "" >> "$file"
            echo "<!--" >> "$file"
            echo "__FINAL__: $MIGRATION_DATE" >> "$file"
            echo "__FINAL__ 标记后的内容在读取时应被忽略" >> "$file"
            echo "-->" >> "$file"
            count=$((count + 1))
            echo "✅ $file"
        fi
    done
done

echo "=== 迁移完成: $count 个文件已添加 __FINAL__ 标记 ==="
