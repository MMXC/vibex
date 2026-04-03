#!/usr/bin/env bash
# proposal-validator.sh - 提案格式验证脚本
# 用法: ./proposal-validator.sh <proposal-file> [options]
#
# 选项:
#   -q, --quiet    静默模式，仅返回退出码
#   -j, --json     JSON 格式输出
#   -h, --help     显示帮助

set -euo pipefail

# 颜色输出
readonly RED='\033[0;31m'
readonly GREEN='\033[0;32m'
readonly YELLOW='\033[0;33m'
readonly BLUE='\033[0;34m'
readonly NC='\033[0m'

# 错误码
readonly E001=1   # 缺少头部标题
readonly E002=2   # 缺少执行摘要
readonly E003=3   # 缺少问题定义
readonly E004=4   # 缺少解决方案
readonly E005=5   # 缺少验收标准
readonly E006=6   # 文件不存在
readonly E007=7   # 缺少提案内容

QUIET=0
JSON_OUTPUT=0
ERRORS=()

# 解析参数
while [[ $# -gt 0 ]]; do
  case "$1" in
    -q|--quiet) QUIET=1; shift ;;
    -j|--json) JSON_OUTPUT=1; shift ;;
    -h|--help)
      echo "Usage: $0 <proposal-file> [options]"
      echo "Options:"
      echo "  -q, --quiet    Quiet mode (exit code only)"
      echo "  -j, --json     JSON output format"
      echo "  -h, --help     Show this help"
      exit 0
      ;;
    *) PROPOSAL_FILE="$1"; shift ;;
  esac
done

if [[ -z "${PROPOSAL_FILE:-}" ]]; then
  echo -e "${RED}[ERROR]${NC} Missing proposal file argument" >&2
  exit 1
fi

# 检查文件存在
if [[ ! -f "$PROPOSAL_FILE" ]]; then
  if [[ $JSON_OUTPUT -eq 1 ]]; then
    echo "{\"valid\":false,\"errors\":[{\"code\":\"E006\",\"message\":\"File does not exist: $PROPOSAL_FILE\"}]}"
  else
    echo -e "${RED}[E006]${NC} 文件不存在: $PROPOSAL_FILE"
  fi
  exit $E006
fi

# 读取文件内容
content=$(cat "$PROPOSAL_FILE")

# 验证规则
check_header() {
  if ! echo "$content" | grep -q "^# "; then
    ERRORS+=("E001:缺少提案标题（应为 # 提案标题）")
    return 1
  fi
  return 0
}

check_executive_summary() {
  if ! echo "$content" | grep -qE "^##\s*(执行摘要|Executive Summary)"; then
    ERRORS+=("E002:缺少执行摘要章节")
    return 1
  fi
  return 0
}

check_problem_definition() {
  if ! echo "$content" | grep -qE "^##\s*(问题定义|Problem Definition|问题陈述|需求定义|功能需求|需求分析|功能列表)"; then
    ERRORS+=("E003:缺少问题/需求章节")
    return 1
  fi
  return 0
}

check_solution() {
  if ! echo "$content" | grep -qE "^##\s*(解决方案|Solution|技术方案|技术选型|实现方案|实施方案|Epic 拆分)"; then
    ERRORS+=("E004:缺少解决方案章节")
    return 1
  fi
  return 0
}

check_acceptance() {
  if ! echo "$content" | grep -qE "^##\s*(验收标准|Acceptance Criteria|验收条件|Success Metrics|验收清单)"; then
    ERRORS+=("E005:缺少验收标准章节")
    return 1
  fi
  return 0
}

check_content_length() {
  local lines
  lines=$(echo "$content" | wc -l)
  if [[ $lines -lt 20 ]]; then
    ERRORS+=("E007:提案内容过少（${lines}行，建议≥20行）")
    return 1
  fi
  return 0
}

# 执行检查
check_header
check_executive_summary
check_problem_definition
check_solution
check_acceptance
check_content_length

# 输出结果
if [[ ${#ERRORS[@]} -eq 0 ]]; then
  if [[ $JSON_OUTPUT -eq 1 ]]; then
    echo "{\"valid\":true,\"proposal\":\"$PROPOSAL_FILE\",\"errors\":[]}"
  else
    echo -e "${GREEN}[PASS]${NC} 提案格式验证通过: $PROPOSAL_FILE"
  fi
  exit 0
else
  if [[ $JSON_OUTPUT -eq 1 ]]; then
    local json_errors
    json_errors=$(printf '%s\n' "${ERRORS[@]}" | jq -R . | jq -s .)
    echo "{\"valid\":false,\"proposal\":\"$PROPOSAL_FILE\",\"errors\":$json_errors}"
  else
    if [[ $QUIET -eq 0 ]]; then
      echo -e "${RED}[FAIL]${NC} 提案格式验证失败: $PROPOSAL_FILE"
      for err in "${ERRORS[@]}"; do
        echo -e "  ${RED}[✗]${NC} $err"
      done
    fi
  fi
  exit 1
fi
