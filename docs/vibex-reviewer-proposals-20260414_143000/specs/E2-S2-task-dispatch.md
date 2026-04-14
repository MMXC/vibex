# Spec: E2.S2 — Reviewer 任务分发与汇总

## 功能概述

负责将评审任务并行分发给多个Reviewer，追踪状态，汇总多结论为统一结论，并在冲突时触发Coord裁决。

---

## E2.S2.F4.1 — 并行分发机制

### 接口定义

```typescript
interface ReviewDispatcher {
  dispatch(proposal: Proposal): Promise<DispatchResult>;
}

interface DispatchResult {
  proposalId: string;
  tasks: ReviewTask[];  // 并行分发
  dispatchedAt: Date;
}

interface ReviewTask {
  reviewer: ReviewerType;
  status: 'pending' | 'in_progress' | 'done' | 'timeout' | 'error';
  result?: ReviewResult;
  assignedAt: Date;
  expiresAt: Date;  // SLA deadline
}
```

### 验收标准

```typescript
describe('Review Dispatcher', () => {
  it('should dispatch all reviewers in parallel', async () => {
    const result = await dispatcher.dispatch(proposalP002);
    expect(result.tasks.length).toBeGreaterThanOrEqual(2);
    // 验证并行：所有任务的assignedAt时间差<1s
    const timeSpreads = calculateTimeSpread(result.tasks.map(t => t.assignedAt));
    expect(timeSpreads.maxDiffMs).toBeLessThan(1000);
  });

  it('should set 4h SLA deadline for each task', () => {
    const result = dispatcher.dispatch(proposal);
    const now = new Date();
    result.tasks.forEach(task => {
      const diff = task.expiresAt.getTime() - now.getTime();
      expect(diff).toBe(4 * 60 * 60 * 1000);  // exactly 4h
    });
  });

  it('should dispatch correct reviewers based on rules', () => {
    const result = dispatcher.dispatch(proposalP002);
    const reviewerNames = result.tasks.map(t => t.reviewer);
    expect(reviewerNames).toContain('security');
    expect(reviewerNames.length).toBeGreaterThanOrEqual(2);
  });
});
```

---

## E2.S2.F4.2 — 状态追踪

### 状态机

```
pending → in_progress → done
                  ↓
               timeout
                  ↓
                error
```

### 验收标准

```typescript
describe('Review State Tracker', () => {
  it('should track state transitions correctly', () => {
    stateTracker.update(proposalId, reviewerId, 'in_progress');
    expect(stateTracker.get(proposalId, reviewerId)).toBe('in_progress');

    stateTracker.update(proposalId, reviewerId, 'done');
    expect(stateTracker.get(proposalId, reviewerId)).toBe('done');
  });

  it('should return all reviewer states for a proposal', () => {
    const states = stateTracker.getAllForProposal(proposalId);
    expect(states).toContainAllKeys(['design', 'architecture', 'security', 'performance']);
  });

  it('should mark as timeout when SLA expires', () => {
    clock.setTime(4 * 60 * 60 * 1000 + 1);  // past SLA
    stateTracker.checkTimeouts();
    expect(stateTracker.get(proposalId, reviewerId)).toBe('timeout');
  });
});
```

---

## E2.S2.F4.3 — 多结论汇总

### 汇总算法

```typescript
function aggregateConclusions(results: ReviewResult[]): AggregatedConclusion {
  const conclusions = results.map(r => r.conclusion).filter(c => c !== 'timeout');
  const approvedCount = conclusions.filter(c => c === 'approved').length;
  const rejectedCount = conclusions.filter(c => c === 'rejected').length;
  const conditionalCount = conclusions.filter(c => c === 'conditional').length;

  if (rejectedCount > 0 && rejectedCount >= approvedCount) {
    return { conclusion: 'rejected', consensus: false };
  }
  if (approvedCount === conclusions.length) {
    return { conclusion: 'approved', consensus: true };
  }
  if (approvedCount > rejectedCount + conditionalCount) {
    return { conclusion: 'approved', consensus: false };
  }
  return { conclusion: 'conditional', consensus: false };
}
```

### 验收标准

```typescript
describe('Conclusion Aggregator', () => {
  it('all approved → approved', () => {
    const result = aggregator.run([
      { conclusion: 'approved' }, { conclusion: 'approved' }
    ]);
    expect(result.conclusion).toBe('approved');
    expect(result.consensus).toBe(true);
  });

  it('any rejected with majority → rejected', () => {
    const result = aggregator.run([
      { conclusion: 'approved' }, { conclusion: 'rejected' }, { conclusion: 'rejected' }
    ]);
    expect(result.conclusion).toBe('rejected');
  });

  it('mixed conclusions → conditional', () => {
    const result = aggregator.run([
      { conclusion: 'approved' }, { conclusion: 'conditional' }
    ]);
    expect(result.conclusion).toBe('conditional');
  });

  it('timeouts excluded from count', () => {
    const result = aggregator.run([
      { conclusion: 'timeout' }, { conclusion: 'approved' }, { conclusion: 'approved' }
    ]);
    expect(result.conclusion).toBe('approved');
  });
});
```

---

## E2.S2.F4.4 — Coord冲突裁决

### 冲突判定

```typescript
function isConflict(results: ReviewResult[]): boolean {
  const conclusions = results.map(r => r.conclusion).filter(c => c !== 'timeout');
  const unique = new Set(conclusions);
  return unique.size > 1;  // 结论不一致即为冲突
}
```

### 裁决流程

```
冲突检测 → 通知Coord Agent → Coord裁定 → 更新最终结论
                ↓
        记录冲突详情到review-history.md
```

### 验收标准

```typescript
describe('Coord Escalation', () => {
  it('should escalate to Coord when conclusions conflict', () => {
    const escalation = coordEscalation.check([
      { conclusion: 'approved' }, { conclusion: 'rejected' }
    ]);
    expect(escalation.shouldEscalate).toBe(true);
    expect(escalation.reason).toBe('conclusion_conflict');
  });

  it('should not escalate when conclusions match', () => {
    const escalation = coordEscalation.check([
      { conclusion: 'approved' }, { conclusion: 'conditional' }
    ]);
    expect(escalation.shouldEscalate).toBe(false);
  });

  it('should send full context to Coord', () => {
    const context = coordEscalation.buildContext(proposalId, results);
    expect(context.proposalId).toBe(proposalId);
    expect(context.allResults).toHaveLength(results.length);
    expect(context.conflictPoints).toBeDefined();
  });
});
```

---

## 实现约束

- 分发器使用Promise.all并行调用所有Reviewer，不串行等待
- 状态存储使用事件溯源模式，每次状态变更记录event
- 汇总器为纯函数，无副作用
- Coord裁决通过消息队列异步处理
