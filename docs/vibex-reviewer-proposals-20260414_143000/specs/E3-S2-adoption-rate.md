# Spec: E3.S2 — 采纳率追踪与报告

## 功能概述

追踪各Reviewer的采纳率、评审周期和超时率，生成统计报告，供Coord优化评审流程使用。

---

## E3.S2.F7.1 — Reviewer采纳率统计

### 采纳率定义

```
采纳率 = (评审结论为'approved'的数量) / (总评审数量 - timeout数量)
```

### 统计维度

| Reviewer | 指标 |
|----------|------|
| design | 采纳率、评审平均时长、高风险提案比例 |
| architecture | 采纳率、评审平均时长、驳回原因分布 |
| security | 采纳率、高风险提案强制评审数、AI相关评审数 |
| performance | 采纳率、Bundle提案强制评审数、性能影响评估准确率 |

### 验收标准

```typescript
describe('Adoption Rate Statistics', () => {
  it('should calculate per-reviewer adoption rate', () => {
    const report = adoptionTracker.generateReport();
    expect(report.design.adoptionRate).toBeDefined();
    expect(report.design.adoptionRate).toBeGreaterThanOrEqual(0);
    expect(report.design.adoptionRate).toBeLessThanOrEqual(1);
  });

  it('should exclude timeouts from adoption rate calculation', () => {
    const reviews = [
      { reviewer: 'design', conclusion: 'approved' },
      { reviewer: 'design', conclusion: 'timeout' },
      { reviewer: 'design', conclusion: 'rejected' }
    ];
    const rate = adoptionTracker.calculateAdoptionRate(reviews, 'design');
    // (1 approved) / (3 total - 1 timeout) = 0.5
    expect(rate).toBe(0.5);
  });

  it('should track forced security reviews count', () => {
    const report = adoptionTracker.generateReport();
    expect(report.security.forcedReviews).toBeGreaterThanOrEqual(0);
  });
});
```

---

## E3.S2.F7.2 — 评审周期统计

### 关键指标

| 指标 | 计算方式 | 目标值 |
|------|---------|--------|
| `avgReviewTime` | 所有非超时评审的平均时长 | < 2h |
| `p95ReviewTime` | 95%分位评审时长 | < 4h |
| `timeoutRate` | timeout数量/总评审数量 | < 5% |
| `bottleneckReviewer` | 超时最多的Reviewer | 无单一>30% |

### 验收标准

```typescript
describe('Review Cycle Statistics', () => {
  it('should calculate average review time', () => {
    const report = adoptionTracker.generateReport();
    expect(report.avgReviewTimeMs).toBeLessThan(2 * 60 * 60 * 1000);
  });

  it('should calculate timeout rate', () => {
    const report = adoptionTracker.generateReport();
    expect(report.timeoutRate).toBeLessThan(0.05);  // <5%
  });

  it('should identify bottleneck reviewer', () => {
    const report = adoptionTracker.generateReport();
    if (report.bottleneckReviewer) {
      expect(report.bottleneckReviewer.timeoutRate).toBeGreaterThan(
        report.others.avgTimeoutRate
      );
    }
  });

  it('should generate report in < 1s', () => {
    const start = Date.now();
    adoptionTracker.generateReport();
    expect(Date.now() - start).toBeLessThan(1000);
  });
});
```

---

## E3.S2.F7.3 — 高风险提案强制报告

### 强制要求

P-002（AI能力）和P-005（团队协作）必须包含Security Review结论，否则报告标记为`incomplete`。

### 验收标准

```typescript
describe('High-Risk Proposal Report', () => {
  it('P-002 must have Security Review in report', () => {
    const report = adoptionTracker.getProposalReport('P-002');
    const hasSecurity = report.reviews.some(r => r.reviewer === 'security');
    expect(hasSecurity).toBe(true);
  });

  it('P-002 report must not be marked incomplete', () => {
    const report = adoptionTracker.getProposalReport('P-002');
    expect(report.isComplete).toBe(true);
    expect(report.missingReviews).toHaveLength(0);
  });

  it('AI proposals should show behavior boundary assessment', () => {
    const report = adoptionTracker.getProposalReport('P-002');
    const securityReview = report.reviews.find(r => r.reviewer === 'security');
    expect(securityReview.checklist.ai_behavior_boundary).toBeDefined();
  });

  it('Bundle proposals should show performance impact', () => {
    const report = adoptionTracker.getProposalReport('P-001');
    const perfReview = report.reviews.find(r => r.reviewer === 'performance');
    expect(perfReview.checklist.bundle_impact).toBeDefined();
  });
});
```

---

## 报告输出格式

```json
{
  "generatedAt": "2026-04-14T16:00:00+08:00",
  "period": { "from": "2026-04-07", "to": "2026-04-14" },
  "summary": {
    "totalProposals": 12,
    "totalReviews": 36,
    "avgReviewersPerProposal": 3.0,
    "overallAdoptionRate": 0.72
  },
  "byReviewer": {
    "design": { "total": 10, "adopted": 8, "adoptionRate": 0.8, "avgTimeMs": 3600000 },
    "architecture": { "total": 9, "adopted": 7, "adoptionRate": 0.78, "avgTimeMs": 4200000 },
    "security": { "total": 5, "adopted": 4, "adoptionRate": 0.8, "forcedReviews": 3 },
    "performance": { "total": 4, "adopted": 3, "adoptionRate": 0.75, "forcedReviews": 2 }
  },
  "slaCompliance": {
    "avgReviewTimeMs": 5400000,
    "p95ReviewTimeMs": 14400000,
    "timeoutRate": 0.028,
    "bottleneckReviewer": null
  }
}
```

---

## 实现约束

- 统计数据从metadata.json聚合计算，不单独存储
- 报告生成时间<1s（纯计算，无IO）
- 历史报告按周归档，保留12周
- 高风险提案标记由规则引擎注入，Reviewer skill不可绕过
