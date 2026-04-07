#!/bin/bash
#
# VibeX 知识库搜索脚本
# 用法: ./search-issue.sh [--keyword KEYWORD] [--category CATEGORY] [--severity SEVERITY]
#

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
KB_DIR="${SCRIPT_DIR}"

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 帮助信息
show_help() {
    cat << EOF
VibeX 知识库搜索工具

用法: $0 [选项]

选项:
    --keyword, -k KEYWORD    按关键词搜索
    --category, -c CATEGORY  按分类筛选 (auth-session, state-management, api-integration, ui-rendering, performance)
    --severity, -s SEVERITY 按严重级别筛选 (P0, P1, P2, P3)
    --list-categories        列出所有分类
    --list-severities        列出所有严重级别
    --help, -h              显示帮助信息

示例:
    $0 --keyword "登录状态"
    $0 --category auth-session
    $0 --severity P0
    $0 --category ui-rendering --severity P1

EOF
}

# 列出所有分类
list_categories() {
    echo -e "${BLUE}可用分类:${NC}"
    echo "  auth-session      - 认证与会话问题"
    echo "  state-management - 状态管理问题"
    echo "  api-integration  - API 集成问题"
    echo "  ui-rendering     - UI 渲染问题"
    echo "  performance      - 性能问题"
}

# 列出所有严重级别
list_severities() {
    echo -e "${BLUE}可用严重级别:${NC}"
    echo "  P0 - 阻断性问题"
    echo "  P1 - 重要问题"
    echo "  P2 - 一般问题"
    echo "  P3 - 轻微问题"
}

# 搜索函数
search() {
    local keyword=""
    local category=""
    local severity=""
    
    while [[ $# -gt 0 ]]; do
        case $1 in
            --keyword|-k)
                keyword="$2"
                shift 2
                ;;
            --category|-c)
                category="$2"
                shift 2
                ;;
            --severity|-s)
                severity="$2"
                shift 2
                ;;
            *)
                echo -e "${RED}未知选项: $1${NC}"
                show_help
                exit 1
                ;;
        esac
    done
    
    # 检查知识库目录
    if [[ ! -d "$KB_DIR" ]]; then
        echo -e "${RED}错误: 知识库目录不存在: $KB_DIR${NC}"
        exit 1
    fi
    
    # 构建搜索命令
    local search_cmd="find '$KB_DIR/issues' -name '*.md' -type f"
    
    if [[ -n "$category" ]]; then
        search_cmd="$search_cmd -path '*/$category/*'"
    fi
    
    # 执行搜索
    local results=$(eval $search_cmd 2>/dev/null || echo "")
    
    if [[ -z "$results" ]]; then
        echo -e "${YELLOW}未找到匹配的问题${NC}"
        exit 0
    fi
    
    # 筛选结果
    local found=0
    while IFS= read -r file; do
        [[ -z "$file" ]] && continue
        
        local content=$(cat "$file")
        
        # 关键词过滤
        if [[ -n "$keyword" ]]; then
            if ! echo "$content" | grep -qi "$keyword"; then
                continue
            fi
        fi
        
        # 严重级别过滤
        if [[ -n "$severity" ]]; then
            if ! echo "$content" | grep -q "$severity"; then
                continue
            fi
        fi
        
        # 显示结果
        local title=$(echo "$content" | grep "^# " | sed 's/^# //')
        local id=$(basename "$file" .md)
        local severity_level=$(echo "$content" | grep -oP "P[0-3]" | head -1)
        
        echo -e "${GREEN}$id${NC} | ${YELLOW}$severity_level${NC} | $title"
        found=$((found + 1))
        
    done <<< "$results"
    
    if [[ $found -eq 0 ]]; then
        echo -e "${YELLOW}未找到匹配的问题${NC}"
    else
        echo ""
        echo -e "${BLUE}共找到 $found 个问题${NC}"
    fi
}

# 主逻辑
case "${1:-}" in
    --help|-h)
        show_help
        exit 0
        ;;
    --list-categories)
        list_categories
        exit 0
        ;;
    --list-severities)
        list_severities
        exit 0
        ;;
    *)
        search "$@"
        ;;
esac
