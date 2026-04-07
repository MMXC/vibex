# PRD: Architect 自检提案实施 — 2026-03-31

> **任务**: vibex-architect-proposals-20260331_060315/create-prd
> **创建日期**: 2026-03-31
> **PM**: PM Agent
> **项目路径**: /root/.openclaw/vibex
> **产出物**: /root/.openclaw/vibex/docs/vibex-architect-proposals-20260331_060315/prd.md

---

## 1. 执行摘要

| 项目 | 内容 |
|------|------|
| **背景** | Architect 自检提案，3 条改进方向：状态管理模块化、虚拟化列表、TS 严格模式 |
| **目标** | 解决 canvasStore.ts 900+ 行技术债，提升渲染性能和类型安全 |
| **成功指标** | canvasStore 覆盖率 > 80%；100节点渲染 < 100ms；tsc --strict 通过 |

---

## 2. Epic 拆分

### Epic 1: 状态管理层模块化（P0，工程 Sprint）

| Story | 描述 | 工时 | 验收标准 |
|-------|------|------|---------|
| S1.1 | store 领域拆分方案设计 | 2h | `expect(splitPlan).toMatch(/contextStore\|flowStore\|componentStore/);` |
| S1.2 | contextStore.ts 拆分 | 3h | `expect(coverage('contextStore')).toBeGreaterThan(80);` |
| S1.3 | flowStore.ts + componentStore.ts 拆分 | 3h | `expect(coverage('flowStore')).toBeGreaterThan(80); expect(coverage('componentStore')).toBeGreaterThan(80);` |
| S1.4 | uiStore.ts 提取 | 2h | `expect(coverage('uiStore')).toBeGreaterThan(80);` |
| S1.5 | 向后兼容聚合层 | 2h | `expect(imports('canvasStore')).not.toBreak();` |

**DoD**: 4 个 store 文件，每文件覆盖率 > 80%，现有组件无需修改

---

### Epic 2: Canvas 虚拟化列表（P1）

| Story | 描述 | 工时 | 验收标准 |
|-------|------|------|---------|
| S2.1 | @tanstack/react-virtual 引入 | 0.5h | `expect(isInstalled('@tanstack/react-virtual')).toBe(true);` |
| S2.2 | ComponentTree 虚拟化 | 2h | `expect(renderTime(100)).toBeLessThan(100); expect(fps).toBeGreaterThan(50);` |
| S2.3 | BusinessFlowTree 虚拟化 | 2h | `expect(renderTime(100)).toBeLessThan(100);` |

**DoD**: 100 节点渲染 < 100ms，滚动 50+ fps

---

### Epic 3: TypeScript 严格模式升级（P1）

| Story | 描述 | 工时 | 验收标准 |
|-------|------|------|---------|
| S3.1 | 当前 tsconfig.json 诊断 | 0.5h | `expect(tscErrors).toBeLessThan(100);` |
| S3.2 | 逐文件启用 strict | 5h | `expect(tsc --strict).toPass();` |
| S3.3 | CI 集成类型检查 | 1h | `expect(ciTypes).toRunOnPR();` |
| S3.4 | 禁止新增 @ts-ignore | 1.5h | `expect(newTsIgnores).toBe(0);` |

**DoD**: `tsc --strict` 通过，新增文件无 `@ts-ignore`

---

## 3. 实施计划

| Epic | 工时 | 优先级 | 负责人 |
|------|------|--------|--------|
| Epic 1: 状态管理模块化 | 12h | P0 | architect+dev |
| Epic 2: 虚拟化列表 | 4.5h | P1 | architect |
| Epic 3: TS 严格模式 | 8h | P1 | architect+dev |

**总工时**: 24.5h
