#!/usr/bin/env bash
# lib/patterns.sh - 模式检测引擎

set -euo pipefail

# shellcheck source=common.sh
[[ -n "${_RCA_PATTERNS_LOADED:-}" ]] && return 0
source "$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)/common.sh"
_RCA_PATTERNS_LOADED=1
readonly _RCA_PATTERNS_LOADED

# 最大文件扫描数
readonly RCA_MAX_FILES="${RCA_MAX_FILES:-500}"

# === 加载模式签名 ===
load_signatures() {
  local pattern_file="$1"
  local -n name_out="${2:-_noname}"
  local -n cat_out="${3:-_nocat}"
  local -n sev_out="${4:-_nosev}"
  local -n conf_out="${5:-_noconf}"
  local -n fixes_out="${6:-_nofix}"

  name_out=""
  cat_out=""
  sev_out=""
  conf_out=""
  fixes_out=""

  [[ ! -f "$pattern_file" ]] && return 0
  [[ ! -r "$pattern_file" ]] && return 0

  local in_fm=false
  local in_sigs=false
  local all_sigs=""

  while IFS= read -r ln || [[ -n "$ln" ]]; do
    if [[ "$ln" == "---" ]] && ! $in_fm; then
      in_fm=true
      continue
    fi
    if [[ "$ln" == "---" ]] && $in_fm; then
      in_fm=false
      in_sigs=false
      continue
    fi
    $in_fm || continue

    case "$ln" in
      name:*)
        name_out="${ln#name: }"
        name_out="${name_out#"${name_out%%[![:space:]]*}"}"
        ;;
      category:*)
        cat_out="${ln#category: }"
        cat_out="${cat_out#"${cat_out%%[![:space:]]*}"}"
        ;;
      severity:*)
        sev_out="${ln#severity: }"
        sev_out="${sev_out#"${sev_out%%[![:space:]]*}"}"
        ;;
      confidence:*)
        conf_out="${ln#confidence: }"
        conf_out="${conf_out#"${conf_out%%[![:space:]]*}"}"
        ;;
      fix_suggestions:*)
        fixes_out="${ln#fix_suggestions: }"
        fixes_out="${fixes_out#"${fixes_out%%[![:space:]]*}"}"
        ;;
      signatures:)
        in_sigs=true
        ;;
    esac

    if $in_sigs; then
      if [[ "$ln" =~ ^[[:space:]]*-[[:space:]]*pattern:[[:space:]]*\"(.*)\" ]]; then
        local raw="${BASH_REMATCH[1]}"
        # Convert regex shorthand to POSIX classes for bash/perl compatibility
        local sig="$raw"
        sig="${sig//\\s/[[:space:]]}"
        sig="${sig//\\d/[0-9]}"
        sig="${sig//\\w/[a-zA-Z0-9_]}"
        # Also fix any remaining double-escaped sequences (for mixed files)
        sig="${sig//\\\\s/[[:space:]]}"
        sig="${sig//\\\\d/[0-9]}"
        sig="${sig//\\\\w/[a-zA-Z0-9_]}"
        all_sigs+="${sig}"$'\n'
      elif [[ "$ln" =~ ^[[:space:]]*-[[:space:]]*pattern:[[:space:]]*'(.*)' ]]; then
        local raw="${BASH_REMATCH[1]}"
        local sig="$raw"
        sig="${sig//\\s/[[:space:]]}"
        sig="${sig//\\d/[0-9]}"
        sig="${sig//\\w/[a-zA-Z0-9_]}"
        sig="${sig//\\\\s/[[:space:]]}"
        sig="${sig//\\\\d/[0-9]}"
        sig="${sig//\\\\w/[a-zA-Z0-9_]}"
        all_sigs+="${sig}"$'\n'
      elif [[ ! "$ln" =~ ^[[:space:]] ]] && [[ -n "${ln// }" ]]; then
        in_sigs=false
      fi
    fi
  done < "$pattern_file"

  echo "$all_sigs"
}

# === 加载所有模式文件 ===
load_all_patterns() {
  local category="$1"
  local pdir="$RCA_ROOT/patterns"
  local pfiles=()

  if [[ -n "$category" ]] && [[ -d "$pdir/$category" ]]; then
    while IFS= read -r -d '' f; do pfiles+=("$f"); done < <(find "$pdir/$category" -name "*.md" -print0 2>/dev/null)
  elif [[ -d "$pdir" ]]; then
    while IFS= read -r -d '' f; do pfiles+=("$f"); done < <(find "$pdir" -name "*.md" -print0 2>/dev/null)
  fi

  printf '%s\n' "${pfiles[@]}"
}

# === 扫描单个文件 ===
scan_file() {
  local file="$1"
  local pattern="$2"

  command -v perl >/dev/null 2>&1 || {
    grep -nE "$pattern" "$file" 2>/dev/null | head -5
    return
  }

  perl -0777 -ne '
    my $content = $_;
    my @lines = split(/\n/, $content);
    while ($content =~ /'"$pattern"'/g) {
      my $ms = $-[0];
      my $ln = 1;
      my $cc = 0;
      for my $l (@lines) {
        $cc += length($l) + 1;
        last if $cc > $ms;
        $ln++;
      }
      my $snip = $&;
      $snip =~ s/[\n\r]/ /g;
      $snip =~ s/\|//g;
      $snip = substr($snip, 0, 120);
      print "$ln|$snip\n";
    }
  ' "$file" 2>/dev/null | head -5
}

# === 检测单个模式 ===
detect_single_pattern() {
  local pfile="$1"
  local target="$2"
  local -a results=()

  local pname pcat psev pconf pfix allsigs
  allsigs=$(load_signatures "$pfile" pname pcat psev pconf pfix)
  [[ -z "$allsigs" ]] && return 1

  # 收集代码文件
  local -a cfiles=()
  local fc=0

  if [[ -f "$target" ]] && is_code_file "$target"; then
    cfiles+=("$target")
  elif [[ -d "$target" ]]; then
    while IFS= read -r -d '' f; do
      ((fc++)) || true
      [[ $fc -gt $RCA_MAX_FILES ]] && break
      is_code_file "$f" && cfiles+=("$f")
    done < <(find "$target" -type f \( -name "*.ts" -o -name "*.tsx" -o -name "*.js" -o -name "*.jsx" -o -name "*.py" -o -name "*.sh" -o -name "*.go" -o -name "*.rs" -o -name "*.java" -o -name "*.rb" -o -name "*.vue" -o -name "*.svelte" \) -print0 2>/dev/null)
  fi

  [[ ${#cfiles[@]} -eq 0 ]] && return 1

  local found=0
  while IFS= read -r sig; do
    [[ -z "$sig" ]] && continue
    for f in "${cfiles[@]}"; do
      local out
      out=$(scan_file "$f" "$sig" 2>/dev/null || true)
      [[ -z "$out" ]] && continue
      while IFS= read -r line; do
        [[ -z "$line" ]] && continue
        local ln="${line%%|*}"
        local ctx="${line#*|}"
        ctx="${ctx//|/}"
        results+=("PATTERN|$ln|$ctx|$pname|${pconf:-70}|$pfix")
        log_verbose "  ✓ $pname @ $f:$ln"
        ((found++)) || true
      done <<< "$out"
    done
  done <<< "$allsigs"

  [[ $found -gt 0 ]] && printf '%s\n' "${results[@]}"
}

# === 主检测 ===
detect_patterns() {
  local target="$1"
  local category="${2:-}"

  [[ ! -e "$target" ]] && { log_error "路径不存在: $target"; return 1; }

  log_info "检测: category=${category:-all}, target=$target"

  local pfstr
  pfstr=$(load_all_patterns "$category")
  [[ -z "$pfstr" ]] && { log_warn "无模式文件: $category"; return 0; }

  local -a all_results=()
  local -A seen=()
  local mc=0
  local pfc=0

  while IFS= read -r pf; do
    [[ -z "$pf" ]] && continue
    local pbase
    pbase=$(basename "$pf" .md)
    log_verbose "检查: $pbase"

    local out
    out=$(detect_single_pattern "$pf" "$target" 2>/dev/null || true)
    if [[ -n "$out" ]]; then
      while IFS= read -r m; do
        [[ -z "$m" ]] && continue
        local key="${m%%|*}"
        [[ -n "${seen[$key]:-}" ]] && continue
        seen[$key]=1
        all_results+=("$m")
        ((mc++)) || true
      done <<< "$out"
    fi

    ((pfc++)) || true
    [[ $pfc -gt 50 ]] && { log_warn "扫描达上限(50)"; break; }
  done <<< "$pfstr"

  log_info "发现 ${mc} 个匹配"
  [[ ${#all_results[@]} -gt 0 ]] && printf '%s\n' "${all_results[@]}"
}

# === 日志分析 ===
analyze_logs() {
  local lpath="$1"
  [[ ! -e "$lpath" ]] && { log_warn "日志不存在: $lpath"; return 1; }

  log_info "分析日志: $lpath"
  local -a results=()

  local err_pats=("Error:" "Exception:" "FATAL" "PANIC" "FAILED" "SyntaxError" "TypeError" "ReferenceError" "undefined" "null is not" "Cannot read" "Timeout" "ECONNREFUSED" "ENOTFOUND" "ETIMEDOUT")
  local warn_pats=("WARN" "WARNING" "Deprecated" "deprecated")

  for pat in "${err_pats[@]}"; do
    local matches
    matches=$(grep -nE "$pat" "$lpath" 2>/dev/null | head -10 || true)
    [[ -z "$matches" ]] && continue
    while IFS= read -r ln; do
      [[ -z "$ln" ]] && continue
      results+=("LOG_ERROR|${ln%%:*}|${ln#*:}")
    done <<< "$matches"
  done

  for pat in "${warn_pats[@]}"; do
    local matches
    matches=$(grep -nE "$pat" "$lpath" 2>/dev/null | head -5 || true)
    [[ -z "$matches" ]] && continue
    while IFS= read -r ln; do
      [[ -z "$ln" ]] && continue
      results+=("LOG_WARN|${ln%%:*}|${ln#*:}")
    done <<< "$matches"
  done

  [[ ${#results[@]} -gt 0 ]] && printf '%s\n' "${results[@]}"
}

calculate_confidence() {
  local base="${2:-70}"
  local adj=$((base + ${1:-1} * 2))
  [[ $adj -gt 100 ]] && adj=100
  echo "$adj"
}

export_to_json() {
  local issue="$1" target="$2" category="$3"; shift 3
  local -a matches=("$@")
  local ts
  ts=$(get_timestamp)

  echo "{"
  echo "  \"report\": {"
  echo "    \"issue\": $(json_escape "$issue"),"
  echo "    \"targetPath\": $(json_escape "$target"),"
  echo "    \"category\": $(json_escape "$category"),"
  echo "    \"timestamp\": \"$ts\","
  echo "    \"matches\": ${#matches[@]},"
  echo "    \"items\": ["
  local first=true
  for m in "${matches[@]}"; do
    IFS='|' read -r t ln c <<< "$m"
    $first || echo ","
    first=false
    echo -n "      {\"type\":$(json_escape "$t"),\"line\":$(json_escape "$ln"),\"content\":$(json_escape "$c")}"
  done
  echo ""
  echo "    ]"
  echo "  }"
  echo "}"
}
