#!/usr/bin/env bash
# lib/report.sh - 报告生成模块

set -euo pipefail

# shellcheck source=common.sh
[[ -z "${_RCA_REPORT_LOADED:-}" ]] || return 0
source "$(dirname "${BASH_SOURCE[0]}")/common.sh"
readonly _RCA_REPORT_LOADED=1

# 报告模板 - Markdown
generate_markdown_report() {
  local issue="$1"
  local target="$2"
  local category="$3"
  shift 3
  local -a matches=("$@")

  local timestamp
  timestamp=$(get_timestamp)

  # 分类统计
  local error_count=0 warn_count=0 pattern_count=0 log_count=0
  for match in "${matches[@]}"; do
    case "$match" in
      LOG_ERROR*) ((error_count++)) || true; ((log_count++)) || true ;;
      LOG_WARN*)  ((warn_count++)) || true; ((log_count++)) || true ;;
      *)          ((pattern_count++)) || true ;;
    esac
  done

  local total=$((error_count + warn_count + pattern_count))
  local severity=""
  if [[ $error_count -gt 3 ]]; then
    severity="🔴 严重"
  elif [[ $error_count -gt 0 ]]; then
    severity="🟡 中等"
  elif [[ $warn_count -gt 0 ]]; then
    severity="🟢 轻微"
  else
    severity="✅ 正常"
  fi

  # 生成报告内容 - 输出到 stdout
  cat << REPORT_EOF
# RCA 分析报告

## 📋 基本信息

| 字段 | 值 |
|------|-----|
| **问题描述** | $issue |
| **分析目标** | $target |
| **模式类别** | $category |
| **分析时间** | $timestamp |
| **总匹配项** | $total |
| **严重程度** | $severity |

---

## 📊 统计摘要

| 类型 | 数量 |
|------|------|
| 🔴 日志错误 | $error_count |
| 🟡 日志警告 | $warn_count |
| 🔍 代码模式 | $pattern_count |
| **总计** | $total |

---

## 🔍 根因分析

REPORT_EOF

  # 按类型分组输出
  local current_type=""
  local first_in_group=true
  for match in "${matches[@]}"; do
    IFS='|' read -r mtype linenum content <<< "$match"
    
    if [[ "$mtype" != "$current_type" ]]; then
      if ! $first_in_group; then
        echo ""
      fi
      first_in_group=false
      current_type="$mtype"
      
      case "$mtype" in
        LOG_ERROR*) echo "### 🔴 日志错误" ;;
        LOG_WARN*)  echo "### 🟡 日志警告" ;;
        *)          echo "### 🔍 代码模式匹配" ;;
      esac
      echo ""
      echo "| 文件位置 | 内容摘要 |"
      echo "|----------|----------|"
    fi
    
    # 截断过长内容
    local short_content="${content:0:100}"
    [[ ${#content} -gt 100 ]] && short_content+="..."
    short_content="${short_content//|/\\|}"
    
    echo "| \`$linenum\` | \`$short_content\` |"
  done

  echo ""
  echo "---"
  echo ""

  # 解决方案建议
  cat << SOLUTIONS_EOF
## 💡 可能的解决方案

SOLUTIONS_EOF

  case "$category" in
    ui-rendering)
      cat << 'SUG'
1. 检查 React 组件的依赖数组配置
2. 使用 `useCallback` 包装回调函数
3. 使用 `useMemo` 避免不必要的计算
4. 检查是否存在无限重渲染循环
5. 确认状态更新是否遵循不可变原则
SUG
      ;;
    api-integration)
      cat << 'SUG'
1. 确保所有 API 调用都有错误处理
2. 添加重试机制（指数退避）
3. 配置合理的超时时间
4. 使用统一的错误拦截器
5. 检查 CORS 配置是否正确
SUG
      ;;
    state-management)
      cat << 'SUG'
1. 检查状态更新的正确性
2. 避免循环状态依赖
3. 使用 Immer 或不可变更新模式
4. 确认状态重置时机
5. 检查状态是否正确同步到UI
SUG
      ;;
    performance)
      cat << 'SUG'
1. 检查内存泄漏（未清理的定时器、事件监听器）
2. 优化包体积（Tree shaking、代码分割）
3. 减少不必要的重渲染
4. 使用虚拟列表处理长列表
5. 优化图片和资源加载
SUG
      ;;
    *)
      cat << 'SUG'
1. 仔细审查相关代码
2. 检查日志中的错误信息
3. 确认输入数据的有效性
4. 添加防御性编程
5. 编写单元测试覆盖边界情况
SUG
      ;;
  esac

  echo ""
  echo "---"
  echo ""
  echo "*报告由 RCA CLI 工具自动生成 | $timestamp*"
}

# 简洁文本输出
print_summary() {
  local issue="$1"
  local target="$2"
  local category="$3"
  shift 3
  local -a matches=("$@")

  local total=${#matches[@]}
  
  echo ""
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  echo "  RCA 分析摘要"
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  echo "  问题: $issue"
  echo "  目标: $target"
  echo "  类别: $category"
  echo "  匹配: $total 项"
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  
  if [[ $total -gt 0 ]]; then
    echo ""
    echo "  前5个匹配:"
    local count=0
    for match in "${matches[@]}"; do
      ((count++)) || true
      [[ $count -gt 5 ]] && break
      IFS='|' read -r mtype linenum content <<< "$match"
      local short="${content:0:60}"
      [[ ${#content} -gt 60 ]] && short+="..."
      printf "  [%d] %s @ line %s: %s\n" "$count" "$mtype" "$linenum" "$short"
    done
    [[ $total -gt 5 ]] && echo "  ... 还有 $((total - 5)) 项"
  fi
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  echo ""
}

# JSON 报告生成
export_to_json() {
  local issue="$1"
  local target="$2"
  local category="$3"
  shift 3
  local -a matches=("$@")

  local timestamp
  timestamp=$(get_timestamp)

  # 分类统计
  local error_count=0 warn_count=0 pattern_count=0
  for match in "${matches[@]}"; do
    case "$match" in
      LOG_ERROR*) ((error_count++)) || true ;;
      LOG_WARN*) ((warn_count++)) || true ;;
      *) ((pattern_count++)) || true ;;
    esac
  done

  local total=${#matches[@]}
  local severity="normal"
  [[ $total -gt 5 ]] && severity="warning"
  [[ $total -gt 10 ]] && severity="critical"

  # 生成 JSON
  echo "{"
  echo "  \"report\": {"
  echo "    \"issue\": $(json_escape "$issue"),"
  echo "    \"targetPath\": $(json_escape "$target"),"
  echo "    \"category\": $(json_escape "$category"),"
  echo "    \"timestamp\": \"$timestamp\","
  echo "    \"summary\": {"
  echo "      \"total\": $total,"
  echo "      \"patterns\": $pattern_count,"
  echo "      \"errors\": $error_count,"
  echo "      \"warnings\": $warn_count,"
  echo "      \"severity\": \"$severity\""
  echo "    },"
  echo "    \"patterns\": ["

  local idx=0
  for match in "${matches[@]}"; do
    IFS='|' read -r mtype linenum content <<< "$match"
    [[ $idx -gt 0 ]] && echo "      ,"
    printf '      {"type": "%s", "line": "%s", "snippet": %s}' "$mtype" "$linenum" "$(json_escape "$content")"
    ((idx++)) || true
  done

  echo ""
  echo "    ],"
  echo "    \"solutions\": ["
  echo "      \"Review the matched patterns and apply suggested fixes\","
  echo "      \"Run RCA tool again after fixes to verify resolution\""
  echo "    ]"
  echo "  }"
  echo "}"
}

# Text 报告生成
generate_text_report() {
  local issue="$1"
  local target="$2"
  local category="$3"
  shift 3
  local -a matches=("$@")

  local timestamp
  timestamp=$(get_timestamp)

  echo "RCA Analysis Report"
  echo "===================="
  echo "Issue: $issue"
  echo "Target: $target"
  echo "Category: $category"
  echo "Time: $timestamp"
  echo "Total Matches: ${#matches[@]}"
  echo ""
  echo "Results:"
  local count=0
  for match in "${matches[@]}"; do
    ((count++)) || true
    IFS='|' read -r mtype linenum content <<< "$match"
    echo "[$count] [$mtype] Line $linenum: $content"
  done
  echo ""
  echo "Done."
}
