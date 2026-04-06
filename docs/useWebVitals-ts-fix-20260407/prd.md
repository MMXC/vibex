# PRD: useWebVitals.ts TypeScript 类型错误修复

**项目**: useWebVitals-ts-fix-20260407
**状态**: Draft
**PM**: PM
**日期**: 2026-04-07

---

## 1. 执行摘要

### 背景
`src/hooks/useWebVitals.ts` 有 6 处 TypeScript 编译错误，集中在 monkey-patch `canvasLogger.default.debug` 时类型推断错误。构建失败，阻塞发布。根因是：`canvasLogger.default.debug` 被重写后 TypeScript 丢失原有类型，`args` 被推断为 `unknown[]`，解构后 `data` 被收窄为 `{}`。

### 目标
修复 useWebVitals.ts 的 6 处 TypeScript 类型错误，恢复构建通过。

### 成功指标
- `npx tsc --noEmit` 无 Web Vitals 相关错误
- `pnpm run build` 成功，exit code = 0
- Web Vitals 采集、回调、阈值告警功能不受影响

---

## 2. Epic 拆分

### Epic 1: useWebVitals TypeScript 类型修复

| Story ID | 描述 | 工时 | 验收标准 |
|----------|------|------|----------|
| S1.1 | 修复 useWebVitals.ts monkey-patch 类型错误 | 0.1h | 见下方验收标准 |

---

## 3. 功能点

| ID | 功能点 | 描述 | 根因关联 | 工时 |
|----|--------|------|----------|------|
| F1.1 | 提取 originalDebug 引用 | monkey-patch 前保存 `canvasLogger.default.debug.bind()` 引用 | 避免类型丢失 | 0.02h |
| F1.2 | 添加函数参数类型标注 | 显式标注 `(...args: unknown[])` | unknown[] 收窄为 {} | 0.02h |
| F1.3 | 添加 data 类型断言 | `args[1] as { name?: string; value?: number }` | data.name 不存在 | 0.02h |
| F1.4 | 添加 onReport 类型断言 | `onReport(data as WebVitalsMetric)` | '{}' not assignable to WebVitalsMetric | 0.02h |
| F1.5 | 修复 cleanup 还原逻辑 | `canvasLogger.default.debug = originalDebug` | 移除 originalConsoleLog | 0.02h |

---

## 4. 验收标准

### Story S1.1: TypeScript 类型错误修复

| ID | Given | When | Then | 验证方式 |
|----|-------|------|------|----------|
| AC1.1 | 修复后 | `npx tsc --noEmit` | 无 TS2339/TS2345 错误 | `tsc 2>&1 \| grep useWebVitals` 无输出 |
| AC1.2 | 修复后 | `pnpm run build` | 构建成功，exit code = 0 | build 日志无 error |
| AC1.3 | 修复后 | grep 源码 | 存在 `originalDebug` 变量 | `grep "originalDebug" useWebVitals.ts` |
| AC1.4 | 修复后 | grep 源码 | 存在 `as WebVitalsMetric` 断言 | `grep "as WebVitalsMetric" useWebVitals.ts` |
| AC1.5 | Web Vitals 触发 | 回调函数传入 | onReport(metric) 正常调用 | 手动测试 |
| AC1.6 | 阈值超限 | LCP/CLS 等指标超标 | canvasLogger.warn 正常输出 | 手动测试 |

**功能点验收汇总：**

| ID | 功能点 | 验收标准 | 页面集成 |
|----|--------|----------|----------|
| F1.1 | 提取 originalDebug 引用 | expect(grep includes 'originalDebug') | 【需页面集成】useWebVitals.ts |
| F1.2 | 添加函数参数类型标注 | expect(tsc --noEmit 无 unknown[] 错误) | 【需页面集成】useWebVitals.ts |
| F1.3 | 添加 data 类型断言 | expect(tsc --noEmit 无 data.name/value 错误) | 【需页面集成】useWebVitals.ts |
| F1.4 | 添加 onReport 类型断言 | expect(tsc --noEmit 无 WebVitalsMetric 错误) | 【需页面集成】useWebVitals.ts |
| F1.5 | 修复 cleanup 还原逻辑 | expect(cleanup 后 debug 恢复正常) | 【需页面集成】useWebVitals.ts |

---

## 5. DoD (Definition of Done)

- [ ] `const originalDebug = canvasLogger.default.debug.bind(canvasLogger.default);` 存在
- [ ] `canvasLogger.default.debug = (...args: unknown[]) => {` 类型标注已添加
- [ ] `const data = args[1] as { name?: string; value?: number };` 断言已添加
- [ ] `onReport(data as WebVitalsMetric);` 断言已添加
- [ ] cleanup 中 `canvasLogger.default.debug = originalDebug;` 正确还原
- [ ] `npx tsc --noEmit` 通过，exit code = 0
- [ ] `pnpm run build` 成功，exit code = 0
- [ ] Web Vitals hook 功能正常（采集 + 回调 + 阈值告警）
- [ ] 提交 commit，message 包含 `fix(useWebVitals): resolve TypeScript type inference errors in monkey-patch`

---

## 6. 实施信息

| 项目 | 值 |
|------|-----|
| 影响文件 | `src/hooks/useWebVitals.ts` |
| 修改类型 | 类型标注 + 类型断言（~5行） |
| 预计工时 | 0.1h |
| 风险等级 | 无 |
| 回归测试 | Web Vitals 回调 + 阈值告警 + cleanup |

---

## 7. 相关任务

- 前置: vibex-canvaslogger-fix-20260407（canvasLogger import 已修复，04d2ebc2）
- 本任务: useWebVitals.ts 类型修复（当前阻塞构建）
