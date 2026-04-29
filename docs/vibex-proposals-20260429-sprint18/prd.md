# VibeX Sprint 18 PRD — 功能提案规划

**版本**: v1.0
**日期**: 2026-04-29
**状态**: Draft → PM Review
**负责人**: PM (Product Manager)

---

## 1. 执行摘要

### 背景

VibeX 项目已完成 Sprint 1-17，积累了大量交付成果。当前系统存在 342 个 TypeScript 编译错误（集中在 E3-U2/U3 模块），严重影响类型安全和开发体验。同时 Sprint 1-17 遗留了一批高优先级增强需求待识别和处理。

### 目标

1. 完成 E3-U2/U3 TypeScript 类型系统修复，消除 342 个 TS errors，使 `tsc --noEmit` 通过
2. 识别 Sprint 1-17 遗留的高优先级功能增强，纳入 Sprint 18 规划
3. 为每个功能点建立 Definition of Done，确保可测试、可验收

### 成功指标

| 指标 | 目标 |
|------|------|
| TS 编译错误数 | 0（`tsc --noEmit` 通过） |
| E3-U2/U3 类型覆盖率 | ≥ 95% |
| 功能点完成率 | Sprint 18 规划 Story 100% 完成 |
| 自动化测试覆盖率 | 类型修复相关测试通过率 100% |

---

## 2. Epic 拆分

### Epic 概览

| Epic ID | Epic 名称 | 优先级 | 工时估算 | 关联功能点 |
|---------|-----------|--------|----------|------------|
| E18-TSFIX | TypeScript 类型系统修复收尾 | P0 | 40h | F1.1, F1.2, F1.3 |
| E18-CORE | 核心功能增强 | P1 | 24h | F2.1, F2.2, F2.3 |
| E18-QUALITY | 质量与体验提升 | P2 | 16h | F3.1, F3.2 |

---

### Epic E18-TSFIX: TypeScript 类型系统修复收尾

**目标**: 消除 E3-U2/U3 模块中的 342 个 TS errors，建立健壮的类型系统。

#### Story E18-TSFIX-1: E3-U2 类型修复

| 字段 | 内容 |
|------|------|
| **Story ID** | E18-TSFIX-1 |
| **描述** | 修复 E3-U2 模块中所有 TypeScript 类型错误 |
| **工时** | 16h |
| **验收标准** | 见下方 |

**验收标准（expect 断言）**:
```ts
// tsconfig.json 检查
expect(tscResult.errors.length).toBe(0);

// E3-U2 模块类型覆盖率
expect(typeCoverage('e3-u2')).toBeGreaterThanOrEqual(95);

// 关键类型定义存在性
expect(hasType('E3U2Session')).toBe(true);
expect(hasType('E3U2Config')).toBe(true);
expect(hasType('E3U2Response')).toBe(true);

// 运行时类型安全（无 'as any' 逃逸）
expect(countUnsafeCasts('e3-u2')).toBe(0);
```

#### Story E18-TSFIX-2: E3-U3 类型修复

| 字段 | 内容 |
|------|------|
| **Story ID** | E18-TSFIX-2 |
| **描述** | 修复 E3-U3 模块中所有 TypeScript 类型错误 |
| **工时** | 16h |
| **验收标准** | 见下方 |

**验收标准（expect 断言）**:
```ts
expect(tscResult.errors.length).toBe(0);
expect(typeCoverage('e3-u3')).toBeGreaterThanOrEqual(95);
expect(hasType('E3U3Session')).toBe(true);
expect(hasType('E3U3Config')).toBe(true);
expect(hasType('E3U3Response')).toBe(true);
expect(countUnsafeCasts('e3-u3')).toBe(0);
```

#### Story E18-TSFIX-3: 类型基础设施加固

| 字段 | 内容 |
|------|------|
| **Story ID** | E18-TSFIX-3 |
| **描述** | 建立 shared types、type utilities、类型守卫，提升全局类型质量 |
| **工时** | 8h |
| **验收标准** | 见下方 |

**验收标准（expect 断言）**:
```ts
// shared types 模块存在且导出完整
expect(hasExport('@/types/shared', 'Session')).toBe(true);
expect(hasExport('@/types/shared', 'Config')).toBe(true);
expect(hasExport('@/types/shared', 'Response')).toBe(true);

// 类型守卫可用
expect(typeof isSession).toBe('function');
expect(typeof isConfig).toBe('function');
expect(typeof isResponse).toBe('function');

// 全局类型检查 CI 通过
expect(ciTypeCheckPassed()).toBe(true);
```

---

### Epic E18-CORE: 核心功能增强

**目标**: 基于 Sprint 1-17 用户反馈，识别并实现核心功能增强。

#### Story E18-CORE-1: 功能增强识别与规划

| 字段 | 内容 |
|------|------|
| **Story ID** | E18-CORE-1 |
| **描述** | 扫描 Sprint 1-17 遗留问题与用户反馈，识别高优先级功能增强 |
| **工时** | 8h |
| **验收标准** | 见下方 |

**验收标准（expect 断言）**:
```ts
// 输出 backlog 文档存在
expect(fs.existsSync('docs/backlog-sprint17.md')).toBe(true);

// backlog 包含 ≥ 5 个功能点
expect(backlogItems().length).toBeGreaterThanOrEqual(5);

// 每个功能点有 RICE 评分
expect(every(backlogItems(), item => item.riceScore !== undefined)).toBe(true);

// top 3 功能点已标注优先级
expect(topPrioritizedItems(3).every(i => i.priority !== undefined)).toBe(true);
```

#### Story E18-CORE-2: 核心功能实现（Top 1）

| 字段 | 内容 |
|------|------|
| **Story ID** | E18-CORE-2 |
| **描述** | 根据 backlog 优先级，实现排名第一的功能增强 |
| **工时** | 8h |
| **验收标准** | 见下方 |

**验收标准**: 待 backlog 梳理完成后从 `docs/backlog-sprint17.md` 的 F2.1 条目中读取。

#### Story E18-CORE-3: 核心功能实现（Top 2）

| 字段 | 内容 |
|------|------|
| **Story ID** | E18-CORE-3 |
| **描述** | 根据 backlog 优先级，实现排名第二的功能增强 |
| **工时** | 8h |
| **验收标准** | 见下方 |

**验收标准**: 待 backlog 梳理完成后从 `docs/backlog-sprint17.md` 的 F2.2 条目中读取。

---

### Epic E18-QUALITY: 质量与体验提升

**目标**: 提升代码质量、测试覆盖和用户交互体验。

#### Story E18-QUALITY-1: 测试覆盖率提升

| 字段 | 内容 |
|------|------|
| **Story ID** | E18-QUALITY-1 |
| **描述** | 为 E3-U2/U3 新增/修复的类型编写单元测试和集成测试 |
| **工时** | 8h |
| **验收标准** | 见下方 |

**验收标准（expect 断言）**:
```ts
// E3-U2 测试覆盖率 ≥ 80%
expect(coverage('e3-u2')).toBeGreaterThanOrEqual(80);

// E3-U3 测试覆盖率 ≥ 80%
expect(coverage('e3-u3')).toBeGreaterThanOrEqual(80);

// 所有测试通过
expect(testResult.passed).toBe(true);
expect(testResult.failed).toBe(0);
```

#### Story E18-QUALITY-2: 开发者体验改进

| 字段 | 内容 |
|------|------|
| **Story ID** | E18-QUALITY-2 |
| **描述** | 改进开发环境配置、类型文档、migration guides |
| **工时** | 8h |
| **验收标准** | 见下方 |

**验收标准（expect 断言）**:
```ts
// tsconfig.json 严格模式开启
expect(tsconfig.strict).toBe(true);

// 类型文档已生成
expect(fs.existsSync('docs/types/README.md')).toBe(true);

// migration guide 存在（针对本次类型变更）
expect(fs.existsSync('docs/migrations/e18-tsfix.md')).toBe(true);

// CI 类型检查 < 5 分钟
expect(ciTypeCheckDuration()).toBeLessThan(300000);
```

---

## 3. 验收标准汇总

| 功能点 ID | 功能点 | 验收标准数 | 可写 expect() | 需页面集成 |
|-----------|--------|------------|---------------|------------|
| E18-TSFIX-1 | E3-U2 类型修复 | 5 | ✅ | ❌ |
| E18-TSFIX-2 | E3-U3 类型修复 | 5 | ✅ | ❌ |
| E18-TSFIX-3 | 类型基础设施加固 | 5 | ✅ | ❌ |
| E18-CORE-1 | 功能增强识别 | 4 | ✅ | ❌ |
| E18-CORE-2 | 核心功能实现 Top1 | 待填充 | ✅ | 待定 |
| E18-CORE-3 | 核心功能实现 Top2 | 待填充 | ✅ | 待定 |
| E18-QUALITY-1 | 测试覆盖率提升 | 3 | ✅ | ❌ |
| E18-QUALITY-2 | 开发者体验改进 | 4 | ✅ | ❌ |

---

## 4. DoD (Definition of Done)

### 通用 DoD（适用于所有 Story）

- [ ] 代码通过 `tsc --noEmit`（无 TS 错误）
- [ ] ESLint 检查通过（无 error 级问题）
- [ ] 所有单元测试通过（`npm test` → 0 failures）
- [ ] 类型覆盖率报告生成（coverage/ 目录）
- [ ] PR 创建并通过 Code Review
- [ ] 功能点对应的 specs/ 目录文件已更新

### Story 特定 DoD

#### E18-TSFIX-1 / E18-TSFIX-2（类型修复）
- [ ] `tsc --noEmit` 输出 0 errors
- [ ] `npx tsc --noEmit 2>&1 | grep -c "error TS"` 返回 0
- [ ] 类型覆盖率报告存在：`coverage/type-coverage-e3-u2.html`
- [ ] 无 `as any` 或 `as unknown` 强制类型转换（特殊豁免需注释说明）
- [ ] 类型测试文件存在：`src/e3-u2/**/*.test.ts`

#### E18-CORE-1（功能识别）
- [ ] `docs/backlog-sprint17.md` 已创建
- [ ] backlog 包含 ≥ 5 个功能点
- [ ] 每个功能点有：描述、RICE 评分、验收标准草稿
- [ ] 与 Architect、Analyst 对齐完成

#### E18-QUALITY-1（测试覆盖）
- [ ] Coverage ≥ 80%（行覆盖率）
- [ ] 测试文件命名符合 `*.test.ts` 规范
- [ ] Mock 使用规范（无硬编码 mock 数据）

#### E18-QUALITY-2（开发者体验）
- [ ] `tsconfig.json` 的 `strict` 模式已开启
- [ ] `docs/types/README.md` 包含所有公开类型文档
- [ ] `docs/migrations/e18-tsfix.md` 记录Breaking Changes

---

## 5. 依赖关系图

```
E18-CORE-1 (功能识别)
    ↓ 输入 backlog
E18-CORE-2 (Top1 实现)  ← 依赖 E18-CORE-1
E18-CORE-3 (Top2 实现)  ← 依赖 E18-CORE-1

E18-TSFIX-3 (类型基础设施) ← 依赖 E18-TSFIX-1, E18-TSFIX-2
E18-TSFIX-1 (E3-U2 类型)
E18-TSFIX-2 (E3-U3 类型)
    ↓ 并行
E18-QUALITY-1 (测试覆盖) ← 依赖 E18-TSFIX-1, E18-TSFIX-2
E18-QUALITY-2 (DX 改进)  ← 依赖 E18-TSFIX-1, E18-TSFIX-2
```

---

## 6. 工时汇总

| Epic | Story | 工时 |
|------|-------|------|
| E18-TSFIX | E18-TSFIX-1 | 16h |
| E18-TSFIX | E18-TSFIX-2 | 16h |
| E18-TSFIX | E18-TSFIX-3 | 8h |
| E18-CORE | E18-CORE-1 | 8h |
| E18-CORE | E18-CORE-2 | 8h |
| E18-CORE | E18-CORE-3 | 8h |
| E18-QUALITY | E18-QUALITY-1 | 8h |
| E18-QUALITY | E18-QUALITY-2 | 8h |
| **合计** | | **80h** |

---

## 7. 风险与依赖

| 风险 | 概率 | 影响 | 缓解措施 |
|------|------|------|----------|
| 342 TS errors 修复工作量超出预期 | 中 | 高 | E18-CORE-1 先识别实际错误数量，按需拆分 Story |
| E18-CORE-2/3 功能范围不确定 | 高 | 中 | E18-CORE-1 必须先完成，明确范围后再实施 |
| 类型修复 Breaking Changes 影响现有功能 | 中 | 高 | E18-QUALITY-2 的 migration guide 必须同步完成 |

---

## 8. PRD 校验清单

- [x] 执行摘要包含：背景 + 目标 + 成功指标
- [x] Epic/Story 表格格式正确（ID/描述/工时/验收标准）
- [x] 每个 Story 有可写的 expect() 断言
- [x] DoD 章节存在且具体
- [x] 功能点页面集成标注（无页面集成需求的功能已标注 ❌）
- [ ] E18-CORE-2、E18-CORE-3 验收标准待 backlog 梳理后填充

---

## 执行决策

- **决策**: 已采纳
- **执行项目**: 待从 team-tasks 获取项目 ID
- **执行日期**: 2026-04-30
