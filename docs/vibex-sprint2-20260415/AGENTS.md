# AGENTS.md — VibeX Sprint 2 实施规范

**项目**: vibex-sprint2-20260415
**日期**: 2026-04-16
**Agent**: architect

---

## 开发约束

> **驳回红线**（符合任一条 → 驳回重做）
> - 架构设计不可行 → 驳回重新设计
> - 接口定义不完整 → 驳回补充
> - 缺少 IMPLEMENTATION_PLAN.md 或 AGENTS.md → 驳回补充
> - 未执行 Technical Design 阶段 → 驳回补充
> - 未执行 /plan-eng-review 技术审查 → 驳回补充

### 强制验证
- 必须使用 gstack 技能（/browse /qa /qa-only /canary）验证问题真实性与修复效果
- 兼容现有架构（Next.js App Router, Zustand, Hono）
- 接口文档完整（TypeScript 类型）
- 评估性能影响（E3/E4 需量化）
- 技术方案可执行
- E4 D1 migration 必须先在 staging 验证

---

## Tech Stack

- **Frontend**: Next.js 14, TypeScript, React 18, Zustand 4
- **Backend**: Hono (Cloudflare Workers), D1 (SQLite)
- **Diff**: json-diff ^1.0.0
- **YAML**: js-yaml ^4.1.0
- **Testing**: Vitest + Playwright
- **工作目录**: `/root/.openclaw/vibex`

---

## Dev Agent 任务清单

### E1: Tab State 修复

#### E1-U1: Tab State 修复

**入口命令**: 
```bash
cd /root/.openclaw/vibex/vibex-fronted
pnpm vitest run src/components/canvas/__tests__/CanvasPage.test.tsx
```

**文件变更**:
- `vibex-fronted/src/components/canvas/CanvasPage.tsx` — Line 216-218

**代码示例**:
```typescript
// CanvasPage.tsx Line 216-218（修改后）
useEffect(() => {
  resetPanelState();
  setPhase('input'); // ← 新增：Tab 切换时重置 phase
}, [activeTab, resetPanelState, setPhase]);
```

**提交信息**: `feat(E1): reset phase on tab switch`

**PR 检查清单**:
- [ ] Tab 切换后 phase === 'input'
- [ ] Vitest 测试通过
- [ ] 不影响其他 tab 行为

---

### E2: 版本历史集成

#### E2-U1: 版本历史 API 集成

**入口命令**:
```bash
curl "https://api.vibex.top/v1/canvas/snapshots?projectId=test-project"
```

**文件变更**:
- `vibex-fronted/src/services/api/modules/prototype.ts` — 确认/修正类型

**PR 检查清单**:
- [ ] API 响应类型与 useVersionHistory 返回类型一致
- [ ] TypeScript 编译通过（无类型错误）

#### E2-U2: 版本列表 UI

**入口命令**:
```bash
cd vibex-fronted && pnpm dev
# 访问 /canvas，检查版本历史按钮
```

**文件变更**:
- New: `vibex-fronted/src/components/canvas/VersionHistoryDialog.tsx`
- Modified: `vibex-fronted/src/components/canvas/CanvasPage.tsx`

**代码示例**:
```typescript
// VersionHistoryDialog.tsx
export function VersionHistoryDialog({ projectId }: { projectId: string }) {
  const { snapshots, loading } = useVersionHistory(projectId);
  return (
    <Dialog>
      {snapshots.map(s => (
        <SnapshotItem key={s.snapshotId} snapshot={s} />
      ))}
    </Dialog>
  );
}
```

**PR 检查清单**:
- [ ] 版本列表正确显示
- [ ] Playwright E2E 通过

#### E2-U3: Diff 查看 + 版本恢复

**入口命令**:
```bash
cd vibex-fronted && pnpm add json-diff
```

**文件变更**:
- `vibex-fronted/package.json` — 添加 `"json-diff": "^1.0.0"`
- `vibex-fronted/src/components/canvas/VersionHistoryDialog.tsx` — diff + restore

**PR 检查清单**:
- [ ] json-diff 正确渲染差异
- [ ] 恢复版本后 Zustand 三树更新
- [ ] Vitest + Playwright 通过

---

### E3: 导入导出

#### E3-U1: JSON 导出

**入口命令**:
```bash
cd vibex-fronted && pnpm vitest run src/services/export/__tests__/
```

**文件变更**:
- New: `vibex-fronted/src/services/export/ExportService.ts`
- New: `vibex-fronted/src/services/export/__tests__/ExportService.test.ts`
- Modified: `vibex-fronted/src/components/canvas/ExportPanel.tsx`

**代码示例**:
```typescript
// ExportService.ts
export async function exportAsJSON(projectName: string): Promise<Blob> {
  const { contextNodes, flowNodes, componentNodes } = useCanvasStore.getState();
  const payload: ProjectExport = {
    version: '1.0.0',
    exportedAt: new Date().toISOString(),
    projectName,
    data: { contexts: contextNodes, flows: flowNodes, components: componentNodes },
    metadata: { appVersion: '2.x', format: 'json', nodeCount: { contexts: contextNodes.length, flows: flowNodes.length, components: componentNodes.length } },
  };
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
  if (!validateFileSize(blob)) throw new Error('超过 5MB 限制');
  return blob;
}

export function validateFileSize(blob: Blob): boolean {
  return blob.size <= 5 * 1024 * 1024;
}
```

**PR 检查清单**:
- [ ] 导出 JSON 包含完整数据
- [ ] 5MB 限制生效
- [ ] Vitest 通过

#### E3-U2: YAML 导出

**入口命令**:
```bash
cd vibex-fronted && pnpm add js-yaml
```

**文件变更**:
- `vibex-fronted/package.json` — 添加 `"js-yaml": "^4.1.0"`
- `vibex-fronted/src/services/export/ExportService.ts` — 添加 exportAsYAML

**代码示例**:
```typescript
import yaml from 'js-yaml';

export async function exportAsYAML(projectName: string): Promise<Blob> {
  const { contextNodes, flowNodes, componentNodes } = useCanvasStore.getState();
  const payload = { version: '1.0.0', exportedAt: new Date().toISOString(), projectName, data: { contexts: contextNodes, flows: flowNodes, components: componentNodes } };
  const yamlStr = yaml.dump(payload);
  return new Blob([yamlStr], { type: 'text/yaml' });
}
```

**PR 检查清单**:
- [ ] YAML 可被 js-yaml 正确解析
- [ ] Vitest round-trip 测试通过

#### E3-U3: Round-trip 验证

**文件变更**:
- New: `vibex-fronted/src/services/import/ImportService.ts`
- New: `vibex-fronted/src/services/import/__tests__/ImportService.test.ts`
- New: `vibex-fronted/src/components/canvas/ImportPanel.tsx`

**代码示例**:
```typescript
// ImportService.ts
export function parseJSON(content: string): ProjectExport {
  const data = JSON.parse(content);
  if (!validateSchema(data)) throw new Error('无效的导入文件格式');
  return data;
}

export function roundTripTest(exportData: ProjectExport): boolean {
  const jsonStr = JSON.stringify(exportData);
  const parsed = JSON.parse(jsonStr);
  return JSON.stringify(parsed) === JSON.stringify(exportData);
}
```

**PR 检查清单**:
- [ ] JSON round-trip 无损
- [ ] YAML round-trip 无损（忽略空白）
- [ ] 导入格式错误有明确提示

---

### E4: 三树数据持久化

#### E4-U1: D1 Migration 验证

**入口命令**:
```bash
cat vibex-backend/drizzle/migrations/0006_*.sql | grep "data"
wrangler d1 execute vibex-db --local --file=drizzle/migrations/0006_*.sql
```

**文件变更**: （确认性检查，无需修改代码）

**PR 检查清单**:
- [ ] D1 schema 检查通过
- [ ] data 字段类型为 TEXT，可存储 JSON

#### E4-U2: 三树数据序列化

**入口命令**:
```bash
cd vibex-fronted && pnpm vitest run src/lib/canvas/__tests__/serialize.test.ts
```

**文件变更**:
- New: `vibex-fronted/src/lib/canvas/serialize.ts`
- New: `vibex-fronted/src/lib/canvas/__tests__/serialize.test.ts`
- Modified: `vibex-fronted/src/hooks/canvas/useAutoSave.ts`

**代码示例**:
```typescript
// serialize.ts
export function serializeThreeTrees(
  contexts: BoundedContextNode[],
  flows: BusinessFlowNode[],
  components: ComponentNode[]
): CanvasSnapshotData {
  return {
    version: 1,
    contextNodes: contexts,
    flowNodes: flows,
    componentNodes: components,
    savedAt: new Date().toISOString(),
  };
}

export function deserializeThreeTrees(jsonStr: string): CanvasSnapshotData {
  const data = JSON.parse(jsonStr);
  if (data.version !== 1) throw new Error('不支持的数据版本');
  return data;
}
```

**PR 检查清单**:
- [ ] 序列化输出格式正确
- [ ] 反序列化恢复三树
- [ ] Vitest > 85% 覆盖率

#### E4-U3: 三树数据恢复

**入口命令**:
```bash
cd vibex-fronted && pnpm playwright test tests/e2e/canvas-restore.spec.ts
```

**文件变更**:
- New: `vibex-fronted/src/hooks/canvas/useProjectLoader.ts`
- Modified: `vibex-fronted/src/hooks/canvas/useAutoSave.ts`

**代码示例**:
```typescript
// useProjectLoader.ts
export function useProjectLoader(projectId: string) {
  useEffect(() => {
    if (!projectId) return;
    loadProject(projectId);
  }, [projectId]);
}

async function loadProject(projectId: string) {
  const response = await fetch(`/api/v1/canvas/snapshots?projectId=${projectId}&limit=1`);
  const { snapshots } = await response.json();
  if (snapshots.length === 0) return;
  const latest = snapshots[0];
  const data = deserializeThreeTrees(latest.data);
  useCanvasStore.getState().setContextNodes(data.contextNodes);
  useCanvasStore.getState().setFlowNodes(data.flowNodes);
  useCanvasStore.getState().setComponentNodes(data.componentNodes);
}
```

**PR 检查清单**:
- [ ] 无 snapshot 时空画布不报错
- [ ] 有 snapshot 时正确恢复
- [ ] Playwright E2E 通过

#### E4-U4: Dashboard 集成验证

**入口命令**:
```bash
cd vibex-fronted && pnpm playwright test tests/e2e/dashboard-canvas-persistence.spec.ts
```

**文件变更**: （E2E 验证，无代码修改）

**PR 检查清单**:
- [ ] Dashboard → Canvas 三树完整恢复
- [ ] Dashboard 不显示三树数据（隐私）

---

## 提交顺序

1. `E1-U1` → Tab State 修复
2. `E2-U1` → 版本历史 API 集成
3. `E2-U2` → 版本列表 UI
4. `E2-U3` → Diff + 恢复
5. `E3-U1` → JSON 导出
6. `E3-U2` → YAML 导出
7. `E3-U3` → Round-trip 验证
8. `E4-U1` → D1 Migration 验证
9. `E4-U2` → 三树序列化
10. `E4-U3` → 三树恢复
11. `E4-U4` → Dashboard 集成验证

---

## 性能基准

| 操作 | 基准 | 验收 |
|------|------|------|
| Tab 切换 + phase 重置 | < 5ms | Vitest 验证 |
| JSON 导出 500KB | < 500ms | Vitest 计时 |
| 三树序列化 500KB | < 20ms | Vitest 计时 |
| D1 写入 500KB | < 50ms | Staging 实测 |
| 列表加载 20 条 | < 1s | Playwright 计时 |
