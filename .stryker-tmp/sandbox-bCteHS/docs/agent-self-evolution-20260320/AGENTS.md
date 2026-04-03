# 验收脚本: Agent 每日自检系统 v2.0

> **项目**: agent-self-evolution-YYYYMMDD
> **用途**: 静默检查 + npm test 验证
> **执行频率**: 每日批次完成后 + 手动验证

---

## 1. 开发命令

### 1.1 日常开发

```bash
# 进入项目目录
cd /root/.openclaw

# 查看今日提案状态
./scripts/check-proposals.sh $(date +%Y%m%d)

# 运行提案格式校验
./scripts/validate-proposals.sh $(date +%Y%m%d)

# 查看批次报告
cat proposals/$(date +%Y%m%d)/REPORT.md
```

### 1.2 Coord 调试

```bash
# 手动触发 Coord 心跳（调试用）
./scripts/heartbeats/coord-heartbeat.sh --dry-run

# 查看任务注册状态
python3 /root/.openclaw/skills/team-tasks/scripts/task_manager.py list

# 手动创建自检项目
./scripts/create-self-evolution.sh $(date +%Y%m%d)

# 手动汇总提案
./scripts/aggregate-proposals.sh $(date +%Y%m%d)

# 手动生成报告
./scripts/generate-report.sh $(date +%Y%m%d)
```

### 1.3 测试命令

```bash
# 运行单元测试（如果存在）
npm test

# 运行集成测试（提案流程）
npm run test:integration

# 端到端验证（完整批次）
npm run test:e2e:self-evolution
```

---

## 2. 静默检查 (No Output Unless Failed)

### 2.1 提案目录结构检查

```bash
#!/bin/bash
# check-proposal-dir.sh — 无输出表示通过
set -e

DATE=${1:-$(date +%Y%m%d)}
PROPOSAL_DIR="/root/.openclaw/workspace-coord/proposals/${DATE}"

REQUIRED_FILES=(
  "dev-proposals.md"
  "analyst-proposals.md"
  "architect-proposals.md"
  "pm-proposals.md"
  "tester-proposals.md"
  "reviewer-proposals.md"
)

for file in "${REQUIRED_FILES[@]}"; do
  test -f "${PROPOSAL_DIR}/${file}" || {
    echo "MISSING: ${file}"
    exit 1
  }
done
```

**验收**: 无输出表示通过，任何缺失文件导致 exit 1

### 2.2 提案格式检查

```bash
#!/bin/bash
# validate-proposal-format.sh
set -e

DATE=${1:-$(date +%Y%m%d)}
PROPOSAL_DIR="/root/.openclaw/workspace-coord/proposals/${DATE}"

REQUIRED_SECTIONS=(
  "问题描述"
  "现状分析"
  "建议方案"
  "优先级"
  "工作量估算"
  "验收标准"
)

for md in "${PROPOSAL_DIR}"/*-proposals.md; do
  for section in "${REQUIRED_SECTIONS[@]}"; do
    grep -q "$section" "$md" || {
      echo "FORMAT_ERROR: ${md} missing section: $section"
      exit 1
    }
  done
done
```

### 2.3 team-tasks 状态检查

```bash
#!/bin/bash
# check-team-tasks.sh
set -e

TODAY=$(date +%Y%m%d)
PROJECT="agent-self-evolution-${TODAY}"
JSON="/home/ubuntu/clawd/data/team-tasks/${PROJECT}.json"

test -f "$JSON" || {
  echo "PROJECT_NOT_FOUND: $PROJECT"
  exit 1
}

# 检查所有 Agent 任务是否为 done
AGENTS=("dev" "analyst" "architect" "pm" "tester" "reviewer")
for agent in "${AGENTS[@]}"; do
  status=$(python3 -c "
import json
d=json.load(open('$JSON'))
for k,v in d['stages'].items():
  if v.get('agent')=='$agent' and 'self-check' in k:
    print(v['status'])
    break
")
  test "$status" = "done" || {
    echo "INCOMPLETE: $agent self-check status=$status"
    exit 1
  }
done
```

---

## 3. npm test 集成

### 3.1 测试脚本

```javascript
// scripts/test/self-evolution.test.ts
import { describe, it, expect } from '@jest/globals'
import * as fs from 'fs'
import * as path from 'path'

const DATE = process.env.DATE || new Date().toISOString().slice(0, 10).replace(/-/g, '')
const PROPOSAL_DIR = `/root/.openclaw/workspace-coord/proposals/${DATE}`
const TEAM_TASKS_DIR = '/home/ubuntu/clawd/data/team-tasks'

const AGENTS = ['dev', 'analyst', 'architect', 'pm', 'tester', 'reviewer']
const REQUIRED_SECTIONS = [
  '问题描述',
  '现状分析',
  '建议方案',
  '优先级',
  '工作量估算',
  '验收标准',
]

describe('Agent Self-Evolution: Daily Batch', () => {
  describe('Proposal Directory', () => {
    it('proposal directory should exist', () => {
      expect(fs.existsSync(PROPOSAL_DIR)).toBe(true)
    })

    it('all agents should submit proposals', () => {
      for (const agent of AGENTS) {
        const file = path.join(PROPOSAL_DIR, `${agent}-proposals.md`)
        expect(fs.existsSync(file)).toBe(
          `Proposal file missing for ${agent}: ${file}`
        )
      }
    })
  })

  describe('Proposal Format', () => {
    for (const agent of AGENTS) {
      const file = path.join(PROPOSAL_DIR, `${agent}-proposals.md`)
      if (fs.existsSync(file)) {
        const content = fs.readFileSync(file, 'utf-8')
        for (const section of REQUIRED_SECTIONS) {
          it(`${agent}-proposals.md should contain "${section}"`, () => {
            expect(content).toContain(section)
          })
        }
      }
    }
  })

  describe('REPORT.md', () => {
    const reportFile = path.join(PROPOSAL_DIR, 'REPORT.md')
    it('REPORT.md should exist after batch completion', () => {
      expect(fs.existsSync(reportFile)).toBe(true)
    })

    if (fs.existsSync(reportFile)) {
      const report = fs.readFileSync(reportFile, 'utf-8')
      it('REPORT.md should contain stats', () => {
        expect(report).toMatch(/提案总数|proposal.*total/i)
      })
      it('REPORT.md should contain quality metrics', () => {
        expect(report).toMatch(/质量达标率|quality.*rate/i)
      })
    }
  })

  describe('INDEX.md', () => {
    const indexFile = path.join(PROPOSAL_DIR, 'INDEX.md')
    it('INDEX.md should exist', () => {
      expect(fs.existsSync(indexFile)).toBe(true)
    })

    if (fs.existsSync(indexFile)) {
      const index = fs.readFileSync(indexFile, 'utf-8')
      for (const agent of AGENTS) {
        it(`INDEX.md should reference ${agent}`, () => {
          expect(index).toContain(agent)
        })
      }
    }
  })
})
```

---

## 4. 快速验证清单

### 每日批次完成验证

```bash
#!/bin/bash
# verify-daily-batch.sh
DATE=${1:-$(date +%Y%m%d)}
PROPOSAL_DIR="/root/.openclaw/workspace-coord/proposals/${DATE}"

echo "=== Verifying batch: $DATE ==="

PASS=0
FAIL=0

# 1. 提案数量
count=$(ls "$PROPOSAL_DIR"/*-proposals.md 2>/dev/null | wc -l)
if [ "$count" -ge 6 ]; then
  echo "✅ Proposals: $count/6"
  PASS=$((PASS+1))
else
  echo "❌ Proposals: $count/6 (expected ≥6)"
  FAIL=$((FAIL+1))
fi

# 2. INDEX.md 存在
if [ -f "$PROPOSAL_DIR/INDEX.md" ]; then
  echo "✅ INDEX.md exists"
  PASS=$((PASS+1))
else
  echo "❌ INDEX.md missing"
  FAIL=$((FAIL+1))
fi

# 3. REPORT.md 存在
if [ -f "$PROPOSAL_DIR/REPORT.md" ]; then
  echo "✅ REPORT.md exists"
  PASS=$((PASS+1))
else
  echo "❌ REPORT.md missing"
  FAIL=$((FAIL+1))
fi

# 4. 格式校验
format_errors=$(./scripts/validate-proposal-format.sh "$DATE" 2>&1 | grep -c "FORMAT_ERROR" || true)
if [ "$format_errors" -eq 0 ]; then
  echo "✅ Format: all valid"
  PASS=$((PASS+1))
else
  echo "❌ Format: $format_errors errors"
  FAIL=$((FAIL+1))
fi

echo ""
echo "=== Result: $PASS passed, $FAIL failed ==="
test "$FAIL" -eq 0
```

---

## 5. 回滚检查

### 异常情况处理

```bash
# 如果批次失败，手动重置
./scripts/reset-batch.sh 20260320

# 查看异常 Agent
./scripts/check-anomalies.sh 20260320

# 强制重新汇总
./scripts/force-aggregate.sh 20260320
```

---

## 6. 静态检查命令

```bash
# 提案数量统计
ls proposals/$(date +%Y%m%d)/*-proposals.md | wc -l

# 提案总行数
wc -l proposals/$(date +%Y%m%d)/*-proposals.md

# 提案优先级分布
grep -h "优先级" proposals/$(date +%Y%m%d)/*-proposals.md | sort | uniq -c

# 查找无提案的 Agent
for agent in dev analyst architect pm tester reviewer; do
  test -f "proposals/$(date +%Y%m%d)/${agent}-proposals.md" || echo "MISSING: $agent"
done

# 查看提案来源字段
grep -r "proposal_source" team-tasks/projects/ 2>/dev/null | head -5
```

---

*Generated by: Architect Agent*
*Date: 2026-03-20*
