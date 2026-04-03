# PRD: VibeX Dev 提案评审与扩展

**项目**: vibex-dev-proposals-20260403_024652  
**版本**: 1.0  
**日期**: 2026-04-03  
**负责人**: PM  
**状态**: Draft  

---

## 1. Executive Summary

### 1.1 背景

VibeX Sprint 3 正在执行两条主线（Checkbox 持久化 + 消息抽屉），同时遗留多项技术债阻碍开发效率：

| 痛点 | 影响 |
|------|------|
| E4 Sync Protocol 缺失 | 多用户并发编辑无冲突保护，数据可能覆盖 |
| canvasStore 未完全退役 | 双重数据源风险（1513 行原文件 + 735 行 split stores） |
| StepClarification 命名冲突 | TS 编译错误，阻断 CI |
| 自动保存缺少 E2E 验证 | beacon/debounce 行为无端到端验证 |

### 1.2 目标

| # | 目标 | 指标 |
|---|------|------|
| G1 | 解除 CI 阻断 | `tsc --noEmit` 零错误 |
| G2 | 实现冲突保护 | 并发编辑场景下用户可选择保留版本 |
| G3 | 补全测试金字塔 | Playwright E2E 覆盖 auto-save 完整流程 |
| G4 | 清理 Store 架构 | canvasStore 仅作兼容层（< 50 行） |

### 1.3 成功指标

| 指标 | 当前值 | 目标值 |
|------|--------|--------|
| TS 编译错误数 | 2 | 0 |
| canvasStore 代码行数 | 1513 | < 50 |
| auto-save E2E 测试覆盖 | 0 | ≥ 4 个测试用例 |
| CI 通过率 | ~80%（TS 阻断） | > 95% |
| 并发冲突丢失数据事件 | 未知（未处理） | 0 |

---

## 2. Epic Breakdown

---

### Epic E1: TypeScript 严格模式收尾

**描述**: 修复 Sprint 2 遗留的 `StepClarification.tsx` 重复类型定义，解除 CI 阻断，并添加 ESLint 防护规则防止未来复发。  
**优先级**: P0  
**状态**: 待开发  
**工时**: 1h  

#### Story 列表

| 功能 ID | Story | 功能点 | 验收标准 | 页面集成 | 工时 | 依赖 |
|---------|-------|--------|----------|----------|------|------|
| E1-S1 | 修复 StepClarification 重复定义 | 移除 `StepComponentProps` 的重复定义，保留一个统一版本 | `expect(tscOutput.errors).toHaveLength(0)` | 无 | 0.5h | 无 |
| E1-S2 | 添加 ESLint 防复发规则 | 配置 `no-duplicate-imports` 或等效规则，在 CI 中 gate | `expect(eslintOutput.errorCount).toBe(0)` | 无 | 0.5h | E1-S1 |

---

### Epic E2: E4 Sync Protocol 冲突检测与解决

**描述**: 完成 canvas-json-persistence Epic 4，为快照保存增加乐观锁 version 字段，后端检测冲突返回 409，前端展示 ConflictDialog 让用户选择保留版本。  
**优先级**: P1  
**状态**: 待开发  
**工时**: 5h  

#### Story 列表

| 功能 ID | Story | 功能点 | 验收标准 | 页面集成 | 工时 | 依赖 |
|---------|-------|--------|----------|----------|------|------|
| E2-S1 | 后端 Snapshot API 增加 version 乐观锁检查 | `POST /v1/canvas/snapshots` 接收 `version` 字段，比较 `localVersion < serverVersion` 时返回 `409 Conflict` | `expect(response.status).toBe(409)` when `localVersion < serverVersion` | 无 | 1.5h | 无 |
| E2-S2 | 前端 useAutoSave 携带 version 字段 | `useAutoSave` hook 在保存请求中携带当前 version，发起条件保存 | `expect(savePayload).toHaveProperty('version')` | 无 | 1.5h | E2-S1 |
| E2-S3 | ConflictDialog 冲突解决 UI | 新建 ConflictDialog 组件，提供「保留本地」和「使用服务端」两个选项 | `expect(dialog.isVisible()).toBe(true)` on 409 response | 【需页面集成】 | 2h | E2-S1, E2-S2 |

---

### Epic E3: Playwright E2E 测试覆盖率提升

**描述**: 为 auto-save 完整流程（debounce、beacon、版本历史面板）补全 Playwright E2E 测试，消除测试金字塔缺口。  
**优先级**: P2  
**状态**: 待开发  
**工时**: 4h  

#### Story 列表

| 功能 ID | Story | 功能点 | 验收标准 | 页面集成 | 工时 | 依赖 |
|---------|-------|--------|----------|----------|------|------|
| E3-S1 | Playwright fixture 搭建与基础配置 | 完善 Playwright 配置，搭建 canvas 场景 fixture | `expect(playwrightConfig.projects).toHaveLength(2)` (chromium + mobile) | 无 | 1h | 无 |
| E3-S2 | auto-save 完整流程 E2E 测试 | 测试编辑 → debounce 等待 → 保存 → 指示器更新完整链路 | `expect(saveIndicator.textContent).toContain('已保存')` after edit | 无 | 1h | E3-S1 |
| E3-S3 | Beacon 触发场景测试 | 测试 `beforeunload` 场景下 beacon 调用被正确触发 | `expect(beaconRequest.completed).toBe(true)` on page close | 无 | 1h | E3-S1 |
| E3-S4 | VersionHistoryPanel 交互测试 | 测试版本历史面板打开、版本切换交互 | `expect(panel.isVisible()).toBe(true)` and `expect(versionItems).toHaveLength(2)` | 【需页面集成】 | 1h | E3-S1 |

---

### Epic E4: canvasStore 退役清理

**描述**: 将 canvasStore 中剩余未迁移逻辑迁移至 split stores，将 canvasStore 降级为纯兼容层（re-export），更新所有组件的 import path，消除双重数据源风险。  
**优先级**: P2  
**状态**: 待开发  
**工时**: 8h  

#### Story 列表

| 功能 ID | Story | 功能点 | 验收标准 | 页面集成 | 工时 | 依赖 |
|---------|-------|--------|----------|----------|------|------|
| E4-S1 | 审查 canvasStore 未迁移逻辑 | 审查 canvasStore.ts 中剩余未迁移逻辑，确定迁移计划 | `expect(unmigratedLogicCount).toBe(0)` | 无 | 2h | 无 |
| E4-S2 | 迁移剩余逻辑至 split stores | 将 canvasStore 中剩余业务逻辑迁移至对应 split stores | `expect(allLogicInSplitStores).toBe(true)` | 无 | 3h | E4-S1 |
| E4-S3 | canvasStore 降级为兼容层 | canvasStore.ts 仅保留 re-export 语句，行数 < 50 | `expect(canvasStoreLineCount).toBeLessThan(50)` | 无 | 2h | E4-S2 |
| E4-S4 | 更新所有组件 import path | 将 14 个组件的 import 从 canvasStore 切换至 split stores | `expect(canvasStoreImportCount).toBe(0)` across all components | 【需页面集成】 | 1h | E4-S3 |

---

## 3. 工时汇总

| Epic | 工时 |
|------|------|
| E1: TypeScript 严格模式收尾 | 1h |
| E2: E4 Sync Protocol | 5h |
| E3: Playwright E2E | 4h |
| E4: canvasStore 退役清理 | 8h |
| **总计** | **18h** |

---

## 4. 验收标准（详细 expect 断言）

### E1-S1: 修复 StepClarification 重复定义
```typescript
// 验收标准
expect(stepClarificationFile).not.toContain('Duplicate identifier');
expect(tscOutput.errors).toHaveLength(0);
expect(tscOutput.errors.filter(e => e.includes('StepComponentProps'))).toHaveLength(0);
```

### E1-S2: 添加 ESLint 防复发规则
```typescript
expect(eslintConfig.rules['no-duplicate-imports']).toBeDefined();
expect(eslintOutput.errorCount).toBe(0);
// 新增重复 import 时 ESLint 报错
expect(() => parseESLint(fileWithDuplicate)).toThrow();
```

### E2-S1: 后端 Snapshot API version 检查
```typescript
// version 一致 → 200 OK
expect(postResponse.status).toBe(200);
// version 过时 → 409 Conflict
expect(obsoleteResponse.status).toBe(409);
expect(obsoleteResponse.body.code).toBe('VERSION_CONFLICT');
// 响应包含 serverVersion
expect(obsoleteResponse.body.serverVersion).toBeDefined();
```

### E2-S2: useAutoSave 携带 version 字段
```typescript
expect(useAutoSave).toBeDefined();
const savePayload = captureSaveRequest();
// 每次保存携带当前 canvas 的 version
expect(savePayload).toHaveProperty('version');
expect(typeof savePayload.version).toBe('number');
```

### E2-S3: ConflictDialog UI
```typescript
// 收到 409 后，对话框显示
expect(conflictDialog.isVisible()).toBe(true);
expect(conflictDialog.getByText('版本冲突')).toBeTruthy();
// 「保留本地」按钮存在
expect(conflictDialog.getByRole('button', { name: /保留本地/i })).toBeTruthy();
// 「使用服务端」按钮存在
expect(conflictDialog.getByRole('button', { name: /使用服务端/i })).toBeTruthy();
// 选择后对话框关闭
await conflictDialog.getByRole('button', { name: /保留本地/i }).click();
expect(conflictDialog.isVisible()).toBe(false);
```

### E3-S1: Playwright fixture 搭建
```typescript
expect(playwrightConfig.projects).toHaveLength(2);
expect(playwrightConfig.testDir).toBe('./tests/e2e');
expect(Object.keys(playwrightConfig.projects[0].use.devices)).toContain('iPhone 12');
```

### E3-S2: auto-save 完整流程
```typescript
await canvas.click();
await canvas.fill('test content');
// 等待 debounce（默认 1000ms）+ 保存延迟
await page.waitForTimeout(2000);
expect(saveIndicator.textContent).toContain('已保存');
// 再次编辑，验证指示器变为「保存中...」
await canvas.fill('new content');
expect(saveIndicator.textContent).toContain('保存中');
```

### E3-S3: Beacon 触发
```typescript
// 通过 intercept 验证 sendBeacon 被调用
const beaconRequests = [];
page.on('request', req => { if (req.method() === 'POST' && req.url().includes('beacon')) beaconRequests.push(req); });
await page.close();
// 验证 beacon 请求被发出
expect(beaconRequests.length).toBeGreaterThan(0);
```

### E3-S4: VersionHistoryPanel 交互
```typescript
await page.getByRole('button', { name: /版本历史/i }).click();
expect(panel.isVisible()).toBe(true);
expect(versionItems).toHaveLength(2);
// 切换版本
await versionItems[1].click();
expect(canvas.textContent).toContain(versionItems[1].dataset.content);
```

### E4-S1: 审查未迁移逻辑
```typescript
const canvasStoreContent = readFile('src/stores/canvasStore.ts');
const businessLogicPatterns = ['setState', 'dispatch', 'action', 'reducer'];
businessLogicPatterns.forEach(pattern => {
  expect(canvasStoreContent).not.toContain(pattern);
});
```

### E4-S2: 逻辑迁移验证
```typescript
const splitStores = ['componentStore', 'sessionStore', 'elementStore', 'selectionStore', 'historyStore'];
splitStores.forEach(store => {
  const storeFile = readFile(`src/stores/${store}.ts`);
  // 每个 store 都有明确的职责
  expect(Object.keys(storeFile.exports).length).toBeGreaterThan(0);
});
```

### E4-S3: canvasStore 兼容层
```typescript
const canvasStoreLines = readFile('src/stores/canvasStore.ts').split('\n').length;
expect(canvasStoreLines).toBeLessThan(50);
expect(canvasStoreContent).not.toContain('setState');
expect(canvasStoreContent).not.toContain('action(');
expect(canvasStoreContent).toMatch(/export.*from/); // 仅为 re-export
```

### E4-S4: import path 更新
```typescript
const allTsxFiles = glob('src/**/*.{tsx,ts}');
allTsxFiles.forEach(file => {
  const content = readFile(file);
  expect(content).not.toMatch(/from ['"].*canvasStore['"]/);
});
// 新路径应为 split stores
expect(componentStoreImports.length).toBeGreaterThan(0);
```

---

## 5. Definition of Done (DoD)

### 5.1 Epic 级别 DoD

| Epic | DoD |
|------|-----|
| E1 | `tsc --noEmit` 零错误；ESLint 配置生效；PR CI 通过 |
| E2 | 乐观锁生效；409 场景可复现；ConflictDialog 两个选项均可工作 |
| E3 | ≥ 4 个 Playwright E2E 测试用例通过；CI 中 E2E 通过率 > 90% |
| E4 | canvasStore < 50 行；所有组件 import 更新；`madge --circular` 无循环依赖 |

### 5.2 Sprint 级别 DoD

- [ ] 所有 Epic DoD 完成
- [ ] `npm run build` 前后端均 0 error
- [ ] `npm run test` 通过率 > 95%
- [ ] 无循环依赖（`madge --circular`）
- [ ] 代码变更已 PR review 通过

---

## 6. Non-Functional Requirements

| # | 类别 | 要求 |
|---|------|------|
| NFR-1 | 性能 | auto-save debounce 不阻塞主线程；冲突检测 API 响应 < 200ms |
| NFR-2 | 可靠性 | beacon 失败时有同步 XHR fallback |
| NFR-3 | 可维护性 | 所有 Store 文件 < 300 行；无上帝文件 |
| NFR-4 | 测试覆盖 | E2E 测试覆盖率 > 80%（按用户关键路径） |
| NFR-5 | 兼容性 | ES2020+；Playwright 测试覆盖 Chromium + Mobile viewport |
| NFR-6 | CI/CD | 所有 Epic 完成后 CI pipeline 包含 TS 类型检查 + E2E 测试步骤 |

---

## 7. Implementation Constraints

| # | 约束 |
|---|------|
| IC-1 | **向后兼容**: canvasStore 退役期间必须保留兼容层，不得破坏现有功能 |
| IC-2 | **增量交付**: 每个 Epic 可独立部署，不得有大爆炸变更 |
| IC-3 | **分支策略**: 每个 Epic 单独 feature branch，完成后 merge to main |
| IC-4 | **测试先行**: E2 和 E3 的代码变更必须先有对应测试 |
| IC-5 | **回归保护**: E4 修改后必须运行完整测试套件，确保无回归 |
| IC-6 | **数据安全**: 版本冲突时不得自动删除任何数据，必须由用户决策 |
| IC-7 | **无锁依赖**: 禁止引入额外生产依赖，仅使用已有依赖栈 |
| IC-8 | **Playwright 稳定性**: 使用 `waitForResponse` 代替硬 sleep，防止 flaky |

---

## 8. Out of Scope

- 实时协作（WebSocket）不在本轮范围
- 大爆炸式 canvasStore 替换（1周冻结）不在本轮范围
- 全库 TS `any` 清理（Option B）作为独立 Epic 延后
- MSW 集成方案（B 选项）作为备选，不在主计划内

---

## 9. 执行顺序

```
Sprint 3.x (立即):
  └─ E1 → 1h，解除 CI 阻断

Sprint 3.y (本周):
  └─ E2 → 5h，canvas-json-persistence 收尾

Sprint 4:
  ├─ E3 → 4h，测试金字塔补全
  └─ E4 Phase1 → 4h，逐步退役 canvasStore
```

---

*本文档由 PM agent 基于 analyst 需求分析报告生成，vibex-dev-proposals-20260403_024652*
