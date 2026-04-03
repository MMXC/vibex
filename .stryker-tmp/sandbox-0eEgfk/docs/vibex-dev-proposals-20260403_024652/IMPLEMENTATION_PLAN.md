# VibeX Dev 提案评审与扩展 — 实施计划

**项目**: vibex-dev-proposals-20260403_024652
**版本**: v1.0
**日期**: 2026-04-03

---

## 执行决策

- **决策**: 已采纳
- **执行项目**: vibex-dev-proposals-20260403_024652
- **执行日期**: 2026-04-03

---

## 1. Sprint 规划总览

| Sprint | Epics | 总工时 | 目标 |
|--------|-------|--------|------|
| Sprint 3.x (立即) | E1 TypeScript | 1h | 解除 CI 阻断 |
| Sprint 3.y (本周) | E2 Sync Protocol | 5h | 乐观锁 + ConflictDialog |
| Sprint 4 | E3 Playwright E2E | 4h | 测试金字塔补全 |
| Sprint 4-5 | E4 canvasStore 退役 | 8h | 兼容层 < 50 行 |

**总工时**: 18h

---

## 2. Sprint 3.x: E1 TypeScript 严格模式收尾 (1h)

### E1-S1: 修复 StepClarification 重复定义 (0.5h)

```
T1.1.1: 定位重复定义
  命令: npx tsc --noEmit 2>&1 | grep StepComponentProps
  文件: vibex-fronted/src/components/dialogue/StepClarification.tsx
  问题: 两个 StepComponentProps 接口定义

T1.1.2: 合并重复定义
  操作: 保留一个 StepComponentProps，删除重复的
  验证: npx tsc --noEmit 无 StepComponentProps 错误

T1.1.3: 全局 TS 错误扫描
  命令: npx tsc --noEmit 2>&1 | grep -c error
  目标: 0 个错误
```

**验收标准**:
- `expect(tscOutput.errors).toHaveLength(0)`
- `expect(tscOutput.errors.filter(e => e.includes('StepComponentProps'))).toHaveLength(0)`

---

### E1-S2: 添加 ESLint 防复发规则 (0.5h)

```
T1.2.1: 安装 eslint-plugin-import
  命令: npm install --save-dev eslint-plugin-import
  验证: 在 .eslintrc 中引入

T1.2.2: 配置 no-duplicate-imports 规则
  文件: .eslintrc.js
  规则:
    'import/no-duplicates': ['error', { 'useInline': true }]

T1.2.3: CI 中 gate ESLint
  文件: .github/workflows/typescript.yml (或 lint.yml)
  新增 step:
    - name: ESLint
      run: npm run lint
```

**验收标准**:
- `expect(eslintConfig.rules['import/no-duplicates']).toBeDefined()`
- `expect(eslintOutput.errorCount).toBe(0)`

---

## 3. Sprint 3.y: E2 Sync Protocol (5h)

### E2-S1: 后端 Snapshot API version 乐观锁 (1.5h)

```
T2.1.1: D1 snapshots 表新增 version 字段
  SQL: ALTER TABLE snapshots ADD COLUMN version INTEGER NOT NULL DEFAULT 1;
  验证: SELECT version FROM snapshots LIMIT 1

T2.1.2: 修改 POST /api/snapshots
  文件: routes/snapshots.ts
  逻辑:
    1. 如果 payload.force === true → 直接保存，version++
    2. 如果 payload.version === 当前 version → 保存成功，version++
    3. 如果 payload.version < 当前 version → 返回 409 { serverVersion, clientVersion }

  验证:
    - version 匹配 → 200
    - version 过时 → 409 { serverVersion, clientVersion }
```

**验收标准**:
- `expect(postResponse.status).toBe(200)` when version matches
- `expect(obsoleteResponse.status).toBe(409)` when version is stale
- `expect(obsoleteResponse.body.code).toBe('VERSION_CONFLICT')`

---

### E2-S2: useAutoSave 携带 version 字段 (1.5h)

```
T2.2.1: 修改 useAutoSave hook
  文件: hooks/canvas/useAutoSave.ts
  变更:
    1. 每次保存请求携带当前 canvas 的 version
    2. 保存成功后更新本地 version = response.version
    3. 收到 409 时触发 onConflict(serverVersion, clientVersion)

T2.2.2: 添加 version 状态到 canvasStore
  文件: stores/contextStore.ts (或 canvasStore)
  字段: currentVersion: number (default 1)

T2.2.3: 单元测试
  文件: hooks/canvas/__tests__/useAutoSave.test.ts
  场景:
    1. 保存成功 → version 更新
    2. 收到 409 → onConflict 被调用
    3. force=true → 强制保存
```

**验收标准**:
- `expect(savePayload).toHaveProperty('version')`
- `expect(typeof savePayload.version).toBe('number')`

---

### E2-S3: ConflictDialog 冲突解决 UI (2h)

```
T2.3.1: 创建 ConflictDialog 组件
  文件: components/canvas/conflict/ConflictDialog.tsx
  组件props:
    - serverData: CanvasData
    - clientData: CanvasData
    - onResolveLocal: () => void
    - onResolveServer: () => void
    - onDiscard: () => void

  UI 布局:
    - 标题: "版本冲突"
    - 说明: "检测到其他用户的修改"
    - 两个按钮: "保留本地" | "使用服务端"
    - 底部: "放弃本地修改" 文字链接

T2.3.2: 集成到 CanvasPage
  文件: CanvasPage.tsx
  逻辑: onConflict(serverVersion, clientVersion) → 显示 ConflictDialog

T2.3.3: Playwright E2E
  文件: tests/e2e/canvas-conflict.spec.ts
  场景: 模拟 409 响应 → 验证 ConflictDialog 出现和交互
```

**验收标准**:
- `expect(conflictDialog.isVisible()).toBe(true)` on 409
- `expect(dialog.getByText('版本冲突')).toBeTruthy()`
- `expect(dialog.getByRole('button', { name: /保留本地/i })).toBeTruthy()`
- `expect(dialog.getByRole('button', { name: /使用服务端/i })).toBeTruthy()`
- `expect(conflictDialog.isVisible()).toBe(false)` after choice

---

## 4. Sprint 4: E3 Playwright E2E 覆盖率提升 (4h)

### E3-S1: Playwright fixture 搭建 (1h)

```
T3.1.1: 完善 Playwright 配置
  文件: playwright.config.ts
  新增:
    projects: [
      { name: 'chromium', use: { ... } },
      { name: 'mobile', use: { ... }, configurations: { ... } }
    ]

T3.1.2: 创建 canvas fixture
  文件: tests/e2e/fixtures/canvas.ts
  内容: 登录 → 进入 /canvas → 加载示例项目

T3.1.3: 创建 auto-save mock server
  文件: tests/e2e/mocks/autoSaveMock.ts
  内容: 拦截 /api/snapshots，返回不同 version 响应
```

**验收标准**:
- `expect(playwrightConfig.projects).toHaveLength(2)`
- `expect(Object.keys(playwrightConfig.projects[1].use.devices)).toContain('iPhone 12')`

---

### E3-S2: auto-save 完整流程 E2E (1h)

```
T3.2.1: 编写 auto-save E2E
  文件: tests/e2e/canvas-autosave.spec.ts
  场景:
    1. 进入 canvas
    2. 编辑节点内容
    3. 等待 debounce 2s
    4. 验证 SaveIndicator 显示"已保存"
    5. 再次编辑，验证"保存中"状态

T3.2.2: 验证 beacon 触发
  文件: tests/e2e/canvas-autosave.spec.ts
  场景:
    1. 编辑数据
    2. 触发 beforeunload (page.close())
    3. 验证 sendBeacon 请求被发出
```

**验收标准**:
- `expect(saveIndicator.textContent).toContain('已保存')` after 2s
- `expect(beaconRequests.length).toBeGreaterThan(0)` on page close

---

### E3-S3: Beacon 触发场景测试 (1h)

```
T3.3.1: 完善 beacon 测试
  使用 nock mock GitHub/Slack，避免真实网络请求
  验证: beacon 请求 URL 包含 /api/snapshots
```

---

### E3-S4: VersionHistoryPanel 交互测试 (1h)

```
T3.4.1: 编写 VersionHistoryPanel E2E
  文件: tests/e2e/canvas-version-history.spec.ts
  场景:
    1. 点击"版本历史"按钮
    2. 验证面板打开
    3. 验证版本列表 >= 2 个
    4. 点击旧版本
    5. 验证 canvas 内容切换到旧版本
```

**验收标准**:
- `expect(panel.isVisible()).toBe(true)`
- `expect(versionItems).toHaveLength(2)`
- `expect(canvas.textContent).toContain(selectedVersionContent)`

---

## 5. Sprint 4-5: E4 canvasStore 退役清理 (8h)

### E4-S1: 审查未迁移逻辑 (2h)

```
T4.1.1: 全量审查 canvasStore.ts
  命令: npx madge --circular src/lib/canvas/canvasStore.ts
  目标: 识别剩余未迁移的逻辑

T4.1.2: 分类剩余逻辑
  类型:
    - setState/action 调用 → 迁移到子 store
    - 直接业务逻辑 → 迁移到对应子 store
    - 仅为 re-export → 保留在兼容层

T4.1.3: 制定迁移计划
  输出: migration-plan.md
  内容: 每个未迁移逻辑的来源 → 目标 store
```

**验收标准**:
- `expect(unmigratedLogicCount).toBe(0)` (所有业务逻辑已分配)

---

### E4-S2: 迁移剩余逻辑 (3h)

```
T4.2.1: 逐个迁移到子 store
  原则:
    - context 树相关 → contextStore
    - flow 树相关 → flowStore
    - component 树相关 → componentStore
    - UI 状态相关 → uiStore
    - SSE/messages → sessionStore

T4.2.2: 更新 consumers
  grep 所有引用 canvasStore 的文件
  改为直接引用对应子 store

T4.2.3: 回归测试
  npm run test
  npx playwright test
```

**验收标准**:
- `expect(allLogicInSplitStores).toBe(true)`
- `expect(tscOutput.errors).toHaveLength(0)`

---

### E4-S3: canvasStore 降级为兼容层 (2h)

```
T4.3.1: 重写 canvasStore.ts
  文件: src/lib/canvas/canvasStore.ts
  目标: < 50 行，仅包含 re-export

  内容:
    // 兼容层：转发到 split stores
    export { useContextStore } from './stores/contextStore';
    export { useFlowStore } from './stores/flowStore';
    export { useComponentStore } from './stores/componentStore';
    export { useUIStore } from './stores/uiStore';
    export { useSessionStore } from './stores/sessionStore';

T4.3.2: 验证行数
  命令: wc -l src/lib/canvas/canvasStore.ts
  目标: < 50 行
```

**验收标准**:
- `expect(canvasStoreLines).toBeLessThan(50)`
- `expect(canvasStoreContent).not.toContain('setState')`
- `expect(canvasStoreContent).not.toContain('action(')`

---

### E4-S4: 更新所有组件 import path (1h)

```
T4.4.1: 搜索所有旧 import
  grep: from ['"].*canvasStore['"]
  文件列表: 所有仍引用 @/lib/canvas/canvasStore 的文件

T4.4.2: 更新 import path
  替换规则:
    @/lib/canvas/canvasStore → @/lib/canvas/stores/[name]Store
    useCanvasStore → use[Name]Store

T4.4.3: 循环依赖检查
  命令: npx madge --circular src/lib/canvas/stores/
  目标: 0 个循环依赖
```

**验收标准**:
- `expect(canvasStoreImportCount).toBe(0)` across all components
- `expect(madgeCircularCount).toBe(0)`

---

## 6. 测试策略

### 6.1 测试覆盖矩阵

| Epic | Story | 单元测试 | E2E | 回归要求 |
|------|-------|---------|-----|---------|
| E1 | S1 | TS 编译 | — | `tsc --noEmit` 通过 |
| E1 | S2 | ESLint | — | `npm run lint` 通过 |
| E2 | S1 | Snapshot API | — | API route test |
| E2 | S2 | useAutoSave hook | — | hook unit test |
| E2 | S3 | — | ConflictDialog | canvas-conflict.spec.ts |
| E3 | S1 | — | fixture | — |
| E3 | S2 | — | auto-save | canvas-autosave.spec.ts |
| E3 | S3 | — | beacon | canvas-autosave.spec.ts |
| E3 | S4 | — | version history | canvas-version-history.spec.ts |
| E4 | S1 | migration plan | — | — |
| E4 | S2 | split stores | — | store unit tests |
| E4 | S3 | — | — | — |
| E4 | S4 | import grep | — | 无编译错误 |

### 6.2 CI 集成

```
# typescript.yml (新增 ESLint step)
- name: ESLint
  run: npm run lint

# playwright.yml (已配置 stability report)
- name: E2E Tests
  run: npx playwright test
```

---

## 7. 风险与缓解

| 风险 | 概率 | 影响 | 缓解 |
|------|------|------|------|
| E4 迁移 break 现有功能 | 中 | 高 | 每个子 store 迁移后立即运行 E2E；canvasStore 保留兼容层 |
| ConflictDialog 覆盖真实 bug | 中 | 中 | 用户选择强制保存前确认 |
| beacon 测试 flaky | 中 | 低 | `waitForResponse` 替代 sleep |
| Madge 检测到循环依赖 | 低 | 高 | 迁移前先做循环依赖分析 |
