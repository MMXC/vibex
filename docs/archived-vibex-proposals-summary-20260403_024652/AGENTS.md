# VibeX Sprint 4 开发约束

**项目**: vibex-proposals-summary-20260403_024652
**版本**: v1.0
**日期**: 2026-04-03
**状态**: Architect 设计完成

---

## 执行决策
- **决策**: 已采纳
- **执行项目**: 待 coord 创建 Sprint 4 项目并绑定
- **执行日期**: 2026-04-03

---

## 1. 角色约束

### 1.1 Dev Agent

**E4 Sync 开发约束**:
- [ ] 不修改现有 `auto-save` 逻辑（debounce/beacon 保持原样）
- [ ] `POST /api/canvas/sync` 版本号使用 D1 transaction 原子递增
- [ ] ConflictDialog 优先级：保留本地 > 使用服务端 > 手动合并
- [ ] `checksum` 相同时应直接返回 `no_change`（避免重复存储）

**canvasStore Facade 约束**:
- [ ] 迁移前先运行 `grep -r "canvasStore" src/` 统计所有引用点
- [ ] 每个 split store 必须有对应的 `.test.ts` 单元测试
- [ ] canvasStore.ts 最终仅含 re-export，禁止有任何状态定义
- [ ] 迁移分 3 阶段：Phase1 < 800行，Phase2 < 500行，Phase3 < 300行

**API 规范**:
- [ ] 所有新 API 响应遵循 `api/error-codes` 定义的错误码规范
- [ ] POST 请求必须有 request body 类型定义（TypeScript interface）
- [ ] 所有 API 端点必须附带 Jest Contract 测试

### 1.2 Tester Agent

**E2E 测试约束**:
- [ ] Playwright 配置: `retries=2, workers=1`（消除 flaky）
- [ ] 每个 Epic 的 DoD 对应 E2E 用例必须实现
- [ ] auto-save E2E 覆盖 beacon、debounce、conflict 三场景
- [ ] Flaky 测试结果需记录到 `reports/flaky-tests.md`

**Contract 测试约束**:
- [ ] 核心 API（sync、share、quality、feedback）必须有 100% 覆盖
- [ ] 每次新增 API 必须同步添加 Contract 测试
- [ ] API schema 使用 TypeScript interface 定义，禁止 `any`

### 1.3 Reviewer Agent

**CHANGELOG 规范**:
- [ ] 每次 PR 必须更新 `CHANGELOG.md`（根目录）
- [ ] 格式：`### [Epic名称] — YYYY-MM-DD` + `#### Added/Fixed/Changed`
- [ ] `#### Changed` 用于 E3 UX 增强类修改
- [ ] Reviewer 负责检查 CHANGELOG 格式，格式错误 = 驳回

**驳回格式（强制）**:
```
❌ 审查驳回: <问题描述>
📍 文件: <文件路径>:<行号>
🔧 修复命令: <具体命令>
📋 参考: AGENTS.md §<章节>
⏰ 请在 24h 内修复并重新提交
```

### 1.4 Coord Agent

**进度跟踪**:
- [ ] 每个 Epic 完成后更新 `SPRINT_STATUS.md`
- [ ] E2E 通过率 < 90% 时立即报警到 #coord
- [ ] 每日 10:00 发送 Sprint 进度报告

---

## 2. 代码规范

### 2.1 TypeScript 规范

```typescript
// ✅ 正确：所有 API 响应定义类型
interface SyncSuccessResponse {
  status: 200;
  snapshot: CanvasSnapshot;
  message: 'saved' | 'no_change';
}

// ❌ 错误：使用 any
interface BadResponse {
  data: any;  // 禁止
}
```

```typescript
// ✅ 正确：版本冲突明确返回类型
interface SyncConflictResponse {
  status: 409;
  error: 'VERSION_CONFLICT';
  serverSnapshot: CanvasSnapshot;
  conflictNodes: ConflictNode[];
}

// ❌ 错误：409 响应体无类型定义
```

### 2.2 React 组件规范

```tsx
// ✅ 正确：ConflictDialog Props 定义
interface ConflictDialogProps {
  serverSnapshot: CanvasSnapshot;
  localData: CanvasData;
  onKeepLocal: () => void;
  onUseServer: () => void;
  onMerge: () => void;
}

// ❌ 错误：无类型 Props
const ConflictDialog = (props) => { ... }
```

```tsx
// ✅ 正确：Share 页面模式锁定
const SharePage: React.FC = () => {
  const canvasMode = 'readonly'; // 禁止编辑
  // ...
};

// ❌ 错误：Share 页面保留编辑能力
```

### 2.3 测试命名规范

```typescript
// ✅ 正确：描述行为而非实现
describe('E4 Sync Protocol', () => {
  it('版本冲突时返回 409 + serverSnapshot', async () => { ... });
  it('checksum 相同时返回 no_change 不重复存储', async () => { ... });
});

// ❌ 错误：描述实现细节
it('调用 D1 transaction', async () => { ... });
```

```typescript
// ✅ 正确：E2E 测试描述用户场景
it('ConflictDialog 显示 3 个选项，用户可保留本地版本', async () => {
  await page.goto('/canvas/proj-1');
  await triggerVersionConflict();
  await expect(page.getByText('保留本地版本')).toBeVisible();
});
```

---

## 3. CHANGELOG 规范

### 3.1 更新规则

1. **触发条件**: 任何功能、修复、重构提交时必须更新
2. **维护位置**: 仅 `vibex-fronted/CHANGELOG.md`（根目录）
3. **禁止行为**: 
   - 禁止手动修改 App 页面内的版本历史
   - 禁止删除已有的 CHANGELOG 条目
   - 禁止使用 emoji 以外的格式

### 3.2 格式模板

```markdown
### [Epic名称] — YYYY-MM-DD

#### Added
- 新功能描述（一句话，带链接）

#### Fixed
- Bug 修复描述（影响 + 修复方式）

#### Changed
- UX 改进描述（改进前 → 改进后）

#### Removed
- 删除的废弃功能
```

### 3.3 示例

```markdown
### [E1 技术债清理] — 2026-04-05

#### Added
- E4 Sync Protocol，冲突检测返回 409 + serverSnapshot

#### Fixed
- StepClarification.tsx 重复类型定义导致 CI 失败

#### Changed
- canvasStore.ts 从 1513 行降级为 285 行（re-export 层）
```

### 3.4 Reviewer 检查清单

```
- [ ] CHANGELOG.md 存在且非空
- [ ] 包含今日日期的 Epic 条目
- [ ] 格式符合 CHANGELOG 规范（无 emoji 标题）
- [ ] 内容与 PR 实际变更匹配
```

---

## 4. Git 规范

### 4.1 Commit 格式

```
<type>(<scope>): <subject>

feat(sync): add E4 conflict detection API
fix(ts): remove duplicate StepComponentProps
refactor(facade): migrate contextStore to split stores
test(e2e): add ConflictDialog interaction tests
chore(quality): configure Playwright retries=2
docs(changelog): update E1 Epic entry
```

### 4.2 Branch 命名

```
feature/e4-sync-protocol
feature/canvasstore-facade
feature/quality-dashboard
feature/share-links
fix/ts-compile-error
chore/pre-submit-script
```

### 4.3 PR 规范

- [ ] PR 标题：`feat: <简短描述>` / `fix: <简短描述>`
- [ ] PR 描述包含：功能点、测试覆盖、CHANGELOG 更新
- [ ] 每个 PR 对应一个 Epic 或一个 Story
- [ ] CI 必须通过（TS + ESLint + E2E）
- [ ] 至少 1 个 Reviewer 批准

---

## 5. 文件结构规范

### 5.1 新增文件位置

```
vibex-fronted/
├── scripts/
│   └── pre-submit-check.sh          # 新增
├── src/
│   ├── components/
│   │   ├── ConflictDialog/          # 新增
│   │   │   ├── index.tsx
│   │   │   ├── ConflictDialog.test.tsx
│   │   │   └── styles.module.css
│   │   ├── PhaseIndicator/          # 新增
│   │   │   └── index.tsx
│   │   ├── GuideCard/               # 新增
│   │   │   └── index.tsx
│   │   └── FeedbackFAB/            # 新增
│   │       └── index.tsx
│   ├── pages/
│   │   ├── share/
│   │   │   └── [token].tsx         # 新增
│   │   └── quality/
│   │       └── index.tsx           # 新增
│   └── lib/
│       ├── canvas/
│       │   └── stores/             # 新增 split stores
│       │       ├── contextStore.ts
│       │       ├── flowStore.ts
│       │       ├── componentStore.ts
│       │       └── selectionStore.ts
│       └── quality/
│           └── useQualityData.ts   # 新增
├── tests/
│   ├── contract/
│   │   ├── sync.test.ts            # 新增
│   │   ├── share.test.ts           # 新增
│   │   └── feedback.test.ts        # 新增
│   └── e2e/
│       ├── conflict-dialog.spec.ts # 新增
│       └── share-page.spec.ts      # 新增
└── CHANGELOG.md

vibex-backend/
├── src/
│   ├── api/
│   │   ├── canvas-sync.ts          # 新增
│   │   ├── share.ts                # 新增
│   │   ├── feedback.ts            # 新增
│   │   ├── quality.ts             # 新增
│   │   └── ci-webhook.ts          # 新增
│   └── services/
│       ├── sync-service.ts        # 新增
│       ├── share-service.ts       # 新增
│       └── quality-service.ts     # 新增
├── prisma/
│   └── schema.prisma               # 更新
└── CHANGELOG.md
```

### 5.2 禁止删除的文件

- `vibex-fronted/src/lib/canvas/canvasStore.ts`（仅降级，不删除）
- `vibex-fronted/CHANGELOG.md`（禁止删除历史记录）

---

## 6. 验收门槛

| 指标 | 目标 | 测量方式 |
|------|------|---------|
| TS 编译 | 零错误 | `npx tsc --noEmit` exit 0 |
| E2E 通过率 | ≥ 95% | Playwright 连续 3 次 |
| canvasStore 行数 | < 300 行 | `wc -l` |
| API Contract 覆盖 | 100% | Jest 覆盖率报告 |
| CHANGELOG 更新率 | 100% | Reviewer 检查 |

---

*开发约束版本: v1.0 | 架构师: Architect Agent | 日期: 2026-04-03*
