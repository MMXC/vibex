# Pattern: API 版本漂移 (API Version Drift)

## 触发条件
- 后端 API 字段新增/删除/重命名
- 前端代码使用旧字段名
- 测试 mock 使用旧数据结构

## 典型症状
```
Expected: { theme: "dark" }
Received: { userPreferences: { theme: "dark" } }
```
或：
```
Property 'mode' does not exist on type 'ThemeState'
// 迁移后旧字段未更新
```

## 根因分析
1. **前后端契约不同步**：API 变更后前端和测试 mock 未同步更新
2. **版本兼容层缺失**：未做向后兼容处理
3. **测试覆盖不足**：只测 happy path，未覆盖字段变更

## 修复方案

### 1. 统一契约定义
```typescript
// api-contract.yaml
ThemeResponse:
  type: object
  properties:
    theme:
      type: string
      enum: [light, dark, system]
    userPreferences:
      $ref: '#/components/schemas/UserPreferences'
```

### 2. Schema 验证
```typescript
import { z } from 'zod';

const ThemeResponseSchema = z.object({
  theme: z.enum(['light', 'dark', 'system']),
  userPreferences: UserPreferencesSchema.optional(),
});

function parseThemeResponse(raw: unknown): ThemeResponse {
  return ThemeResponseSchema.parse(raw);
}
```

### 3. Mock 同步
```typescript
// 每次 API 变更后，同步更新：
// 1. api-contract.yaml
// 2. TypeScript types
// 3. Jest mocks (mockResolvedValue 数据结构)
// 4. Test fixtures
```

## 验收标准
- [ ] API contract 与实现一致
- [ ] Mock 数据结构与真实 API 一致
- [ ] Schema 验证覆盖所有外部数据

## 相关检查清单
- Contract-First Development
- Mock Data Accuracy
