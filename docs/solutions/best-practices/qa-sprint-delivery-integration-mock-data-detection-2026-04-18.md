---
title: Sprint5-QA 交付中心——Mock数据检测与PRD融合验证
date: 2026-04-18
category: docs/solutions/best-practices
module: vibex
problem_type: best_practice
component: frontend_stimulus
severity: medium
applies_when:
  - QA sprint validating delivery integration features with mock→real data transitions
  - Detecting loadMockData() vs loadFromStores() call patterns
  - PRD generation from real store data vs hardcoded content
  - Verifying export functionality replaces TODO stubs
tags:
  - qa-sprint
  - mock-data
  - delivery-integration
  - prd-generation
  - defect-archival
  - best-practice
related_components:
  - deliveryStore
  - loadFromStores
  - PRDGenerator
  - exportItem
---

# Sprint5-QA 交付中心——Mock数据检测与PRD融合验证

## Context

Sprint5 Delivery Integration 交付了交付中心，但 QA Sprint 发现两个 **BLOCKER** 级别缺陷：
1. `delivery/page.tsx` 调用 `loadMockData()` 而非 `loadFromStores()` — 交付中心永远显示 mock 数据
2. `PRDGenerator.ts` 文件不存在 — PRD Tab 硬编码 "电商系统"

这是一个典型的"功能外壳完成，内核仍为 mock"的场景，与 Sprint6-QA 的 AI stub 问题类似。

---

## Guidance

### 模式 1: Mock 数据检测（Delivery 场景）

```bash
# 检查 page.tsx 调用的是 mock 还是真实数据
grep "loadMockData\|loadFromStores" src/app/canvas/delivery/page.tsx

# 预期: loadFromStores (真实数据)
# 实际: loadMockData() (mock数据) → BLOCKER
```

```typescript
// delivery/page.tsx — 错误（调用 mock）
useEffect(() => {
  loadMockData();  // ❌ BLOCKER: 交付中心永远显示 Mock Component / Mock Context
}, [loadMockData]);

// delivery/page.tsx — 正确（调用真实数据）
useEffect(() => {
  loadFromStores();  // ✅ 从 prototypeStore + DDSCanvasStore 拉取真实数据
}, []);
```

### 模式 2: PRD 生成器缺失检测

```bash
# 检查 PRDGenerator 是否存在
find src/lib/delivery/ -name "PRDGenerator.ts"
# 预期: 文件存在
# 实际: NOT FOUND → BLOCKER

# 检查 PRDTab 是否含硬编码
grep "电商系统\|Mock PRD" src/components/delivery/PRDTab.tsx
# 预期: 0 matches
# 实际: "电商系统" 存在 → BLOCKER
```

### 模式 3: Export TODO Stub 检测

```bash
grep "TODO.*Replace\|TODO.*API" src/stores/deliveryStore.ts
# 预期: 0 matches
# 实际: "TODO: Replace with actual API call" → BLOCKER
```

---

## Why This Matters

**Mock 数据在交付中心是致命的。** 交付中心的价值在于将真实的设计数据（从 prototype/DDS 画布）转化为可交付物。如果用户看到的是 Mock Component / Mock Context，他们无法相信这些是可交付的产出。

**PRDGenerator 缺失意味着 PRD Tab 完全是假的。** 用户在 PRD Tab 看到的内容是硬编码的演示文本，不是从真实画布数据生成的。这比没有功能更危险——用户可能以为这是真实数据。

---

## Prevention

- **Delivery page 必须调用 loadFromStores()**：任何交付相关的 page.tsx，在 loadFromStores 可用时禁止调用 loadMockData()
- **PRDGenerator 必须从真实数据生成**：PRD Tab 的内容必须来自 prototypeStore/DDSCanvasStore，禁止硬编码
- **Export 功能禁止有 TODO stub**：下载按钮必须在 MVP 中有实际逻辑，不接受 download() {} 空壳
- **Mock 数据迁移检查表**：当 sprint 完成从 mock 到真实的迁移时，必须在 QA checklist 中明确验证 loadFromStores 被调用

---

## Related

- `qa-sprint-ai-integration-mock-detection-2026-04-18.md` — Sprint6-QA 的 AI stub 检测模式，两者同属"外壳完整、内核为空"的问题类型
