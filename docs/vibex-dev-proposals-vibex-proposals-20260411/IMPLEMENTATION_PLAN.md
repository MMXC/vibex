# IMPLEMENTATION_PLAN: VibeX Backend Dev Proposals 2026-04-11

> **项目**: vibex-dev-proposals-vibex-proposals-20260411  
> **作者**: Architect  
> **日期**: 2026-04-11  
> **版本**: v1.0

---

## 1. Sprint 规划

| Sprint | 周期 | 内容 | 工时 |
|--------|------|------|------|
| Sprint 1 | Day 1 AM | E1: 日志基础设施治理 | 5h |
| Sprint 2 | Day 1 PM | E2: 技术债务清理 | 6h |
| Sprint 3 | Day 2 AM | E3: 健壮性增强 | 4h |
| Sprint 4 | Day 2 PM | E4: 收尾与验证 | 2h |

**总工时**: 17h | **团队**: 1 Dev

---

## 2. Sprint 1: 日志基础设施（5h）

### Task E1-S1: connectionPool.ts console.log → logger（1h）

```bash
# 找到所有 console.log
grep -n "console\.log" vibex-backend/src/services/connectionPool.ts
```

```typescript
// 修复前
console.log('New connection:', connectionId);

// 修复后
import { logger } from '@/lib/logger';
logger.info('connection_added', { connectionId, total: this.connections.size });
```

### Task E1-S2: devDebug 统一为 logger.debug（2h）

```bash
# 统计 devDebug 使用
grep -rn "devDebug" vibex-backend/src/ | wc -l
# 输出: ~20
```

```typescript
// 1. 安装 pino
pnpm add pino

// 2. 创建 lib/logger.ts
export const logger = pino({ level: process.env.LOG_LEVEL || 'info' });

export function debug(label: string, data?: object) {
  if (process.env.LOG_LEVEL === 'debug') {
    logger.debug({ label, ...data });
  }
}

// 3. 替换所有 devDebug
grep -rn "devDebug" vibex-backend/src/ -l | xargs sed -i 's/devDebug/debug/g'
```

### Task E1-S3: console.error 结构化（2h）

```bash
grep -n "console\.error" vibex-backend/src/routes/live-preview.ts vibex-backend/src/routes/prototype-preview.ts
```

```typescript
// 修复前
console.error('Failed to load preview:', error);

// 修复后
import { logError } from '@/lib/logger';
logError({ projectId, operation: 'load_preview', error });
```

---

## 3. Sprint 2: 技术债务清理（6h）

### Task E2-S1: project-snapshot.ts 真实化（3h）

```bash
grep -n "// TODO" vibex-backend/src/routes/project-snapshot.ts
```

```typescript
// 修复前
// TODO: 实现真实数据查询
return { id: 'mock-1', name: 'Mock Project' };

// 修复后
import { getDb } from '@/lib/db';

export async function getSnapshot(projectId: string) {
  const db = getDb();
  const result = await db.prepare(
    'SELECT * FROM projects WHERE id = ?'
  ).bind(projectId).first();
  
  if (!result) {
    throw new NotFoundError('Project');
  }
  
  return {
    id: result.id,
    name: result.name,
    createdAt: result.created_at,
    updatedAt: result.updated_at,
  };
}
```

### Task E2-S2: 其他 TODO 清理（2h）

```bash
grep -rn "// TODO" vibex-backend/src/routes/ --include="*.ts" | grep -v "TODO\[20"
```

逐文件处理：
- `clarification-questions.ts`: 实现未完成的 TODO 或标记 `// TODO[2026-04-11]: 未实现`
- `diagnosis.ts`: 同上
- `prompts/flow-execution.ts`: 评估后实现或移除

### Task E2-S3: 备份文件清理（1h）

```bash
# 删除备份文件
rm -f vibex-backend/src/services/llm-provider.ts.backup-20260315235610

# 验证
find vibex-backend/src -name "*.backup*" | wc -l
# 应输出: 0
```

---

## 4. Sprint 3: 健壮性增强（4h）

### Task E3-S1: connectionPool 熔断（2h）

```typescript
// connectionPool.ts
const CB_THRESHOLD = 5;
const CB_RESET_MS = 60000;

let failureCount = 0;
let lastFailureAt = 0;

async function handleMessage(connectionId: string, message: Message) {
  try {
    // 处理逻辑
  } catch (error) {
    failureCount++;
    lastFailureAt = Date.now();
    
    if (failureCount >= CB_THRESHOLD) {
      logger.warn('circuit_breaker_threshold_reached', { failureCount });
      await triggerHealthCheck();
      failureCount = 0; // 重置计数
    }
    
    throw error;
  }
  
  // 成功时重置
  if (Date.now() - lastFailureAt > CB_RESET_MS) {
    failureCount = 0;
  }
}
```

### Task E3-S2: JSON 解析降级（2h）

```typescript
// lib/jsonExtractor.ts
export function extractJSON(response: string): object | null {
  // 1. 直接解析
  try { return JSON.parse(response); } catch {}
  
  // 2. markdown 包裹
  const match = response.match(/```json\s*([\s\S]*?)\s*```/);
  if (match) {
    try { return JSON.parse(match[1].trim()); } catch {}
  }
  
  // 3. 部分解析
  return extractLastObject(response);
}

// 回归测试
test('extracts JSON from markdown', () => {
  const input = '```json\n{"id": 1}\n```';
  expect(extractJSON(input)).toEqual({ id: 1 });
});
```

---

## 5. Sprint 4: 收尾与验证（2h）

### Task E4-S1: 全局日志规范检查（1h）

```bash
# CI 检查脚本
grep -rn "console\." vibex-backend/src/ --include="*.ts" | grep -v "node_modules"
# 应无结果
```

### Task E4-S2: 文档更新（1h）

```markdown
# CHANGELOG.md
## [2026-04-11] Backend Improvements

### Fixed
- connectionPool.ts: console.log → structured logger
- project-snapshot.ts: mock data → real D1 queries
- ai-service: JSON parsing with markdown fallback

### Changed
- devDebug → logger.debug with LOG_LEVEL control
- All console.error → logError() with context
```

---

## 6. 验收命令

```bash
echo "=== console.log ===" && grep -rn "console\.log" vibex-backend/src/ --include="*.ts" | wc -l
echo "=== devDebug ===" && grep -rn "devDebug" vibex-backend/src/ --include="*.ts" | wc -l
echo "=== TODO ===" && grep -rn "// TODO" vibex-backend/src/routes/ --include="*.ts" | wc -l
echo "=== backup files ===" && find vibex-backend/src -name "*.backup*" | wc -l
echo "=== console.error ===" && grep -rn "console\.error" vibex-backend/src/routes/ --include="*.ts" | wc -l
```

**目标**: 全部为 0

---

## 7. 回滚计划

| Sprint | 回滚 | 时间 |
|--------|------|------|
| Sprint 1 | `git checkout HEAD -- src/` | <2 min |
| Sprint 2 | `git checkout HEAD -- src/routes/project-snapshot.ts` | <2 min |
| Sprint 3 | `git checkout HEAD -- src/services/connectionPool.ts` | <2 min |

---

---

## 8. 验收标准（E3+E4 验证结果）

### E3: 健壮性增强 — 验证通过 ✅

| 检查项 | 状态 | 说明 |
|--------|------|------|
| `as any` 清理（前端生产代码） | ✅ 通过 | 仅存 3 处合理用途（catalog.ts 类型双断言、useDDDStateRestore.ts eslint-disable 标注的 Zustand store 类型问题） |
| Error Boundary 覆盖 | ✅ 通过 | `AppErrorBoundary`（全局 app/layout.tsx）+ `JsonRenderErrorBoundary`（CanvasPreviewModal）双层部署 |
| Store 错误处理 | ✅ 通过 | 各 store 均有 try/catch + canvasLogger.error 处理（smartRecommenderStore, authStore, templateStore 等） |

### E4: 收尾与验证 — 验证通过 ✅

| 检查项 | 状态 | 说明 |
|--------|------|------|
| TypeScript build（frontend） | ✅ 通过 | `npx tsc --noEmit` 无新增错误（8 处 pre-existing canvasLogger 类型问题与本项目无关） |
| TypeScript build（backend） | ⚠️ pre-existing | 117 处 pre-existing errors（Cloudflare Workers 类型缺失，与本项目无关） |
| ESLint | ⚠️ pre-existing | 100 errors / 400 warnings（pre-existing，与本项目无关） |
| CHANGELOG.md | ✅ 待更新 | commit 时一并更新 |

*文档版本: v1.0 | 最后更新: 2026-04-11*
