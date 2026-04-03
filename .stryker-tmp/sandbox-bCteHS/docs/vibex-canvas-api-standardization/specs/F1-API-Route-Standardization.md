# F1: API 路由标准化规格说明

**功能域**: 前端路由标准化  
**PRD ID**: F1  
**状态**: 待开发

---

## 1. 规格详情

### F1.1 api-config.ts 端点审查

**当前状态**: `src/lib/api-config.ts` 中 `endpoints.canvas` 已使用 `/v1/canvas/*` ✅

**规格要求**:
- 所有 Canvas 相关端点必须以 `/v1/canvas/` 开头
- 禁止出现 `/api/canvas/` (不含 v1)
- 端点配置格式:
  ```typescript
  endpoints: {
    canvas: {
      generateContexts: '/api/v1/canvas/generate-contexts',
      generateFlows: '/api/v1/canvas/generate-flows',
      generateComponents: '/api/v1/canvas/generate-components',
      generate: '/api/v1/canvas/generate',
      project: '/api/v1/canvas/project',
      status: '/api/v1/canvas/status',
      export: '/api/v1/canvas/export',
    }
  }
  ```

**验证命令**:
```bash
grep -E "canvas.*['\"]\/api\/(?!v1\/canvas)" src/lib/api-config.ts
# 期望结果: 无输出
```

---

### F1.2 canvasApi.ts 清理

**当前状态**: 需审查

**规格要求**:
- 所有 `fetch` 调用必须通过 `getApiUrl()` 获取基础路径
- 禁止硬编码完整 URL: `https://` 或 `http://`
- 禁止直接拼接非配置的路径
- 错误示例:
  ```typescript
  // ❌ 禁止
  fetch('https://example.com/api/v1/canvas/generate-contexts')
  // ✅ 正确
  fetch(`${getApiUrl()}/canvas/generate-contexts`)
  ```

**验证命令**:
```bash
grep -n "fetch.*['\"]https\?://" src/lib/canvas/api/canvasApi.ts
# 期望结果: 无输出
```

---

### F1.3 死代码清理

**规格要求**:
- `canvasApi.ts` 中不得存在任何调用 `/api/canvas/` (不含 v1) 的代码路径
- 包括注释中的示例 URL 也需清理

**验证命令**:
```bash
grep -n "\/api\/canvas" src/lib/canvas/api/canvasApi.ts | grep -v "/v1/canvas"
# 期望结果: 无输出
```

---

## 2. 相关文件

| 文件路径 | 操作 |
|----------|------|
| `src/lib/api-config.ts` | 审查 + 确认 |
| `src/lib/canvas/api/canvasApi.ts` | 审查 + 清理 |

---

## 3. 验收标准

| ID | 验收标准 | 验证方法 |
|----|----------|----------|
| AC-1 | `api-config.ts` 中所有 Canvas 端点均以 `/v1/canvas/` 开头 | 代码审查 |
| AC-2 | `canvasApi.ts` 中所有 `fetch` 调用均指向 `getApiUrl()` | grep 验证 |
| AC-3 | 全库无 `/api/canvas/`（不含 v1）引用 | `grep -r` 验证 |

---

## 4. 依赖

- 无外部依赖
- 依赖于 `api-config.ts` 中端点配置保持正确
