# AGENTS.md — VibeX Reviewer 提案质量评审系统

> **项目**: vibex-reviewer-proposals-20260414_143000  
> **日期**: 2026-04-14

---

## 1. Reviewer 工作流

```
1. team-tasks ready → Reviewer 领取 review-<type> 任务
2. 读取对应模板 (docs/templates/review-<type>.md)
3. 读取提案文档 (docs/<project>/)
4. 产出 review 输出到 docs/<project>/review-<type>.md
5. task update <project> review-<type> done
```

---

## 2. 评审约束

### 2.1 模板使用

- **必须使用** `docs/templates/review-<type>.md` 模板
- 禁止跳过模板章节
- 结论必须明确 (pass/fail/conditional)

### 2.2 SLA

- 每条评审线 **4 小时 SLA**
- 3.5h 无响应 → 自动放行
- 评审开始即更新 team-tasks 为 in-progress

### 2.3 接口约束

所有 reviewer skills 必须实现:

```typescript
interface ReviewerSkill {
  type: 'design' | 'architecture' | 'security' | 'performance';
  review(input: ReviewInput): Promise<ReviewOutput>;
  getTemplate(): ReviewTemplate;
}
```

---

## 3. 参考文档

- PRD: `docs/vibex-reviewer-proposals-20260414_143000/prd.md`
- Specs: `docs/vibex-reviewer-proposals-20260414_143000/specs/`

---

*Architect Agent | 2026-04-14*
