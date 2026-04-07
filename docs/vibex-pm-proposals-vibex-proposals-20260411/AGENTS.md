# AGENTS.md: VibeX PM Proposals 2026-04-11

> **项目**: vibex-pm-proposals-vibex-proposals-20260411  
> **作者**: Architect  
> **日期**: 2026-04-11  
> **版本**: v1.0

---

## Dev 职责

### 提交规范

```bash
git commit -m "feat(E1): S1.1 AI clarification detection"
git commit -m "feat(E1): S1.2 project search with filters"
git commit -m "test(E1): S1.3 flowId E2E verification"
git commit -m "feat(E2): S2.1 team collaboration panel"
git commit -m "feat(E2): S2.2 version history diff"
git commit -m "feat(E2): S2.3 Tree toolbar style unification"
```

### 禁止事项

| 禁止 | 正确 |
|------|------|
| 同步多人编辑无冲突解决 | Y.js CRDT |
| 版本对比硬编码 | 真实 D1 快照 |

---

## Tester 职责

### E2E 测试用例

| 用例 | 验收 |
|------|------|
| AI 补全触发 | 模糊输入后显示追问 |
| 项目搜索 | < 200ms |
| 版本对比 | 差异高亮 |
| flowId 存在 | UUID 格式验证 |

---

## DoD

- [ ] AI 补全触发率 ≥ 80%
- [ ] 项目搜索 < 200ms
- [ ] flowId E2E 100% 通过
- [ ] 团队协作 UI 正常显示

---

*文档版本: v1.0 | 最后更新: 2026-04-11*
