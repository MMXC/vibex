#!/usr/bin/env bash
# rca-tool.sh - 根因分析 CLI 工具
# 用法: ./rca-tool.sh <issue> <target-path> [options]
#
# 选项:
#   -c, --category   模式类别: ui-rendering | api-integration | state-management | performance
#   -o, --output     输出文件路径
#   -f, --format     输出格式: markdown | json | text (default: markdown)
#   -v, --verbose    详细输出
#   -l, --log        分析指定日志文件
#   --dry-run        仅分析，不生成报告
#   -h, --help       显示帮助

set -euo pipefail

# shellcheck source=lib/common.sh
source "$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)/lib/common.sh"

# === 全局变量 ===
ISSUE=""
TARGET_PATH=""
CATEGORY=""
OUTPUT_FILE=""
OUTPUT_FORMAT="markdown"
VERBOSE=0
DRY_RUN=0
LOG_FILE=""

# === 帮助信息 ===
show_help() {
  cat << 'HELP'
RCA 根因分析工具 v2.0
========================

用法:
  ./rca-tool.sh <issue> <target-path> [options]

位置参数:
  <issue>          问题描述 (必需)
  <target-path>    目标代码路径 (必需)

选项:
  -c, --category   模式类别:
                     ui-rendering     React/Vue 渲染问题
                     api-integration API 调用问题
                     state-management 状态管理问题
                     performance     性能问题
  -o, --output     输出文件路径 (默认: 终端输出)
  -f, --format     输出格式: markdown | json | text (默认: markdown)
  -v, --verbose    详细输出模式
  -l, --log        分析指定日志文件
  --dry-run        仅分析，不生成报告
  -h, --help       显示此帮助

示例:
  ./rca-tool.sh "页面渲染失败" ./src/components/ -c ui-rendering -v
  ./rca-tool.sh "API 调用失败" ./src/api/ -c api-integration -o report.md
  ./rca-tool.sh "内存泄漏" ./src/ -c performance --dry-run

了解更多: docs/vibex-proposal-rca-tool/architecture.md
HELP
}

# === 解析参数 ===
parse_args() {
  # Handle --help/-h early before arg count check
  for arg in "$@"; do
    case "$arg" in
      -h|--help)
        show_help
        exit 0
        ;;
    esac
  done

  if [[ $# -lt 2 ]]; then
    log_error "参数不足"
    show_help
    exit 1
  fi

  ISSUE="$1"
  TARGET_PATH="$2"
  shift 2

  while [[ $# -gt 0 ]]; do
    case "$1" in
      -c|--category)
        CATEGORY="$2"
        shift 2
        ;;
      -o|--output)
        OUTPUT_FILE="$2"
        shift 2
        ;;
      -f|--format)
        OUTPUT_FORMAT="$2"
        shift 2
        ;;
      -v|--verbose)
        VERBOSE=1
        shift
        ;;
      -l|--log)
        LOG_FILE="$2"
        shift 2
        ;;
      --dry-run)
        DRY_RUN=1
        shift
        ;;
      -h|--help)
        show_help
        exit 0
        ;;
      *)
        log_warn "未知选项: $1"
        shift
        ;;
    esac
  done

  # 验证必填参数
  [[ -z "$ISSUE" ]] && { log_error "缺少 issue 参数"; exit 1; }
  [[ -z "$TARGET_PATH" ]] && { log_error "缺少 target-path 参数"; exit 1; }
  [[ ! -e "$TARGET_PATH" ]] && { log_error "目标路径不存在: $TARGET_PATH"; exit 1; }

  # 验证类别
  if [[ -n "$CATEGORY" ]]; then
    case "$CATEGORY" in
      ui-rendering|api-integration|state-management|performance) ;;
      *)
        log_error "未知类别: $CATEGORY"
        log_error "可用类别: ui-rendering, api-integration, state-management, performance"
        exit 1
        ;;
    esac
  fi

  # 验证格式
  case "$OUTPUT_FORMAT" in
    markdown|json|text) ;;
    *)
      log_error "未知格式: $OUTPUT_FORMAT"
      exit 1
      ;;
  esac
}

# === 主流程 ===
main() {
  parse_args "$@"

  log_info "RCA 工具 v2.0 启动"
  log_info "问题: $ISSUE"
  log_info "目标: $TARGET_PATH"
  [[ -n "$CATEGORY" ]] && log_info "类别: $CATEGORY"
  [[ -n "$LOG_FILE" ]] && log_info "日志: $LOG_FILE"
  echo ""

  # shellcheck source=lib/patterns.sh
  source "$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)/lib/patterns.sh"
  # shellcheck source=lib/report.sh
  source "$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)/lib/report.sh"

  local -a all_matches=()

  # 1. 代码模式检测
  if [[ -n "$CATEGORY" ]]; then
    log_info "━━━ 步骤 1/3: 代码模式检测 ━━━"
    if patterns_output=$(detect_patterns "$TARGET_PATH" "$CATEGORY" 2>&1); then
      while IFS= read -r line; do
        [[ -n "$line" ]] && all_matches+=("$line")
      done <<< "$patterns_output"
    fi
    echo ""
  else
    log_info "━━━ 步骤 1/3: 全类别代码模式检测 ━━━"
    for cat in ui-rendering api-integration state-management performance; do
      log_verbose "检测类别: $cat"
      if patterns_output=$(detect_patterns "$TARGET_PATH" "$cat" 2>&1); then
        while IFS= read -r line; do
          [[ -n "$line" ]] && all_matches+=("$line")
        done <<< "$patterns_output"
      fi
    done
    echo ""
  fi

  # 2. 日志分析
  if [[ -n "$LOG_FILE" ]]; then
    log_info "━━━ 步骤 2/3: 日志分析 ━━━"
    if log_output=$(analyze_logs "$LOG_FILE" 2>&1); then
      while IFS= read -r line; do
        [[ -n "$line" ]] && all_matches+=("$line")
      done <<< "$log_output"
    fi
    echo ""
  fi

  # 3. 汇总
  log_info "━━━ 步骤 3/3: 生成报告 ━━━"
  
  if [[ $DRY_RUN -eq 1 ]]; then
    log_info "Dry-run 模式: 跳过报告生成"
    print_summary "$ISSUE" "$TARGET_PATH" "${CATEGORY:-all}" "${all_matches[@]}"
    log_success "分析完成 (dry-run)"
    exit 0
  fi

  # 输出报告
  case "$OUTPUT_FORMAT" in
    markdown)
      if [[ -n "$OUTPUT_FILE" ]]; then
        generate_markdown_report "$ISSUE" "$TARGET_PATH" "${CATEGORY:-all}" \
          "${all_matches[@]}" > "$OUTPUT_FILE"
        log_success "报告已生成: $OUTPUT_FILE"
      else
        generate_markdown_report "$ISSUE" "$TARGET_PATH" "${CATEGORY:-all}" \
          "${all_matches[@]}"
      fi
      ;;
    json)
      if ensure_jq; then
        if [[ -n "$OUTPUT_FILE" ]]; then
          export_to_json "$ISSUE" "$TARGET_PATH" "${CATEGORY:-all}" "${all_matches[@]}" > "$OUTPUT_FILE"
          log_success "报告已生成: $OUTPUT_FILE"
        else
          export_to_json "$ISSUE" "$TARGET_PATH" "${CATEGORY:-all}" "${all_matches[@]}"
        fi
      else
        log_error "JSON 格式需要 jq，请先安装: apt install jq"
        exit 1
      fi
      ;;
    text)
      if [[ -n "$OUTPUT_FILE" ]]; then
        print_summary "$ISSUE" "$TARGET_PATH" "${CATEGORY:-all}" "${all_matches[@]}" > "$OUTPUT_FILE"
        log_success "报告已生成: $OUTPUT_FILE"
      else
        print_summary "$ISSUE" "$TARGET_PATH" "${CATEGORY:-all}" "${all_matches[@]}"
      fi
      ;;
  esac

  log_success "分析完成! 共发现 ${#all_matches[@]} 个匹配项"
}

main "$@"
