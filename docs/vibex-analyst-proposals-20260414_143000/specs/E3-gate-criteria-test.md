# Specs: E3 Gate Criteria

## Template: docs/templates/gate-criteria.md

### Three Decision Criteria

#### Recommend (推荐)
All must be true:
- [ ] Technical feasibility: ✅
- [ ] Business value > 0
- [ ] Time estimate reasonable
- [ ] Risks acceptable

#### Not Recommend (不推荐)
Any must be true:
- [ ] Technical infeasible
- [ ] Business value = 0
- [ ] Risks cannot be mitigated
- [ ] Required resources unavailable

#### Conditional Recommend (有条件推荐)
All must be true:
- [ ] Technically feasible
- [ ] Unresolved risks remain
- OR:
- [ ] Requires additional resources not yet approved

### Subjective Term Guidelines
| Term | Guideline | Boundary Cases |
|------|-----------|---------------|
| 业务价值 > 0 | 有明确用户收益或技术收益 | - 纯技术债务（价值 < 0）<br>- 功能用户使用率 < 10%（价值可疑）<br>- 合规要求（强制做，即使业务价值难量化）→ 有条件推荐 |
| 工时合理 | 估算工时 / 提案影响范围合理 | - 1人周小改动 vs 3人月大重构 → 需权衡<br>- 紧急 hotfix vs 长期债务 → 紧急情况降级为有条件推荐 |
| 风险可接受 | 缓解后残余风险 ≤ 🟠 中 | - 🔴 高风险必须有缓解措施，否则不推荐

### Rejection Reason Requirements
| Status | Reason Requirement |
|--------|-------------------|
| 不推荐 | 必须有具体原因，不接受"综合考虑" |
| 不推荐 | 原因必须可操作（后续可验证） |
| 不推荐 | 原因必须记录到 analysis.md |

### Verification
- [ ] 三种判断标准清晰可执行（不是模糊描述）
- [ ] 每种标准有 checklist
- [ ] "不推荐"原因不合规（如"综合考虑"）可被识别
- [ ] Gate criteria.md 包含 subjective term FAQ
