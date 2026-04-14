# Spec: E3.S1 — 4h SLA 超时机制

## 功能概述

每个评审任务设置4小时SLA截止时间。系统在3.5h时发送预警，在4h时自动放行，确保评审不成为Sprint瓶颈。

---

## E3.S1.F6.1 — SLA计时器启动

### 接口定义

```typescript
interface SLATimer {
  start(proposalId: string, reviewers: ReviewerType[]): TimerSession;
  getExpiresAt(proposalId: string, reviewer: ReviewerType): Date;
  remainingMs(proposalId: string, reviewer: ReviewerType): number;
}

interface TimerSession {
  proposalId: string;
  tasks: {
    reviewer: ReviewerType;
    expiresAt: Date;
  }[];
  startedAt: Date;
}
```

### 验收标准

```typescript
describe('SLA Timer', () => {
  it('should set expiresAt to exactly 4h from now', () => {
    const now = new Date();
    const session = timer.start(proposalId, ['design', 'security']);
    session.tasks.forEach(task => {
      const diff = task.expiresAt.getTime() - now.getTime();
      expect(diff).toBe(4 * 60 * 60 * 1000);
    });
  });

  it('should return correct remaining time', () => {
    timer.start(proposalId, ['design']);
    clock.advance(1 * 60 * 60 * 1000);  // advance 1h
    const remaining = timer.remainingMs(proposalId, 'design');
    expect(remaining).toBe(3 * 60 * 60 * 1000);
  });

  it('should track multiple reviewers independently', () => {
    const session = timer.start(proposalId, ['design', 'security']);
    expect(session.tasks).toHaveLength(2);
    session.tasks.forEach(task => {
      expect(task.expiresAt).toBeDefined();
    });
  });
});
```

---

## E3.S1.F6.2 — 超时自动放行

### 超时处理流程

```
定时器检查（每1min）→ 发现超时任务 → 自动放行 → 标记结论为'timeout'
                                              ↓
                                    更新stateTracker状态
                                              ↓
                                    通知提议人（超时告知）
```

### 验收标准

```typescript
describe('Auto-Proceed on Timeout', () => {
  it('should mark task as timeout when SLA expires', () => {
    timer.start(proposalId, ['design']);
    clock.advance(4 * 60 * 60 * 1000 + 1);  // past 4h
    timeoutChecker.run();
    expect(stateTracker.get(proposalId, 'design')).toBe('timeout');
  });

  it('should set conclusion to timeout', () => {
    timer.start(proposalId, ['design']);
    clock.advance(4 * 60 * 60 * 1000 + 1);
    timeoutChecker.run();
    const meta = JSON.parse(fs.readFileSync(`proposals/${proposalId}/metadata.json`));
    const designReview = meta.reviews.find(r => r.reviewer === 'design');
    expect(designReview.conclusion).toBe('timeout');
  });

  it('should not affect other reviewers when one times out', () => {
    timer.start(proposalId, ['design', 'security']);
    clock.advance(4 * 60 * 60 * 1000 + 1);
    timeoutChecker.run();
    expect(stateTracker.get(proposalId, 'security')).toBe('timeout');
    // aggregator should still process non-timeout results
  });

  it('should auto-proceed proposal when min reviewers are met', () => {
    timer.start(proposalId, ['design', 'security', 'architecture', 'performance']);
    clock.advance(4 * 60 * 60 * 1000 + 1);
    timeoutChecker.run();
    // Even if design/security timeout, if arch/perf done → proceed
    const doneCount = ['architecture', 'performance']
      .filter(r => stateTracker.get(proposalId, r) === 'done').length;
    if (doneCount >= 2) {
      expect(proposalFlow.isUnblocked(proposalId)).toBe(true);
    }
  });
});
```

---

## E3.S1.F6.3 — 超时告警（提前30min）

### 告警规则

- 在3.5h时（剩余30min）发送提醒
- 提醒内容：提案ID、剩余时间、当前状态
- 提醒方式：消息通知 + 评审记录标注

### 验收标准

```typescript
describe('Timeout Warning (3.5h)', () => {
  it('should send warning at 3.5h mark', () => {
    timer.start(proposalId, ['design']);
    clock.advance(3.5 * 60 * 60 * 1000);  // 3.5h
    const warnings = warningChecker.run();
    expect(warnings).toContainEqual(
      expect.objectContaining({ proposalId, remainingMin: 30 })
    );
  });

  it('should not send duplicate warnings', () => {
    timer.start(proposalId, ['design']);
    clock.advance(3.5 * 60 * 60 * 1000);
    warningChecker.run();
    clock.advance(1 * 60 * 1000);  // 1min later
    const secondWarnings = warningChecker.run();
    expect(secondWarnings).toHaveLength(0);
  });

  it('should not warn if already completed', () => {
    timer.start(proposalId, ['design']);
    clock.advance(3.5 * 60 * 60 * 1000);
    stateTracker.update(proposalId, 'design', 'done');
    const warnings = warningChecker.run();
    expect(warnings).toHaveLength(0);
  });
});
```

---

## 实现约束

- 计时器使用内存存储，进程重启后从metadata.json恢复
- 超时检查每60秒执行一次，使用cron/scheduler
- 告警只发送一次，防止重复骚扰
- 超时放行的结论标记为`timeout`，不参与多数投票
