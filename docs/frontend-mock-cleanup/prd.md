# PRD — frontend-mock-cleanup

**Agent**: PM
**日期**: 2026-04-04 18:40
**仓库**: /root/.openclaw/vibex
**基于**: docs/frontend-mock-cleanup/analysis.md

---

## 执行摘要

### 背景
`scripts/cleanup-mocks.js` 检测到 9 处 mock/fallback 模式存在于生产代码中，分布在 4 个文件。其中 3 个文件（useProjectTree.ts、BoundedContextTree.tsx、ComponentTree.tsx）有真实 mock 遗留，1 个文件为检测脚本误报（test-utils/factories 中的 JSDoc 注释）。

### 目标
清除生产代码中的 mock 遗留（E1），修复检测脚本误报（E2），确保 CI 流程正确运行。

### 成功指标
| KPI | 当前 | 目标 |
|-----|------|------|
| mock 遗留数（生产代码） | 6 处 | 0 处 |
| cleanup-mocks.js 误报数 | 3 处（test-utils） | 0 处 |
| CI mock-check 通过率 | 0%（失败中） | 100% |

---

## Epic 总览

| Epic | 名称 | 工时 | 优先级 |
|------|------|------|--------|
| E1 | 生产代码 Mock 清理 | 3-4h | P0 |
| E2 | 检测脚本误报修复 | 0.5h | P1 |

---

## Epic 1: 生产代码 Mock 清理

### Stories

#### Story E1-S1: useProjectTree.ts — 移除 3 处 mock return
- **问题**: 三处 `return MOCK_DATA` 在生产代码中直接返回 mock 数据
- **工时**: 1.5h
- **验收标准**:
```typescript
// E1-S1.1: Error case — 不再返回 mock
// 修改前: if (query.isError && useMockOnError) return MOCK_DATA;
// 修改后: 移除此行，保留错误处理逻辑
// 验收: useProjectTree.ts 中无 MOCK_DATA return 语句
expect(sourceCode).not.toMatch(/return MOCK_DATA/);

// E1-S1.2: skip case — 改为空状态
// 修改前: if (skip) return MOCK_DATA;
// 修改后: 移除此行，调用方处理加载状态
// 验收: skip 分支不再 return mock 数据

// E1-S1.3: No project case — 改为空状态
// 修改前: if (!projectId) return MOCK_DATA;
// 修改后: 移除此行，返回 [] 或空状态
// 验收: 无 projectId 时返回空数组，不返回 MOCK_DATA
```

#### Story E1-S2: BoundedContextTree.tsx — 移除 mockGenerateContexts
- **问题**: L399 调用 `mockGenerateContexts('')` 直接生成 mock 数据
- **工时**: 1h
- **验收标准**:
```typescript
// E1-S2.1: 移除 mockGenerateContexts 调用
// 验收: BoundedContextTree.tsx 中不包含 mockGenerateContexts
expect(sourceCode).not.toMatch(/mockGenerateContexts/);

// E1-S2.2: 使用真实数据源
// 验收: 使用 useCanvasStore 或 API service 获取 bounded context 数据
expect(sourceCode).toMatch(/useCanvasStore|boundedContextTree/);

// E1-S2.3: 清理完成后 cleanup-mocks.js 无此文件报错
// 验收: node scripts/cleanup-mocks.js 输出中无 BoundedContextTree.tsx
```

#### Story E1-S3: ComponentTree.tsx — 移除 mockGenerateComponents
- **问题**: L683 调用 `mockGenerateComponents(flowNodes.length)` 生成 mock 数据
- **工时**: 1h
- **验收标准**:
```typescript
// E1-S3.1: 移除 mockGenerateComponents 调用
expect(sourceCode).not.toMatch(/mockGenerateComponents/);

// E1-S3.2: 使用真实数据源
expect(sourceCode).toMatch(/useCanvasStore|componentTree/);

// E1-S3.3: cleanup-mocks.js 无此文件报错
```

### 功能点汇总

| ID | 功能点 | 描述 | 验收标准 | 页面集成 |
|----|--------|------|----------|----------|
| E1-F1 | useProjectTree mock清理 | 移除3处MOCK_DATA return | expect(no MOCK_DATA in source) | 【需页面集成】 |
| E1-F2 | BoundedContextTree mock清理 | 移除mockGenerateContexts | expect(no mockGenerateContexts) | 【需页面集成】 |
| E1-F3 | ComponentTree mock清理 | 移除mockGenerateComponents | expect(no mockGenerateComponents) | 【需页面集成】 |

### DoD
- [ ] `useProjectTree.ts` 中 3 处 `return MOCK_DATA` 已移除或替换
- [ ] `BoundedContextTree.tsx` 中 `mockGenerateContexts` 调用已替换为真实数据源
- [ ] `ComponentTree.tsx` 中 `mockGenerateComponents` 调用已替换为真实数据源
- [ ] `node scripts/cleanup-mocks.js` 对 `src/` 目录下 3 个文件无报错
- [ ] Canvas 页面正常渲染（数据来源真实 API 或 store，无硬编码 mock）
- [ ] Playwright E2E 测试覆盖 Canvas 三树渲染流程

---

## Epic 2: 检测脚本误报修复

### Stories

#### Story E2-S1: cleanup-mocks.js — 跳过 test-utils 目录
- **问题**: `src/test-utils/factories/index.ts` 中的 JSDoc 注释包含 `mock` 关键词被误报
- **工时**: 0.5h
- **验收标准**:
```bash
# E2-S1.1: test-utils 目录被跳过
# 修改 cleanup-mocks.js 的 SKIP_PATTERNS
# 修复后运行脚本，test-utils 文件应不出现在输出中
node scripts/cleanup-mocks.js
# 期望: 无 test-utils/factories 相关报错

# E2-S1.2: 其他真实问题仍被检测
# 修复 E1 后，cleanup-mocks.js 应输出 0 issues
# 退出码为 0
```

### 功能点汇总

| ID | 功能点 | 描述 | 验收标准 | 页面集成 |
|----|--------|------|----------|----------|
| E2-F1 | test-utils跳过 | cleanup-mocks.js跳过test-utils目录 | expect(test-utils not in output) | 无 |

### DoD
- [ ] `cleanup-mocks.js` 的 `SKIP_PATTERNS` 包含 `/test-utils/` 目录
- [ ] 运行 `node scripts/cleanup-mocks.js` 输出中无 `test-utils` 相关误报
- [ ] `src/` 下其他 mock 模式仍正常检测

---

## 验收标准汇总

| 功能ID | 验收断言 | 测试方式 |
|--------|----------|----------|
| E1-F1 | `expect(source).not.toMatch(/return MOCK_DATA/)` | 静态检查 |
| E1-F2 | `expect(source).not.toMatch(/mockGenerateContexts/)` | 静态检查 |
| E1-F3 | `expect(source).not.toMatch(/mockGenerateComponents/)` | 静态检查 |
| E2-F1 | `expect(output).not.toContain('test-utils')` | 脚本执行 |

### 最终验证
```bash
# CI 验证（GitHub Actions mock-cleanup workflow 应通过）
node scripts/cleanup-mocks.js
# 期望: ✅ No mock/fallback patterns found in production code!
# 期望: exit 0
```

---

## 非功能需求

| 类型 | 要求 |
|------|------|
| 兼容性 | cleanup-mocks.js 兼容 Node.js 20 |
| 性能 | 扫描时间 < 5s |
| CI 集成 | GitHub Actions workflow 通过 |

---

**PRD 状态**: ✅ 完成
**下一步**: Dev 实现
