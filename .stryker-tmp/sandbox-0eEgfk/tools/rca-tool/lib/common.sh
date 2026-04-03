#!/usr/bin/env bash
# lib/common.sh - 公共工具函数与常量

set -euo pipefail

# 颜色输出（防止重复定义）
[[ -z "${_RCA_COMMON_LOADED:-}" ]] || return 0
readonly _RCA_COMMON_LOADED=1

readonly RED='\033[0;31m'
readonly GREEN='\033[0;32m'
readonly YELLOW='\033[0;33m'
readonly BLUE='\033[0;34m'
readonly CYAN='\033[0;36m'
readonly NC='\033[0m' # No Color

# 路径配置
readonly SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
readonly RCA_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

# 日志函数
log_info() { echo -e "${BLUE}[INFO]${NC} $*" >&2; }
log_success() { echo -e "${GREEN}[SUCCESS]${NC} $*" >&2; }
log_warn() { echo -e "${YELLOW}[WARN]${NC} $*" >&2; }
log_error() { echo -e "${RED}[ERROR]${NC} $*" >&2; }
log_verbose() { [[ "${VERBOSE:-0}" == "1" ]] && echo -e "${CYAN}[VERBOSE]${NC} $*" >&2 || true; }

# 检查依赖
check_dependency() {
  local cmd="$1"
  if ! command -v "$cmd" &>/dev/null; then
    log_error "缺少依赖: $cmd"
    return 1
  fi
  return 0
}

# 确保jq可用
ensure_jq() {
  check_dependency jq || {
    log_warn "jq 未安装，JSON输出将受限"
    return 1
  }
}

# 安全读取文件
safe_read_file() {
  local file="$1"
  if [[ ! -f "$file" ]]; then
    log_verbose "文件不存在: $file"
    return 1
  fi
  if [[ ! -r "$file" ]]; then
    log_warn "文件不可读: $file"
    return 1
  fi
  return 0
}

# 获取文件扩展名
get_ext() {
  local file="$1"
  echo "${file##*.}"
}

# 判断是否为代码文件
is_code_file() {
  local file="$1"
  local ext
  ext=$(get_ext "$file")
  case "$ext" in
    ts|tsx|js|jsx|py|sh|bash|go|rs|java|c|cpp|h|rb|php|vue|svelte)
      return 0
      ;;
    *)
      # 检查文件头
      if head -c 100 "$file" 2>/dev/null | grep -qE '#!|/usr/bin|package|import|require|const|let|var|function|def|class'; then
        return 0
      fi
      return 1
      ;;
  esac
}

# 递归获取代码文件
get_code_files() {
  local target="$1"
  local files=()

  if [[ -f "$target" ]]; then
    if is_code_file "$target"; then
      echo "$target"
    fi
  elif [[ -d "$target" ]]; then
    while IFS= read -r -d '' file; do
      if is_code_file "$file"; then
        echo "$file"
      fi
    done < <(find "$target" -type f \( -name "*.ts" -o -name "*.tsx" -o -name "*.js" -o -name "*.jsx" -o -name "*.py" -o -name "*.sh" -o -name "*.go" -o -name "*.rs" -o -name "*.java" -o -name "*.rb" -o -name "*.php" -o -name "*.vue" -o -name "*.svelte" \) -print0 2>/dev/null)
  fi
}

# 清理临时文件
cleanup_temp() {
  local tmpfile="$1"
  [[ -f "$tmpfile" ]] && rm -f "$tmpfile"
}

# 生成时间戳
get_timestamp() {
  date -u +"%Y-%m-%dT%H:%M:%SZ"
}

# 生成短时间戳
get_short_ts() {
  date -u +"%Y%m%d_%H%M%S"
}

# 转义JSON字符串
json_escape() {
  local str="$1"
  printf '%s' "$str" | python3 -c 'import json,sys; print(json.dumps(sys.stdin.read()))' 2>/dev/null || echo "\"$str\""
}

# 数字比较
max() { printf '%s\n' "$@" | sort -rn | head -1; }
min() { printf '%s\n' "$@" | sort -n | head -1; }
