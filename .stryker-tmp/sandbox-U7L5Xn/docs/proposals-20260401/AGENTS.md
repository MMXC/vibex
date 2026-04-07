# AGENTS.md — proposals-20260401 开发约束

**Agent**: Architect
**日期**: 2026-04-01
**版本**: v1.0

---

## 一、代码规范（所有 Agent 强制遵守）

### 1.1 TypeScript 规范

- **strict 模式**: 所有新代码必须 `strict: true`
- **类型推断**: 优先使用类型推断，避免不必要的 `: any`
- **interface vs type**: 使用 `interface` 定义对象结构，`type` 用于联合/交叉类型
- **禁止**: `// @ts-ignore`、``as any`（除非在测试的 mock 场景）

```typescript
// ✅ 正确
interface FlowUpdate {
  flowId: string
  nodes: Node[]
  edges: Edge[]
}

// ❌ 错误
const x: any = something
```

### 1.2 提交信息规范

```
feat(E3): 修复 canvas 选区过滤逻辑
fix(E1): 解决 backend pretest TS 错误
test(E5): 添加 Playwright CI-blocking 测试
docs(E7): 更新 domain.md 章节版本化
refactor(E7): 拆分 API route 到 service 层
```

### 1.3 文件路径规范

- 自检报告路径: `proposals/YYYYMMDD/<agent>.md`
- 测试文件: `e2e/<type>-<name>.spec.ts`（E5-T1 规范）
- Service 文件: `src/services/<Name>Service.ts`
- Schema 文件: `lib/schemas/<name>.ts`
- Store 文件: `src/stores/<Name>Store.ts`

---

## 二、E7 架构演进专项约束

### 2.1 API Route 约束（E7-S3）

**规则**: 所有 API route 必须经由 Service 层，禁止直接调用 Prisma。

```typescript
// ❌ 禁止: API route 直接操作 DB
// src/app/api/projects/route.ts
export async function POST(req: Request) {
  const body = await req.json()
  const project = await prisma.project.create({ data: body })  // 禁止！
  return Response.json(project)
}

// ✅ 正确: API route 调用 Service
// src/app/api/projects/route.ts
import { ProjectService } from '@/services/ProjectService'

export async function POST(req: Request) {
  const body = await req.json()
  const project = await ProjectService.create(body)
  return Response.json(project)
}

// src/services/ProjectService.ts
export class ProjectService {
  static async create(data: CreateProjectDTO) {
    return prisma.project.create({ data })  // DB 操作在 Service 层
  }
}
```

**检查脚本**: CI 运行 `scripts/validate-api-no-db.ts`

### 2.2 React Flow 性能约束（E7-S1）

**规则**: 所有自定义 Node 组件必须使用 `React.memo` + `useCallback`。

```typescript
// ✅ 正确
const CustomNode = React.memo(({ data, selected }: CustomNodeProps) => {
  const handleClick = useCallback(() => {
    // ...
  }, [])

  return (
    <div onClick={handleClick} className={selected ? 'selected' : ''}>
      {data.label}
    </div>
  )
})

// ❌ 错误
function CustomNode({ data, selected }: CustomNodeProps) {
  const handleClick = () => { /* ... */ }
  return <div onClick={handleClick}>{data.label}</div>
}
```

### 2.3 canvasApi 响应校验约束（E7-S4）

**规则**: 所有 `/api/canvas/*` 响应必须经过 Zod schema 验证。

```typescript
// ✅ 正确
import { FlowUpdateSchema } from '@/lib/schemas/canvas'

async function handleFlowUpdate(data: unknown) {
  const result = FlowUpdateSchema.safeParse(data)
  if (!result.success) {
    throw new ValidationError('Invalid flow update response', result.error)
  }
  return result.data
}

// ❌ 错误
function handleFlowUpdate(data: unknown) {
  // 直接使用，无校验
  return data as FlowUpdate
}
```

---

## 三、E2 协作质量专项约束

### 3.1 越权编辑防护（E2-S1）

**规则**: 所有写操作必须通过 CollaborationService 校验文件锁。

```typescript
// 写操作 API 必须检查文件锁
export async function PUT(req: Request, { params }: { params: { id: string } }) {
  const lockToken = req.headers.get('X-File-Lock-Token')
  const hasLock = await CollaborationService.validateLock(params.id, lockToken)
  
  if (!hasLock) {
    throw new ApiError('LOCK_REQUIRED', 403)
  }
  
  // 继续处理...
}
```

### 3.2 自检报告路径校验（E2-S2）

**规则**: 所有 agent 自检报告必须写入 `proposals/YYYYMMDD/` 目录。

```python
# 路径正则校验
import re
VALID_PATH_PATTERN = re.compile(r'^proposals/\d{8}/[a-z-]+\.md$')

def validate_report_path(path: str) -> bool:
    return VALID_PATH_PATTERN.match(path) is not None
```

### 3.3 通知去重（E2-S3）

**规则**: 相同内容的消息在 30 分钟内不重复发送。

```typescript
// NotificationService 内部实现
async send(channel: string, content: string): Promise<void> {
  const hash = cryptoHash(content)
  const key = `notif:${channel}:${hash}`
  
  const exists = await KV.get(key)
  if (exists) return  // 去重，不发送
  
  await Slack.send(channel, content)
  await KV.set(key, Date.now(), { expirationTtl: 1800 })  // 30min TTL
}
```

---

## 四、E5 质量流程专项约束

### 4.1 Playwright E2E 规范（E5-T1）

**命名规范**: `<type>-<name>.spec.ts`
- `feature-<name>.spec.ts` - 功能测试
- `bug-<name>.spec.ts` - 回归测试
- `regression-<name>.spec.ts` - 已知 bug 修复验证

**必须**: 每个 spec 文件顶部注明 `@ci-blocking`（如需 CI 失败阻止合并）

```typescript
// @ci-blocking
// feature-canvas-selection.spec.ts
import { test, expect } from '@playwright/test'

test('@ci-blocking 用户选中卡片后 deselect，继续请求不包含已取消节点', async ({ page }) => {
  // ...
})
```

**最少用例**: 5 个 `@ci-blocking` 场景（E5 验收要求）

### 4.2 CI 覆盖率 Gate（E5-T2）

**规则**: `npm run test:coverage` 覆盖率 < 80% 时 CI 必须失败。

```yaml
# .github/workflows/ci.yml 新增 step
- name: Check Coverage
  run: |
    npm run test:coverage --workspace vibex-frontend -- --json > coverage.json
    node scripts/check-coverage.js coverage.json 80
    # 退出码非 0 → CI 失败
```

---

## 五、E3 Canvas 选区修复专项约束（E3-S1）

### 5.1 状态分离原则

**规则**: `selectedNodeIds` 和 `confirmed` 必须作为独立状态变量管理。

```typescript
// ✅ 正确: 分离状态
interface FlowState {
  selectedNodeIds: string[]   // 反映当前 UI 选中态
  confirmed: boolean           // 是否点击了"确认继续"按钮
  
  selectNode(id: string) {
    this.selectedNodeIds = [...this.selectedNodeIds, id]
    // 不修改 confirmed
  }
  
  deselectNode(id: string) {
    this.selectedNodeIds = this.selectedNodeIds.filter(n => n !== id)
    // 不修改 confirmed
  }
}

// ❌ 错误: 混合状态
deselectNode(id: string) {
  this.confirmed = false  // 禁止！
}
```

### 5.2 继续发送请求约束

**规则**: `continueFlow` 请求只使用 `selectedNodeIds`，不使用 `confirmed`。

```typescript
async continueFlow(): Promise<void> {
  const payload = {
    // ✅ 正确: 只用当前选中态
    nodeIds: this.selectedNodeIds,
    projectId: this.currentProjectId
  }
  
  // ❌ 错误: 混合 confirmed
  // nodeIds: this.confirmed ? this.selectedNodeIds : []  ← 禁止
}
```

---

## 六、测试要求汇总

| Epic | 覆盖率要求 | CI Blocking | 测试框架 |
|------|-----------|-------------|---------|
| E1 | 核心逻辑 100% | 否 | Jest |
| E2 | Service 层 100% | 否 | Jest |
| E3 | Store + E2E | 否 | Jest + Playwright |
| E4 | 新组件 80% | 否 | Jest |
| E5 | CI-blocking 5+ | ✅ | Playwright |
| E6 | 文档可验证性 | 否 | 手动 + gstack browse |
| E7 | Service + Schema 100% | 否 | Jest |

---

## 七、禁止事项

| # | 禁止行为 | 理由 | 例外 |
|---|---------|------|------|
| 1 | API route 直接操作 DB | 违反 Service 层拆分原则 | 无 |
| 2 | `// @ts-ignore` | TypeScript 类型安全 | 测试 mock 场景 |
| 3 | 硬编码时间戳 | 不可维护 | 用于 mock 测试 |
| 4 | `selectedNodeIds` 和 `confirmed` 混合 | E3 bug 根因 | 无 |
| 5 | 自检报告写入非 `proposals/YYYYMMDD/` 路径 | 协作规范 | 无 |
| 6 | CI-blocking 测试数量 < 5 | 验收标准 | 无 |
| 7 | coverage < 80% 通过 CI | 质量标准 | 无 |

---

## 八、验收清单

### Dev 完成 E1 后自检
- [ ] `npm run pretest --workspace vibex-backend` 通过
- [ ] `npm run pretest --workspace vibex-frontend` 通过
- [ ] 并发 task_manager 测试通过

### Dev 完成 E2 后自检
- [ ] 无锁调用 `update` 抛出 `LockRequired`
- [ ] 自检报告路径校验通过
- [ ] 重复通知 0 次

### Dev 完成 E3 后自检
- [ ] E2E 测试覆盖 `canvas-selection.spec.ts`
- [ ] deselect 后请求仅包含当前选中节点

### Dev 完成 E4 后自检
- [ ] 首次打开 30s 内触发引导
- [ ] Tooltip 延迟 < 200ms
- [ ] 快捷键栏可折叠

### Dev 完成 E7 后自检
- [ ] API route 无直接 Prisma 调用
- [ ] React Flow FPS ≥ 30（100 节点）
- [ ] Zod schema 验证测试通过

---

*约束版本: v1.0 | 生成时间: 2026-04-01*
