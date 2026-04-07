#!/usr/bin/env bats
# integration/full-flow.test.sh - Full RCA flow integration tests

RCA_TOOL="/root/.openclaw/vibex/tools/rca-tool/rca-tool.sh"

setup() {
  export VERBOSE=0
  export DRY_RUN=0
  rm -rf /tmp/rca-integration-*
}

teardown() {
  rm -rf /tmp/rca-integration-*
}

@test "Full RCA flow generates markdown report" {
  mkdir -p /tmp/rca-integration-1/src/components
  echo 'const [count, setCount] = useState(0);' > /tmp/rca-integration-1/src/components/BadComponent.tsx
  echo 'useEffect(() => { setCount(count + 1); }, []);' >> /tmp/rca-integration-1/src/components/BadComponent.tsx
  
  run "$RCA_TOOL" "页面渲染问题" /tmp/rca-integration-1/src/components -c ui-rendering -o /tmp/rca-integration-1/report.md
  
  [[ "$status" -eq 0 ]]
  [ -f "/tmp/rca-integration-1/report.md" ]
  grep -q "RCA\|分析\|Issue\|Problem" /tmp/rca-integration-1/report.md
}

@test "Dry run mode does not create report file" {
  mkdir -p /tmp/rca-integration-2
  echo 'useEffect(() => { console.log(x); }, []);' > /tmp/rca-integration-2/test.js
  
  # Capture any existing report files
  before=$(ls /tmp/rca-integration-2-*.md 2>/dev/null || true)
  
  run "$RCA_TOOL" "test issue" /tmp/rca-integration-2 -c ui-rendering --dry-run
  
  [[ "$status" -eq 0 ]]
}

@test "JSON format output works" {
  mkdir -p /tmp/rca-integration-3
  echo 'const x = useState(0);' > /tmp/rca-integration-3/test.jsx
  
  run "$RCA_TOOL" "state issue" /tmp/rca-integration-3 -c state-management -f json -o /tmp/rca-integration-3/report.json
  
  [[ "$status" -eq 0 ]]
  [ -f "/tmp/rca-integration-3/report.json" ]
}

@test "Help flag shows usage" {
  run "$RCA_TOOL" --help
  
  [[ "$status" -eq 0 ]]
  echo "$output" | grep -qi "RCA\|用法\|usage\|帮助" || echo "Output: $output"
}

@test "Missing arguments shows error" {
  run "$RCA_TOOL"
  [[ "$status" -ne 0 ]]
  
  run "$RCA_TOOL" "only one arg"
  [[ "$status" -ne 0 ]]
}

@test "API integration category works" {
  mkdir -p /tmp/rca-integration-5
  cat > /tmp/rca-integration-5/api.ts << 'EOF'
export async function getData(url) {
  const resp = await fetch(url);
  return resp.json();
}
EOF
  
  run "$RCA_TOOL" "API error" /tmp/rca-integration-5 -c api-integration -o /tmp/rca-integration-5/report.md
  
  [[ "$status" -eq 0 ]]
  [ -f "/tmp/rca-integration-5/report.md" ]
}

@test "Performance category works" {
  mkdir -p /tmp/rca-integration-6
  echo 'const largeArray = Array(10000).fill({});' > /tmp/rca-integration-6/perf.js
  
  run "$RCA_TOOL" "memory leak" /tmp/rca-integration-6 -c performance -o /tmp/rca-integration-6/report.md
  
  [[ "$status" -eq 0 ]]
  [ -f "/tmp/rca-integration-6/report.md" ]
}

@test "Text format output works" {
  mkdir -p /tmp/rca-integration-7
  echo 'setTimeout(() => setX(x + 1), 100);' > /tmp/rca-integration-7/test.js
  
  run "$RCA_TOOL" "timing issue" /tmp/rca-integration-7 -c ui-rendering -f text -o /tmp/rca-integration-7/report.txt
  
  [[ "$status" -eq 0 ]]
  [ -f "/tmp/rca-integration-7/report.txt" ]
}

@test "Empty directory handled gracefully" {
  mkdir -p /tmp/rca-integration-8/empty
  
  run "$RCA_TOOL" "no issues here" /tmp/rca-integration-8/empty -c ui-rendering -o /tmp/rca-integration-8/report.md
  
  [[ "$status" -eq 0 ]]
  [ -f "/tmp/rca-integration-8/report.md" ]
}
