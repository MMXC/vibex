# PRD: canvasLogger 未定义导致构建失败

**项目**: vibex-canvaslogger-fix-20260407
**状态**: Draft
**PM**: PM
**日期**: 2026-04-07

---

## 1. 执行摘要

### 背景
Commit `b85f3ac7` 将全量 `console.*` 替换为 `canvasLogger.default.*`（102 个前端文件），但 `src/app/export/page.tsx` 遗漏了顶层 import，导致 `ReferenceError: canvasLogger is not defined`，构建失败。

### 目标
修复 export/page.tsx 中缺失的 canvasLogger import，消除构建错误，恢复导出功能。

### 成功指标
- 构建通过（`npm run build` 无 canvasLogger 相关错误）
- TypeScript 类型检查通过（`npx tsc --noEmit`）
- 导出功能异常路径回归正常（catch block 仍正确 alert）

---

## 2. Epic 拆分

### Epic 1: canvasLogger Import 修复

| Story ID | 描述 | 工时 | 验收标准 |
|----------|------|------|----------|
| S1.1 | 在 export/page.tsx 顶部添加 canvasLogger import | 0.05h | 见下方验收标准 |

---

## 3. 验收标准

### Story S1.1: canvasLogger Import 修复

| ID | Given | When | Then | 验证方式 |
|----|-------|------|------|----------|
| AC1.1 | export/page.tsx | grep "canvasLogger" 前10行 | 包含 `import { canvasLogger }` | `head -10 src/app/export/page.tsx \| grep canvasLogger` |
| AC1.2 | 修复后 | `npm run build` | 无 canvasLogger ReferenceError | 构建日志无 "canvasLogger is not defined" |
| AC1.3 | 修复后 | `npx tsc --noEmit` | 无新增 TS 错误 | tsc exit code = 0 |
| AC1.4 | 导出异常时 | catch block 触发 | alert('导出失败，请重试') 仍正常弹出 | 手动测试异常路径 |

**功能点表格：**

| ID | 功能点 | 描述 | 验收标准 | 页面集成 |
|----|--------|------|----------|----------|
| F1.1 | canvasLogger import 修复 | 在 export/page.tsx 顶部添加 import 语句 | expect(head(10).includes('import { canvasLogger }')) | 【需页面集成】export/page.tsx |

---

## 4. DoD (Definition of Done)

研发完成的判断标准：

- [ ] `import { canvasLogger } from '@/lib/canvas/canvasLogger';` 存在于 export/page.tsx 顶部（前 10 行）
- [ ] `npm run build` 通过，无 canvasLogger 相关错误
- [ ] `npx tsc --noEmit` 通过，exit code = 0
- [ ] 异常导出路径手动测试确认 alert 仍正常触发
- [ ] 提交 commit，message 包含 `fix(canvasLogger): add missing import in export/page.tsx`

---

## 5. 实施信息

| 项目 | 值 |
|------|-----|
| 影响文件 | `src/app/export/page.tsx` |
| 修改类型 | 添加 1 行 import |
| 预计工时 | 0.05h |
| 风险等级 | 无 |
| 回归测试 | 导出异常路径 |

---

## 6. 参考

- 根因 commit: `b85f3ac7`（全量 console→canvasLogger 重构）
- 同模式案例: `MEMORY.md` "功能已实现但未集成" 模式
- 相关文件: `src/lib/canvas/canvasLogger.ts`（已存在，路径正确）
