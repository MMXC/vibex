# Specs: E3 Coord Adoption Tracking

## Coordination Decision Record

### Required Fields in analysis.md
| Field | Required | Description |
|-------|---------|-------------|
| Coord 决策 | Yes | 采纳/不采纳/有条件采纳 |
| Coord 理由 | Yes | 决策原因 |
| 决策时间 | Yes | YYYY-MM-DD |
| 推翻 Analyst 结论 | Boolean | 如推翻，记录复盘 |

### Adoption Rate Calculation
```
采纳率 = Analyst 推荐被采纳数 / Analyst 建议总数
```

### Monthly Report Fields
| Field | Description |
|-------|-------------|
| 月份 | YYYY-MM |
| 总提案数 | 当月分析提案数 |
| Analyst 采纳数 | Coord 采纳的 Analyst 结论 |
| Coord 采纳率 | 采纳率百分比 |
| Analyst 误判数 | Coord 推翻的 Analyst 结论 |
| 误判案例 | 复盘记录链接 |

### Verification
- [ ] feasibility-analysis-template.md 包含 Coord 决策记录字段
- [ ] 每月生成采纳率统计
- [ ] 误判案例有复盘记录（存储到 docs/learnings/）
