# Specs 索引

**项目**: vibex-architect-proposals-20260402_201318  
**生成日期**: 2026-04-02  
**规格文件数**: 7

---

## ADR 规格

| 规格文件 | ADR | 名称 | Sprint | 状态 |
|---------|-----|------|--------|------|
| `adr-001-canvasstore-split.md` | ADR-001 | canvasStore 拆分架构 | Sprint 1 | 待实施 |
| `adr-002-persistence-layer.md` | ADR-002 | 状态持久化分层策略 | Sprint 2 | 待实施 |
| `adr-003-css-architecture.md` | ADR-003 | CSS 架构规范 | Sprint 0 | 待实施 |
| `adr-004-security-hardening.md` | ADR-004 | 前端安全加固 | Sprint 0 | 待实施 |
| `adr-005-e2e-testing.md` | ADR-005 | E2E 测试基础设施 | Sprint 1 | 待实施 |

## Sprint 规格

| 规格文件 | Sprint | 名称 | 工时 |
|---------|--------|------|------|
| `sprint-0-quick-reference.md` | Sprint 0 | CI 阻断解除 + 安全修复 | 6-8h |

## PM 提案规格

| 规格文件 | 提案 | 名称 | Sprint |
|---------|------|------|--------|
| `pm-proposals-summary.md` | P-001~P-006 | PM 提案汇总 | Sprint 1-2 |

---

## 依赖关系

```
Sprint 0
├── D-001 TS错误清理
├── D-002 DOMPurify (L1 overrides)
├── D-E1 checkbox合并 → D-E2 级联确认
└── ADR-003 CSS清理 (伴随 D-E1/E2)

Sprint 1
├── ADR-001 canvasStore拆分 (关键路径)
├── ADR-005 E2E建设 (依赖 Sprint 0 稳定)
├── D-005 防御性解析 (可提前)
├── D-004 Migration修复
└── P-001 确认状态可视化 (合并到 D-E1/E2)

Sprint 2
├── ADR-002 状态持久化分层
├── P-002 面板状态持久化 (可提前，独立实施)
├── P-003 导出向导 (需API稳定)
└── P-004 空状态引导

Defer
├── P-005 移动端 (降级为只读预览)
└── P-006 PRD导出 (暂缓)
```

---

## 快速导航

- [Sprint 0 实施指南](./sprint-0-quick-reference.md)
- [ADR-001 canvasStore 拆分](./adr-001-canvasstore-split.md)
- [ADR-002 状态持久化](./adr-002-persistence-layer.md)
- [ADR-003 CSS 规范](./adr-003-css-architecture.md)
- [ADR-004 安全加固](./adr-004-security-hardening.md)
- [ADR-005 E2E 测试](./adr-005-e2e-testing.md)
- [PM 提案汇总](./pm-proposals-summary.md)
