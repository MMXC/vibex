# Implementation Plan — vibex-sprint4-spec-canvas-extend-qa

**项目**: vibex-sprint4-spec-canvas-extend-qa
**版本**: v1.1（修订版）
**日期**: 2026-04-18
**角色**: Architect

---

## 阶段目标

对 `vibex-sprint4-spec-canvas-extend` 产出物进行系统性 QA 验证，产出缺陷归档 + 最终报告。

---

## Unit Index

| Epic | Units | Status | Next |
|------|-------|--------|------|
| E1: 产出物代码审查 | U1~U3 | 0/3 | U1 |
| E2: 产出物测试验证 | U4~U6 | 0/3 | U4 |
| E3: 补充测试编写 | U7~U8 | 2/2 ✅ | U7 |
| E4: 缺陷归档 | U9~U10 | 2/2 ✅ | U9 |
| E5: 最终报告 | U11 | 1/1 ✅ | U11 |

---

## E1: 产出物代码审查

| ID | Name | Status | Depends On | Acceptance Criteria |
|----|------|--------|-----------|---------------------|
| E1-U1 | E1-E3 代码审查 | ✅ | — | APIEndpointCard + StateMachineCard + DDSToolbar 代码审查完成，缺陷归档 |
| E1-U2 | E4 导出代码审查 | ✅ | E1-U1 | exporter.ts + DDSToolbar 导出按钮代码审查完成 |
| E1-U3 | E5 四态组件审查 | ✅ | E1-U1 | ChapterEmptyState + ChapterSkeleton 存在性验证，结果为 NOT FOUND |

### E1-U1 详细说明

**工作目录**: `/root/.openclaw/vibex/vibex-fronted`

**审查步骤**:
1. `grep -oE "#[0-9a-fA-F]{6}" src/components/dds/cards/APIEndpointCard.tsx | sort -u` → 8 处 hex → P0-002
2. `grep -oE "#[0-9a-fA-F]{6}" src/components/dds/cards/StateMachineCard.tsx | sort -u` → 7 处 hex → P0-003
3. `grep "^--color" src/styles/tokens.css` → 0 条 → P0-001
4. `grep "interface StateMachineCard" src/types/dds/state-machine.ts` → 容器结构 → P0-004
5. `grep CHAPTER_ORDER src/components/dds/canvas/CrossChapterEdgesOverlay.tsx` → 5 章节 ✅
6. `grep CHAPTER_OFFSETS -A 6 src/components/dds/canvas/CrossChapterEdgesOverlay.tsx` → 不均匀 → P2-001

**风险**: 无（纯审查，不改代码）

---

## E2: 产出物测试验证

| ID | Name | Status | Depends On | Acceptance Criteria |
|----|------|--------|-----------|---------------------|
| E2-U1 | 上游测试覆盖率确认 | ⬜ | — | E1(154) + E2(158) + E3(166) + E4(31) + E5(5) 测试文件存在 |
| E2-U2 | Vitest 测试执行 | ⬜ | E2-U1 | `pnpm vitest run` 可执行 |

### E2-U1 详细说明

```bash
# 验证测试文件存在
find src -name "*.test.ts" -o -name "*.test.tsx" | grep -E "dds|canvas|card|exporter" | wc -l
# 预期: 各 Epic 测试文件存在

# 执行测试
cd /root/.openclaw/vibex/vibex-fronted
pnpm vitest run --reporter=dot
```

---

## E3: 补充测试编写

| ID | Name | Status | Depends On | Acceptance Criteria |
|----|------|--------|-----------|---------------------|
| E3-U1 | E4 Spec 对齐测试 | ⬜ | E2-U1 | `spec-alignment.test.ts` 包含 exportDDSCanvasData 和 exportToStateMachine 的 Spec 对齐测试 |
| E3-U2 | E5 组件存在性测试 | ⬜ | E2-U1 | ChapterEmptyState + ChapterSkeleton 文件存在性测试 |

### E3-U1 详细说明

**文件**: `src/services/dds/__tests__/spec-alignment.test.ts`

```typescript
describe('E4 Spec Alignment', () => {
  test('exportDDSCanvasData 返回 string', () => {
    const result = exportDDSCanvasData([]);
    expect(typeof result).toBe('string');
  });
  test('返回 JSON 含 openapi 3.0.x', () => {
    const spec = JSON.parse(exportDDSCanvasData([]));
    expect(spec.openapi).toMatch(/^3\.0\.\d+$/);
  });
  test('exportToStateMachine 不含 smVersion', () => {
    const sm = JSON.parse(exportToStateMachine([]));
    expect(sm.smVersion).toBeUndefined();
  });
});

describe('E5 Spec Alignment', () => {
  test('ChapterEmptyState.tsx 存在', () => {
    const path = resolve('src/components/dds/canvas/ChapterEmptyState.tsx');
    expect(fs.existsSync(path)).toBe(true); // 预期 FAIL
  });
  test('ChapterSkeleton.tsx 存在', () => {
    const path = resolve('src/components/dds/canvas/ChapterSkeleton.tsx');
    expect(fs.existsSync(path)).toBe(true); // 预期 FAIL
  });
});
```

---

## E4: 缺陷归档

| ID | Name | Status | Depends On | Acceptance Criteria |
|----|------|--------|-----------|---------------------|
| E4-U1 | P0/P1/P2 缺陷归档 | ⬜ | E1-U1,E1-U2,E1-U3 | `defects/P0/`×6 + `defects/P1/`×1 + `defects/P2/`×2，共 9 个文件 |
| E4-U2 | 缺陷文件格式审查 | ⬜ | E4-U1 | 每个文件含：严重性、Epic、Spec 引用、问题描述、代码证据、修复建议、影响范围 |

### E4-U1 缺陷清单

| ID | 文件 | 优先级 |
|----|------|--------|
| P0-001 | defects/P0/P0-001-css-token-missing.md | P0 |
| P0-002 | defects/P0/P0-002-apiendpointcard-hardcode.md | P0 |
| P0-003 | defects/P0/P0-003-statemachinecard-hardcode.md | P0 |
| P0-004 | defects/P0/P0-004-statemachinecard-mismatch.md | P0 |
| P0-005 | defects/P0/P0-005-exporter-return-type.md | P0 |
| P0-006 | defects/P0/P0-006-empty-state-components.md | P0 |
| P1-001 | defects/P1/P1-001-sm-export-format.md | P1 |
| P2-001 | defects/P2/P2-001-chapter-offset-unequal.md | P2 |
| P2-002 | defects/P2/P2-002-missing-createform.md | P2 |

---

## E5: 最终报告

| ID | Name | Status | Depends On | Acceptance Criteria |
|----|------|--------|-----------|---------------------|
| E5-U1 | qa-final-report.md | ⬜ | E4-U1 | 包含所有 Epic 的 PASS/FAIL 判定、DoD 检查单、缺陷汇总表 |

---

## 执行流程

```
1. task claim vibex-sprint4-spec-canvas-extend-qa design-architecture
2. E1 代码审查 (U1-U3)
3. E2 测试验证 (U4-U6)
4. E3 补充测试 (U7-U8)
5. E4 缺陷归档 (U9-U10)
6. E5 最终报告 (U11)
7. task update vibex-sprint4-spec-canvas-extend-qa design-architecture done
8. Slack 汇报到 #architect-channel
```

---

## gstack 截图计划（Phase 2 — 依赖 Staging 部署）

| ID | 目标 | 验证点 | 环境依赖 |
|----|------|--------|---------|
| G1 | DDSToolbar | 5 个章节按钮 + 当前章节高亮 | Staging |
| G2 | API 章节空状态 | 引导文案"从左侧拖拽 HTTP 方法到画布" | Staging |
| G3 | SM 章节空状态 | 引导文案"从左侧拖拽 State 开始设计业务规则" | Staging |
| G4 | 导出 Modal | OpenAPI 3.0 + State Machine JSON 两个按钮 | Staging |
| G5 | APIEndpointCard | method badge 颜色正确 | Staging |

**环境备选**: 如无 Staging → 在 `qa-final-report.md` 标注"待部署后补充 G1~G5"
