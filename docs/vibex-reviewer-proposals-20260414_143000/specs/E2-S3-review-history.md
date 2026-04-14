# Spec: E2.S3 — 评审历史归档

## 功能概述

每个提案的完整评审记录需持久化存储，供审计、回溯和采纳率统计使用。

---

## E2.S3.F5.1 — 评审记录文件

### 文件结构

```
proposals/
  {proposalId}/
    review-history.md      # 主评审记录
    metadata.json          # 提案元数据（含reviews字段）
    artifacts/
      design-review.json   # 各Reviewer原始输出
      arch-review.json
      security-review.json
      performance-review.json
```

### review-history.md 格式

```markdown
# 评审历史: {proposalId}

## 元信息
- 提案标题: {title}
- 提交时间: {submittedAt}
- 评审开始: {reviewStartedAt}
- 评审结束: {reviewEndedAt}
- 评审周期: {duration}
- 最终结论: {finalConclusion}

## 评审者列表

| Reviewer | 结论 | 风险等级 | 评审时间 |
|----------|------|---------|---------|
| design | {conclusion} | {riskLevel} | {duration} |
| architecture | {conclusion} | {riskLevel} | {duration} |
| security | {conclusion} | {riskLevel} | {duration} |
| performance | {conclusion} | {riskLevel} | {duration} |

## 结论汇总
{finalConclusion} — {consensus ? '全票通过' : '存在分歧'}

## 建议汇总
{aggregatedSuggestions}

## Coord裁决（如有）
{coordDecision}
```

### 验收标准

```typescript
describe('Review History Archival', () => {
  it('should create review-history.md after all reviews complete', async () => {
    await reviewManager.completeReview(proposalId, allResults);
    const content = fs.readFileSync(`proposals/${proposalId}/review-history.md`);
    expect(content).toContain(`## 评审历史: ${proposalId}`);
    expect(content).toContain('## 评审者列表');
  });

  it('should contain all reviewer results', () => {
    const content = fs.readFileSync(`proposals/${proposalId}/review-history.md`);
    expect(content).toContain('design');
    expect(content).toContain('architecture');
  });

  it('should include final conclusion', () => {
    const content = fs.readFileSync(`proposals/${proposalId}/review-history.md`);
    expect(content).toMatch(/最终结论: (approved|rejected|conditional)/);
  });
});
```

---

## E2.S3.F5.2 — 评审结论写入提案元数据

### metadata.json 结构

```json
{
  "proposalId": "P-002",
  "title": "AI能力集成",
  "submittedAt": "2026-04-14T10:00:00+08:00",
  "reviews": [
    {
      "reviewer": "design",
      "conclusion": "approved",
      "riskLevel": "low",
      "durationMs": 1200000,
      "completedAt": "2026-04-14T10:20:00+08:00",
      "skillVersion": "design-lens-reviewer@v1.2"
    },
    {
      "reviewer": "security",
      "conclusion": "conditional",
      "riskLevel": "high",
      "durationMs": 1800000,
      "completedAt": "2026-04-14T10:30:00+08:00",
      "skillVersion": "security-sentinel@v2.1",
      "forcedByPolicy": true
    }
  ],
  "aggregatedConclusion": "conditional",
  "reviewConsensus": false,
  "coordEscalation": null,
  "slaExpired": false,
  "reviewDurationMs": 2100000
}
```

### 验收标准

```typescript
describe('Proposal Metadata', () => {
  it('should persist reviews array in metadata.json', () => {
    const meta = JSON.parse(fs.readFileSync(`proposals/${proposalId}/metadata.json`));
    expect(meta.reviews).toBeInstanceOf(Array);
    expect(meta.reviews.length).toBeGreaterThanOrEqual(2);
  });

  it('should include skillVersion for each review', () => {
    const meta = JSON.parse(fs.readFileSync(`proposals/${proposalId}/metadata.json`));
    meta.reviews.forEach(review => {
      expect(review.skillVersion).toBeDefined();
    });
  });

  it('should mark forced reviews', () => {
    const meta = JSON.parse(fs.readFileSync(`proposals/${proposalId}/metadata.json`));
    const securityReview = meta.reviews.find(r => r.reviewer === 'security');
    expect(securityReview?.forcedByPolicy).toBe(true);
  });
});
```

---

## 实现约束

- 文件写入使用原子操作（写临时文件→重命名），防止损坏
- 所有时间戳使用ISO 8601格式，时区+08:00
- 评审记录不可修改（append-only），历史版本通过git管理
- 文件路径与proposalId强绑定，便于检索
