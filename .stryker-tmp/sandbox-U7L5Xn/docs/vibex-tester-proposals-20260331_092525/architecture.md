# Architecture: vibex-tester-proposals-20260331_092525

**Project**: Tester 自检提案 — E2E 规范 + CI 质量 Gate
**Agent**: architect
**Date**: 2026-03-31
**PRD**: docs/vibex-tester-proposals-20260331_092525/prd.md

---

## 1. E2E 目录统一

```
vibex-fronted/tests/e2e/
├── canvas/
│   ├── checkbox.spec.ts
│   ├── f11-fullscreen.spec.ts
│   └── ...
```

---

## 2. CI Quality Gate

| Gate | 阈值 |
|------|------|
| 覆盖率 | ≥ 80% |
| 覆盖率下降 | ≤ 5% vs baseline |
| Slack 通知延迟 | < 5min |

---

*Architect 产出物 | 2026-03-31*
