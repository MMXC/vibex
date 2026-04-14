# Specs: E2 Risk Matrix & Estimate Standard

## Template: docs/templates/risk-matrix.md

### Risk Level Definitions
| Level | Icon | Description |
|-------|------|-------------|
| High | 🔴 | 影响核心功能，阻止发布 |
| Medium | 🟠 | 影响效率或质量，中等延迟 |
| Low | 🟡 | 影响体验，可后续处理 |

### Matrix Columns
| Column | Required | Description |
|--------|---------|-------------|
| 风险描述 | Yes | 清晰描述风险内容 |
| 等级 | Yes | 🔴/🟠/🟡 之一 |
| 缓解措施 | Yes | 具体可执行的措施 |
| 残余风险 | Yes | 缓解后剩余风险 |

### Minimum Risk Count
- 每个分析至少包含 3 项风险：
  - 技术风险 ≥ 1
  - 业务风险 ≥ 1
  - 依赖风险 ≥ 1

---

## Template: docs/templates/estimate-standard.md

### Estimate Fields
| Field | Required | Description |
|-------|---------|-------------|
| 估算值 | Yes | 人时/人日/人周 |
| 乐观 | Yes | 最佳情况工时 |
| 悲观 | Yes | 最差情况工时 |
| 依据 | Yes | 估算依据说明 |

### Validation Rules
- [ ] 乐观 ≤ 估算值 ≤ 悲观
- [ ] 依据必须具体（不能是"经验估计"）
- [ ] 回验记录机制说明存在
- [ ] 偏差率 = abs(实际-估算)/估算 < 30%

### Retrospective Tracking
- Sprint 结束后记录实际工时
- 计算偏差率
- 更新到 analysis.md 的回验记录区域
