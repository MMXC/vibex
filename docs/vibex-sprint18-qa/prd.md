# VibeX Sprint 18 QA PRD — 验收标准与测试用例

**版本**: v1.0
**日期**: 2026-04-30
**状态**: Draft
**负责人**: PM (Product Manager)
**项目**: vibex-sprint18-qa

---

## 1. 执行摘要

### 背景

VibeX Sprint 18 交付了 8 个 Epic（E18-TSFIX-1/2/3, E18-CORE-1/2/3, E18-QUALITY-1/2），覆盖 TypeScript 类型系统修复、骨架屏 UX、三树空状态、测试覆盖率提升等。本 PRD 定义 QA 验证范围和测试用例。

### 目标

1. 验证 E18-TSFIX-1/2/3 TS 类型修复（342→0 errors）
2. 验证 E18-TSFIX-3 @vibex/types 19 个 guards 测试通过
3. 验证 E18-CORE-2 Canvas 骨架屏 UX 可用
4. 验证 E18-CORE-3 三树面板空状态正常
5. 验证 E18-QUALITY-1/2 测试覆盖率与 DX 改进
6. 确保 specs/ 目录完整性（specs/ 四态定义）

### 成功指标

| 指标 | 目标 | 验证方式 |
|------|------|----------|
| mcp-server TS errors | 0 | `cd packages/mcp-server && pnpm exec tsc --noEmit` |
| vibex-fronted TS errors | 0 | `cd vibex-fronted && pnpm exec tsc --noEmit` |
| @vibex/types guards 测试 | ≥19 通过 | `node test-guards.mjs` + `vitest guards.test.ts` |
| Canvas 骨架屏 | 存在且可用 | 源码审查 + 页面截图 |
| 三树空状态 | 存在且正常 | 源码审查 |
| specs/ 四态定义 | 完整 | 目录文件存在性检查 |

---

## 2. Epic 拆分

### Epic 概览

| Epic ID | Epic 名称 | 类型 | 优先级 | 工时 | 验收状态 |
|---------|-----------|------|--------|------|----------|
| E18-TSFIX-1 | mcp-server TS修复 | 验证 | P0 | 2h | 需验证 |
| E18-TSFIX-2 | vibex-fronted TS修复 | 验证 | P0 | 2h | 需验证 |
| E18-TSFIX-3 | @vibex/types 类型基础设施 | 验证 | P0 | 2h | 需验证 |
| E18-CORE-1 | Sprint 1-17 Backlog 扫描 | 验证 | P1 | 1h | 需验证 |
| E18-CORE-2 | Canvas 骨架屏 | 验证 | P1 | 2h | 需验证 |
| E18-CORE-3 | 三树面板空状态 | 验证 | P1 | 2h | 需验证 |
| E18-QUALITY-1 | 测试覆盖率提升 | 验证 | P2 | 2h | 需验证 |
| E18-QUALITY-2 | DX 改进 | 验证 | P2 | 1h | 需验证 |

**总工时**: 14h

---

### 2a. 本质需求穿透（神技1）

#### E18-TSFIX 系列（TS 类型修复）

- **用户的底层动机**: 开发者在修复类型错误时，不希望因类型问题阻塞功能开发。TS 错误多意味着每次 `tsc` 编译都报警，真实错误被淹没。
- **去掉现有方案，理想解法**: `tsc --noEmit` 通过率 100%，真实错误一目了然。
- **本质问题**: 消除类型噪音，让类型系统成为安全网而非障碍物。

#### E18-CORE 系列（UX 体验）

- **用户的底层动机**: 用户打开 Canvas 页面时，等待加载期间看到空白页面会焦虑，不确定是否在加载、出错还是真的没数据。
- **去掉现有方案，理想解法**: 加载中显示骨架屏，明确告知"正在加载"。空状态提供引导文案，告知用户下一步该做什么。
- **本质问题**: 消除用户等待焦虑，提供状态确定性。

#### E18-QUALITY 系列（质量与 DX）

- **用户的底层动机**: 开发者需要类型文档和 migration guide，避免因 Breaking Changes 导致生产事故。
- **去掉现有方案，理想解法**: docs/types/README.md 完整，migration guide 存在且覆盖所有 Breaking Changes。
- **本质问题**: 降低升级摩擦，减少生产事故。

---

### 2b. 最小可行范围（神技2）

#### 本期必做（去掉流程不通）

| Epic | 必做理由 |
|------|----------|
| E18-TSFIX-1/2/3 | TS 错误不消除，编译失败，其他功能无法交付 |
| E18-CORE-2 | 无骨架屏，用户在加载时面对空白页面，无法判断是加载中还是出错 |
| E18-CORE-3 | 三树无空状态，新用户首次使用时看到空白，无法理解需要先添加数据 |

#### 本期不做（去掉后仍能完成任务）

| Epic | 不做理由 |
|------|----------|
| E18-QUALITY-1 | 测试覆盖率低于 80%不影响功能可用性，只是长期技术债务 |
| E18-QUALITY-2 | 无类型文档时开发者可通过源码理解类型，但会增加学习成本 |
| E18-CORE-1 | Backlog 扫描是规划用途，不影响 Sprint 18 交付物的功能验收 |

#### 暂缓（80%用户的80%场景不需要）

| Epic | 暂缓理由 |
|------|----------|
| - | Sprint 18 范围已完整覆盖核心需求，无暂缓项 |

---

### 2c. 用户情绪地图（神技3）

#### Canvas 页面（E18-CORE-2 骨架屏）

| 状态 | 用户情绪 | 引导策略 |
|------|----------|----------|
| 进入页面 | 期待加载已有数据 | 骨架屏占位，告知正在加载 |
| 加载中 | 等待，不确定要多久 | 三栏骨架屏提供视觉反馈，暗示数据规模 |
| 加载失败 | 焦虑，担心数据丢失 | 错误边界显示具体错误信息 + 重试按钮 |
| 空数据 | 迷茫，不知道要做什么 | 空状态显示引导文案 + 新增按钮 |

#### 三树面板（E18-CORE-3 空状态）

| 组件 | 空状态情绪 | 引导文案 |
|------|------------|----------|
| BoundedContextTree | 迷茫，首次使用不知所措 | "暂无限界上下文，请先添加" + 手动新增按钮 |
| ComponentTree | 等待，不知道是否有数据 | "暂无组件，请从限界上下文开始" |
| BusinessFlowTree | 好奇，不知道业务流程是什么 | "暂无业务流程" + 引导文案 + 手动新增按钮 |

---

### 2d. UI状态规范（神技4 — Spec阶段）

**详见 specs/ 目录**：
- `specs/e18-core-2-canvas-skeleton.md` — Canvas 骨架屏四态定义
- `specs/e18-core-3-tree-empty-states.md` — 三树空状态四态定义

---

## 3. Epic/Story 详细验收标准

### Epic E18-TSFIX-1: mcp-server TS修复

| 字段 | 内容 |
|------|------|
| **Epic ID** | E18-TSFIX-1 |
| **Epic 名称** | mcp-server TypeScript 修复 |
| **关联 Commit** | e65d0537c |
| **工时** | 2h |
| **类型** | 验证 |

#### Story QA-E18-TSFIX-1: mcp-server TS错误验证

**验收标准（expect 断言）**:
```ts
// TS 编译 0 errors
expect(execSync('cd packages/mcp-server && pnpm exec tsc --noEmit').exitCode).toBe(0);

// 错误数统计
const result = execSync('cd packages/mcp-server && pnpm exec tsc --noEmit 2>&1 | grep "error TS" | wc -l');
expect(parseInt(result.toString())).toBe(0);

// CHANGELOG 条目存在
expect(fs.readFileSync('CHANGELOG.md', 'utf8')).toContain('E18-TSFIX-1');

// Commit SHA 一致
const log = execSync('git log --oneline -1 e65d0537c').toString();
expect(log).toContain('TSFIX-1');
```

---

### Epic E18-TSFIX-2: vibex-fronted TS修复

| 字段 | 内容 |
|------|------|
| **Epic ID** | E18-TSFIX-2 |
| **Epic 名称** | vibex-fronted 严格模式修复 |
| **关联 Commit** | 18bda9f69, c04dcccd2 |
| **工时** | 2h |
| **类型** | 验证 |

#### Story QA-E18-TSFIX-2: vibex-fronted TS错误验证

**验收标准（expect 断言）**:
```ts
// TS 编译 0 errors
expect(execSync('cd vibex-fronted && pnpm exec tsc --noEmit').exitCode).toBe(0);

// 错误数统计（344 errors → 0）
const result = execSync('cd vibex-fronted && pnpm exec tsc --noEmit 2>&1 | grep "error TS" | wc -l');
expect(parseInt(result.toString())).toBe(0);

// unwrappers 测试通过
expect(execSync('cd vibex-fronted && pnpm exec vitest run tests/unit/unwrappers.test.ts').exitCode).toBe(0);

// CHANGELOG 条目存在
expect(fs.readFileSync('CHANGELOG.md', 'utf8')).toContain('E18-TSFIX-2');
```

---

### Epic E18-TSFIX-3: @vibex/types 类型基础设施

| 字段 | 内容 |
|------|------|
| **Epic ID** | E18-TSFIX-3 |
| **Epic 名称** | @vibex/types 类型基础设施 |
| **关联 Commit** | d6332dd3f, 126823bb1 |
| **工时** | 2h |
| **类型** | 验证 |

#### Story QA-E18-TSFIX-3: @vibex/types guards 测试验证

**验收标准（expect 断言）**:
```ts
// Node runtime 测试（38 tests passed）
const result = execSync('cd packages/types && node test-guards.mjs').toString();
expect(result).toContain('38 passed');
expect(result).not.toContain('failed');

// vitest 测试（84 tests passed）
expect(execSync('cd packages/types && pnpm exec vitest run guards.test.ts').exitCode).toBe(0);

// guards 数量 ≥ 19
const guardsContent = fs.readFileSync('packages/types/src/guards.ts', 'utf8');
const guardCount = (guardsContent.match(/^export function is[A-Z]/gm) || []).length;
expect(guardCount).toBeGreaterThanOrEqual(19);

//guards 导出完整
expect(guardsContent).toContain('isCardTreeNodeStatus');
expect(guardsContent).toContain('isBoundedContext');
expect(guardsContent).toContain('isDedupResult');
```

---

### Epic E18-CORE-1: Sprint 1-17 Backlog 扫描

| 字段 | 内容 |
|------|------|
| **Epic ID** | E18-CORE-1 |
| **Epic 名称** | Sprint 1-17 Backlog 扫描 |
| **关联 Commit** | 9b4b0ea33 |
| **工时** | 1h |
| **类型** | 验证 |

#### Story QA-E18-CORE-1: Backlog 文档验证

**验收标准（expect 断言）**:
```ts
// backlog 文档存在
expect(fs.existsSync('docs/backlog-sprint17.md')).toBe(true);

// backlog 包含 ≥ 5 个功能点
const backlog = fs.readFileSync('docs/backlog-sprint17.md', 'utf8');
const featureCount = (backlog.match(/^##\s+|^###\s+/gm) || []).length;
expect(featureCount).toBeGreaterThanOrEqual(5);

// 每个功能点有 RICE 评分
expect(backlog).toContain('RICE');

// CHANGELOG 条目存在
expect(fs.readFileSync('CHANGELOG.md', 'utf8')).toContain('E18-CORE-1');
```

---

### Epic E18-CORE-2: Canvas 骨架屏

| 字段 | 内容 |
|------|------|
| **Epic ID** | E18-CORE-2 |
| **Epic 名称** | Canvas 骨架屏 |
| **关联 Commit** | 8af38ce53 |
| **工时** | 2h |
| **类型** | 验证 |
| **页面集成** | ✅ 是（详见 specs/e18-core-2-canvas-skeleton.md）|

#### Story QA-E18-CORE-2: Canvas 骨架屏验证

**验收标准（expect 断言）**:
```ts
// Skeleton 组件存在
expect(fs.existsSync('vibex-fronted/src/components/canvas/CanvasPageSkeleton.tsx')).toBe(true);

// Skeleton 辅助组件存在
expect(fs.existsSync('vibex-fronted/src/components/canvas/Skeleton.tsx')).toBe(true);

// CanvasPage 集成骨架屏
const canvasPage = fs.readFileSync('vibex-fronted/src/app/canvas/CanvasPage.tsx', 'utf8');
expect(canvasPage).toContain('Skeleton') || expect(canvasPage).toContain('loading');

// 三栏布局骨架屏
const skeleton = fs.readFileSync('vibex-fronted/src/components/canvas/CanvasPageSkeleton.tsx', 'utf8');
expect(skeleton).toContain('BoundedContextTree') || expect(skeleton).toContain('TreeSkeleton');
expect(skeleton).toContain('ComponentTree') || expect(skeleton).toContain('TreeSkeleton');
expect(skeleton).toContain('BusinessFlowTree') || expect(skeleton).toContain('TreeSkeleton');

// CHANGELOG 条目存在
expect(fs.readFileSync('CHANGELOG.md', 'utf8')).toContain('E18-CORE-2');
```

---

### Epic E18-CORE-3: 三树面板空状态

| 字段 | 内容 |
|------|------|
| **Epic ID** | E18-CORE-3 |
| **Epic 名称** | 三树面板空状态 |
| **关联 Commit** | 3f65313c6 |
| **工时** | 2h |
| **类型** | 验证 |
| **页面集成** | ✅ 是（详见 specs/e18-core-3-tree-empty-states.md）|

#### Story QA-E18-CORE-3: 三树空状态验证

**验收标准（expect 断言）**:
```ts
// BoundedContextTree 空状态
const bcTree = fs.readFileSync('vibex-fronted/src/components/canvas/BoundedContextTree.tsx', 'utf8');
expect(bcTree).toContain('暂无') || expect(bcTree).toContain('EmptyState') || expect(bcTree).toContain('empty');

// ComponentTree 空状态
const compTree = fs.readFileSync('vibex-fronted/src/components/canvas/ComponentTree.tsx', 'utf8');
expect(compTree).toContain('暂无') || expect(compTree).toContain('EmptyState') || expect(compTree).toContain('empty');

// BusinessFlowTree 空状态
const bfTree = fs.readFileSync('vibex-fronted/src/components/canvas/BusinessFlowTree.tsx', 'utf8');
expect(bfTree).toContain('暂无') || expect(bfTree).toContain('EmptyState') || expect(bfTree).toContain('empty');

// CHANGELOG 条目存在
expect(fs.readFileSync('CHANGELOG.md', 'utf8')).toContain('E18-CORE-3');
```

---

### Epic E18-QUALITY-1: 测试覆盖率提升

| 字段 | 内容 |
|------|------|
| **Epic ID** | E18-QUALITY-1 |
| **Epic 名称** | 测试覆盖率提升 |
| **关联 Commit** | 412827d85 |
| **工时** | 2h |
| **类型** | 验证 |

#### Story QA-E18-QUALITY-1: 测试覆盖率验证

**验收标准（expect 断言）**:
```ts
// vitest 测试通过
expect(execSync('cd packages/types && pnpm exec vitest run guards.test.ts').exitCode).toBe(0);

// node test-guards.mjs 通过
const result = execSync('cd packages/types && node test-guards.mjs').toString();
expect(result).toContain('passed');
expect(result).not.toContain('failed');

// guard 测试用例数量 ≥ 84
expect(result).toMatch(/\d+ passed/);

// CHANGELOG 条目存在
expect(fs.readFileSync('CHANGELOG.md', 'utf8')).toContain('E18-QUALITY-1');
```

---

### Epic E18-QUALITY-2: DX 改进

| 字段 | 内容 |
|------|------|
| **Epic ID** | E18-QUALITY-2 |
| **Epic 名称** | DX 改进（类型文档 & Migration） |
| **关联 Commit** | 93b33afe3 |
| **工时** | 1h |
| **类型** | 验证 |

#### Story QA-E18-QUALITY-2: DX 改进验证

**验收标准（expect 断言）**:
```ts
// tsconfig strict 模式
const tsconfig = JSON.parse(fs.readFileSync('vibex-fronted/tsconfig.json', 'utf8'));
expect(tsconfig.compilerOptions.strict).toBe(true);

// 类型文档存在
expect(fs.existsSync('vibex-fronted/docs/types/README.md')).toBe(true);

// Migration guide 存在
expect(fs.existsSync('vibex-fronted/docs/migrations/e18-tsfix.md')).toBe(true);

// CHANGELOG 条目存在
expect(fs.readFileSync('CHANGELOG.md', 'utf8')).toContain('E18-QUALITY-2');
```

---

## 4. 验收标准汇总

| 功能点 ID | 功能点 | 验收标准数 | 可写 expect() | 需页面集成 |
|-----------|--------|------------|---------------|------------|
| QA-E18-TSFIX-1 | mcp-server TS错误验证 | 4 | ✅ | ❌ |
| QA-E18-TSFIX-2 | vibex-fronted TS错误验证 | 4 | ✅ | ❌ |
| QA-E18-TSFIX-3 | @vibex/types guards 测试验证 | 4 | ✅ | ❌ |
| QA-E18-CORE-1 | Backlog 文档验证 | 4 | ✅ | ❌ |
| QA-E18-CORE-2 | Canvas 骨架屏验证 | 4 | ✅ | ✅ |
| QA-E18-CORE-3 | 三树空状态验证 | 4 | ✅ | ✅ |
| QA-E18-QUALITY-1 | 测试覆盖率验证 | 4 | ✅ | ❌ |
| QA-E18-QUALITY-2 | DX 改进验证 | 4 | ✅ | ❌ |

**总计**: 8 个 Story，32 条验收标准

---

## 5. DoD (Definition of Done)

### 通用 DoD（适用于所有 QA Story）

- [ ] 源码文件存在性验证通过
- [ ] CHANGELOG.md 条目存在且包含 Epic ID
- [ ] 对应 Commit SHA 在 git log 中可追溯
- [ ] 自动化测试命令执行通过（exitCode = 0）
- [ ] specs/ 目录四态定义文件存在（涉及页面的 Epic）

### Story 特定 DoD

#### E18-TSFIX-1/2/3（TS 类型修复）
- [ ] `tsc --noEmit` 输出 0 errors
- [ ] CHANGELOG.md 包含 Epic ID 条目
- [ ] 对应 Commit 在 git log 中可追溯

#### E18-CORE-2（Canvas 骨架屏）
- [ ] `CanvasPageSkeleton.tsx` 存在
- [ ] `Skeleton.tsx` 存在
- [ ] `CanvasPage.tsx` 集成骨架屏
- [ ] specs/e18-core-2-canvas-skeleton.md 四态定义完整

#### E18-CORE-3（三树空状态）
- [ ] `BoundedContextTree.tsx` 包含空状态
- [ ] `ComponentTree.tsx` 包含空状态
- [ ] `BusinessFlowTree.tsx` 包含空状态
- [ ] specs/e18-core-3-tree-empty-states.md 四态定义完整

#### E18-QUALITY-1/2（质量与 DX）
- [ ] vitest 测试通过
- [ ] Node runtime 测试通过
- [ ] 文档文件存在

---

## 6. 依赖关系图

```
analyze-requirements (analyst)
    ↓ 输出 analysis.md + analyst-qa-report
create-prd (pm)
    ↓ 输出 prd.md + specs/
design-architecture (architect)
    ↓ 输出 architecture.md
coord-decision (coord)
    ↓ 通过/驳回
```

---

## 7. PRD 校验清单

- [x] 执行摘要包含：背景 + 目标 + 成功指标
- [x] Epic/Story 表格格式正确（ID/描述/工时/验收标准）
- [x] 每个 Story 有可写的 expect() 断言
- [x] DoD 章节存在且具体
- [x] 功能点页面集成标注（E18-CORE-2/3 标注 ✅）
- [x] 本质需求穿透（神技1）
- [x] 最小可行范围（神技2）
- [x] 用户情绪地图（神技3）
- [x] UI状态规范标注（神技4，specs/ 目录）

---

## 执行决策

- **决策**: 已采纳
- **执行项目**: vibex-sprint18-qa
- **执行日期**: 2026-04-30

---

*PM — Product Manager*
*验证依据: analyst-qa-report-20260430.md, CHANGELOG.md, git log*
