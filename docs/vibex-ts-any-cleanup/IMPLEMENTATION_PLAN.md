# Implementation Plan: TypeScript `as any` Cleanup

| Epic | 工时 | 交付物 |
|------|------|--------|
| E1: Canvas History 类型修复 | 2h | CanvasSnapshot 类型 + useCanvasHistory 修复 |
| E2: 剩余源码清理 | 2h | 21处 as any → 正确类型 |
| E3: ESLint 规则启用 | 0.5h | .eslintrc.js 规则开启 |
| **合计** | **4.5h** | |

## 任务分解

| Task | 文件 | 验证 |
|------|------|------|
| S1.1: CanvasSnapshot | `src/types/canvas/CanvasSnapshot.ts` | `expect(type).toBeDefined()` |
| S1.2: useCanvasHistory | `useCanvasHistory.ts` | `grep "as any" | wc -l` → 0 |
| S2.1-S2.4: 其余清理 | 各源文件 | `grep -r "as any" src/*.ts` → 0 |
| S3.1: ESLint | `.eslintrc.js` | 规则为 'error' |

## DoD
- [x] **Canvas History `as any` 清除** — useCanvasHistory.ts (6处) + ProjectBar.tsx (6处) ✅ commit `063e9918`
- [ ] 源码 `as any` 全量清除（E2）
- [ ] ESLint 规则从 'off' 改为 'error'（E3）

*Architect Agent | 2026-04-07*
