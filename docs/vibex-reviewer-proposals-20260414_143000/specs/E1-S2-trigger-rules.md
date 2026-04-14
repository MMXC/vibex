# Spec: E1.S2 — 评审触发规则引擎

## 功能概述

规则引擎决定每个提案需要触发哪些Reviewer。核心原则：
1. **AI提案强制Security**：P-002等包含AI能力的提案必须经过Security Review
2. **Bundle提案强制Performance**：Bundle优化类提案必须经过Performance Review
3. **最低评审数量**：每个提案至少2个Reviewer

---

## E1.S2.F2.1 — 提案分类规则

### 分类维度

| 维度 | 识别方式 | 对应Reviewer |
|------|---------|------------|
| `is_ai_proposal` | 提案标签包含`ai`或`llm`或`gpt` | Security Review |
| `is_bundle_proposal` | 提案标签包含`bundle`或`perf` | Performance Review |
| `is_security_sensitive` | 提案标签包含`auth`或`permission`或`P-005` | Security Review |
| `is_design_change` | 提案标签包含`ui`或`ux`或`visual`或`P-001` | Design Review |
| `is_architecture_change` | 提案标签包含`arch`或`infrastructure`或`A-`前缀 | Architecture Review |

### 验收标准

```typescript
describe('Proposal Classification Rules', () => {
  it('P-002 should be classified as AI proposal', () => {
    const classification = classifyProposal({ id: 'P-002', tags: ['ai', 'llm'] });
    expect(classification.is_ai_proposal).toBe(true);
  });

  it('AI proposal should require Security Review', () => {
    const reviewers = resolveReviewer(['P-002'], { tags: ['ai'] });
    expect(reviewers).toContain('security');
  });

  it('Bundle proposal should require Performance Review', () => {
    const reviewers = resolveReviewer(['P-001'], { tags: ['bundle'] });
    expect(reviewers).toContain('performance');
  });

  it('P-005 collaboration proposal should require Security Review', () => {
    const reviewers = resolveReviewer(['P-005'], { tags: ['collaboration'] });
    expect(reviewers).toContain('security');
  });
});
```

---

## E1.S2.F2.2 — Bundle提案规则

### 强制Performance Review的场景

- 提案涉及`bundle`优化（代码分割、tree-shaking）
- 提案涉及`visual`变更（P-001视觉规范）——同时需要Design+Performance
- Dev P0-3性能优化类提案

### 验收标准

```typescript
describe('Bundle Proposal Rules', () => {
  it('Bundle proposal should trigger Performance Review', () => {
    const reviewers = resolveReviewer(['DevP0-3'], { tags: ['bundle', 'performance'] });
    expect(reviewers).toContain('performance');
  });

  it('P-001 visual proposal should trigger Design + Performance Review', () => {
    const reviewers = resolveReviewer(['P-001'], { tags: ['visual', 'bundle'] });
    expect(reviewers).toContain('design');
    expect(reviewers).toContain('performance');
  });
});
```

---

## E1.S2.F2.3 — 最低评审数量规则

### 规则定义

```typescript
const MIN_REVIEWERS = 2;

function ensureMinReviewers(resolved: ReviewerType[]): ReviewerType[] {
  if (resolved.length >= MIN_REVIEWERS) return resolved;
  // 补足到2个：默认补充Architecture Review
  return [...new Set([...resolved, 'architecture'])];
}
```

### 验收标准

```typescript
describe('Minimum Reviewer Count Rule', () => {
  it('should always return at least 2 reviewers', () => {
    const reviewers = resolveReviewer(['some-proposal'], { tags: [] });
    expect(reviewers.length).toBeGreaterThanOrEqual(2);
  });

  it('AI proposal with 1 required reviewer should get 1 more', () => {
    // AI proposal only requires security (1), should add at least 1 more
    const reviewers = resolveReviewer(['P-002'], { tags: ['ai'] });
    expect(reviewers.length).toBeGreaterThanOrEqual(2);
  });
});
```

---

## 规则优先级

| 优先级 | 规则类型 | 说明 |
|--------|---------|------|
| P0 | 强制规则 | AI提案→Security，Bundle→Performance，不可绕过 |
| P1 | 补足规则 | 补足到最低评审数量 |
| P2 | 建议规则 | 架构变更→Architecture，设计变更→Design |

---

## 实现约束

- 规则引擎实现为纯函数，无副作用
- 规则配置外部化：`specs/rules/reviewer-rules.json`
- 新增规则只需在JSON中注册，无需修改代码
- 规则冲突时：强制规则 > 补足规则 > 建议规则
