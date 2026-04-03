#!/bin/bash
# validate_analysis.sh — Validates analysis.md files against the standard template
# Exit code: 0 if all pass, non-zero if any violations found
# Usage: bash scripts/validate_analysis.sh [directory]
# Default directory: docs/

set -euo pipefail

SEARCH_DIR="${1:-docs}"

TEMPLATE_KEYS=(
    "问题定义"
    "业务场景"
    "JTBD"
    "技术方案对比"
    "验收标准"
    "风险识别"
)

# Keys that should not appear as literal template placeholders
TEMPLATE_PLACEHOLDERS=(
    "..."
    "<agent>"
    "<YYYY-MM-DD>"
    "<项目名>"
    "<Draft>"
)

total=0
violations=0
skip_count=0

# Files to skip (template itself, archived docs)
SKIP_PATTERNS=(
    "docs/analysis-template.md"
    "docs/docs/"
)

should_skip() {
    local file="$1"
    for pattern in "${SKIP_PATTERNS[@]}"; do
        if [[ "$file" == *"$pattern"* ]]; then
            return 0
        fi
    done
    return 1
}

echo "🔍 Scanning analysis.md files in: $SEARCH_DIR"
echo "============================================="

while IFS= read -r -d '' f; do
    if should_skip "$f"; then
        ((skip_count++)) || true
        continue
    fi

    ((total++)) || true

    missing_keys=()
    for key in "${TEMPLATE_KEYS[@]}"; do
        if ! grep -q "$key" "$f" 2>/dev/null; then
            missing_keys+=("$key")
        fi
    done

    if [ ${#missing_keys[@]} -gt 0 ]; then
        ((violations++)) || true
        echo ""
        echo "❌ $f"
        echo "   缺少 ${#missing_keys[@]} 个必填节: ${missing_keys[*]}"
    fi
done < <(find "$SEARCH_DIR" -name "analysis.md" -print0 2>/dev/null)

echo ""
echo "============================================="
echo "📊 验证结果:"
echo "   总计: $total 个文件"
echo "   跳过: $skip_count 个 (模板/归档)"
echo "   合规: $((total - violations)) 个"
echo "   违规: $violations 个"

if [ $violations -gt 0 ]; then
    echo ""
    echo "⚠️  $violations 个文件不符合标准模板"
    exit 1
else
    echo ""
    echo "✅ 所有 $total 个文件符合标准模板"
    exit 0
fi
