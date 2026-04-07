# Spec: Epic 2 — 技术债务清理

**Epic**: E2  
**Project**: vibex-dev-proposals-vibex-proposals-20260411  
**Date**: 2026-04-11

---

## 1. Overview

清理散布于关键路由中的 TODO 标记和遗留文件，使代码状态清晰，消除假数据接口，恢复核心功能的正确性。

---

## 2. Stories

### E2-S1: project-snapshot.ts 快照接口真实化

**文件**: `src/routes/project-snapshot.ts`  
**优先级**: P0（影响核心功能正确性）

**现状**（5个 TODO，全部返回硬编码假数据）:
```ts
// :47 — TODO: query real data from DB
const snapshot = { id: 'mock-id', name: 'Mock Project', ... };

// :60, 63, 66, 69 — TODO: 各项字段均返回假数据
```

**修改方案**:

1. **确认 D1 schema**: 先查询 D1 数据库表结构，确认 `projects`/`snapshots` 表字段
2. **替换为真实查询**:
```ts
import { createDb } from '@/lib/db';

const db = createDb(env);

const snapshot = await db.prepare(`
  SELECT s.*, p.name as project_name, p.updated_at
  FROM snapshots s
  JOIN projects p ON s.project_id = p.id
  WHERE s.project_id = ?
`).bind(projectId).first();

if (!snapshot) {
  return c.json({ error: 'Snapshot not found' }, 404);
}

return c.json({ ...snapshot });
```

3. **不确定字段时**: 加 `// TODO[YYYY-MM-DD]: verify schema` 标注，不留裸 TODO

**验收**:
```ts
// Given: D1 有 project id='test-123'
// When: GET /api/project-snapshot?projectId=test-123
// Then: 返回数据与 DB 一致，非硬编码
const dbRow = await db.prepare('SELECT * FROM snapshots WHERE project_id = ?').bind('test-123').first();
expect(snapshot).toMatchObject({
  id: dbRow.id,
  project_name: dbRow.project_name,
});
```

---

### E2-S2: 其他路由 TODO 清理

| 文件 | 行号 | 内容 | 处理方式 |
|------|------|------|---------|
| `routes/clarification-questions.ts` | 53 | indexed lookup 实现 | 实现索引查询或标注 `// TODO[YYYY-MM-DD]: 实现索引查询` |
| `routes/diagnosis.ts` | 54 | 缓存检测 | 实现缓存检测逻辑 |
| `routes/business-domain.ts` | 308,398,437 | D1 不可用时跳过 DB（已有 console.log） | `console.log` → `logger.warn` |
| `services/prompts/flow-execution.ts` | 792 | 流程执行未实现 | 实现或标注 `// TODO[YYYY-MM-DD]: 实现流程执行` |

**处理原则**:
- 能实现的直接实现（低风险）
- 无法实现的加 `// TODO[YYYY-MM-DD]: <reason>` 格式标注，注明负责人和原因
- 禁止裸 `// TODO:` 遗留

---

### E2-S3: 遗留备份文件清理

**文件**: `src/services/llm-provider.ts.backup-20260315235610`

**操作**: 删除该文件
```bash
rm src/services/llm-provider.ts.backup-20260315235610
```

**注意**: 备份应通过 git tag 或专用备份工具管理，不应在源码目录留存

**验收**:
- `llm-provider.ts.backup-*` 文件数为 0
- git status 无意外删除（仅删除目标文件）

---

## 3. Technical Notes

- **D1 Schema 确认**: 在修改 `project-snapshot.ts` 前，先在 D1 console 中执行 `.schema` 确认表结构
- **向后兼容**: 如果 D1 查询失败，降级到 404 而非返回假数据
- **TODO 标注格式**: `// TODO[YYYY-MM-DD]: <描述> — @<owner>`，如 `// TODO[2026-04-11]: verify D1 schema — @dev`

---

## 4. Dependencies

- D1 Database schema — 需确认 `projects` 和 `snapshots` 表结构
- 测试框架 — 需为 snapshot API 添加集成测试
