# Implementation Plan — vibex-sprint5-delivery-integration-qa

**项目**: vibex-sprint5-delivery-integration-qa
**版本**: v1.0
**日期**: 2026-04-18
**角色**: Architect

---

## 阶段目标

对 `vibex-sprint5-delivery-integration` 产出物进行系统性 QA 验证，产出缺陷归档 + 最终报告。

---

## Unit Index

| Epic | Units | Status | Next |
|------|-------|--------|------|
| E1: 数据层审查 | U1~U2 | 0/2 | U1 |
| E2: 导航审查 | U3 | 0/1 | U3 |
| E3: 导出器审查 | U4 | 0/1 | U4 |
| E4: PRD融合审查 | U5~U7 | 3/3 ✅ | — |
| E5: 状态处理审查 | U8 | 1/1 ✅ | — |
| E6: 缺陷归档 | U9~U10 | 0/2 | U9 |
| E7: 最终报告 | U11 | 0/1 | U11 |

---

## E1: 数据层审查

| ID | Name | Status | Depends On | Acceptance Criteria |
|----|------|--------|-----------|---------------------|
| E1-U1 | loadFromStores 调用验证 | ✅ | — | delivery/page.tsx 改用 loadFromStores()，grep "loadMockData" → 0 |
| E1-U2 | BoundedContext 类型验证 | ✅ | U1 | relations 字段移除，tsc --noEmit 通过 |

### E1-U1 详细说明

**文件**: `src/app/canvas/delivery/page.tsx`

**修复**: 1 行代码，5 分钟
```typescript
// 修改前
useEffect(() => { loadMockData(); }, [loadMockData]);
// 修改后
useEffect(() => { loadFromStores(); }, []);
```

---

## E2: 导航审查

| ID | Name | Status | Depends On | Acceptance Criteria |
|----|------|--------|-----------|---------------------|
| E2-U1 | DeliveryNav 测试覆盖率 | ✅ | — | DeliveryNav.test.tsx 从 3 tests 补充到 7 tests |

---

## E3: 导出器审查

| ID | Name | Status | Depends On | Acceptance Criteria |
|----|------|--------|-----------|---------------------|
| E3-U1 | DDLGenerator 测试覆盖率 | ✅ | — | DDLGenerator.test.ts 10→16 tests ✅ |

---

## E4: PRD融合审查

| ID | Name | Status | Depends On | Acceptance Criteria |
|----|------|--------|-----------|---------------------|
| E4-U1 | PRDGenerator 新建 | ✅ | — | lib/delivery/PRDGenerator.ts ✅ 5 tests |
| E4-U2 | PRDTab 替换硬编码 | ✅ | U1 | PRDTab.tsx ✅ 无"电商系统"硬编码，使用 generatePRDMarkdown |
| E4-U3 | exportItem 替换 TODO | ✅ | U2 | deliveryStore.ts ✅ 无 TODO:Replace，/api/delivery/export 实现 |

### E4-U1 详细说明

**新建文件**: `src/lib/delivery/PRDGenerator.ts`

按 Spec E4-prd-fusion.md 接口实现，含：
- `generatePRD(prototypeData, ddsData): PRDOutput`
- `generatePRDMarkdown(prd: PRDOutput): string`

---

## E5: 状态处理审查

| ID | Name | Status | Depends On | Acceptance Criteria |
|----|------|--------|-----------|---------------------|
| E5-U1 | PRDTab 空状态组件 | ✅ | E4-U2 | PRDTab.tsx ✅ 含空状态引导"请先在 DDS 画布中创建..." |

---

## E6: 缺陷归档

| ID | Name | Status | Depends On | Acceptance Criteria |
|----|------|--------|-----------|---------------------|
| E6-U1 | BLOCKER/P1/P2 缺陷归档 | ⬜ | E1-U2,E4-U3,E5-U1 | BLOCKER×4 + P1×1 + P2×2 |
| E6-U2 | 缺陷文件格式审查 | ⬜ | U9 | 每个文件含 7 个必需字段 |

---

## E7: 最终报告

| ID | Name | Status | Depends On | Acceptance Criteria |
|----|------|--------|-----------|---------------------|
| E7-U1 | qa-final-report.md | ⬜ | E6-U1 | 含所有 Epic PASS/FAIL、DoD、BLOCKER 追踪 |

---

## 执行流程

```
1. task claim vibex-sprint5-delivery-integration-qa design-architecture
2. E1-U1: 修改 delivery/page.tsx (5 分钟)
3. E1-U2: 清理 BoundedContext relations
4. E2-U1: 补充 DeliveryNav tests (3→7)
5. E3-U1: 补充 DDLGenerator tests (10→16)
6. E4-U1: 新建 PRDGenerator.ts
7. E4-U2: PRDTab 调用 generatePRD
8. E4-U3: exportItem 实现下载逻辑
9. E5-U1: PRDTab 空状态
10. E6-U1~U2: 缺陷归档
11. E7-U1: qa-final-report.md
12. task update done
13. Slack 汇报
```

---

## gstack 截图计划

| ID | 目标 | 验证点 | 环境依赖 |
|----|------|--------|---------|
| G1 | delivery/page.tsx | 真实数据（loadFromStores） | Staging |
| G2 | PRD Tab | 真实数据（PRDGenerator） | Staging |
| G3 | PRD Tab 空状态 | 引导文案 | Staging |
| G4 | 导出功能 | 实际文件下载 | Staging |
| G5 | DDL Modal | 语法高亮 | Staging |
