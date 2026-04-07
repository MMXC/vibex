#!/bin/bash
#==============================================================================
# Root Cause Analysis Tool (RCA Tool)
# 
# 功能: 自动分析代码问题根因，生成分析报告
# 用法: ./rca-tool.sh <问题描述> <相关文件路径>
#
# 示例:
#   ./rca-tool.sh "API调用失败" ./src/api/
#   ./rca-tool.sh "页面渲染异常" ./src/components/
#==============================================================================

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 默认配置
OUTPUT_DIR="/root/.openclaw/vibex/docs/knowledge-base/issues"
TEMPLATE_FILE="/root/.openclaw/vibex/docs/knowledge-base/template.md"

#-------------------------------------------------------------------------------
# 打印帮助信息
#-------------------------------------------------------------------------------
show_help() {
    echo -e "${BLUE}Root Cause Analysis Tool${NC}"
    echo ""
    echo "用法: $0 <问题描述> <文件路径> [选项]"
    echo ""
    echo "参数:"
    echo "  问题描述    问题/错误的简要描述"
    echo "  文件路径    需要分析的文件或目录路径"
    echo ""
    echo "选项:"
    echo "  -o, --output    输出目录 (默认: $OUTPUT_DIR)"
    echo "  -c, --category   分类 (ui-rendering|api-integration|state-management|auth-session|performance)"
    echo "  -h, --help       显示帮助"
    echo ""
    echo "示例:"
    echo "  $0 '页面渲染失败' ./src/components/"
    echo "  $0 'API调用异常' ./src/api/ -c api-integration"
}

#-------------------------------------------------------------------------------
# 检查依赖
#-------------------------------------------------------------------------------
check_dependencies() {
    local missing=()
    
    command -v grep >/dev/null 2>&1 || missing+=("grep")
    command -v sed >/dev/null 2>&1 || missing+=("sed")
    command -v awk >/dev/null 2>&1 || missing+=("awk")
    
    if [ ${#missing[@]} -ne 0 ]; then
        echo -e "${RED}错误: 缺少必要工具: ${missing[*]}${NC}"
        exit 1
    fi
}

#-------------------------------------------------------------------------------
# 分析代码模式
#-------------------------------------------------------------------------------
analyze_code_patterns() {
    local file_path="$1"
    local issue_desc="$2"
    
    echo -e "${BLUE}=== 代码模式分析 ===${NC}"
    
    # 检查常见问题模式
    local patterns=(
        "console\.log.*debug"
        "TODO.*fixme"
        "any\)"
        "as\s+\w+\s+//"
        "catch.*empty"
        "if.*undefined.*return"
        "setTimeout.*0"
    )
    
    local findings=()
    for pattern in "${patterns[@]}"; do
        local matches=$(grep -rn "$pattern" "$file_path" 2>/dev/null | head -5 || true)
        if [ -n "$matches" ]; then
            findings+=("发现模式 '$pattern':")
            findings+=("$matches")
            findings+=("")
        fi
    done
    
    if [ ${#findings[@]} -eq 0 ]; then
        echo "未发现明显代码问题模式"
    else
        printf '%s\n' "${findings[@]}"
    fi
}

#-------------------------------------------------------------------------------
# 分析日志输出
#-------------------------------------------------------------------------------
analyze_logs() {
    local file_path="$1"
    
    echo -e "${BLUE}=== 日志分析 ===${NC}"
    
    # 检查日志级别
    local log_issues=$(grep -rn "console\.\(log\|debug\|info\)" "$file_path" 2>/dev/null | wc -l || echo "0")
    local warn_issues=$(grep -rn "console\.warn" "$file_path" 2>/dev/null | wc -l || echo "0")
    local error_issues=$(grep -rn "console\.error" "$file_path" 2>/dev/null | wc -l || echo "0")
    
    echo "日志统计:"
    echo "  - console.log/debug/info: $log_issues"
    echo "  - console.warn: $warn_issues"
    echo "  - console.error: $error_issues"
}

#-------------------------------------------------------------------------------
# 分析异常处理
#-------------------------------------------------------------------------------
analyze_error_handling() {
    local file_path="$1"
    
    echo -e "${BLUE}=== 异常处理分析 ===${NC}"
    
    # 检查空的catch块
    local empty_catches=$(grep -rn "catch.*{\s*}" "$file_path" 2>/dev/null | wc -l || echo "0")
    echo "空catch块: $empty_catches"
    
    # 检查未处理的Promise rejection
    local unhandled_rejections=$(grep -rn "unhandledrejection" "$file_path" 2>/dev/null | wc -l || echo "0")
    echo "未处理的Promise rejection: $unhandled_rejections"
    
    # 检查try-catch覆盖率
    local try_blocks=$(grep -rn "try\s*{" "$file_path" 2>/dev/null | wc -l || echo "0")
    echo "try块数量: $try_blocks"
}

#-------------------------------------------------------------------------------
# 分析类型安全
#-------------------------------------------------------------------------------
analyze_type_safety() {
    local file_path="$1"
    
    echo -e "${BLUE}=== 类型安全分析 ===${NC}"
    
    # 检查 any 类型使用
    local any_usage=$(grep -rn ": any\|as any\|\"any\"" "$file_path" 2>/dev/null | wc -l || echo "0")
    echo "any类型使用: $any_usage"
    
    # 检查 non-null断言
    local non_null=$(grep -rn "!" "$file_path" 2>/dev/null | grep -v "//\|/\*" | wc -l || echo "0")
    echo "非空断言(!): $non_null"
    
    # 检查可选链
    local optional_chain=$(grep -rn "\?\." "$file_path" 2>/dev/null | wc -l || echo "0")
    echo "可选链(?.): $optional_chain"
}

#-------------------------------------------------------------------------------
# 生成根因分析报告
#-------------------------------------------------------------------------------
generate_report() {
    local issue_desc="$1"
    local file_path="$2"
    local category="$3"
    local output_dir="$4"
    
    local timestamp=$(date +"%Y-%m-%d %H:%M:%S")
    local date_str=$(date +%Y-%m-%d)
    local issue_id="KB-${date_str}-$(date +%H%M%S)"
    
    # 确保输出目录存在
    mkdir -p "$output_dir/$category"
    
    local output_file="$output_dir/$category/${issue_id}.md"
    
    echo -e "${BLUE}=== 生成根因分析报告 ===${NC}"
    echo "输出文件: $output_file"
    
    # 生成报告内容
    cat > "$output_file" << EOF
# 根因分析报告

**问题 ID**: ${issue_id}  
**问题描述**: ${issue_desc}  
**分析日期**: ${timestamp}  
**分析师**: RCA Tool (自动分析)  

---

## 1. 问题概述

### 问题描述
${issue_desc}

### 影响范围
- 文件: ${file_path}
- 分类: ${category}

---

## 2. 代码分析结果

### 2.1 代码模式分析

\`\`\`
$(analyze_code_patterns "$file_path" "$issue_desc")
\`\`\`

### 2.2 异常处理分析

\`\`\`
$(analyze_error_handling "$file_path")
\`\`\`

### 2.3 类型安全分析

\`\`\`
$(analyze_type_safety "$file_path")
\`\`\`

---

## 3. 根因假设

基于代码分析，发现以下可能的根因:

| # | 假设 | 可能性 | 建议验证方法 |
|---|------|--------|--------------|
| 1 | 代码存在空catch块，异常被吞掉 | 高 | 检查日志输出 |
| 2 | 类型安全不足，存在any类型 | 中 | 运行TypeScript检查 |
| 3 | 异步处理不当，race condition | 中 | 检查时序逻辑 |

---

## 4. 验证步骤

1. 运行 \`npm run build\` 检查编译错误
2. 查看控制台日志
3. 复现问题场景
4. 添加断点调试

---

## 5. 解决方案建议

### 方案 A: 增强异常处理
\`\`\`typescript
// 改进前
try {
  // do something
} catch {}

// 改进后
try {
  // do something
} catch (error) {
  console.error('操作失败:', error);
  // 处理或上报错误
}
\`\`\`

### 方案 B: 提升类型安全
\`\`\`typescript
// 改进前
const data: any = response;

// 改进后
interface ResponseData {
  // 定义明确类型
}
const data: ResponseData = response;
\`\`\`

---

## 6. 防范机制

- [ ] 添加单元测试覆盖异常场景
- [ ] 配置 ESLint 规则禁止空 catch 块
- [ ] 启用 TypeScript strict 模式
- [ ] 添加集成测试验证错误处理

---

*本报告由 RCA Tool 自动生成*
EOF

    echo -e "${GREEN}✅ 报告已生成: $output_file${NC}"
    
    # 更新索引
    update_index "$output_dir" "$issue_id" "$issue_desc" "$category"
}

#-------------------------------------------------------------------------------
# 更新索引文件
#-------------------------------------------------------------------------------
update_index() {
    local output_dir="$1"
    local issue_id="$2"
    local issue_desc="$3"
    local category="$4"
    
    local index_file="$output_dir/index.md"
    
    if [ ! -f "$index_file" ]; then
        cat > "$index_file" << 'EOF'
# 知识库索引

> 自动生成的根因分析索引

---

## 最近更新

| 日期 | 问题ID | 描述 | 分类 |
|------|--------|------|------|
EOF
    fi
    
    local date_str=$(date +%Y-%m-%d)
    echo "| $date_str | $issue_id | $issue_desc | $category |" >> "$index_file"
    
    echo -e "${GREEN}✅ 索引已更新${NC}"
}

#-------------------------------------------------------------------------------
# 主函数
#-------------------------------------------------------------------------------
main() {
    local issue_desc=""
    local file_path=""
    local category="ui-rendering"
    local output_dir="$OUTPUT_DIR"
    
    # 解析参数
    while [[ $# -gt 0 ]]; do
        case $1 in
            -h|--help)
                show_help
                exit 0
                ;;
            -c|--category)
                category="$2"
                shift 2
                ;;
            -o|--output)
                output_dir="$2"
                shift 2
                ;;
            *)
                if [ -z "$issue_desc" ]; then
                    issue_desc="$1"
                elif [ -z "$file_path" ]; then
                    file_path="$1"
                fi
                shift
                ;;
        esac
    done
    
    # 验证参数
    if [ -z "$issue_desc" ] || [ -z "$file_path" ]; then
        echo -e "${RED}错误: 缺少必要参数${NC}"
        show_help
        exit 1
    fi
    
    # 检查依赖
    check_dependencies
    
    # 检查文件路径
    if [ ! -e "$file_path" ]; then
        echo -e "${RED}错误: 文件路径不存在: $file_path${NC}"
        exit 1
    fi
    
    echo -e "${GREEN}开始根因分析...${NC}"
    echo "问题: $issue_desc"
    echo "文件: $file_path"
    echo "分类: $category"
    echo ""
    
    # 执行分析
    analyze_code_patterns "$file_path" "$issue_desc"
    echo ""
    analyze_logs "$file_path"
    echo ""
    analyze_error_handling "$file_path"
    echo ""
    analyze_type_safety "$file_path"
    echo ""
    
    # 生成报告
    generate_report "$issue_desc" "$file_path" "$category" "$output_dir"
}

# 运行主函数
main "$@"
