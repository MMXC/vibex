#!/bin/bash
# check-curly-quotes.sh — 检测 Unicode 弯引号，防止 build 失败
# E6 Story: 预防规则
set -e
cd "$(dirname "$0")/.."
echo "检查 Unicode 弯引号..."
FOUND=0
for pat in $'\u2018' $'\u2019' $'\u201c' $'\u201d'; do
  matches=$(grep -rl --include="*.ts" --include="*.tsx" --include="*.js" --include="*.jsx" "$pat" src/ 2>/dev/null || true)
  if [ -n "$matches" ]; then
    printf "❌ 发现 Unicode 引号 (U+%04X)\n" "'$pat"
    echo "$matches"
    FOUND=1
  fi
done
if [ $FOUND -eq 1 ]; then
  echo "错误: 检测到 Unicode 弯引号，请替换为 ASCII 引号"
  exit 1
fi
echo "✅ 无 Unicode 弯引号"
exit 0
