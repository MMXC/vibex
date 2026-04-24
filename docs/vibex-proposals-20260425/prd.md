# VibeX Sprint 8 PRD — 功能提案规划

**版本**: v1.0
**日期**: 2026-04-25
**PM**: pm
**状态**: Draft

---

## 1. 执行摘要

### 背景

VibeX 已完成 Sprint 1-7 交付，核心功能（Canvas/Delivery/Dashboard/Auth）已上线，但存在三类关键债务：

1. **技术债**：143 个 TS 编译错误，集中在 Cloudflare Workers 类型定义缺失，导致 CI 构建不稳定
2. **质量债**：PM 神技（Design Token/四态表/情绪地图）落地系统性失败，缺乏强制评审门禁
3. **功能风险**：Firebase Realtime Collaboration 无可行性评审；Import/Export 无 round-trip E2E 测试，存在数据丢失风险

### 目标

Sprint 8 分两批完成：
- **第一批（1-5天）**：P001 债务清理 + P004 质量门禁建立
- **第二批（6-10天）**：P002 Firebase 验证 + P003 Import/Export 测试覆盖

### 成功指标

| 指标 | 目标值 |
|------|--------|
| TS 编译错误数 | 0 |
| CI tsc gate | 通过率 100% |
| Firebase Presence 更新延迟 | 单用户 < 1s |
| JSON round-trip E2E | 通过率 100% |
| YAML round-trip E2E | 通过率 100% |
| PRD/SPEC 质量门禁检查点 | 覆盖率 100% |

---

## 2. Epic 拆分

### Epic P001 — TypeScript 债务清理

| ID | Story | 描述 | 工时 | 验收标准 |
|----|-------|------|------|----------|
| P001-S1 | 安装 Cloudflare Workers 类型包 | 在 vibex-backend 安装 `@cloudflare/workers-types`，更新 `tsconfig.json` 的 `types` 数组 | 0.5d | `expect(require('@cloudflare/workers-types')).toBeDefined()`; `expect(tsconfig.compilerOptions.types).toContain('cloudflare-workers-types')` |
| P001-S2 | 修复剩余 143 个 TS 错误 | 逐文件修复类型错误，最终达到 `tsc --noEmit` exit code = 0 | 2d | `expect(exec('cd vibex-backend && pnpm exec tsc --noEmit').exitCode).toBe(0)` |
| P001-S3 | CI 增加 tsc gate | GitHub Actions workflow 增加 `pnpm exec tsc --noEmit` 步骤，失败则阻断 merge | 0.5d | `expect(ciConfig.steps).toContain('tsc --noEmit')`; `expect(ciConfig.failOnError).toBe(true)` |

**Epic P001 工时合计**: 3d

### Epic P002 — Firebase 实时协作可行性验证

| ID | Story | 描述 | 工时 | 验收标准 |
|----|-------|------|------|----------|
| P002-S1 | Architect 可行性评审 | Architect 产出 Firebase on Cloudflare Workers 冷启动性能评审报告 | 1d | `expect(fs.existsSync('docs/architecture/firebase-feasibility-review.md')).toBe(true)`; `expect(report.coldStartMs).toBeDefined()` |
| P002-S2 | Firebase SDK 冷启动性能验证 | Playwright E2E 测量 Firebase SDK init 时间，目标 < 500ms | 1d | `expect(coldStartMs).toBeLessThan(500)` |
| P002-S3 | Presence 更新延迟验证 | 单用户 Presence 更新（在线状态/头像）目标 < 1s | 1d | `expect(presenceUpdateMs).toBeLessThan(1000)` |
| P002-S4 | Analytics Dashboard 展示 | 在 `/dashboard` 增加 analytics 看板，展示 page_view/canvas_open/component_create/delivery_export 事件趋势 | 1.5d | 【需页面集成】`expect(isVisible('.analytics-widget')).toBe(true)`; `expect(analyticsData.events.length).toBeGreaterThan(0)` |
| P002-S5 | SSE bridge E2E 验证 | 验证 `sseToQueryBridge.ts` 将 SSE 数据正确写入 Query 缓存 | 0.5d | `expect(sseBridgeData).toEqual(queryCache.get(key))` |

**Epic P002 工时合计**: 5d（其中 S1 依赖 Architect，S4 需页面集成）

### Epic P003 — Teams + Import/Export 测试覆盖

| ID | Story | 描述 | 工时 | 验收标准 |
|----|-------|------|------|----------|
| P003-S1 | Teams 页面 API 集成验证 | 验证 `/dashboard/teams` 页面正确调用 Teams API 并展示成员列表 | 1d | 【需页面集成】`expect(isVisible('.teams-list')).toBe(true)`; `expect(teamsMembers.length).toBeGreaterThan(0)` |
| P003-S2 | JSON round-trip E2E | 导出 JSON → 删除 → 导入 → 比对，验证无数据丢失 | 1d | `expect(exportedData).toEqual(importedData)`; `expect(Object.keys(exportedData).sort()).toEqual(Object.keys(importedData).sort())` |
| P003-S3 | YAML round-trip E2E | 导出 YAML（含特殊字符 `:`, `#`, `|`, 多行字符串）→ 删除 → 导入 → 比对 | 1d | `expect(exportedYAML).toEqual(importedYAML)`; 特殊字符无转义丢失 |
| P003-S4 | 5MB 文件大小限制前端拦截 | 超过 5MB 的文件在上传前被前端拦截，提示"文件大小超出 5MB 限制" | 0.5d | 【需页面集成】`expect(拦截消息).toContain('5MB')`; `expect(uploadRequest).not.toHaveBeenCalled()` |

**Epic P003 工时合计**: 3.5d（并行于 P001/P002）

### Epic P004 — PM 神技质量门禁建立

| ID | Story | 描述 | 工时 | 验收标准 |
|----|-------|------|------|----------|
| P004-S1 | Coord 评审强制检查点 | Coord 评审流程增加 3 个强制检查点：四态表存在、Design Token 无硬编码色值、情绪地图存在 | 1d | `expect(coor评审清单).toContain('四态表检查')`; `expect(coor评审清单).toContain('Design Token 检查')`; `expect(coor评审清单).toContain('情绪地图检查')` |
| P004-S2 | PRD 模板更新 | 在 PRD 模板增加"本期不做"清单章节，强制要求每个 PRD 标注 scope 边界 | 0.5d | `expect(prd模板.sections).toContain('本期不做')`; `expect(prd模板.checklist).toContain('scope 边界明确')` |
| P004-S3 | 新功能 SPEC 模板更新 | 新功能 Spec 模板强制包含四态表、Design Token 规范、情绪地图路径引用 | 0.5d | `expect(spec模板).toContain('四态表')`; `expect(spec模板).toContain('Design Token')`; `expect(spec模板).toContain('情绪地图')` |

**Epic P004 工时合计**: 2d（独立于 P001-P003，可在 Sprint 8 任意时间执行）

---

## 3. 功能点总表

| ID | 功能点 | 描述 | 验收标准 | 页面集成 |
|----|--------|------|----------|----------|
| P001-S1 | Cloudflare Workers 类型包安装 | 安装 `@cloudflare/workers-types` 并配置 tsconfig.json | `expect(require('@cloudflare/workers-types')).toBeDefined()` | 否 |
| P001-S2 | 剩余 TS 错误修复 | 修复 143 个 TS 编译错误，达到 `tsc --noEmit` 通过 | `expect(tscExitCode).toBe(0)` | 否 |
| P001-S3 | CI tsc gate | GitHub Actions 增加 tsc 检查步骤 | `expect(ciSteps).toContain('tsc --noEmit')` | 否 |
| P002-S1 | Firebase Architect 评审 | Architect 产出可行性报告 | `expect(reportFile).toExist()` | 否 |
| P002-S2 | Firebase 冷启动性能 | SDK init < 500ms | `expect(coldStartMs).toBeLessThan(500)` | 否 |
| P002-S3 | Presence 更新延迟 | Presence 状态更新 < 1s | `expect(presenceUpdateMs).toBeLessThan(1000)` | 否 |
| P002-S4 | Analytics Dashboard | Dashboard 展示 analytics 看板 | `expect(isVisible('.analytics-widget')).toBe(true)` | 【需页面集成】 |
| P002-S5 | SSE bridge 验证 | SSE 数据正确写入 Query 缓存 | `expect(sseData).toEqual(cacheData)` | 否 |
| P003-S1 | Teams 页面 API | `/dashboard/teams` 正确展示团队成员 | `expect(isVisible('.teams-list')).toBe(true)` | 【需页面集成】 |
| P003-S2 | JSON round-trip E2E | JSON 导出→导入无数据丢失 | `expect(exported).toEqual(imported)` | 否 |
| P003-S3 | YAML round-trip E2E | YAML 含特殊字符 round-trip 无丢失 | `expect(exportedYAML).toEqual(importedYAML)` | 否 |
| P003-S4 | 5MB 文件限制 | 前端拦截超过 5MB 的上传 | `expect(拦截).toContain('5MB')` | 【需页面集成】 |
| P004-S1 | Coord 评审检查点 | Coord 增加 3 个强制检查点 | `expect(检查点列表).toContain('四态表')` | 否 |
| P004-S2 | PRD 模板更新 | PRD 模板增加"本期不做"章节 | `expect(模板).toContain('本期不做')` | 否 |
| P004-S3 | SPEC 模板更新 | SPEC 模板强制四态表/Design Token/情绪地图 | `expect(模板).toContain('四态表')` | 否 |

---

## 4. 验收标准详情（expect() 断言）

### P001-S2: TS 错误修复

```typescript
// 测试文件: vibex-backend/src/__tests__/ts-clean.ts
describe('TypeScript compilation', () => {
  it('tsc --noEmit exits with code 0', () => {
    const result = execSync('cd vibex-backend && pnpm exec tsc --noEmit', { encoding: 'utf8' });
    expect(result.exitCode).toBe(0);
  });

  it('no TypeScript errors in src/', () => {
    const result = execSync('cd vibex-backend && pnpm exec tsc --noEmit 2>&1', { encoding: 'utf8' });
    expect(result).not.toMatch(/error TS\d+:/);
  });
});
```

### P002-S2: Firebase 冷启动

```typescript
// 测试文件: vibex-frontend/src/__tests__/firebase-cold-start.spec.ts
describe('Firebase cold start performance', () => {
  it('Firebase SDK init < 500ms', async () => {
    const start = performance.now();
    await initializeFirebasePresence();
    const duration = performance.now() - start;
    expect(duration).toBeLessThan(500);
  });
});
```

### P002-S3: Presence 更新延迟

```typescript
it('Presence update latency < 1s', async () => {
  await setUserPresence('online', 'avatar-url');
  const start = performance.now();
  // 模拟另一个客户端接收
  const update = await waitForPresenceUpdate();
  const latency = performance.now() - start;
  expect(latency).toBeLessThan(1000);
});
```

### P002-S4: Analytics Dashboard

```typescript
// 测试文件: vibex-frontend/src/__tests__/analytics-dashboard.spec.ts
describe('Analytics Dashboard Widget', () => {
  it('widget is visible on /dashboard', async () => {
    await page.goto('/dashboard');
    await expect(page.locator('.analytics-widget')).toBeVisible();
  });

  it('displays event data from Analytics SDK', async () => {
    await page.goto('/dashboard');
    const eventCount = await page.locator('.analytics-event-count').textContent();
    expect(parseInt(eventCount!)).toBeGreaterThan(0);
  });
});
```

### P003-S2: JSON round-trip

```typescript
// 测试文件: vibex-frontend/src/__tests__/json-roundtrip.spec.ts
describe('JSON round-trip integrity', () => {
  it('export then import preserves all data', async () => {
    const exported = await exportCanvasAsJSON(canvasId);
    const canvasSnapshot = parse(exported);

    // 模拟删除后重新导入
    await deleteCanvas(canvasId);
    const imported = await importCanvasFromJSON(exported);

    expect(Object.keys(canvasSnapshot).sort()).toEqual(Object.keys(imported).sort());
    expect(canvasSnapshot.components).toEqual(imported.components);
    expect(canvasSnapshot.connections).toEqual(imported.connections);
  });
});
```

### P003-S3: YAML round-trip（含特殊字符）

```typescript
describe('YAML round-trip with special chars', () => {
  const specialYAML = `
title: "Test: Complex Case #1"
description: |
  Multi-line
  description
with: "key: value"
comment: "# not a comment"
`;

  it('special characters preserved', async () => {
    const exported = await exportCanvasAsYAML(canvasId, { includeSpecialChars: true });
    const imported = await importCanvasFromYAML(exported);
    expect(imported.title).toContain(':');
    expect(imported.description).toContain('\n');
    expect(exported).toContain('# not a comment');
  });
});
```

### P003-S4: 5MB 文件限制

```typescript
describe('File size limit enforcement', () => {
  it('blocks files > 5MB before upload', async () => {
    const bigFile = createFakeFile(6 * 1024 * 1024); // 6MB
    const uploadSpy = await import.meta.jest.fn();

    user uploads bigFile;
    expect(uploadSpy).not.toHaveBeenCalled();
    expect(page.locator('.file-size-error')).toContainText('5MB');
  });
});
```

---

## 5. DoD (Definition of Done)

### P001 TypeScript 债务清理

- [ ] `pnpm exec tsc --noEmit` 在本地和 CI 均 exit code = 0
- [ ] `@cloudflare/workers-types` 已添加到 `tsconfig.json` 的 `types` 数组
- [ ] GitHub Actions workflow 已增加 tsc gate，PR 构建失败时明确提示 TS 错误
- [ ] 新增 Cloudflare Workers API 调用时，同步更新类型定义

### P002 Firebase 实时协作验证

- [ ] Architect 产出可行性报告，结论明确（可行/需换方案）
- [ ] Playwright E2E 测试通过：Firebase SDK init < 500ms
- [ ] Playwright E2E 测试通过：Presence 更新 < 1s
- [ ] `/dashboard` 页面 analytics widget 可见且有数据
- [ ] SSE bridge 数据一致性 E2E 验证通过
- [ ] 【需页面集成】Firebase Presence UI 在 `/canvas` 正确显示其他用户头像

### P003 Teams + Import/Export

- [ ] Playwright E2E 测试通过：JSON round-trip 数据完全一致
- [ ] Playwright E2E 测试通过：YAML round-trip 含 `:`, `#`, `|`, 多行字符串特殊字符无丢失
- [ ] Playwright E2E 测试通过：5MB 文件上传被前端拦截
- [ ] 【需页面集成】`/dashboard/teams` 页面正确展示团队成员列表
- [ ] 错误边界处理：导入损坏 JSON/YAML 时有明确错误提示

### P004 PM 神技质量门禁

- [ ] Coord 评审流程文档已更新，包含 3 个强制检查点
- [ ] PRD 模板已更新，新增"本期不做"章节
- [ ] SPEC 模板已更新，强制要求四态表、Design Token、情绪地图
- [ ] 下一次 Coord 评审已应用新检查点（验证性运行）

---

## 6. 依赖关系图

```
Sprint 8 Day 1-5 (第一批)
┌─────────────────────────────────────────────────┐
│ P001-S1 → P001-S2 → P001-S3                      │
│ (TS债务)           (CI gate)                     │
│                                                  │
│ P004-S1 → P004-S2 → P004-S3                      │
│ (评审检查点)    (PRD模板) (SPEC模板)             │
└─────────────────────────────────────────────────┘
           ↓ (P001 完成后 CI 稳定)
Sprint 8 Day 6-10 (第二批)
┌─────────────────────────────────────────────────┐
│ P002-S1 (Architect评审)                         │
│   ↓                                              │
│ P002-S2 → P002-S3 → P002-S5                      │
│ (冷启动)     (Presence)  (SSE验证)               │
│                     ↓                            │
│                   P002-S4 【需页面集成】          │
│                   (Analytics Dashboard)          │
│                                                  │
│ P003-S1 【需页面集成】← P003-S2                  │
│ (Teams)              (JSON)                     │
│   ↓                      ↓                      │
│ P003-S3 ←── P003-S2  (YAML)                     │
│   ↓                                              │
│ P003-S4 【需页面集成】                           │
│ (5MB限制)                                        │
└─────────────────────────────────────────────────┘

⚠️ 阻塞条件：
- P002 依赖 P001 完成（CI 稳定后 Firebase 验证才能可靠进行）
- P003 与 P001/P002 并行，无直接依赖
- P004 完全独立，可在任意时间执行
```

---

## 7. Sprint 8 排期建议

| Week | Monday | Tuesday | Wednesday | Thursday | Friday |
|------|--------|---------|-----------|----------|--------|
| Week 1 | P001-S1 | P001-S2 | P001-S2 | P001-S2 + P001-S3 | P004-S1 |
| Week 2 | P004-S2 + P004-S3 | P002-S1 (Architect) | P002-S2 | P002-S3 + P002-S5 | P002-S4 【页面】|
| Week 3 | P003-S1 【页面】| P003-S2 | P003-S3 | P003-S4 【页面】| Buffer + 回归 |

---

## 8. PRD 自检清单

- [x] 执行摘要包含：背景 + 目标 + 成功指标
- [x] Epic/Story 表格格式正确（ID/描述/工时/验收标准）
- [x] 每个 Story 有可写的 expect() 断言
- [x] DoD 章节存在且具体（4 个 Epic 各自 DoD）
- [x] 功能点总表包含 ID/描述/验收标准/页面集成标注
- [x] 依赖关系图清晰
- [x] Sprint 排期建议已给出
