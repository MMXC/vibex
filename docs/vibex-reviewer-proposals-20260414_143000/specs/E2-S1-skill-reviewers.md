# Spec: E2.S1 — Skill-Based Reviewer 集成

## 功能概述

集成四个Reviewer skill，每个skill实现统一接口，接受提案输入，输出结构化评审结论。

---

## E2.S1.F3.1 — design-lens-reviewer

### 接口定义

```typescript
interface DesignReviewer {
  name: 'design-lens-reviewer';
  run(proposal: Proposal): Promise<DesignReviewResult>;
}

interface DesignReviewResult {
  reviewer: 'design';
  conclusion: 'approved' | 'rejected' | 'conditional';
  checklist: DesignChecklist;
  suggestions: Suggestion[];
  riskLevel: 'low' | 'medium' | 'high';
  durationMs: number;
}
```

### 验收标准

```typescript
describe('Design Reviewer', () => {
  it('should return structured result within 30min', async () => {
    const result = await designReviewer.run(proposalP001);
    expect(result.reviewer).toBe('design');
    expect(result.conclusion).toBeOneOf(['approved', 'rejected', 'conditional']);
    expect(result.durationMs).toBeLessThan(30 * 60 * 1000);
  });

  it('should include all checklist items', () => {
    const result = designReviewer.run(proposalP001);
    expect(Object.keys(result.checklist)).toContainAllKeys([
      'brand_consistency', 'interaction_pattern', 'accessibility',
      'responsive_design', 'visual_hierarchy'
    ]);
  });

  it('should have suggestions when not approved', () => {
    const result = designReviewer.run(proposalP001);
    if (result.conclusion !== 'approved') {
      expect(result.suggestions.length).toBeGreaterThan(0);
    }
  });
});
```

---

## E2.S1.F3.2 — architecture-strategist

### 接口定义

```typescript
interface ArchReviewer {
  name: 'architecture-strategist';
  run(proposal: Proposal): Promise<ArchReviewResult>;
}

interface ArchReviewResult {
  reviewer: 'architecture';
  conclusion: 'approved' | 'rejected' | 'conditional';
  checklist: ArchChecklist;
  suggestions: Suggestion[];
  riskLevel: 'low' | 'medium' | 'high';
  durationMs: number;
}
```

### 验收标准

```typescript
describe('Architecture Reviewer', () => {
  it('should return structured result within 30min', async () => {
    const result = await archReviewer.run(proposal);
    expect(result.durationMs).toBeLessThan(30 * 60 * 1000);
  });

  it('should check arch boundary compliance', () => {
    const result = archReviewer.run(proposal);
    expect(result.checklist.arch_boundary).toBeDefined();
  });
});
```

---

## E2.S1.F3.3 — security-sentinel

### 接口定义

```typescript
interface SecurityReviewer {
  name: 'security-sentinel';
  run(proposal: Proposal): Promise<SecurityReviewResult>;
}

interface SecurityReviewResult {
  reviewer: 'security';
  conclusion: 'approved' | 'rejected' | 'conditional';
  checklist: SecurityChecklist;
  suggestions: Suggestion[];
  riskLevel: 'low' | 'medium' | 'high';
  durationMs: number;
  forcedByPolicy: boolean;  // true for P-002, P-005
}
```

### 验收标准

```typescript
describe('Security Reviewer', () => {
  it('P-002 AI proposal should be forced through security review', () => {
    const result = securityReviewer.run(proposalP002);
    expect(result.forcedByPolicy).toBe(true);
    expect(result.checklist.ai_behavior_boundary).toBeDefined();
  });

  it('should evaluate AI behavior boundaries', () => {
    const result = securityReviewer.run(proposalP002);
    expect(result.checklist.ai_behavior_boundary.status).toBeOneOf(['pass', 'fail']);
  });
});
```

---

## E2.S1.F3.4 — performance-oracle

### 接口定义

```typescript
interface PerfReviewer {
  name: 'performance-oracle';
  run(proposal: Proposal): Promise<PerfReviewResult>;
}

interface PerfReviewResult {
  reviewer: 'performance';
  conclusion: 'approved' | 'rejected' | 'conditional';
  checklist: PerfChecklist;
  suggestions: Suggestion[];
  riskLevel: 'low' | 'medium' | 'high';
  durationMs: number;
  forcedByPolicy: boolean;  // true for bundle proposals
}
```

### 验收标准

```typescript
describe('Performance Reviewer', () => {
  it('Bundle proposal should be forced through performance review', () => {
    const result = perfReviewer.run(proposalBundle001);
    expect(result.forcedByPolicy).toBe(true);
  });

  it('should measure bundle impact', () => {
    const result = perfReviewer.run(proposalBundle001);
    expect(result.checklist.bundle_impact.status).toBeOneOf(['pass', 'fail']);
  });
});
```

---

## 实现约束

- 所有Reviewer实现统一的`Reviewer`接口
- Reviewer为无状态函数，可并行执行
- Reviewer调用有超时保护（30min），超时返回`{ conclusion: 'timeout' }`
- Reviewer版本固定在提案评审记录中，便于追溯
