# Spec: E3 Tester 主动扫描 E2E 报告

## 问题

Tester 采用纯事件驱动模式，在 Dev 单边 Epic 日无主动贡献（最近 24h 无新阶段文件）。

## 现状

- Tester 依赖其他 agent 触发事件
- 无主动扫描机制
- `~/.gstack/reports/` 目录包含 E2E 测试报告，但从未被自动分析

## 解决方案

### 在 Tester HEARTBEAT.md 增加主动扫描逻辑

```bash
# HEARTBEAT.md 扫描逻辑
#!/bin/bash
REPORTS_DIR="$HOME/.gstack/reports"
REPORT_STATE_FILE="$HOME/.gstack/reports/.scan_state.json"

# 读取上次扫描状态
LAST_SCAN=$(cat $REPORT_STATE_FILE 2>/dev/null | jq -r '.last_scan // "1970-01-01"')

# 扫描新报告
for report in $(find $REPORTS_DIR -name "*.html" -newer $LAST_SCAN 2>/dev/null); do
    # 解析报告并生成 phase 文件
    REPORT_NAME=$(basename $report)
    PROJECT=$(echo $REPORT_NAME | cut -d'-' -f1-3)
    
    # 生成分析 phase 文件
    cat > "docs/${PROJECT}-tester-epic1-$(date +%Y%m%d_%H%M%S).md" << EOF
# Tester Analysis — E2E Report

## 报告
__FILE__: $report
__SCAN_TIME__: $(date -Iseconds)

## 关键指标
- 通过率: [从 HTML 解析]
- 失败用例: [列表]
- 性能数据: [若有]

## 结论
[PASS/FAIL] - 通过率 [X]%

EOF
    
    # 更新扫描状态
    echo "{\"last_scan\": \"$(date -Iseconds)\"}" > $REPORT_STATE_FILE
done
```

## 报告解析逻辑

```typescript
// 使用 gstack browse 解析 HTML 报告
// 选择器示例（Playwright HTML 报告）
const summary = await page.evaluate(() => {
  const stats = document.querySelector('.summary');
  return {
    passed: stats?.getAttribute('data-passed') ?? '0',
    failed: stats?.getAttribute('data-failed') ?? '0',
    duration: stats?.getAttribute('data-duration') ?? '0'
  };
});
```

## 告警规则

| 条件 | 动作 |
|------|------|
| 测试通过率 < 80% | 标记 `⚠️ 需要关注` |
| 测试通过率 < 50% | 标记 `🔴 高优先级` |
| 无新报告超过 2h | 记录静默状态 |

## 验收标准

```bash
# 测试：创建假报告
touch ~/.gstack/reports/test-report-20260329.html

# 观察：Tester 是否在下次心跳时生成 phase 文件
# 预期：docs/vibex-tester-epic1-[timestamp].md 存在
```

## 输出

- 更新后的 Tester `HEARTBEAT.md`
- 报告解析脚本 `scripts/parse-e2e-report.sh`
