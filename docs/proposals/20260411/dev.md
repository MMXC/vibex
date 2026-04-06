# Dev 每日提案 — 2026-04-11

> **Date**: 2026-04-11
> **Author**: Dev Agent
> **Working Directory**: /root/.openclaw/vibex

---

## D-P0-1: canvasLogger 未定义导致构建失败

**Summary**: `export/page.tsx` 使用了 `canvasLogger.default.error()` 但未导入 import 语句，导致运行时 `ReferenceError`。

**Problem**: Commit `b85f3ac7` 在重构 console.* → canvasLogger 时遗漏了顶层 import。文件第 265 行调用 `canvasLogger.default.error()` 但文件中没有 `import { canvasLogger } from '@/lib/canvas/canvasLogger';`。

**Solution**: 在 `vibex-fronted/src/app/export/page.tsx` 文件顶部添加 import 语句。

**Impact**:
| Dimension | Impact |
|-----------|--------|
| User Experience | 导出功能完全不可用 |
| Performance | N/A |
| Security | N/A |
| Maintainability | 影响 Vite/Next.js 构建流程 |

**Effort**: 0.5h  
**Files**: `vibex-fronted/src/app/export/page.tsx`

---

## D-P1-1: flow-execution 引擎多处 TODO 待实现

**Summary**: 业务流程执行引擎的核心功能（周期检测、节点执行、决策逻辑）仍为占位代码，无法实际执行业务流程。

**Problem**: `vibex-backend/src/lib/flow-execution/engine.ts` 和 `code-generator/index.ts` 中多处 `// TODO: Implement` 标记：
- 周期检测未实现 (line 160)
- 节点执行未实现 (lines 65, 97, 126, 161, 197)
- 决策逻辑未实现

这导致限界上下文 → 业务流程 → UI生成 的完整链路无法闭环。

**Solution**: 实现 flow-execution 引擎的核心逻辑：
1. 实现节点执行器 (NodeExecutor)
2. 实现周期检测 (CycleDetector)
3. 实现决策节点逻辑

**Impact**:
| Dimension | Impact |
|-----------|--------|
| User Experience | 业务流程功能不可用 |
| Performance | N/A |
| Security | 需防止无限循环 |
| Maintainability | 核心业务逻辑缺失 |

**Effort**: 8h  
**Files**: `vibex-backend/src/lib/flow-execution/engine.ts`, `code-generator/index.ts`

---

## D-P1-2: diagnosis.ts 缓存检测未实现

**Summary**: 诊断模块的缓存状态始终返回 `cached: false`，无法利用缓存加速重复诊断请求。

**Problem**: `vibex-backend/src/routes/diagnosis.ts` line 56 硬编码 `cached: false`，注释 `// TODO: Add actual cache detection`。

**Solution**: 实现基于请求参数的缓存键生成和缓存检测逻辑。

**Impact**:
| Dimension | Impact |
|-----------|--------|
| User Experience | 重复诊断请求无加速 |
| Performance | 每次请求都调用 AI，增加延迟和成本 |
| Security | N/A |
| Maintainability | 缺失缓存层 |

**Effort**: 2h  
**Files**: `vibex-backend/src/routes/diagnosis.ts`

---

## D-P2-1: project-settings 页面多处后端 API 调用待实现

**Summary**: 项目设置页面的多个 API 调用仍为 TODO 状态，使用模拟数据。

**Problem**: `vibex-fronted/src/app/project-settings/page.tsx` 中多处 TODO：
- Line 88: 后端 API 支持后替换为真实 API
- Line 181, 211, 227, 246: 同上

类似问题也存在于 `useHomeGeneration.ts` (line 229, 246, 268) 和 `deliveryStore.ts` (line 250)。

**Solution**: 
1. 确保后端 project-settings API 端点可用
2. 前端 store 替换 TODO 为实际 API 调用
3. 添加 loading/error 状态处理

**Impact**:
| Dimension | Impact |
|-----------|--------|
| User Experience | 每次重新加载丢失编辑内容 |
| Performance | N/A |
| Security | 需确保 API 认证 |
| Maintainability | Mock 代码难以维护 |

**Effort**: 4h  
**Files**: `vibex-fronted/src/app/project-settings/page.tsx`, stores, hooks

---

## D-P2-2: auth.ts 角色权限检查未实现

**Summary**: JWT payload 缺少 role 字段，后端无法基于角��进行权限控制。

**Problem**: `vibex-backend/src/lib/auth.ts` line 227 注释 `// TODO: Add role field to JWTPayload and check user role`。

**Solution**: 
1. 在 JWT token 生成时添加 role 字段
2. 在 middleware 中检查用户角色
3. 支持 Admin/Editor/Viewer 角色

**Impact**:
| Dimension | Impact |
|-----------|--------|
| User Experience | 无法区分用户权限 |
| Performance | N/A |
| Security | 权限控制缺失 |
| Maintainability | 安全基线不完整 |

**Effort**: 3h  
**Files**: `vibex-backend/src/lib/auth.ts`, middleware

---

## D-P3-1: 注册表单密码强度验证

**Summary**: 用户注册表单缺少密码强度验证功能。

**Problem**: `vibex-fronted/tests/e2e/auth/register.spec.ts` line 59 注释 `TODO: 注册表单尚未实现密码强度验证功能，暂跳过`。

**Solution**: 实现密码强度检测组件，支持最小长度、大小写、数字、特殊字符检测。

**Impact**:
| Dimension | Impact |
|-----------|--------|
| User Experience | 用户可能设置弱密码 |
| Performance | N/A |
| Security | 用户账户安全风险 |
| Maintainability | 功能缺失 |

**Effort**: 2h  
**Files**: `vibex-fronted/src/components/auth/*.tsx`

---

## D-P3-2: PreviewArea 组件卡片集成

**Summary**: PreviewArea 预览组件中的领域模型、业务流程卡片仍为 TODO 状态。

**Problem**: `vibex-fronted/src/components/homepage/PreviewArea/PreviewArea.tsx` lines 33, 35 注释 `// TODO: integrate with CardTree`。

**Solution**: 将 CardTree 状态与 PreviewArea 组件集成，实现数据流绑定。

**Impact**:
| Dimension | Impact |
|-----------|--------|
| User Experience | 预览功能不完整 |
| Performance | N/A |
| Security | N/A |
| Maintainability | 功能未完成 |

**Effort**: 3h  
**Files**: `vibex-fronted/src/components/homepage/PreviewArea/*.tsx`

---

## 扫描发现总结

| Priority | Count | Key Issues |
|----------|-------|-----------|
| P0 | 1 | canvasLogger 构建失败 |
| P1 | 2 | flow-execution 引擎, 缓存检测 |
| P2 | 2 | project-settings API, 角色权限 |
| P3 | 2 | 密码强度, PreviewArea 集成 |

**总预计工时**: ~22.5h

---

## 验证状态

- [x] git log --oneline -20 已检查
- [x] TODO/FIXME 注释已扫描
- [x] 后端 package.json 已有
- [x] 近期 fix 项目已查看

---

*Generated: 2026-04-11 02:15 GMT+8*