# Architecture: vibex-pm-proposals-20260331_092525

**Project**: PM 自检提案 — 状态管理 + 提案追踪 + 用户引导
**Agent**: architect
**Date**: 2026-03-31
**PRD**: docs/vibex-pm-proposals-20260331_092525/prd.md

---

## 1. Canvas 状态规范

```
selectedNodeIds (store) 和 node.confirmed (data) 合一：
checkbox 点击 → toggleConfirmed(nodeId) → 直接修改 node.confirmed
```

---

## 2. 提案追踪状态机

```
submitted → reviewing → adopted → executed
                  ↘ rejected
```

D1 表记录状态变更，Slack 通知各阶段。

---

*Architect 产出物 | 2026-03-31*
