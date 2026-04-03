# TypeScript 类型安全改进报告

**项目**: vibex-p1-impl-20260314
**任务**: impl-typescript-safety
**日期**: 2026-03-14

---

## 1. 当前类型安全现状

### 1.1 TypeScript 编译状态
- ✅ TypeScript 编译通过，无错误
- ⚠️ 存在 47 处 `any` 类型使用
- ⚠️ 部分组件缺少完整的 Props 类型定义

### 1.2 类型安全问题清单

| 类别 | 数量 | 严重程度 | 位置 |
|------|------|----------|------|
| `any` 类型使用 | 47 | 中 | 多个文件 |
| 缺少组件 Props 类型 | 12 | 低 | preview/page.tsx 等 |
| API 响应类型不完整 | 5 | 高 | services/api/ |
| catch 块 error 类型 | 4 | 中 | hooks/ |

---

## 2. 已识别的类型改进点

### 2.1 高优先级 (P0)

**API 响应类型统一**
```typescript
// 目标：创建统一的 API 响应类型
// services/api/types/base.ts (新建)
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: ApiError;
  timestamp?: string;
}

export interface ApiError {
  code: string;
  message: string;
  details?: Record<string, unknown>;
}
```

**Hook 参数类型**
```typescript
// hooks/useDDDStream.ts 当前
generateDomainModels: (requirementText: string, boundedContexts?: any[]) => void

// 改进后
generateDomainModels: (requirementText: string, boundedContexts?: BoundedContext[]) => void
```

### 2.2 中优先级 (P1)

**组件 Props 类型补全**
- preview/page.tsx: `boundedContexts`, `domainModels`, `businessFlow.states`
- MermaidPreview.tsx: `mermaidInstance`

**Error 类型定义**
```typescript
// lib/errors/types.ts (新建)
export class ApiError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode?: number,
    public details?: Record<string, unknown>
  ) {
    super(message);
    this.name = 'ApiError';
  }
}
```

### 2.3 低优先级 (P2)

**测试文件类型改进**
- 使用具体的 Mock 类型替代 `any`
- 添加 Test fixtures 类型定义

---

## 3. 验证命令

```bash
# 类型检查
cd /root/.openclaw/vibex/vibex-fronted
npx tsc --noEmit

# 严格模式检查
npx tsc --noEmit --strict

# 统计 any 类型使用
grep -rn ": any" src/ --include="*.ts" --include="*.tsx" | wc -l
```

---

## 4. 实施计划

### Phase 1: 核心类型定义 (第 1-2 天)
- [ ] 创建 `services/api/types/base.ts`
- [ ] 统一 API 响应类型
- [ ] 导出所有基础类型

### Phase 2: Hook 类型改进 (第 3-4 天)
- [ ] 修复 `useDDDStream.ts` 中的 `any` 类型
- [ ] 添加 `BoundedContext[]`, `DomainModel[]` 类型
- [ ] 改进 Error 处理类型

### Phase 3: 组件类型补全 (第 5-6 天)
- [ ] 为 `preview/page.tsx` 添加完整类型
- [ ] 为 `MermaidPreview.tsx` 添加类型
- [ ] 验证编译通过

---

## 5. 预期收益

| 指标 | 当前 | 目标 | 提升 |
|------|------|------|------|
| `any` 类型使用 | 47 | < 10 | -79% |
| 类型覆盖率 | ~60% | > 85% | +25% |
| 运行时类型错误 | - | 减少 50% | - |

---

## 6. 产出物

- `services/api/types/base.ts` - 统一 API 类型定义
- `lib/errors/types.ts` - Error 类型定义
- 类型改进后的源文件列表
