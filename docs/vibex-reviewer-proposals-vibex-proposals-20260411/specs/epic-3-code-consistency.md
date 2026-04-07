# SPEC — Epic 3: Code Consistency

**Epic ID**: EP-003  
**Epic 名称**: 代码一致性提升（Code Consistency）  
**所属项目**: vibex-proposals-20260411  
**优先级**: P2  
**工时**: 4h  
**依赖 Epic**: Epic 1（类型安全基础完成后进行）

---

## 1. Overview

消除代码库中的重复模式和冗余配置，提升代码可维护性和开发者认知效率。

---

## 2. 文件修复清单

### S3.1 — 合并 API unwrap 模块

**现状**:
- `src/services/api/unwrappers.ts` — 声称统一处理
- `src/lib/api-unwrap.ts` — 并行实现

**修复策略**:

1. **选择主模块**: 以 `src/services/api/unwrappers.ts` 为主模块（更合理的目录结构）
2. **功能合并**: 将 `api-unwrap.ts` 中的独特逻辑合并到 `unwrappers.ts`
3. **渐进迁移**: 
   - 在 `api-unwrap.ts` 中添加 deprecated 注释和 re-export
   - 逐步将调用方迁移到 `unwrappers.ts`
4. **最终删除**: 所有迁移完成后，删除 `api-unwrap.ts`

```typescript
// src/lib/api-unwrap.ts（合并后）
/**
 * @deprecated Use src/services/api/unwrappers.ts instead.
 * This file will be removed after migration. See VIBEX-XXXX.
 */
export { unwrapApiResponse, unwrapData } from '../services/api/unwrappers';
```

**验收**:
- `find . -name 'api-unwrap.ts' -o -name 'unwrappers.ts' | grep -v node_modules | wc -l` → 1
- 所有 API 调用通过 `src/services/api/unwrappers.ts` 发起
- E2E 回归测试通过率 100%

---

### S3.2 — 清理 eslint-disable 注释

**现状**:
| 文件 | 行号 | 原因 |
|------|------|------|
| `src/stores/ddd/init.ts` | 51, 53 | react-hooks/rules-of-hooks |
| `src/components/canvas/edges/RelationshipConnector.tsx` | 53 | react-hooks/refs（需 DOM 查询）|
| `src/test-utils/component-test-utils.tsx` | 73 | @typescript-eslint/ban-ts-comment |
| `src/components/chat/SearchFilter.tsx` | 120 | @typescript-eslint/no-unused-vars |

**修复策略**:

1. **逐文件评估**:
   - `init.ts` 的 hooks 规则禁用 → 评估是否真的违反规则，如是则修复逻辑而非抑制
   - `RelationshipConnector.tsx` → DOM 查询场景合理，保留但添加说明
   - `component-test-utils.tsx` → 优先移除 ts-ignore，改为正确类型
   - `SearchFilter.tsx` → 修复未使用变量

2. **保留标准**: 无法消除且合理的禁用，添加以下格式注释：
   ```typescript
   // eslint-disable-next-line @typescript-eslint/no-unused-vars
   // Reason: 原因说明 + Ticket 引用（如有）
   ```

**验收**:
- `grep -rn "eslint-disable" src --include='*.ts' --include='*.tsx' | wc -l` ≤ 3（合理保留）
- 保留项均包含说明注释

---

### S3.3 — TODO 评估

**现状**（需评估的 TODO）:
| 文件 | 内容 | 评估标准 |
|------|------|---------|
| `src/app/projects/new/page.tsx:58` | 模板数据填充 | 如果已实现 → 删除 TODO；否则保留 |
| `src/app/project-settings/page.tsx:86,179,209,225,244` | 后端 API 替换占位 | 如果已实现 → 删除 TODO；否则关联 ticket |
| `src/stores/projectTemplateStore.ts:107` | API 调用替换 | 同上 |
| `src/stores/deliveryStore.ts:250` | 实际 API 调用 | 同上 |
| `src/components/delivery/ComponentTab.tsx:85` | 添加 interface members | 同上 |

**修复策略**:
1. 遍历所有 TODO 行，逐条判断是否仍有效
2. 有效的 TODO → 添加 ticket 引用（格式: `// TODO [VIBEX-XXXX]: 描述`）
3. 过期的 TODO → 直接删除该行注释
4. 由人工审查（Reviewer team）确认决策

**验收**:
- `grep -rn "TODO" src --include='*.ts' --include='*.tsx'` 所有结果包含 ticket 引用或无 TODO

---

## 3. 验收标准

| Story | 验收条件 |
|-------|---------|
| S3.1 | 仅存在一个 unwrap 模块入口，所有调用方统一引用 |
| S3.1 | E2E 回归测试通过率 100% |
| S3.2 | eslint-disable 行数 ≤ 3，保留项均有说明注释 |
| S3.3 | 所有 TODO 均包含 VIBEX-XXXX ticket 引用 |
| 整体 | 代码库无重复实现、无过期注释 |
