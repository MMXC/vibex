#!/usr/bin/env bash
# proposal-validator.sh - 提案格式验证脚本
# 检查提案是否符合标准模板格式
set -uo pipefail

# 颜色输出
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

ERRORS=()
WARNINGS=()

# ── 检查函数 ────────────────────────────────────────────────────────

check_header() {
    local file="$1"
    if ! grep -qE '^#[[:space:]]+[^[:space:]]' "$file"; then
        add_error "E001" "头部格式错误：缺少 '# 提案标题' 格式"
        return 1
    fi
    return 0
}

check_section() {
    local file="$1"
    local section="$2"
    local code="$3"
    if ! grep -qE "##[[:space:]]+${section}" "$file"; then
        add_error "$code" "缺少章节：## $section"
        return 1
    fi
    return 0
}

check_sections() {
    local file="$1"
    local failed=0
    
    check_section "$file" "执行摘要" "E002" || ((failed=failed+1))
    check_section "$file" "问题定义" "E003" || ((failed=failed+1))
    check_section "$file" "解决方案" "E004" || ((failed=failed+1))
    check_section "$file" "验收标准" "E005" || ((failed=failed+1))
    
    return $failed
}

check_structure() {
    local file="$1"
    # 检查是否有足够的行数（至少100行）
    local lines=$(wc -l < "$file")
    if [ "$lines" -lt 50 ]; then
        add_warning "W001" "内容过少（${lines}行），可能不完整"
    fi
}

# ── 辅助函数 ────────────────────────────────────────────────────────

add_error() {
    local code="$1"
    local msg="$2"
    ERRORS+=("[${code}] ${msg}")
}

add_warning() {
    local code="$1"
    local msg="$2"
    WARNINGS+=("[${code}] ${msg}")
}

print_errors() {
    if [ ${#ERRORS[@]} -gt 0 ]; then
        echo -e "${RED}❌ 发现 ${#ERRORS[@]} 个错误：${NC}"
        for err in "${ERRORS[@]}"; do
            echo -e "  ${RED}✗${NC} $err"
        done
        return 1
    fi
    return 0
}

print_warnings() {
    if [ ${#WARNINGS[@]} -gt 0 ]; then
        echo -e "${YELLOW}⚠️  发现 ${#WARNINGS[@]} 个警告：${NC}"
        for warn in "${WARNINGS[@]}"; do
            echo -e "  ${YELLOW}!${NC} $warn"
        done
    fi
}

print_success() {
    echo -e "${GREEN}✅ 验证通过：$1${NC}"
}

# ── 主流程 ──────────────────────────────────────────────────────────

usage() {
    echo "Usage: $0 <proposal-file-or-dir>"
    echo ""
    echo "检查提案文件是否符合标准格式"
    echo ""
    echo "验证规则："
    echo "  E001 - 头部格式必须为 # 提案标题"
    echo "  E002 - 必须包含 ## 执行摘要 章节"
    echo "  E003 - 必须包含 ## 问题定义 章节"
    echo "  E004 - 必须包含 ## 解决方案 章节"
    echo "  E005 - 必须包含 ## 验收标准 章节"
    exit 1
}

main() {
    local target="$1"
    local files=()
    
    if [ -z "$target" ]; then
        usage
    fi
    
    if [ ! -e "$target" ]; then
        echo -e "${RED}❌ 文件不存在：$target${NC}"
        exit 1
    fi
    
    if [ -d "$target" ]; then
        # 查找所有 .md 文件
        while IFS= read -r -d '' f; do
            files+=("$f")
        done < <(find "$target" -name "*.md" -print0 2>/dev/null)
    else
        files+=("$target")
    fi
    
    if [ ${#files[@]} -eq 0 ]; then
        echo -e "${YELLOW}⚠️  未找到 .md 文件${NC}"
        exit 0
    fi
    
    local total_errors=0
    
    for file in "${files[@]}"; do
        ERRORS=()
        WARNINGS=()
        
        echo ""
        echo "📄 检查: $file"
        echo "─────────────────────────────────"
        
        check_header "$file"
        check_sections "$file"
        check_structure "$file"
        
        if print_errors; then
            print_success "$file"
        else
            print_warnings
            total_errors=$((total_errors + 1))
        fi
    done
    
    echo ""
    if [ $total_errors -gt 0 ]; then
        echo -e "${RED}❌ 共 ${total_errors} 个文件验证失败${NC}"
        exit 1
    else
        echo -e "${GREEN}✅ 所有文件验证通过${NC}"
        exit 0
    fi
}

main "$@"
