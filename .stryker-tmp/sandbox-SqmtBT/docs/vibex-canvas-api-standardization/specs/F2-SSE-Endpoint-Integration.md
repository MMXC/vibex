# F2: SSE 端点整合规格说明

**功能域**: SSE 流式端点统一管理  
**PRD ID**: F2  
**状态**: 待开发

---

## 1. 规格详情

### F2.1 dddApi.ts 迁移

**当前状态**: `src/lib/api/dddApi.ts` 存在，调用 `/api/v1/analyze/stream`

**规格要求**:
- 将 `src/lib/api/dddApi.ts` 迁移至 `src/lib/canvas/api/canvasSseApi.ts`
- 文件重命名语义清晰：`canvasSseApi.ts` 表示 Canvas 模块的 SSE API
- 迁移时保持原有函数签名不变

**迁移步骤**:
1. 复制 `dddApi.ts` → `src/lib/canvas/api/canvasSseApi.ts`
2. 更新文件内 import 路径（相对路径需调整）
3. 验证新文件可正常导入

**验证命令**:
```bash
test -f src/lib/canvas/api/canvasSseApi.ts
echo $?  # 期望: 0
```

---

### F2.2 导出路径更新

**规格要求**:
- 所有原引用 `src/lib/api/dddApi.ts` 的文件必须更新为 `src/lib/canvas/api/canvasSseApi.ts`
- 更新范围包括: `import ... from '@/lib/api/dddApi'` → `import ... from '@/lib/canvas/api/canvasSseApi'`

**验证命令**:
```bash
grep -rn "dddApi" --include="*.ts" --include="*.tsx" src/
# 期望结果: 无 `dddApi.ts` 路径引用
```

---

### F2.3 SSE 命名空间统一

**规格要求**:
- `canvasSseApi.ts` 导出函数以 `canvasSse` 为命名前缀
- 例如: `streamAnalyze` → `canvasSseStreamAnalyze`
- 确保函数名不与其他模块冲突

**示例导出格式**:
```typescript
// canvasSseApi.ts
export async function canvasSseStreamAnalyze(params: StreamParams): Promise<void> {
  // 实现...
}
```

**验证命令**:
```bash
grep -E "^export (async )?function (?!canvasSse)" src/lib/canvas/api/canvasSseApi.ts
# 期望结果: 无输出
```

---

## 2. 相关文件

| 文件路径 | 操作 |
|----------|------|
| `src/lib/api/dddApi.ts` | 迁移源（可删除或标记废弃） |
| `src/lib/canvas/api/canvasSseApi.ts` | 迁移目标（新建） |
| 所有引用 `dddApi.ts` 的文件 | 更新 import 路径 |

---

## 3. 验收标准

| ID | 验收标准 | 验证方法 |
|----|----------|----------|
| AC-SSE-1 | `canvasSseApi.ts` 文件存在 | `test -f` |
| AC-SSE-2 | 所有 `dddApi.ts` 引用已更新 | `grep` 无残留 |
| AC-SSE-3 | SSE 函数以 `canvasSse` 为前缀 | 代码审查 |

---

## 4. 依赖

- `dddApi.ts` 原有依赖不变
- SSE 流式端点 `/api/v1/analyze/stream` 保持可用
