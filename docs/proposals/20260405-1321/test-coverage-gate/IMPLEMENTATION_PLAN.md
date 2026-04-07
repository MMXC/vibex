# Implementation Plan: CI Coverage Gate Enforcement

| Epic | 工时 | 交付物 |
|------|------|--------|
| E1: Vitest 配置修复 | 1h | vitest.config.ts |
| E2: 阈值调整 | 0.5h | lines: 80%, branches: 65% |
| E3: Coverage Baseline | 0.5h | coverage/baseline.json |
| E4: Fork PR 检查 | 1h | coverage-gate.yml |
| **合计** | **3h** | |

## 任务分解

| Task | 文件 | 验证 |
|------|------|------|
| 1. 创建 vitest.config.ts | `vitest.config.ts` | `vitest --version` 读取正确 |
| 2. 配置 thresholds | `vitest.config.ts` | lines: 80%, branches: 65% |
| 3. 生成 baseline | `coverage/baseline.json` | `pnpm test:coverage` |
| 4. 配置 coverage-gate.yml | `.github/workflows/` | Fork PR 运行 |

## DoD
- [ ] vitest.config.ts 存在且 threshold 配置正确
- [ ] Lines 阈值 80%，Branches 阈值 65%
- [ ] coverage/baseline.json 存在
- [ ] Fork PR 也能运行覆盖率检查

*Architect Agent | 2026-04-05*
