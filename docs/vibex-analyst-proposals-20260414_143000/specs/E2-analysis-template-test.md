# Specs: E2 Analysis Template

## Template: docs/templates/feasibility-analysis-template.md

### Mandatory Sections
| Section | Required | Description |
|---------|---------|-------------|
| 执行决策 | Yes | 决策/决策理由/Coord采纳记录 |
| 可行性评估 | Yes | 技术/业务/依赖三维 |
| 风险矩阵 | Yes | 至少 3 项风险 |
| 工时估算 | Yes | 估算值/乐观/悲观/依据 |
| 结论 | Yes | 推荐/不推荐/有条件推荐 |

### Decision Field Constraints
| Decision | Constraint |
|----------|------------|
| 推荐 | 技术可行 + 业务价值 > 0 + 工时合理 + 风险可接受 |
| 不推荐 | 必须有具体驳回原因，不接受"综合考虑" |
| 有条件推荐 | 技术可行但有未解决风险或需额外资源 |

### Verification Checklist
- [ ] 所有 5 个章节存在
- [ ] 结论字段只能是"推荐/不推荐/有条件推荐"
- [ ] "不推荐"必须有具体原因（不接受"综合考虑"）
- [ ] 风险矩阵至少 3 项（技术/业务/依赖各 1）
- [ ] 工时估算包含乐观/悲观范围
- [ ] 每个章节有灰色注释指引
